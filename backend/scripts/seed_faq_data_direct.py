#!/usr/bin/env python3
"""
Seed FAQ data into the database using direct SQL
"""
import os
import sys
from uuid import uuid4

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from database.connection import get_db_config


def seed_faq_data():
    """Seed FAQ categories and questions using direct SQL"""

    # Get database configuration
    db_config = get_db_config()
    database_url = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"

    # Create engine
    engine = create_engine(database_url)

    print("🌱 Starting FAQ data seeding...")

    # Define FAQ structure
    faq_structure = [
        {
            'name': 'Getting Started',
            'slug': 'getting-started',
            'description': 'Basic information about getting started with SwissAI Tax',
            'user_type': 'all',
            'sort_order': 1,
            'questions': [
                {
                    'question': 'What is SwissAI Tax and how does it work?',
                    'answer': 'SwissAI Tax is an AI-powered Swiss tax filing platform that simplifies the tax preparation process. Our intelligent system guides you through a series of questions, automatically calculates your taxes based on Swiss federal and cantonal regulations, and helps you maximize deductions.',
                    'sort_order': 1
                },
                {
                    'question': 'Who can use SwissAI Tax?',
                    'answer': 'SwissAI Tax is designed for Swiss residents, including both individuals and families. Whether you are employed, self-employed, or have rental income, our platform handles various tax situations across all Swiss cantons.',
                    'sort_order': 2
                },
                {
                    'question': 'How long does it take to complete my tax filing?',
                    'answer': 'Most users complete their tax filing in 15-30 minutes. The exact time depends on the complexity of your financial situation. Our AI guides you step-by-step, making the process as quick and efficient as possible.',
                    'sort_order': 3
                },
                {
                    'question': 'What documents do I need?',
                    'answer': 'You will need your salary certificate (Lohnausweis), bank statements, investment income documentation, receipts for deductible expenses, and any other relevant financial documents. Our system will tell you exactly what documents are needed based on your answers.',
                    'sort_order': 4
                },
                {
                    'question': 'Is my data secure?',
                    'answer': 'Yes, absolutely. We use bank-level encryption to protect all your data. Your personal and financial information is encrypted both in transit and at rest. We comply with Swiss data protection laws and never share your data with third parties.',
                    'sort_order': 5
                }
            ]
        },
        {
            'name': 'Tax Filing Process',
            'slug': 'tax-filing',
            'description': 'Information about the tax filing process',
            'user_type': 'all',
            'sort_order': 2,
            'questions': [
                {
                    'question': 'What tax years can I file with SwissAI Tax?',
                    'answer': 'You can file taxes for the current year and previous years. Our system supports all Swiss cantons and is updated annually with the latest tax regulations and rates.',
                    'sort_order': 1
                },
                {
                    'question': 'Can I save my progress and return later?',
                    'answer': 'Yes, your progress is automatically saved as you go. You can log in anytime and pick up exactly where you left off. Your data remains secure and accessible only to you.',
                    'sort_order': 2
                },
                {
                    'question': 'How do I submit my tax return to the authorities?',
                    'answer': 'After completing your tax filing, SwissAI Tax generates all necessary forms in the correct format for your canton. You can download PDF versions to submit electronically or print and mail them to your tax office.',
                    'sort_order': 3
                },
                {
                    'question': 'What happens if I make a mistake?',
                    'answer': 'You can edit your answers at any time before submitting. Our AI checks for common errors and inconsistencies. If you discover an error after submission, you can file an amendment with your tax office.',
                    'sort_order': 4
                }
            ]
        },
        {
            'name': 'Deductions & Optimization',
            'slug': 'deductions',
            'description': 'Information about tax deductions and optimization',
            'user_type': 'all',
            'sort_order': 3,
            'questions': [
                {
                    'question': 'What deductions am I eligible for?',
                    'answer': 'Deductions vary based on your situation but commonly include Pillar 3a contributions, professional expenses, insurance premiums, commuting costs, childcare expenses, and charitable donations. Our AI identifies all applicable deductions for you.',
                    'sort_order': 1
                },
                {
                    'question': 'How does SwissAI Tax help me save on taxes?',
                    'answer': 'Our AI analyzes your financial situation and automatically identifies all deductions and tax-saving opportunities. We compare your entries against typical deduction amounts and suggest additional deductions you may have missed.',
                    'sort_order': 2
                },
                {
                    'question': 'Can I deduct home office expenses?',
                    'answer': 'Yes, if you work from home regularly and have a dedicated workspace. You can deduct a portion of rent, utilities, and office equipment. Our system calculates the eligible amount based on Swiss tax regulations.',
                    'sort_order': 3
                },
                {
                    'question': 'What about Pillar 3a contributions?',
                    'answer': 'Pillar 3a contributions are fully tax-deductible up to the annual maximum (CHF 7,056 for employees or CHF 35,280 for self-employed without a pension fund). Our system automatically applies these deductions when you enter your contributions.',
                    'sort_order': 4
                }
            ]
        },
        {
            'name': 'Pricing & Support',
            'slug': 'pricing-support',
            'description': 'Information about pricing and customer support',
            'user_type': 'all',
            'sort_order': 4,
            'questions': [
                {
                    'question': 'How much does SwissAI Tax cost?',
                    'answer': 'We offer transparent pricing with no hidden fees. You can start for free and only pay when you are ready to submit your tax return. Pricing varies based on the complexity of your tax situation.',
                    'sort_order': 1
                },
                {
                    'question': 'What if I need help while filing?',
                    'answer': 'Our support team is available via email and chat during business hours. We also offer comprehensive help articles and video tutorials. For complex situations, you can request a consultation with our tax experts.',
                    'sort_order': 2
                },
                {
                    'question': 'Do you offer refunds?',
                    'answer': 'Yes, we offer a satisfaction guarantee. If you are not satisfied with our service before submitting your return, contact us for a full refund. After submission, refunds are evaluated on a case-by-case basis.',
                    'sort_order': 3
                },
                {
                    'question': 'Can I get a tax expert to review my return?',
                    'answer': 'Yes, we offer optional expert review services. A certified Swiss tax professional will review your completed return, check for optimization opportunities, and answer any questions before you submit.',
                    'sort_order': 4
                }
            ]
        }
    ]

    categories_created = 0
    questions_created = 0

    with engine.begin() as conn:
        for cat_data in faq_structure:
            # Check if category exists
            result = conn.execute(text("""
                SELECT id FROM swisstax.faq_categories WHERE slug = :slug
            """), {"slug": cat_data['slug']})

            existing = result.fetchone()

            if existing:
                print(f"  ℹ️  Category '{cat_data['name']}' already exists, skipping...")
                category_id = existing[0]
            else:
                # Create category
                category_id = str(uuid4())
                conn.execute(text("""
                    INSERT INTO swisstax.faq_categories
                    (id, name, slug, description, user_type, sort_order, is_active)
                    VALUES (:id, :name, :slug, :description, CAST(:user_type AS swisstax.usertype), :sort_order, 1)
                """), {
                    'id': category_id,
                    'name': cat_data['name'],
                    'slug': cat_data['slug'],
                    'description': cat_data['description'],
                    'user_type': cat_data['user_type'],
                    'sort_order': cat_data['sort_order']
                })
                categories_created += 1
                print(f"  ✓ Created category: {cat_data['name']}")

            # Create questions for this category
            for q_data in cat_data['questions']:
                # Check if question exists
                result = conn.execute(text("""
                    SELECT id FROM swisstax.faqs
                    WHERE category_id = :category_id AND question = :question
                """), {"category_id": category_id, "question": q_data['question']})

                if result.fetchone():
                    continue

                # Create question
                conn.execute(text("""
                    INSERT INTO swisstax.faqs
                    (id, category_id, question, answer, user_type, sort_order, is_active, view_count, helpful_count)
                    VALUES (:id, :category_id, :question, :answer, CAST(:user_type AS swisstax.usertype), :sort_order, 1, 0, 0)
                """), {
                    'id': str(uuid4()),
                    'category_id': category_id,
                    'question': q_data['question'],
                    'answer': q_data['answer'],
                    'user_type': 'all',
                    'sort_order': q_data['sort_order']
                })
                questions_created += 1

    print(f"\n✅ FAQ seeding completed!")
    print(f"   📁 Categories created: {categories_created}")
    print(f"   ❓ Questions created: {questions_created}")


if __name__ == "__main__":
    seed_faq_data()
