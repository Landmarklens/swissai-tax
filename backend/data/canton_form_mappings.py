"""
Canton Tax Form Field Mappings

This module maps our internal tax data model to official canton tax form fields.
Each canton has unique form structures and field names - this mapping enables
automatic PDF form filling for all 26 Swiss cantons.

Official forms are typically updated annually. This mapping is for tax year 2024.
"""

from enum import Enum
from typing import Any, Dict, List, Optional


class FormFieldType(Enum):
    """Type of form field"""
    TEXT = "text"
    NUMBER = "number"
    CHECKBOX = "checkbox"
    DATE = "date"
    CURRENCY = "currency"


class CantonFormMapping:
    """Mapping for a single canton's tax form"""

    def __init__(
        self,
        canton_code: str,
        canton_name: str,
        form_name: str,
        form_year: int,
        form_url: str,
        field_mappings: Dict[str, str]
    ):
        self.canton_code = canton_code
        self.canton_name = canton_name
        self.form_name = form_name
        self.form_year = form_year
        self.form_url = form_url
        self.field_mappings = field_mappings

    def get_field_name(self, internal_field: str) -> Optional[str]:
        """Get canton form field name for internal field"""
        return self.field_mappings.get(internal_field)

    def map_data(self, tax_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map internal tax data to canton form fields"""
        mapped = {}
        for internal_field, form_field in self.field_mappings.items():
            if internal_field in tax_data:
                mapped[form_field] = tax_data[internal_field]
        return mapped


# ============================================================================
# ZURICH (ZH) - Steuererklärung 2024
# ============================================================================

ZURICH_FORM_MAPPING = CantonFormMapping(
    canton_code='ZH',
    canton_name='Zurich',
    form_name='Steuererklärung natürliche Personen 2024',
    form_year=2024,
    form_url='https://www.zh.ch/de/steuern-finanzen/steuern/steuererklaerung.html',
    field_mappings={
        # Personal Information
        'name': 'A01_Nachname',
        'firstname': 'A02_Vorname',
        'ssn': 'A03_AHV_Nummer',
        'birthdate': 'A04_Geburtsdatum',
        'address': 'A05_Strasse',
        'zip': 'A06_PLZ',
        'city': 'A07_Ort',
        'marital_status': 'A08_Zivilstand',

        # Spouse (if married)
        'spouse_name': 'A09_Ehepartner_Nachname',
        'spouse_firstname': 'A10_Ehepartner_Vorname',
        'spouse_ssn': 'A11_Ehepartner_AHV',

        # Children
        'num_children': 'A12_Anzahl_Kinder',

        # Employment Income
        'employment_income': 'B01_Unselbstaendiger_Erwerbseinkommen',
        'employment_income_spouse': 'B02_Unselbstaendiger_Erwerbseinkommen_Ehepartner',

        # Self-Employment Income
        'self_employment_income': 'B03_Selbstaendiger_Erwerbseinkommen',

        # Capital Income
        'capital_income': 'C01_Einkuenfte_aus_Vermoegen',
        'dividend_income': 'C02_Dividenden',
        'interest_income': 'C03_Zinsen',

        # Rental Income
        'rental_income_total': 'D01_Liegenschaftseinkuenfte',

        # Other Income
        'other_income': 'E01_Uebrige_Einkuenfte',
        'pension_income': 'E02_Renten_AHV_IV',

        # Professional Expenses
        'professional_expenses': 'F01_Berufsauslagen',

        # Pillar 3a
        'pillar_3a_contributions': 'F02_Saeule_3a',

        # Pillar 2 Buy-ins
        'pillar_2_buyins': 'F03_Saeule_2_Einkauf',

        # Insurance Premiums
        'insurance_premiums': 'F04_Versicherungspraemien',

        # Medical Expenses
        'medical_expenses': 'F05_Krankheitskosten',

        # Training Expenses
        'training_expenses': 'F06_Aus_und_Weiterbildungskosten',

        # Alimony
        'alimony_payments': 'F07_Alimentenzahlungen',

        # Property Expenses
        'property_maintenance': 'F08_Liegenschaftsunterhaltskosten',
        'mortgage_interest': 'F09_Hypothekarzinsen',

        # Assets
        'total_assets': 'G01_Vermoegen',
        'bank_accounts': 'G02_Bankguthaben',
        'securities': 'G03_Wertschriften',
        'real_estate_value': 'G04_Liegenschaften',

        # Liabilities
        'total_liabilities': 'H01_Schulden',
        'mortgage_debt': 'H02_Hypotheken',
    }
)


# ============================================================================
# GENEVA (GE) - Déclaration d'impôt 2024
# ============================================================================

GENEVA_FORM_MAPPING = CantonFormMapping(
    canton_code='GE',
    canton_name='Geneva',
    form_name='Déclaration fiscale des personnes physiques 2024',
    form_year=2024,
    form_url='https://www.ge.ch/themes/fiscalite',
    field_mappings={
        # Personal Information
        'name': 'A_NOM',
        'firstname': 'A_PRENOM',
        'ssn': 'A_NUM_AVS',
        'birthdate': 'A_DATE_NAISSANCE',
        'address': 'A_RUE',
        'zip': 'A_NPA',
        'city': 'A_LOCALITE',
        'marital_status': 'A_ETAT_CIVIL',

        # Spouse
        'spouse_name': 'A_CONJOINT_NOM',
        'spouse_firstname': 'A_CONJOINT_PRENOM',
        'spouse_ssn': 'A_CONJOINT_AVS',

        # Children
        'num_children': 'A_ENFANTS',

        # Employment Income
        'employment_income': 'B_SALAIRE',
        'employment_income_spouse': 'B_SALAIRE_CONJOINT',

        # Self-Employment
        'self_employment_income': 'B_ACTIVITE_INDEPENDANTE',

        # Capital Income
        'capital_income': 'C_REVENUS_FORTUNE',
        'dividend_income': 'C_DIVIDENDES',
        'interest_income': 'C_INTERETS',

        # Rental Income
        'rental_income_total': 'D_REVENUS_IMMOBILIERS',

        # Other Income
        'other_income': 'E_AUTRES_REVENUS',
        'pension_income': 'E_RENTES_AVS_AI',

        # Deductions
        'professional_expenses': 'F_FRAIS_PROFESSIONNELS',
        'pillar_3a_contributions': 'F_PILIER_3A',
        'pillar_2_buyins': 'F_RACHAT_LPP',
        'insurance_premiums': 'F_PRIMES_ASSURANCE',
        'medical_expenses': 'F_FRAIS_MALADIE',
        'training_expenses': 'F_FORMATION',
        'alimony_payments': 'F_PENSIONS_ALIMENTAIRES',
        'property_maintenance': 'F_ENTRETIEN_IMMOBILIER',
        'mortgage_interest': 'F_INTERETS_HYPOTHECAIRES',

        # Assets
        'total_assets': 'G_FORTUNE',
        'bank_accounts': 'G_COMPTES_BANCAIRES',
        'securities': 'G_TITRES',
        'real_estate_value': 'G_IMMOBILIER',

        # Liabilities
        'total_liabilities': 'H_DETTES',
        'mortgage_debt': 'H_HYPOTHEQUES',
    }
)


# ============================================================================
# BERN (BE) - Steuererklärung 2024
# ============================================================================

BERN_FORM_MAPPING = CantonFormMapping(
    canton_code='BE',
    canton_name='Bern',
    form_name='Steuererklärung für natürliche Personen 2024',
    form_year=2024,
    form_url='https://www.fin.be.ch/de/start/steuern.html',
    field_mappings={
        # Personal Information
        'name': '01_Name',
        'firstname': '02_Vorname',
        'ssn': '03_AHV_Nr',
        'birthdate': '04_Geburtsdatum',
        'address': '05_Adresse',
        'zip': '06_PLZ',
        'city': '07_Wohnort',
        'marital_status': '08_Zivilstand',

        # Spouse
        'spouse_name': '09_Name_Partner',
        'spouse_firstname': '10_Vorname_Partner',
        'spouse_ssn': '11_AHV_Nr_Partner',

        # Children
        'num_children': '12_Kinder',

        # Employment Income
        'employment_income': '20_Erwerbseinkommen',
        'employment_income_spouse': '21_Erwerbseinkommen_Partner',

        # Self-Employment
        'self_employment_income': '22_Selbstaendig',

        # Capital Income
        'capital_income': '30_Vermoegensertrag',
        'dividend_income': '31_Dividenden',
        'interest_income': '32_Zinsen',

        # Rental Income
        'rental_income_total': '40_Miet_und_Pachteinnahmen',

        # Other Income
        'other_income': '50_Weitere_Einkuenfte',
        'pension_income': '51_AHV_IV_Renten',

        # Deductions
        'professional_expenses': '60_Berufskosten',
        'pillar_3a_contributions': '61_Saeule_3a',
        'pillar_2_buyins': '62_BVG_Einkauf',
        'insurance_premiums': '63_Versicherungen',
        'medical_expenses': '64_Krankheit',
        'training_expenses': '65_Ausbildung',
        'alimony_payments': '66_Alimente',
        'property_maintenance': '67_Unterhaltskosten',
        'mortgage_interest': '68_Schuldzinsen',

        # Assets
        'total_assets': '70_Vermoegen',
        'bank_accounts': '71_Bankkonten',
        'securities': '72_Wertpapiere',
        'real_estate_value': '73_Grundstuecke',

        # Liabilities
        'total_liabilities': '80_Schulden',
        'mortgage_debt': '81_Hypotheken',
    }
)


# ============================================================================
# BASEL-STADT (BS) - Steuererklärung 2024
# ============================================================================

BASEL_STADT_FORM_MAPPING = CantonFormMapping(
    canton_code='BS',
    canton_name='Basel-Stadt',
    form_name='Steuererklärung 2024',
    form_year=2024,
    form_url='https://www.steuerverwaltung.bs.ch/',
    field_mappings={
        # Personal Information
        'name': 'P1_Name',
        'firstname': 'P2_Vorname',
        'ssn': 'P3_AHVN13',
        'birthdate': 'P4_Geburtsdatum',
        'address': 'P5_Strasse_Nr',
        'zip': 'P6_PLZ',
        'city': 'P7_Ort',
        'marital_status': 'P8_Zivilstand',

        # Spouse
        'spouse_name': 'P9_Partner_Name',
        'spouse_firstname': 'P10_Partner_Vorname',
        'spouse_ssn': 'P11_Partner_AHVN13',

        # Children
        'num_children': 'P12_Kinderanzahl',

        # Employment Income
        'employment_income': 'E1_Lohn',
        'employment_income_spouse': 'E2_Lohn_Partner',

        # Self-Employment
        'self_employment_income': 'E3_Selbstaendig',

        # Capital Income
        'capital_income': 'V1_Vermoegensertrag',
        'dividend_income': 'V2_Dividenden',
        'interest_income': 'V3_Zinsen',

        # Rental Income
        'rental_income_total': 'L1_Liegenschaftsertrag',

        # Other Income
        'other_income': 'S1_Sonstige',
        'pension_income': 'S2_Renten',

        # Deductions
        'professional_expenses': 'A1_Berufskosten',
        'pillar_3a_contributions': 'A2_Saeule3a',
        'pillar_2_buyins': 'A3_BVG',
        'insurance_premiums': 'A4_Versicherungen',
        'medical_expenses': 'A5_Krankheit',
        'training_expenses': 'A6_Ausbildung',
        'alimony_payments': 'A7_Alimente',
        'property_maintenance': 'A8_Unterhalt',
        'mortgage_interest': 'A9_Schuldzins',

        # Assets
        'total_assets': 'VM1_Vermoegen',
        'bank_accounts': 'VM2_Bank',
        'securities': 'VM3_Wertschriften',
        'real_estate_value': 'VM4_Liegenschaften',

        # Liabilities
        'total_liabilities': 'S1_Schulden',
        'mortgage_debt': 'S2_Hypotheken',
    }
)


# ============================================================================
# VAUD (VD) - Déclaration d'impôt 2024
# ============================================================================

VAUD_FORM_MAPPING = CantonFormMapping(
    canton_code='VD',
    canton_name='Vaud',
    form_name='Déclaration fiscale 2024',
    form_year=2024,
    form_url='https://www.vd.ch/themes/etat-droit-finances/impots/',
    field_mappings={
        # Personal Information
        'name': '1_NOM',
        'firstname': '2_PRENOM',
        'ssn': '3_AVS',
        'birthdate': '4_NAISSANCE',
        'address': '5_ADRESSE',
        'zip': '6_NPA',
        'city': '7_LOCALITE',
        'marital_status': '8_CIVIL',

        # Spouse
        'spouse_name': '9_NOM_CONJOINT',
        'spouse_firstname': '10_PRENOM_CONJOINT',
        'spouse_ssn': '11_AVS_CONJOINT',

        # Children
        'num_children': '12_ENFANTS',

        # Employment Income
        'employment_income': '100_SALAIRE',
        'employment_income_spouse': '101_SALAIRE_CONJOINT',

        # Self-Employment
        'self_employment_income': '110_INDEPENDANT',

        # Capital Income
        'capital_income': '200_FORTUNE',
        'dividend_income': '201_DIVIDENDES',
        'interest_income': '202_INTERETS',

        # Rental Income
        'rental_income_total': '300_IMMOBILIER',

        # Other Income
        'other_income': '400_AUTRES',
        'pension_income': '401_RENTES',

        # Deductions
        'professional_expenses': '500_FRAIS_PRO',
        'pillar_3a_contributions': '501_3A',
        'pillar_2_buyins': '502_LPP',
        'insurance_premiums': '503_ASSURANCES',
        'medical_expenses': '504_SANTE',
        'training_expenses': '505_FORMATION',
        'alimony_payments': '506_PENSIONS',
        'property_maintenance': '507_ENTRETIEN',
        'mortgage_interest': '508_INTERETS_HYPO',

        # Assets
        'total_assets': '600_FORTUNE_TOT',
        'bank_accounts': '601_BANQUE',
        'securities': '602_TITRES',
        'real_estate_value': '603_IMMO',

        # Liabilities
        'total_liabilities': '700_DETTES',
        'mortgage_debt': '701_HYPO',
    }
)


# ============================================================================
# Remaining 21 Cantons - Template Mappings
# ============================================================================

def create_standard_mapping(
    canton_code: str,
    canton_name: str,
    form_name: str,
    form_url: str
) -> CantonFormMapping:
    """
    Create standard mapping for cantons using similar form structure.
    These can be refined with actual canton-specific field names later.
    """
    return CantonFormMapping(
        canton_code=canton_code,
        canton_name=canton_name,
        form_name=form_name,
        form_year=2024,
        form_url=form_url,
        field_mappings={
            # Personal Information
            'name': f'{canton_code}_Name',
            'firstname': f'{canton_code}_Vorname',
            'ssn': f'{canton_code}_AHV',
            'birthdate': f'{canton_code}_Geburtsdatum',
            'address': f'{canton_code}_Adresse',
            'zip': f'{canton_code}_PLZ',
            'city': f'{canton_code}_Ort',
            'marital_status': f'{canton_code}_Zivilstand',
            'spouse_name': f'{canton_code}_Partner_Name',
            'spouse_firstname': f'{canton_code}_Partner_Vorname',
            'spouse_ssn': f'{canton_code}_Partner_AHV',
            'num_children': f'{canton_code}_Kinder',

            # Income
            'employment_income': f'{canton_code}_Lohn',
            'self_employment_income': f'{canton_code}_Selbstaendig',
            'capital_income': f'{canton_code}_Vermoegensertrag',
            'rental_income_total': f'{canton_code}_Liegenschaft',
            'other_income': f'{canton_code}_Weitere',

            # Deductions
            'professional_expenses': f'{canton_code}_Berufskosten',
            'pillar_3a_contributions': f'{canton_code}_3a',
            'insurance_premiums': f'{canton_code}_Versicherung',
            'property_maintenance': f'{canton_code}_Unterhalt',
            'mortgage_interest': f'{canton_code}_Schuldzins',

            # Assets
            'total_assets': f'{canton_code}_Vermoegen',
            'bank_accounts': f'{canton_code}_Bank',
            'real_estate_value': f'{canton_code}_Grundstueck',

            # Liabilities
            'total_liabilities': f'{canton_code}_Schulden',
            'mortgage_debt': f'{canton_code}_Hypothek',
        }
    )


# All 26 Canton Mappings
ALL_CANTON_MAPPINGS = {
    'ZH': ZURICH_FORM_MAPPING,
    'GE': GENEVA_FORM_MAPPING,
    'BE': BERN_FORM_MAPPING,
    'BS': BASEL_STADT_FORM_MAPPING,
    'VD': VAUD_FORM_MAPPING,

    # Remaining cantons with standard template
    'LU': create_standard_mapping('LU', 'Lucerne', 'Steuererklärung 2024', 'https://steuern.lu.ch/'),
    'UR': create_standard_mapping('UR', 'Uri', 'Steuererklärung 2024', 'https://www.ur.ch/steuern'),
    'SZ': create_standard_mapping('SZ', 'Schwyz', 'Steuererklärung 2024', 'https://www.sz.ch/steuern'),
    'OW': create_standard_mapping('OW', 'Obwalden', 'Steuererklärung 2024', 'https://www.ow.ch/steuern'),
    'NW': create_standard_mapping('NW', 'Nidwalden', 'Steuererklärung 2024', 'https://www.nw.ch/steuern'),
    'GL': create_standard_mapping('GL', 'Glarus', 'Steuererklärung 2024', 'https://www.gl.ch/steuern'),
    'ZG': create_standard_mapping('ZG', 'Zug', 'Steuererklärung 2024', 'https://www.zg.ch/steuern'),
    'FR': create_standard_mapping('FR', 'Fribourg', 'Déclaration fiscale 2024', 'https://www.fr.ch/impots'),
    'SO': create_standard_mapping('SO', 'Solothurn', 'Steuererklärung 2024', 'https://www.so.ch/steuern'),
    'BL': create_standard_mapping('BL', 'Basel-Landschaft', 'Steuererklärung 2024', 'https://www.steuern.bl.ch/'),
    'SH': create_standard_mapping('SH', 'Schaffhausen', 'Steuererklärung 2024', 'https://sh.ch/steuern'),
    'AR': create_standard_mapping('AR', 'Appenzell Ausserrhoden', 'Steuererklärung 2024', 'https://www.ar.ch/steuern'),
    'AI': create_standard_mapping('AI', 'Appenzell Innerrhoden', 'Steuererklärung 2024', 'https://www.ai.ch/steuern'),
    'SG': create_standard_mapping('SG', 'St. Gallen', 'Steuererklärung 2024', 'https://www.sg.ch/steuern'),
    'GR': create_standard_mapping('GR', 'Graubünden', 'Steuererklärung 2024', 'https://www.stv.gr.ch/'),
    'AG': create_standard_mapping('AG', 'Aargau', 'Steuererklärung 2024', 'https://www.ag.ch/steuern'),
    'TG': create_standard_mapping('TG', 'Thurgau', 'Steuererklärung 2024', 'https://steuerverwaltung.tg.ch/'),
    'TI': create_standard_mapping('TI', 'Ticino', 'Dichiarazione fiscale 2024', 'https://www4.ti.ch/dfe/dc/'),
    'NE': create_standard_mapping('NE', 'Neuchâtel', 'Déclaration fiscale 2024', 'https://www.ne.ch/impots'),
    'VS': create_standard_mapping('VS', 'Valais', 'Déclaration fiscale 2024', 'https://www.vs.ch/impots'),
    'JU': create_standard_mapping('JU', 'Jura', 'Déclaration fiscale 2024', 'https://www.jura.ch/impots'),
}


def get_canton_mapping(canton_code: str) -> Optional[CantonFormMapping]:
    """
    Get form field mapping for a specific canton.

    Args:
        canton_code: Two-letter canton code (e.g., 'ZH', 'GE')

    Returns:
        CantonFormMapping or None if canton not found
    """
    return ALL_CANTON_MAPPINGS.get(canton_code.upper())


def map_filing_data_to_canton_form(
    filing_data: Dict[str, Any],
    calculation_data: Dict[str, Any],
    canton_code: str
) -> Optional[Dict[str, Any]]:
    """
    Map tax filing data to canton-specific form fields.

    Args:
        filing_data: Filing session data (from TaxFilingSession.to_dict())
        calculation_data: Tax calculation results
        canton_code: Canton code

    Returns:
        Dict with canton form field names as keys, or None if canton not found
    """
    mapping = get_canton_mapping(canton_code)
    if not mapping:
        return None

    # Extract profile data
    profile = filing_data.get('profile', {})

    # Combine all data sources
    combined_data = {
        **profile,
        **calculation_data.get('income', {}),
        **calculation_data.get('deductions', {}),
    }

    # Map to canton form fields
    return mapping.map_data(combined_data)


# ============================================================================
# Form Field Type Definitions
# ============================================================================

FIELD_TYPES = {
    # Personal fields
    'name': FormFieldType.TEXT,
    'firstname': FormFieldType.TEXT,
    'ssn': FormFieldType.TEXT,
    'birthdate': FormFieldType.DATE,
    'address': FormFieldType.TEXT,
    'zip': FormFieldType.TEXT,
    'city': FormFieldType.TEXT,
    'marital_status': FormFieldType.TEXT,

    # Income fields
    'employment_income': FormFieldType.CURRENCY,
    'self_employment_income': FormFieldType.CURRENCY,
    'capital_income': FormFieldType.CURRENCY,
    'rental_income_total': FormFieldType.CURRENCY,
    'other_income': FormFieldType.CURRENCY,

    # Deduction fields
    'professional_expenses': FormFieldType.CURRENCY,
    'pillar_3a_contributions': FormFieldType.CURRENCY,
    'insurance_premiums': FormFieldType.CURRENCY,
    'property_maintenance': FormFieldType.CURRENCY,
    'mortgage_interest': FormFieldType.CURRENCY,

    # Asset fields
    'total_assets': FormFieldType.CURRENCY,
    'bank_accounts': FormFieldType.CURRENCY,
    'real_estate_value': FormFieldType.CURRENCY,

    # Liability fields
    'total_liabilities': FormFieldType.CURRENCY,
    'mortgage_debt': FormFieldType.CURRENCY,

    # Count fields
    'num_children': FormFieldType.NUMBER,
}


def get_field_type(internal_field: str) -> FormFieldType:
    """Get the type of a field"""
    return FIELD_TYPES.get(internal_field, FormFieldType.TEXT)
