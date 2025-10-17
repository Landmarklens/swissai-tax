#!/usr/bin/env python3
"""
Script to reorganize interview questions flow and add new deduction questions.

Changes:
1. Move Q01d (spouse employed) to income section
2. Move Q02a/Q02b (other canton income) to income section
3. Remove Q03b (child details - ages, names)
4. Add new deduction questions:
   - Q_commute_costs (commuting)
   - Q_professional_dev (professional development)
   - Q_mortgage_interest (mortgage interest)
   - Q_house_maintenance (property maintenance)
   - Q03d (child support)
   - Q03e (education expenses)
5. Reorganize flow to be more logical
"""

import yaml
from collections import OrderedDict

def represent_ordereddict(dumper, data):
    """Custom representer for OrderedDict to maintain order in YAML"""
    return dumper.represent_dict(data.items())

yaml.add_representer(OrderedDict, represent_ordereddict)

# Load existing questions
with open('config/questions.yaml', 'r') as f:
    data = yaml.safe_load(f)

questions = data['questions']

# ============================================================================
# STEP 1: Update existing question flows
# ============================================================================

print("Step 1: Updating existing question flows...")

# Update Q01 branching - remove Q01d from married branch (will move to income section)
questions['Q01']['branching'] = {
    'married': ['Q01a_name', 'Q01a'],
    'default': 'Q03'  # Changed from Q02a
}

# Update Q01a next field
questions['Q01a']['next'] = 'Q03'  # Changed from Q01d

# Update Q03 (children question) - skip Q03b, go to Q03a or Q17
questions['Q03']['branching'] = {
    True: 'Q03a',
    False: 'Q17'  # Jump to church question
}

# Update Q03a next field - skip Q03b, go directly to Q03c
questions['Q03a']['next'] = 'Q17'  # Go to church, will come back for childcare in deductions

# Update Q17 (church) next field - go to income section
questions['Q17']['branching'] = {
    True: 'Q17a',
    False: 'Q01d'  # Go to spouse employment (now in income section)
}

# Update Q17a next field
questions['Q17a']['next'] = 'Q17c'

# Update Q17c next field
questions['Q17c']['branching'] = {
    True: 'Q01d',  # Go to income section
    False: 'Q01d'  # Go to income section
}

# Q01d (spouse employed) - update to go to Q02a (other canton income)
questions['Q01d']['next'] = 'Q02a'
questions['Q01d']['category'] = 'income_sources'

# Q02a/Q02b - update category and next fields
questions['Q02a']['category'] = 'income_sources'
questions['Q02a']['branching'] = {
    True: 'Q02b',
    False: 'Q04'  # Go to employment questions
}

questions['Q02b']['next'] = 'Q04'
questions['Q02b']['category'] = 'income_sources'

# Update Q04c branching to go to Q04d first
questions['Q04c']['branching'] = {
    True: 'Q04d',
    False: 'Q05'
}

# Update Q04d branching
if 'branching' in questions['Q04d']:
    questions['Q04d']['branching'] = {
        True: 'Q04d_details',
        False: 'Q05'
    }

# Update Q04d_details next
if 'Q04d_details' in questions:
    questions['Q04d_details']['next'] = 'Q05'

# Update income section flows to retirement
questions['Q06']['branching'] = {True: 'Q07', False: 'Q07'}
questions['Q07']['branching'] = {True: 'Q08', False: 'Q08'}
questions['Q08']['branching'] = {True: 'Q09', False: 'Q09'}

# Update property section
questions['Q09']['branching'] = {
    True: 'Q09a',
    False: 'Q18_bank_statements'  # Skip to bank statements
}

questions['Q09a']['next'] = 'Q09b'
questions['Q09b']['next'] = 'Q09b_upload'
questions['Q09b_upload']['next'] = 'Q09c'
questions['Q09c']['branching'] = {
    True: 'Q09c_amount',
    False: 'Q18_bank_statements'
}
questions['Q09c_amount']['next'] = 'Q18_bank_statements'

# Update financial assets section
questions['Q18_bank_statements']['next'] = 'Q10'
questions['Q10']['branching'] = {
    True: 'Q10a',
    False: 'Q16'  # Skip to crypto
}
questions['Q10a']['branching'] = {
    True: 'Q10b',
    False: 'Q10b'
}

# Fix Q10b next (was Q10_upload which doesn't exist)
if 'Q10b' in questions:
    questions['Q10b']['next'] = 'Q16'

# Update Q16 to go to deductions
questions['Q16']['branching'] = {
    True: 'Q03c',  # Start deductions with childcare
    False: 'Q03c'
}

# ============================================================================
# STEP 2: Add new deduction questions
# ============================================================================

print("Step 2: Adding new deduction questions...")

# Q_commute_costs
questions['Q_commute_costs'] = {
    'id': 'Q_commute_costs',
    'text': {
        'en': 'Do you have commuting costs between home and work?',
        'de': 'Haben Sie Fahrtkosten zwischen Wohnort und Arbeitsplatz?',
        'fr': 'Avez-vous des frais de déplacement entre domicile et travail?',
        'it': 'Ha spese di pendolarismo tra casa e lavoro?'
    },
    'type': 'yes_no',
    'explanation': {
        'en': 'Commuting costs between your home and workplace can be deducted. This includes public transport season tickets or private vehicle costs based on distance.',
        'de': 'Fahrtkosten zwischen Wohnort und Arbeitsplatz sind abzugsfähig. Dies umfasst Abonnemente für öffentliche Verkehrsmittel oder private Fahrzeugkosten basierend auf der Distanz.',
        'fr': 'Les frais de déplacement entre domicile et lieu de travail sont déductibles. Cela comprend les abonnements de transport public ou les frais de véhicule privé selon la distance.'
    },
    'branching': {
        True: 'Q_commute_costs_details',
        False: 'Q_professional_dev'
    },
    'category': 'deductions',
    'required': True
}

# Q_commute_costs_details
questions['Q_commute_costs_details'] = {
    'id': 'Q_commute_costs_details',
    'text': {'en': 'Commuting cost details', 'de': 'Fahrtkosten Details', 'fr': 'Détails des frais de déplacement'},
    'type': 'group',
    'parent': 'Q_commute_costs',
    'next': 'Q_professional_dev',
    'category': 'deductions',
    'fields': [
        {
            'id': 'transport_type',
            'text': {
                'en': 'Type of transport',
                'de': 'Verkehrsmittel',
                'fr': 'Type de transport'
            },
            'type': 'single_choice',
            'options': [
                {
                    'value': 'public',
                    'label': {
                        'en': 'Public transport (GA, Half-Fare, Monthly pass)',
                        'de': 'Öffentliche Verkehrsmittel (GA, Halbtax, Monatsabo)',
                        'fr': 'Transport public (AG, Demi-tarif, Abonnement)'
                    }
                },
                {
                    'value': 'private',
                    'label': {
                        'en': 'Private vehicle (car, motorcycle)',
                        'de': 'Privates Fahrzeug (Auto, Motorrad)',
                        'fr': 'Véhicule privé (voiture, moto)'
                    }
                },
                {
                    'value': 'bicycle',
                    'label': {
                        'en': 'Bicycle/E-bike',
                        'de': 'Fahrrad/E-Bike',
                        'fr': 'Vélo/E-bike'
                    }
                }
            ]
        },
        {
            'id': 'annual_cost',
            'text': {
                'en': 'Annual commuting costs (CHF)',
                'de': 'Jährliche Fahrtkosten (CHF)',
                'fr': 'Frais de déplacement annuels (CHF)'
            },
            'type': 'currency',
            'help_text': {
                'en': 'Enter the total annual cost for commuting to work',
                'de': 'Geben Sie die gesamten jährlichen Kosten für den Arbeitsweg ein',
                'fr': 'Entrez le coût annuel total pour les déplacements au travail'
            }
        },
        {
            'id': 'distance_km',
            'text': {
                'en': 'One-way distance (km)',
                'de': 'Einfache Distanz (km)',
                'fr': 'Distance simple (km)'
            },
            'type': 'number',
            'help_text': {
                'en': 'Distance from home to workplace in kilometers',
                'de': 'Distanz von Wohnort zu Arbeitsplatz in Kilometer',
                'fr': 'Distance du domicile au lieu de travail en kilomètres'
            }
        }
    ]
}

# Q_professional_dev
questions['Q_professional_dev'] = {
    'id': 'Q_professional_dev',
    'text': {
        'en': 'Did you have professional training or development expenses?',
        'de': 'Hatten Sie Weiterbildungs- oder berufliche Entwicklungskosten?',
        'fr': 'Avez-vous eu des frais de formation professionnelle?',
        'it': 'Ha avuto spese per la formazione professionale?'
    },
    'type': 'yes_no',
    'explanation': {
        'en': 'Costs for professional training, courses, certifications, and career development can be deducted if they are directly related to your current job.',
        'de': 'Kosten für berufliche Weiterbildung, Kurse, Zertifizierungen und Karriereentwicklung sind abzugsfähig, wenn sie direkt mit Ihrer aktuellen Tätigkeit zusammenhängen.',
        'fr': 'Les frais de formation professionnelle, cours, certifications et développement de carrière sont déductibles s\'ils sont directement liés à votre emploi actuel.'
    },
    'branching': {
        True: 'Q_professional_dev_details',
        False: 'Q_mortgage_interest'
    },
    'category': 'deductions',
    'required': True
}

# Q_professional_dev_details
questions['Q_professional_dev_details'] = {
    'id': 'Q_professional_dev_details',
    'text': {'en': 'Professional development details', 'de': 'Weiterbildungskosten Details', 'fr': 'Détails formation professionnelle'},
    'type': 'group',
    'parent': 'Q_professional_dev',
    'next': 'Q_mortgage_interest',
    'category': 'deductions',
    'fields': [
        {
            'id': 'annual_cost',
            'text': {
                'en': 'Annual professional development expenses (CHF)',
                'de': 'Jährliche Weiterbildungskosten (CHF)',
                'fr': 'Frais de formation professionnelle annuels (CHF)'
            },
            'type': 'currency',
            'help_text': {
                'en': 'Include course fees, exam costs, study materials, and related travel expenses',
                'de': 'Einschließlich Kursgebühren, Prüfungskosten, Studienmaterial und damit verbundene Reisekosten',
                'fr': 'Incluez les frais de cours, coûts d\'examen, matériel d\'étude et frais de déplacement associés'
            }
        },
        {
            'id': 'description',
            'text': {
                'en': 'What type of training?',
                'de': 'Welche Art von Weiterbildung?',
                'fr': 'Quel type de formation?'
            },
            'type': 'text',
            'placeholder': {
                'en': 'e.g., CFA course, programming bootcamp, language course',
                'de': 'z.B. CFA-Kurs, Programmier-Bootcamp, Sprachkurs',
                'fr': 'ex: cours CFA, bootcamp de programmation, cours de langue'
            }
        }
    ]
}

# Q_mortgage_interest
questions['Q_mortgage_interest'] = {
    'id': 'Q_mortgage_interest',
    'text': {
        'en': 'Do you pay mortgage interest on your primary residence?',
        'de': 'Zahlen Sie Hypothekarzinsen für Ihre Hauptwohnung?',
        'fr': 'Payez-vous des intérêts hypothécaires sur votre résidence principale?'
    },
    'type': 'yes_no',
    'explanation': {
        'en': 'Mortgage interest on your primary residence is tax-deductible. You will need your annual mortgage statement from your bank.',
        'de': 'Hypothekarzinsen für Ihre Hauptwohnung sind steuerlich abzugsfähig. Sie benötigen Ihre jährliche Hypothekarrechnung von der Bank.',
        'fr': 'Les intérêts hypothécaires sur votre résidence principale sont déductibles d\'impôt. Vous aurez besoin de votre relevé hypothécaire annuel de votre banque.'
    },
    'branching': {
        True: 'Q_mortgage_interest_details',
        False: 'Q_house_maintenance'
    },
    'category': 'deductions',
    'required': True
}

# Q_mortgage_interest_details
questions['Q_mortgage_interest_details'] = {
    'id': 'Q_mortgage_interest_details',
    'text': {'en': 'Mortgage interest details', 'de': 'Hypothekarzinsen Details', 'fr': 'Détails intérêts hypothécaires'},
    'type': 'group',
    'parent': 'Q_mortgage_interest',
    'next': 'Q_house_maintenance',
    'category': 'deductions',
    'fields': [
        {
            'id': 'annual_interest',
            'text': {
                'en': 'Annual mortgage interest paid (CHF)',
                'de': 'Jährlich bezahlte Hypothekarzinsen (CHF)',
                'fr': 'Intérêts hypothécaires payés annuellement (CHF)'
            },
            'type': 'currency'
        }
    ],
    'inline_document_upload': {
        'document_type': 'mortgage_statement',
        'accepted_formats': ['pdf', 'jpg', 'jpeg', 'png'],
        'max_size_mb': 10,
        'bring_later': True,
        'upload_text': {
            'en': 'Upload your annual mortgage statement',
            'de': 'Laden Sie Ihre jährliche Hypothekarrechnung hoch',
            'fr': 'Téléchargez votre relevé hypothécaire annuel'
        }
    }
}

# Q_house_maintenance
questions['Q_house_maintenance'] = {
    'id': 'Q_house_maintenance',
    'text': {
        'en': 'Did you have property maintenance or renovation costs?',
        'de': 'Hatten Sie Liegenschaftsunterhalts- oder Renovationskosten?',
        'fr': 'Avez-vous eu des frais d\'entretien ou de rénovation de propriété?'
    },
    'type': 'yes_no',
    'explanation': {
        'en': 'Maintenance and renovation costs for your primary residence are deductible. This includes repairs, painting, renovations (not energy-related), and property upkeep.',
        'de': 'Unterhalts- und Renovationskosten für Ihre Hauptwohnung sind abzugsfähig. Dies umfasst Reparaturen, Malerarbeiten, Renovationen (nicht energetisch) und Liegenschaftspflege.',
        'fr': 'Les frais d\'entretien et de rénovation de votre résidence principale sont déductibles. Cela comprend les réparations, peinture, rénovations (non énergétiques) et entretien de propriété.'
    },
    'branching': {
        True: 'Q_house_maintenance_details',
        False: 'Q_energy_renovation'
    },
    'category': 'deductions',
    'required': True
}

# Q_house_maintenance_details
questions['Q_house_maintenance_details'] = {
    'id': 'Q_house_maintenance_details',
    'text': {'en': 'Property maintenance details', 'de': 'Unterhaltskosten Details', 'fr': 'Détails entretien propriété'},
    'type': 'group',
    'parent': 'Q_house_maintenance',
    'next': 'Q_energy_renovation',
    'category': 'deductions',
    'fields': [
        {
            'id': 'annual_cost',
            'text': {
                'en': 'Annual maintenance and renovation costs (CHF)',
                'de': 'Jährliche Unterhalts- und Renovationskosten (CHF)',
                'fr': 'Coûts annuels d\'entretien et rénovation (CHF)'
            },
            'type': 'currency'
        },
        {
            'id': 'description',
            'text': {
                'en': 'What type of work?',
                'de': 'Welche Art von Arbeiten?',
                'fr': 'Quel type de travaux?'
            },
            'type': 'text',
            'placeholder': {
                'en': 'e.g., roof repair, painting, bathroom renovation',
                'de': 'z.B. Dachreparatur, Malerarbeiten, Badezimmerrenovation',
                'fr': 'ex: réparation toit, peinture, rénovation salle de bain'
            }
        }
    ]
}

# Update Q_energy_renovation next
if 'Q_energy_renovation' in questions:
    questions['Q_energy_renovation']['next'] = 'Q11'

# Q03d - Child support
questions['Q03d'] = {
    'id': 'Q03d',
    'text': {
        'en': 'Do you pay child support (alimony for children)?',
        'de': 'Zahlen Sie Kinderalimente?',
        'fr': 'Payez-vous une pension alimentaire pour enfants?'
    },
    'type': 'yes_no',
    'explanation': {
        'en': 'Child support payments you make to a former spouse or partner are tax-deductible. This is different from spousal alimony.',
        'de': 'Kinderalimente, die Sie an einen ehemaligen Ehepartner oder Partner zahlen, sind steuerlich abzugsfähig. Dies unterscheidet sich von Ehegattenalimenten.',
        'fr': 'Les pensions alimentaires pour enfants que vous versez à un ex-conjoint sont déductibles d\'impôt. Ceci est différent de la pension alimentaire pour conjoint.'
    },
    'branching': {
        True: 'Q03d_details',
        False: 'Q03e'
    },
    'category': 'deductions',
    'required': True
}

# Q03d_details
questions['Q03d_details'] = {
    'id': 'Q03d_details',
    'text': {'en': 'Child support details', 'de': 'Kinderalimente Details', 'fr': 'Détails pension alimentaire'},
    'type': 'group',
    'parent': 'Q03d',
    'next': 'Q03e',
    'category': 'deductions',
    'fields': [
        {
            'id': 'annual_amount',
            'text': {
                'en': 'Annual child support paid (CHF)',
                'de': 'Jährlich bezahlte Kinderalimente (CHF)',
                'fr': 'Pension alimentaire annuelle versée (CHF)'
            },
            'type': 'currency'
        },
        {
            'id': 'num_children',
            'text': {
                'en': 'Number of children receiving support',
                'de': 'Anzahl der Kinder mit Alimentenzahlungen',
                'fr': 'Nombre d\'enfants recevant une pension'
            },
            'type': 'number'
        }
    ]
}

# Q03e - Education expenses
questions['Q03e'] = {
    'id': 'Q03e',
    'text': {
        'en': 'Did you have education expenses for your children in post-secondary education?',
        'de': 'Hatten Sie Ausbildungskosten für Ihre Kinder in nachobligatorischer Ausbildung?',
        'fr': 'Avez-vous eu des frais de scolarité pour vos enfants dans l\'enseignement post-secondaire?'
    },
    'type': 'yes_no',
    'explanation': {
        'en': 'Education expenses for children in post-secondary education (university, vocational training) may be deductible depending on the canton.',
        'de': 'Ausbildungskosten für Kinder in nachobligatorischer Ausbildung (Universität, Berufsausbildung) können je nach Kanton abzugsfähig sein.',
        'fr': 'Les frais de scolarité pour enfants dans l\'enseignement post-secondaire (université, formation professionnelle) peuvent être déductibles selon le canton.'
    },
    'branching': {
        True: 'Q03e_details',
        False: 'Q_commute_costs'
    },
    'category': 'deductions',
    'required': True
}

# Q03e_details
questions['Q03e_details'] = {
    'id': 'Q03e_details',
    'text': {'en': 'Education expense details', 'de': 'Ausbildungskosten Details', 'fr': 'Détails frais de scolarité'},
    'type': 'group',
    'parent': 'Q03e',
    'next': 'Q_commute_costs',
    'category': 'deductions',
    'fields': [
        {
            'id': 'annual_cost',
            'text': {
                'en': 'Annual education expenses (CHF)',
                'de': 'Jährliche Ausbildungskosten (CHF)',
                'fr': 'Frais de scolarité annuels (CHF)'
            },
            'type': 'currency',
            'help_text': {
                'en': 'Include tuition, books, and related educational expenses',
                'de': 'Einschließlich Studiengebühren, Bücher und damit verbundene Bildungskosten',
                'fr': 'Incluez les frais de scolarité, livres et dépenses éducatives associées'
            }
        }
    ]
}

# Update Q03c to be the entry point for child deductions
questions['Q03c']['branching'] = {
    True: 'Q03d',  # If has childcare costs, ask about child support next
    False: 'Q03d'  # Still ask about child support even if no childcare costs
}

# Update Q11 (charitable donations) next
questions['Q11']['branching'] = {
    True: 'Q12',
    False: 'Q12'
}

# Update Q12 (alimony) next
questions['Q12']['branching'] = {
    True: 'Q13',
    False: 'Q13'
}

# Update Q13 to flow to special situations
questions['Q13']['branching'] = {
    True: 'Q13b',
    False: 'Q_complexity_screen'
}

# Update Q13b chain
if 'Q13b' in questions:
    questions['Q13b']['next'] = 'Q13b_basic'
if 'Q13b_basic' in questions:
    questions['Q13b_basic']['next'] = 'Q13b_supplementary'
if 'Q13b_supplementary' in questions:
    questions['Q13b_supplementary']['branching'] = {
        True: 'Q13b_supplementary_amount',
        False: 'Q_complexity_screen'
    }
if 'Q13b_supplementary_amount' in questions:
    questions['Q13b_supplementary_amount']['next'] = 'Q_complexity_screen'

# Update Q_complexity_screen to go to Q15 (foreign income)
if 'Q_complexity_screen' in questions:
    # Keep existing branching but set default to Q15
    if 'branching' not in questions['Q_complexity_screen']:
        questions['Q_complexity_screen']['branching'] = {}
    questions['Q_complexity_screen']['branching']['default'] = 'Q15'

# Update Q15 flow
questions['Q15']['branching'] = {
    True: 'Q15_details',
    False: 'Q17b'
}

if 'Q15_details' in questions:
    questions['Q15_details']['next'] = 'Q17b'

# Update Q17b to complete
questions['Q17b']['branching'] = {
    True: 'complete',
    False: 'complete'
}

# ============================================================================
# STEP 3: Remove Q03b (child details)
# ============================================================================

print("Step 3: Removing Q03b (child details)...")
if 'Q03b' in questions:
    del questions['Q03b']
    print("  Removed Q03b")

# ============================================================================
# Save updated questions
# ============================================================================

print("\nSaving updated questions.yaml...")

# Write to file with proper YAML formatting
with open('config/questions.yaml', 'w') as f:
    yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False, width=120)

print("\n✅ Successfully updated questions.yaml")
print("\nSummary of changes:")
print("  - Moved Q01d (spouse employed) to income section")
print("  - Moved Q02a/Q02b (other canton) to income section")
print("  - Removed Q03b (child age/name details)")
print("  - Added Q_commute_costs (commuting deduction)")
print("  - Added Q_professional_dev (professional development)")
print("  - Added Q_mortgage_interest (mortgage interest deduction)")
print("  - Added Q_house_maintenance (property maintenance)")
print("  - Added Q03d (child support payments)")
print("  - Added Q03e (education expenses)")
print("  - Reorganized flow to be more logical")
print("\n⚠️  Please review the changes and test the interview flow!")
