#!/usr/bin/env python3
"""
Canton Tax Form Download Script

Downloads official tax return forms from all 26 Swiss canton websites.
Forms are saved in the canton_forms directory organized by canton and language.

Usage:
    python download_canton_forms.py --year 2024
    python download_canton_forms.py --year 2024 --canton ZH
    python download_canton_forms.py --year 2024 --language de
"""

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import List, Optional

import requests
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from data.canton_form_metadata import (CANTON_FORMS_2024,
                                       get_canton_form_metadata,
                                       list_all_cantons)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CantonFormDownloader:
    """Downloads canton tax forms from official websites"""

    def __init__(self, base_dir: str = None):
        if base_dir is None:
            base_dir = Path(__file__).parent.parent / 'data' / 'canton_forms'
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def download_canton_forms(
        self,
        canton_code: str,
        tax_year: int = 2024
    ) -> dict:
        """
        Download all available forms for a canton.

        Args:
            canton_code: Canton code (e.g., 'ZH')
            tax_year: Tax year

        Returns:
            Dict with download status
        """
        metadata = get_canton_form_metadata(canton_code)
        if not metadata:
            logger.error(f"Canton {canton_code} not found in metadata")
            return {'success': False, 'error': 'Canton not found'}

        # Create canton directory
        canton_dir = self.base_dir / canton_code
        canton_dir.mkdir(exist_ok=True)

        results = {
            'canton': canton_code,
            'success': True,
            'downloads': [],
            'errors': []
        }

        # Download each language version
        for language, url in metadata.form_urls.items():
            filename = f"{canton_code}_{tax_year}_{language}.pdf"
            filepath = canton_dir / filename

            try:
                logger.info(f"Downloading {canton_code} form ({language}): {url}")
                success = self._download_file(url, filepath)

                if success:
                    results['downloads'].append({
                        'language': language,
                        'file': str(filepath),
                        'size': os.path.getsize(filepath)
                    })
                    logger.info(f"✓ Downloaded {filename}")
                else:
                    results['errors'].append({
                        'language': language,
                        'error': 'Download failed'
                    })
                    logger.error(f"✗ Failed to download {filename}")

            except Exception as e:
                results['errors'].append({
                    'language': language,
                    'error': str(e)
                })
                results['success'] = False
                logger.error(f"✗ Error downloading {canton_code} ({language}): {e}")

        return results

    def _download_file(self, url: str, filepath: Path) -> bool:
        """
        Download file from URL with progress bar.

        Args:
            url: Download URL
            filepath: Destination file path

        Returns:
            True if successful, False otherwise
        """
        try:
            # Some canton websites may require specific headers
            headers = {
                'User-Agent': 'SwissAI Tax Form Downloader/1.0 (Educational/Research)',
                'Accept': 'application/pdf',
            }

            response = requests.get(url, headers=headers, stream=True, timeout=30)
            response.raise_for_status()

            total_size = int(response.headers.get('content-length', 0))

            with open(filepath, 'wb') as f:
                if total_size == 0:
                    # No content-length header
                    f.write(response.content)
                else:
                    # Download with progress bar
                    with tqdm(total=total_size, unit='B', unit_scale=True, desc=filepath.name) as pbar:
                        for chunk in response.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                                pbar.update(len(chunk))

            # Verify it's a PDF
            with open(filepath, 'rb') as f:
                header = f.read(4)
                if header != b'%PDF':
                    logger.warning(f"Downloaded file may not be a PDF: {filepath}")
                    return False

            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP error downloading {url}: {e}")
            return False
        except Exception as e:
            logger.error(f"Error downloading {url}: {e}")
            return False

    def download_all_cantons(
        self,
        tax_year: int = 2024,
        language_filter: Optional[str] = None
    ) -> dict:
        """
        Download forms for all cantons.

        Args:
            tax_year: Tax year
            language_filter: Optional language filter (e.g., 'de')

        Returns:
            Summary of all downloads
        """
        cantons = list_all_cantons()
        summary = {
            'total_cantons': len(cantons),
            'successful': 0,
            'failed': 0,
            'total_files': 0,
            'results': []
        }

        logger.info(f"Downloading forms for {len(cantons)} cantons...")

        for canton_code in cantons:
            result = self.download_canton_forms(canton_code, tax_year)
            summary['results'].append(result)

            if result['success']:
                summary['successful'] += 1
                summary['total_files'] += len(result['downloads'])
            else:
                summary['failed'] += 1

        logger.info(f"\n{'='*60}")
        logger.info(f"Download Summary:")
        logger.info(f"  Total cantons: {summary['total_cantons']}")
        logger.info(f"  Successful: {summary['successful']}")
        logger.info(f"  Failed: {summary['failed']}")
        logger.info(f"  Total files: {summary['total_files']}")
        logger.info(f"{'='*60}")

        return summary

    def verify_downloads(self) -> dict:
        """
        Verify all downloaded forms exist and are valid PDFs.

        Returns:
            Verification report
        """
        cantons = list_all_cantons()
        report = {
            'verified': 0,
            'missing': 0,
            'invalid': 0,
            'details': []
        }

        for canton_code in cantons:
            metadata = get_canton_form_metadata(canton_code)
            canton_dir = self.base_dir / canton_code

            canton_status = {
                'canton': canton_code,
                'files': []
            }

            for language in metadata.form_urls.keys():
                filename = f"{canton_code}_2024_{language}.pdf"
                filepath = canton_dir / filename

                if not filepath.exists():
                    canton_status['files'].append({
                        'file': filename,
                        'status': 'missing'
                    })
                    report['missing'] += 1
                else:
                    # Verify it's a PDF
                    try:
                        with open(filepath, 'rb') as f:
                            header = f.read(4)
                            if header == b'%PDF':
                                canton_status['files'].append({
                                    'file': filename,
                                    'status': 'valid',
                                    'size': os.path.getsize(filepath)
                                })
                                report['verified'] += 1
                            else:
                                canton_status['files'].append({
                                    'file': filename,
                                    'status': 'invalid'
                                })
                                report['invalid'] += 1
                    except Exception as e:
                        canton_status['files'].append({
                            'file': filename,
                            'status': 'error',
                            'error': str(e)
                        })
                        report['invalid'] += 1

            report['details'].append(canton_status)

        return report


def main():
    parser = argparse.ArgumentParser(
        description='Download Swiss canton tax forms'
    )
    parser.add_argument(
        '--year',
        type=int,
        default=2024,
        help='Tax year (default: 2024)'
    )
    parser.add_argument(
        '--canton',
        type=str,
        help='Download specific canton only (e.g., ZH)'
    )
    parser.add_argument(
        '--language',
        type=str,
        help='Filter by language (de, fr, it, en)'
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='Verify existing downloads instead of downloading'
    )
    parser.add_argument(
        '--base-dir',
        type=str,
        help='Custom base directory for forms'
    )

    args = parser.parse_args()

    downloader = CantonFormDownloader(base_dir=args.base_dir)

    if args.verify:
        logger.info("Verifying downloaded forms...")
        report = downloader.verify_downloads()
        logger.info(f"\nVerification Report:")
        logger.info(f"  Valid PDFs: {report['verified']}")
        logger.info(f"  Missing: {report['missing']}")
        logger.info(f"  Invalid: {report['invalid']}")

        # Print missing files
        if report['missing'] > 0:
            logger.info("\nMissing files:")
            for canton in report['details']:
                for file_info in canton['files']:
                    if file_info['status'] == 'missing':
                        logger.info(f"  - {canton['canton']}/{file_info['file']}")

    elif args.canton:
        # Download single canton
        result = downloader.download_canton_forms(
            args.canton.upper(),
            args.year
        )
        if result['success']:
            logger.info(f"✓ Successfully downloaded {args.canton} forms")
        else:
            logger.error(f"✗ Failed to download {args.canton} forms")
            sys.exit(1)

    else:
        # Download all cantons
        summary = downloader.download_all_cantons(
            args.year,
            args.language
        )

        if summary['failed'] > 0:
            logger.warning(f"\n⚠ {summary['failed']} cantons failed to download")
            sys.exit(1)


if __name__ == '__main__':
    main()
