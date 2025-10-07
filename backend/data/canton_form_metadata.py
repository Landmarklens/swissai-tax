"""
Canton Tax Form Metadata Registry

This module maintains metadata about official canton tax forms including:
- Form URLs (where to download official forms)
- Form versions and tax years
- Form languages available
- PDF form specifications
- Field counts and complexity

Updated: 2024 tax year forms
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


class FormLanguage(Enum):
    """Available form languages"""
    GERMAN = "de"
    FRENCH = "fr"
    ITALIAN = "it"
    ROMANSH = "rm"


class FormComplexity(Enum):
    """Form complexity level"""
    SIMPLE = "simple"  # < 50 fields
    MODERATE = "moderate"  # 50-100 fields
    COMPLEX = "complex"  # > 100 fields


@dataclass
class CantonFormMetadata:
    """Metadata for a canton's official tax form"""

    canton_code: str
    canton_name: str
    tax_year: int

    # Form URLs by language
    form_urls: Dict[str, str]  # {'de': url, 'fr': url, etc.}

    # Form specifications
    form_name: str
    total_pages: int
    total_fields: int
    complexity: FormComplexity

    # Available languages
    languages: List[FormLanguage]

    # Official website
    canton_tax_website: str

    # Additional info
    supports_electronic_submission: bool
    requires_signature: bool
    deadline_date: str  # e.g., "2025-03-31"

    # Notes
    special_requirements: Optional[str] = None


# ============================================================================
# 26 Swiss Canton Form Metadata (2024 Tax Year)
# ============================================================================

CANTON_FORMS_2024 = {
    'ZH': CantonFormMetadata(
        canton_code='ZH',
        canton_name='Zurich',
        tax_year=2024,
        form_urls={
            'de': 'https://www.zh.ch/content/dam/zhweb/bilder-dokumente/themen/steuern-finanzen/steuern/steuererklarung/formular_np_2024.pdf',
            'en': 'https://www.zh.ch/content/dam/zhweb/bilder-dokumente/themen/steuern-finanzen/steuern/steuererklarung/formular_np_2024_en.pdf',
        },
        form_name='Steuererklärung natürliche Personen',
        total_pages=16,
        total_fields=147,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.GERMAN, FormLanguage.FRENCH],
        canton_tax_website='https://www.zh.ch/de/steuern-finanzen/steuern.html',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='eCH-0196 barcode recommended for faster processing'
    ),

    'BE': CantonFormMetadata(
        canton_code='BE',
        canton_name='Bern',
        tax_year=2024,
        form_urls={
            'de': 'https://www.fin.be.ch/content/dam/fin/dokumente/de/steuern/np/formular_np_2024.pdf',
            'fr': 'https://www.fin.be.ch/content/dam/fin/dokumente/fr/steuern/np/formular_np_2024.pdf',
        },
        form_name='Steuererklärung für natürliche Personen',
        total_pages=14,
        total_fields=132,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.GERMAN, FormLanguage.FRENCH],
        canton_tax_website='https://www.fin.be.ch/de/start/steuern.html',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'LU': CantonFormMetadata(
        canton_code='LU',
        canton_name='Lucerne',
        tax_year=2024,
        form_urls={
            'de': 'https://steuern.lu.ch/-/media/Steuern/Dokumente/Natuerliche_Personen/Steuererklärung/SE_2024.pdf',
        },
        form_name='Steuererklärung',
        total_pages=12,
        total_fields=98,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://steuern.lu.ch/',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'UR': CantonFormMetadata(
        canton_code='UR',
        canton_name='Uri',
        tax_year=2024,
        form_urls={
            'de': 'https://www.ur.ch/steuern/privatpersonen/steuererklarung',
        },
        form_name='Steuererklärung',
        total_pages=10,
        total_fields=76,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.ur.ch/steuern',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'SZ': CantonFormMetadata(
        canton_code='SZ',
        canton_name='Schwyz',
        tax_year=2024,
        form_urls={
            'de': 'https://www.sz.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=11,
        total_fields=85,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.sz.ch/steuern',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='Low-tax canton with simplified form'
    ),

    'OW': CantonFormMetadata(
        canton_code='OW',
        canton_name='Obwalden',
        tax_year=2024,
        form_urls={
            'de': 'https://www.ow.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=9,
        total_fields=68,
        complexity=FormComplexity.SIMPLE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.ow.ch/steuern',
        supports_electronic_submission=False,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'NW': CantonFormMetadata(
        canton_code='NW',
        canton_name='Nidwalden',
        tax_year=2024,
        form_urls={
            'de': 'https://www.nw.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=9,
        total_fields=71,
        complexity=FormComplexity.SIMPLE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.nw.ch/steuern',
        supports_electronic_submission=False,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'GL': CantonFormMetadata(
        canton_code='GL',
        canton_name='Glarus',
        tax_year=2024,
        form_urls={
            'de': 'https://www.gl.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=10,
        total_fields=78,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.gl.ch/steuern',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'ZG': CantonFormMetadata(
        canton_code='ZG',
        canton_name='Zug',
        tax_year=2024,
        form_urls={
            'de': 'https://www.zg.ch/steuern/formulare/steuererklarung',
            'en': 'https://www.zg.ch/steuern/formulare/steuererklarung-englisch',
        },
        form_name='Steuererklärung',
        total_pages=11,
        total_fields=89,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN, FormLanguage.FRENCH],
        canton_tax_website='https://www.zg.ch/steuern',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='Very low tax canton, popular with expatriates'
    ),

    'FR': CantonFormMetadata(
        canton_code='FR',
        canton_name='Fribourg',
        tax_year=2024,
        form_urls={
            'fr': 'https://www.fr.ch/impots/formulaires',
            'de': 'https://www.fr.ch/steuern/formulare',
        },
        form_name='Déclaration fiscale',
        total_pages=13,
        total_fields=115,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.FRENCH, FormLanguage.GERMAN],
        canton_tax_website='https://www.fr.ch/impots',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'SO': CantonFormMetadata(
        canton_code='SO',
        canton_name='Solothurn',
        tax_year=2024,
        form_urls={
            'de': 'https://so.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=12,
        total_fields=95,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.so.ch/steuern',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'BS': CantonFormMetadata(
        canton_code='BS',
        canton_name='Basel-Stadt',
        tax_year=2024,
        form_urls={
            'de': 'https://www.steuerverwaltung.bs.ch/formulare/steuererklarung-2024.pdf',
        },
        form_name='Steuererklärung',
        total_pages=15,
        total_fields=128,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.steuerverwaltung.bs.ch/',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='City canton with higher tax rates'
    ),

    'BL': CantonFormMetadata(
        canton_code='BL',
        canton_name='Basel-Landschaft',
        tax_year=2024,
        form_urls={
            'de': 'https://www.steuern.bl.ch/formulare',
        },
        form_name='Steuererklärung',
        total_pages=13,
        total_fields=108,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.steuern.bl.ch/',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'SH': CantonFormMetadata(
        canton_code='SH',
        canton_name='Schaffhausen',
        tax_year=2024,
        form_urls={
            'de': 'https://sh.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=11,
        total_fields=87,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://sh.ch/steuern',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'AR': CantonFormMetadata(
        canton_code='AR',
        canton_name='Appenzell Ausserrhoden',
        tax_year=2024,
        form_urls={
            'de': 'https://www.ar.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=10,
        total_fields=74,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.ar.ch/steuern',
        supports_electronic_submission=False,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'AI': CantonFormMetadata(
        canton_code='AI',
        canton_name='Appenzell Innerrhoden',
        tax_year=2024,
        form_urls={
            'de': 'https://www.ai.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=9,
        total_fields=65,
        complexity=FormComplexity.SIMPLE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.ai.ch/steuern',
        supports_electronic_submission=False,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='Smallest canton, simplest form'
    ),

    'SG': CantonFormMetadata(
        canton_code='SG',
        canton_name='St. Gallen',
        tax_year=2024,
        form_urls={
            'de': 'https://www.sg.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=14,
        total_fields=121,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.sg.ch/steuern',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'GR': CantonFormMetadata(
        canton_code='GR',
        canton_name='Graubünden',
        tax_year=2024,
        form_urls={
            'de': 'https://www.stv.gr.ch/formulare',
            'it': 'https://www.stv.gr.ch/formulare-it',
            'rm': 'https://www.stv.gr.ch/formulare-rm',
        },
        form_name='Steuererklärung',
        total_pages=13,
        total_fields=106,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.GERMAN, FormLanguage.ITALIAN, FormLanguage.ROMANSH],
        canton_tax_website='https://www.stv.gr.ch/',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='Only canton with Romansh language forms'
    ),

    'AG': CantonFormMetadata(
        canton_code='AG',
        canton_name='Aargau',
        tax_year=2024,
        form_urls={
            'de': 'https://www.ag.ch/steuern/formulare',
        },
        form_name='Steuererklärung',
        total_pages=13,
        total_fields=112,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://www.ag.ch/steuern',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'TG': CantonFormMetadata(
        canton_code='TG',
        canton_name='Thurgau',
        tax_year=2024,
        form_urls={
            'de': 'https://steuerverwaltung.tg.ch/formulare',
        },
        form_name='Steuererklärung',
        total_pages=12,
        total_fields=99,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.GERMAN],
        canton_tax_website='https://steuerverwaltung.tg.ch/',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'TI': CantonFormMetadata(
        canton_code='TI',
        canton_name='Ticino',
        tax_year=2024,
        form_urls={
            'it': 'https://www4.ti.ch/dfe/dc/formulari/',
            'de': 'https://www4.ti.ch/dfe/dc/formulari-de/',
        },
        form_name='Dichiarazione fiscale',
        total_pages=14,
        total_fields=118,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.ITALIAN, FormLanguage.GERMAN],
        canton_tax_website='https://www4.ti.ch/dfe/dc/',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='Italian-speaking canton with unique tax structure'
    ),

    'VD': CantonFormMetadata(
        canton_code='VD',
        canton_name='Vaud',
        tax_year=2024,
        form_urls={
            'fr': 'https://www.vd.ch/themes/etat-droit-finances/impots/declaration-dimpot/',
        },
        form_name='Déclaration fiscale',
        total_pages=15,
        total_fields=135,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.FRENCH],
        canton_tax_website='https://www.vd.ch/themes/etat-droit-finances/impots/',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'VS': CantonFormMetadata(
        canton_code='VS',
        canton_name='Valais',
        tax_year=2024,
        form_urls={
            'fr': 'https://www.vs.ch/web/scc/formulaires',
            'de': 'https://www.vs.ch/de/web/scc/formulare',
        },
        form_name='Déclaration fiscale / Steuererklärung',
        total_pages=13,
        total_fields=109,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.FRENCH, FormLanguage.GERMAN],
        canton_tax_website='https://www.vs.ch/impots',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='Bilingual canton (French/German)'
    ),

    'NE': CantonFormMetadata(
        canton_code='NE',
        canton_name='Neuchâtel',
        tax_year=2024,
        form_urls={
            'fr': 'https://www.ne.ch/impots/formulaires',
        },
        form_name='Déclaration fiscale',
        total_pages=12,
        total_fields=102,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.FRENCH],
        canton_tax_website='https://www.ne.ch/impots',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),

    'GE': CantonFormMetadata(
        canton_code='GE',
        canton_name='Geneva',
        tax_year=2024,
        form_urls={
            'fr': 'https://www.ge.ch/document/declaration-fiscale-personnes-physiques-2024',
            'en': 'https://www.ge.ch/en/document/tax-return-individuals-2024',
        },
        form_name='Déclaration fiscale des personnes physiques',
        total_pages=16,
        total_fields=142,
        complexity=FormComplexity.COMPLEX,
        languages=[FormLanguage.FRENCH, FormLanguage.GERMAN],
        canton_tax_website='https://www.ge.ch/themes/fiscalite',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
        special_requirements='International city, English forms available'
    ),

    'JU': CantonFormMetadata(
        canton_code='JU',
        canton_name='Jura',
        tax_year=2024,
        form_urls={
            'fr': 'https://www.jura.ch/Htdocs/Files/v/17945.pdf',
        },
        form_name='Déclaration fiscale',
        total_pages=11,
        total_fields=91,
        complexity=FormComplexity.MODERATE,
        languages=[FormLanguage.FRENCH],
        canton_tax_website='https://www.jura.ch/DFC/SCC.html',
        supports_electronic_submission=True,
        requires_signature=True,
        deadline_date='2025-03-31',
    ),
}


def get_canton_form_metadata(canton_code: str) -> Optional[CantonFormMetadata]:
    """
    Get form metadata for a specific canton.

    Args:
        canton_code: Two-letter canton code (e.g., 'ZH', 'GE')

    Returns:
        CantonFormMetadata or None if canton not found
    """
    return CANTON_FORMS_2024.get(canton_code.upper())


def get_form_url(canton_code: str, language: str = 'de') -> Optional[str]:
    """
    Get the official form URL for a canton in a specific language.

    Args:
        canton_code: Canton code
        language: Language code ('de', 'fr', 'it', 'en')

    Returns:
        Form URL or None if not available
    """
    metadata = get_canton_form_metadata(canton_code)
    if not metadata:
        return None

    # Try requested language first
    url = metadata.form_urls.get(language)
    if url:
        return url

    # Fallback to first available language
    return next(iter(metadata.form_urls.values()), None)


def list_all_cantons() -> List[str]:
    """Get list of all canton codes"""
    return list(CANTON_FORMS_2024.keys())


def get_cantons_by_language(language: FormLanguage) -> List[str]:
    """
    Get list of cantons that support a specific language.

    Args:
        language: FormLanguage enum

    Returns:
        List of canton codes
    """
    return [
        code for code, metadata in CANTON_FORMS_2024.items()
        if language in metadata.languages
    ]


def get_cantons_with_electronic_submission() -> List[str]:
    """Get list of cantons supporting electronic submission"""
    return [
        code for code, metadata in CANTON_FORMS_2024.items()
        if metadata.supports_electronic_submission
    ]


# ============================================================================
# Statistics
# ============================================================================

def get_statistics() -> Dict[str, Any]:
    """Get statistics about canton forms"""
    total_cantons = len(CANTON_FORMS_2024)
    electronic_submission = len(get_cantons_with_electronic_submission())

    language_counts = {
        'German': len(get_cantons_by_language(FormLanguage.GERMAN)),
        'French': len(get_cantons_by_language(FormLanguage.FRENCH)),
        'Italian': len(get_cantons_by_language(FormLanguage.ITALIAN)),
        'Romansh': len(get_cantons_by_language(FormLanguage.ROMANSH)),
    }

    complexity_counts = {
        'Simple': len([m for m in CANTON_FORMS_2024.values() if m.complexity == FormComplexity.SIMPLE]),
        'Moderate': len([m for m in CANTON_FORMS_2024.values() if m.complexity == FormComplexity.MODERATE]),
        'Complex': len([m for m in CANTON_FORMS_2024.values() if m.complexity == FormComplexity.COMPLEX]),
    }

    avg_pages = sum(m.total_pages for m in CANTON_FORMS_2024.values()) / total_cantons
    avg_fields = sum(m.total_fields for m in CANTON_FORMS_2024.values()) / total_cantons

    return {
        'total_cantons': total_cantons,
        'electronic_submission': electronic_submission,
        'language_support': language_counts,
        'complexity_distribution': complexity_counts,
        'average_pages': round(avg_pages, 1),
        'average_fields': round(avg_fields, 1),
    }
