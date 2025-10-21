"""Script to generate all 26 canton wealth tax calculator classes

This script creates the remaining canton calculator classes based on
the data from the database migration.
"""

# Canton configurations
PROPORTIONAL_CANTONS = {
    'nidwalden': {
        'code': 'NW',
        'name': 'Nidwalden',
        'threshold_single': 35000,
        'threshold_married': 70000,
        'rate': 0.25,
        'source': 'https://www.steuern-nw.ch/',
        'notes': 'LOWEST in Switzerland! Per child: CHF 15K. Share rights: 0.2‰'
    },
    'schwyz': {
        'code': 'SZ',
        'name': 'Schwyz',
        'threshold_single': 125000,
        'threshold_married': 250000,
        'rate': 0.6,
        'source': 'https://www.sz.ch/verwaltung/finanzdepartement/steuerverwaltung.html',
        'notes': 'Very low wealth tax canton. Municipal multipliers 189-330%'
    },
    'lucerne': {
        'code': 'LU',
        'name': 'Lucerne',
        'threshold_single': 80000,
        'threshold_married': 160000,
        'rate': 0.75,
        'source': 'https://steuern.lu.ch/',
        'notes': 'Rate reduced from 0.875‰ in 2024. Max combined 3.0‰'
    },
    'appenzell_innerrhoden': {
        'code': 'AI',
        'name': 'Appenzell Innerrhoden',
        'threshold_single': 0,
        'threshold_married': 0,
        'rate': 1.5,
        'source': 'https://www.ai.ch/',
        'notes': 'No explicit threshold. Pillar 2/3a tax-free until due'
    },
    'bern': {
        'code': 'BE',
        'name': 'Bern',
        'threshold_single': 100000,
        'threshold_married': 100000,
        'rate': 2.4,
        'source': 'https://www.sv.fin.be.ch/',
        'notes': 'If wealth >= threshold, ALL wealth taxed. Ceiling: 25% of net wealth income'
    },
    'uri': {
        'code': 'UR',
        'name': 'Uri',
        'threshold_single': 100000,
        'threshold_married': 200000,
        'rate': 2.5,
        'source': 'https://www.ur.ch/dienstleistungen/3196',
        'notes': 'Per child: CHF 30K. +1.69% inflation adjustment 2024'
    },
}

PROGRESSIVE_CANTONS = {
    'zug': {
        'code': 'ZG',
        'name': 'Zug',
        'threshold_single': 200000,
        'threshold_married': 400000,
        'source': 'https://www.zg.ch/behoerden/finanzdirektion/steuerverwaltung',
        'notes': 'DOUBLED thresholds in 2024! 15% rate reduction',
        'brackets': [
            (150000, 0.425),
            (300000, 0.6),
            (600000, 0.9),
            (1200000, 1.2),
            (None, 1.9),
        ]
    },
    'geneva': {
        'code': 'GE',
        'name': 'Geneva',
        'threshold_single': 86833,
        'threshold_married': 173666,
        'source': 'https://www.ge.ch/document/baremes-icc-impots-revenu-fortune-avec-exemples-calcul-2024',
        'notes': 'Per child: CHF 43,417. Official barème 2024',
        'brackets': [
            (114621, 1.75),
            (229242, 2.0),
            (343863, 2.25),
            (572305, 2.5),
            (858458, 2.75),
            (1144610, 3.0),
            (1719304, 3.5),
            (None, 4.5),
        ]
    },
    'vaud': {
        'code': 'VD',
        'name': 'Vaud',
        'threshold_single': 50000,
        'threshold_married': 50000,
        'source': 'https://www.vd.ch/etat-droit-finances/impots/',
        'notes': 'Canton coefficient 155%. Max combined 10‰',
        'brackets': [
            (100000, 0.48),
            (200000, 1.0),
            (500000, 1.5),
            (1000000, 2.0),
            (2000000, 3.082),
            (None, 3.39),
        ]
    },
    'basel_stadt': {
        'code': 'BS',
        'name': 'Basel-Stadt',
        'threshold_single': 75000,
        'threshold_married': 150000,
        'source': 'https://www.steuerverwaltung.bs.ch/',
        'notes': 'New tariff 2024. Top: CHF 7.90 per 1000 for > CHF 4M',
        'brackets': [
            (100000, 1.5),
            (200000, 2.0),
            (500000, 2.5),
            (1000000, 3.5),
            (2000000, 5.0),
            (4000000, 6.5),
            (None, 7.9),
        ]
    },
    'solothurn': {
        'code': 'SO',
        'name': 'Solothurn',
        'threshold_single': 60000,
        'threshold_married': 100000,
        'source': 'https://steuerbuch.so.ch/',
        'notes': 'Canton multiplier 104%. Municipal avg ~115%',
        'brackets': [
            (500000, 0.75),
            (1000000, 0.9),
            (2000000, 1.1),
            (3000000, 1.2),
            (None, 1.3),
        ]
    },
    'schaffhausen': {
        'code': 'SH',
        'name': 'Schaffhausen',
        'threshold_single': 50000,
        'threshold_married': 100000,
        'source': 'https://sh.ch/',
        'notes': 'Per child: CHF 30K. Canton mult 81%, municipal 61-117%',
        'brackets': [
            (200000, 0.9),
            (500000, 1.2),
            (1000000, 1.5),
            (2000000, 1.8),
            (None, 2.3),
        ]
    },
    'st_gallen': {
        'code': 'SG',
        'name': 'St. Gallen',
        'threshold_single': 260800,
        'threshold_married': 260800,
        'source': 'https://www.sg.ch/',
        'notes': 'Canton coefficient 105%. Effective rate 1.785‰',
        'brackets': [
            (100000, 0.8),
            (200000, 1.2),
            (500000, 1.5),
            (1000000, 1.7),
            (None, 1.9),
        ]
    },
    'glarus': {
        'code': 'GL',
        'name': 'Glarus',
        'threshold_single': 76300,
        'threshold_married': 152600,
        'source': 'https://www.gl.ch/',
        'notes': 'Per child: CHF 25,400. +1.76% inflation adj 2024',
        'brackets': [
            (500000, 1.0),
            (1500000, 1.5),
            (None, 2.0),
        ]
    },
    'fribourg': {
        'code': 'FR',
        'name': 'Fribourg',
        'threshold_single': 50000,
        'threshold_married': 50000,
        'source': 'https://www.fr.ch/impots/',
        'notes': 'Canton coeff 96% for income, 100% other',
        'brackets': [
            (100000, 0.5),
            (300000, 1.0),
            (600000, 2.0),
            (1200000, 3.7),
            (None, 2.9),
        ]
    },
    'neuchatel': {
        'code': 'NE',
        'name': 'Neuchâtel',
        'threshold_single': 50000,
        'threshold_married': 50000,
        'source': 'https://www.ne.ch/',
        'notes': 'Simple progressive system',
        'brackets': [
            (200000, 3.0),
            (350000, 4.0),
            (500000, 5.0),
            (None, 3.6),
        ]
    },
    'valais': {
        'code': 'VS',
        'name': 'Valais',
        'threshold_single': 60000,
        'threshold_married': 120000,
        'source': 'https://www.vs.ch/web/scc/',
        'notes': 'TOU thresholds. Progressive up to 3‰ for > CHF 1.9M',
        'brackets': [
            (200000, 1.0),
            (500000, 1.5),
            (1000000, 2.0),
            (1901000, 2.5),
            (None, 3.0),
        ]
    },
    'ticino': {
        'code': 'TI',
        'name': 'Ticino',
        'threshold_single': 90000,
        'threshold_married': 180000,
        'source': 'https://www4.ti.ch/dfe/dc/',
        'notes': '2024 tax reform. Progressive 0.2-0.47%',
        'brackets': [
            (200000, 2.0),
            (500000, 2.5),
            (1000000, 3.0),
            (2000000, 3.7),
            (None, 4.7),
        ]
    },
    # Simplified brackets for remaining cantons
    'obwalden': {
        'code': 'OW',
        'name': 'Obwalden',
        'threshold_single': 75000,
        'threshold_married': 150000,
        'source': 'https://www.ow.ch/',
        'notes': 'One of lowest. Real estate at 60%. Max 1.4‰',
        'brackets': [
            (500000, 0.8),
            (1500000, 1.0),
            (None, 1.4),
        ]
    },
    'basel_landschaft': {
        'code': 'BL',
        'name': 'Basel-Landschaft',
        'threshold_single': 75000,
        'threshold_married': 150000,
        'source': 'https://www.baselland.ch/',
        'notes': '70% pay NO tax. Reform planned. Currently high',
        'brackets': [
            (500000, 2.0),
            (1500000, 3.5),
            (None, 4.6),
        ]
    },
    'aargau': {
        'code': 'AG',
        'name': 'Aargau',
        'threshold_single': 80000,
        'threshold_married': 160000,
        'source': 'https://www.ag.ch/de/verwaltung/dfr/steuerverwaltung',
        'notes': '2025 reform: highest bracket reduction planned',
        'brackets': [
            (500000, 1.0),
            (1500000, 1.8),
            (None, 2.5),
        ]
    },
    'thurgau': {
        'code': 'TG',
        'name': 'Thurgau',
        'threshold_single': 100000,
        'threshold_married': 200000,
        'source': 'https://steuerverwaltung.tg.ch/',
        'notes': 'Per child: CHF 100K. § 53 StG',
        'brackets': [
            (500000, 1.2),
            (1500000, 1.7),
            (None, 2.2),
        ]
    },
    'appenzell_ausserrhoden': {
        'code': 'AR',
        'name': 'Appenzell Ausserrhoden',
        'threshold_single': 80000,
        'threshold_married': 160000,
        'source': 'https://ar.ch/',
        'notes': 'Steuertarif 2024. eTax available since Jan 17, 2025',
        'brackets': [
            (500000, 1.1),
            (1500000, 1.6),
            (None, 2.1),
        ]
    },
    'jura': {
        'code': 'JU',
        'name': 'Jura',
        'threshold_single': 75000,
        'threshold_married': 150000,
        'source': 'https://www.jura.ch/',
        'notes': 'Decree 641.111.22. 2024 price index adjustments',
        'brackets': [
            (500000, 1.0),
            (1500000, 2.0),
            (None, 2.8),
        ]
    },
    'graubuenden': {
        'code': 'GR',
        'name': 'Graubünden',
        'threshold_single': 80000,
        'threshold_married': 160000,
        'source': 'https://www.stv.gr.ch/',
        'notes': 'Articles 54 ff. Steuergesetz. Trilingual canton',
        'brackets': [
            (500000, 1.2),
            (1500000, 2.0),
            (None, 2.8),
        ]
    },
}


PROPORTIONAL_TEMPLATE = '''"""{{name}} Canton Wealth Tax Calculator

Official Source: {{source}}
Tax Year: 2024
Structure: Proportional (Flat Rate)
"""
from decimal import Decimal
from .base import ProportionalWealthTaxCalculator


class {{class_name}}WealthTaxCalculator(ProportionalWealthTaxCalculator):
    """{{name}} Canton Wealth Tax Calculator - Proportional Structure"""

    CANTON_CODE = "{{code}}"
    CANTON_NAME = "{{name}}"

    THRESHOLD_SINGLE = Decimal('{{threshold_single}}')
    THRESHOLD_MARRIED = Decimal('{{threshold_married}}')
    RATE_PER_MILLE = Decimal('{{rate}}')

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code=self.CANTON_CODE, tax_year=tax_year)

    def _load_threshold_single(self) -> Decimal:
        return self.THRESHOLD_SINGLE

    def _load_threshold_married(self) -> Decimal:
        return self.THRESHOLD_MARRIED

    def _load_rate_structure(self) -> str:
        return 'proportional'

    def _load_municipal_multiplier_flag(self) -> bool:
        return True

    def _load_proportional_rate(self) -> Decimal:
        return self.RATE_PER_MILLE

    def get_canton_info(self) -> dict:
        info = super().get_info()
        info.update({
            'canton_name': self.CANTON_NAME,
            'rate_per_mille': float(self.RATE_PER_MILLE),
            'rate_percentage': float(self.RATE_PER_MILLE / 10),
            'source': '{{source}}',
            'notes': '{{notes}}'
        })
        return info
'''

PROGRESSIVE_TEMPLATE = '''"""{{name}} Canton Wealth Tax Calculator

Official Source: {{source}}
Tax Year: 2024
Structure: Progressive
"""
from decimal import Decimal
from .base import ProgressiveWealthTaxCalculator


class {{class_name}}WealthTaxCalculator(ProgressiveWealthTaxCalculator):
    """{{name}} Canton Wealth Tax Calculator - Progressive Structure"""

    CANTON_CODE = "{{code}}"
    CANTON_NAME = "{{name}}"

    THRESHOLD_SINGLE = Decimal('{{threshold_single}}')
    THRESHOLD_MARRIED = Decimal('{{threshold_married}}')

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code=self.CANTON_CODE, tax_year=tax_year)

    def _load_threshold_single(self) -> Decimal:
        return self.THRESHOLD_SINGLE

    def _load_threshold_married(self) -> Decimal:
        return self.THRESHOLD_MARRIED

    def _load_rate_structure(self) -> str:
        return 'progressive'

    def _load_municipal_multiplier_flag(self) -> bool:
        return True

    def _load_brackets(self) -> list:
        """Progressive brackets - rates in per mille (‰)"""
        return [
{{brackets}}
        ]

    def get_canton_info(self) -> dict:
        info = super().get_info()
        info.update({
            'canton_name': self.CANTON_NAME,
            'num_brackets': len(self._load_brackets()),
            'source': '{{source}}',
            'notes': '{{notes}}'
        })
        return info
'''


def generate_proportional_calculator(canton_key, config):
    """Generate a proportional calculator file"""
    class_name = ''.join(word.capitalize() for word in canton_key.split('_'))

    content = PROPORTIONAL_TEMPLATE
    content = content.replace('{{name}}', config['name'])
    content = content.replace('{{class_name}}', class_name)
    content = content.replace('{{code}}', config['code'])
    content = content.replace('{{threshold_single}}', str(config['threshold_single']))
    content = content.replace('{{threshold_married}}', str(config['threshold_married']))
    content = content.replace('{{rate}}', str(config['rate']))
    content = content.replace('{{source}}', config['source'])
    content = content.replace('{{notes}}', config['notes'])

    return content


def generate_progressive_calculator(canton_key, config):
    """Generate a progressive calculator file"""
    class_name = ''.join(word.capitalize() for word in canton_key.split('_'))

    # Format brackets
    bracket_lines = []
    for upper_limit, rate in config['brackets']:
        if upper_limit is None:
            bracket_lines.append(f"            (None, Decimal('{rate}')),  # Top bracket")
        else:
            bracket_lines.append(f"            (Decimal('{upper_limit}'), Decimal('{rate}')),")
    brackets_str = '\n'.join(bracket_lines)

    content = PROGRESSIVE_TEMPLATE
    content = content.replace('{{name}}', config['name'])
    content = content.replace('{{class_name}}', class_name)
    content = content.replace('{{code}}', config['code'])
    content = content.replace('{{threshold_single}}', str(config['threshold_single']))
    content = content.replace('{{threshold_married}}', str(config['threshold_married']))
    content = content.replace('{{brackets}}', brackets_str)
    content = content.replace('{{source}}', config['source'])
    content = content.replace('{{notes}}', config['notes'])

    return content


if __name__ == '__main__':
    import os

    base_dir = os.path.dirname(__file__)

    print("Generating canton wealth tax calculators...")
    print()

    # Generate proportional cantons
    print("Proportional Cantons:")
    for canton_key, config in PROPORTIONAL_CANTONS.items():
        filename = f"{canton_key}.py"
        filepath = os.path.join(base_dir, filename)
        content = generate_proportional_calculator(canton_key, config)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"  ✓ {config['code']} - {config['name']} ({filename})")

    print()
    print("Progressive Cantons:")
    # Generate progressive cantons (excluding zurich which is already created)
    for canton_key, config in PROGRESSIVE_CANTONS.items():
        if canton_key == 'zurich':  # Skip, already created
            print(f"  ✓ ZH - Zurich (zurich.py) [already exists]")
            continue

        filename = f"{canton_key}.py"
        filepath = os.path.join(base_dir, filename)
        content = generate_progressive_calculator(canton_key, config)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"  ✓ {config['code']} - {config['name']} ({filename})")

    print()
    print(f"✅ Generated {len(PROPORTIONAL_CANTONS) + len(PROGRESSIVE_CANTONS)} canton calculators")
