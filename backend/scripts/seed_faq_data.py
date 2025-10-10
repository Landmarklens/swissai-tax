#!/usr/bin/env python3
"""
Seed FAQ data into the database
Creates categories and FAQs based on the static FAQ structure
"""
import json
import os
import sys
from uuid import uuid4

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from database.connection import get_db_config

# Import only FAQ models to avoid issues with other models
from models.faq import FAQ, FAQCategory, UserType


def seed_faq_data(db: Session):
    """Seed FAQ categories and questions"""

    print("🌱 Starting FAQ data seeding...")

    # Define FAQ structure (based on constants/FAQ.js)
    faq_structure = [
        {
            'name': 'Getting Started',
            'slug': 'getting-started',
            'description': 'Basic information about getting started with SwissAI Tax',
            'user_type': UserType.BOTH,
            'sort_order': 1,
            'questions': [
                {
                    'question': 'What is SwissAI Tax and how does it work?',
                    'answer': 'SwissAI Tax is an AI-powered Swiss tax filing platform that simplifies the tax preparation process. Our intelligent system guides you through a series of questions, automatically calculates your taxes based on Swiss federal and cantonal regulations, and helps you maximize deductions.',
                    'sort_order': 1
                },
                {
                    'question': 'Who can use SwissAI Tax?',
                    'answer': 'SwissAI Tax is designed for Swiss residents, including both individuals and families. Whether you\'re employed, self-employed, or a landlord, our platform handles various tax situations across all Swiss cantons.',
                    'sort_order': 2
                },
                {
                    'question': 'How long does it take to complete my tax filing?',
                    'answer': 'Most users complete their tax filing in 15-30 minutes. The exact time depends on the complexity of your financial situation. Our AI guides you step-by-step, making the process as quick and efficient as possible.',
                    'sort_order': 3
                },
                {
                    'question': 'What documents do I need?',
                    'answer': 'You\'ll need your salary certificate (Lohnausweis), bank statements, investment income documentation, receipts for deductible expenses, and any other relevant financial documents. Our system will tell you exactly what documents are needed based on your answers.',
                    'sort_order': 4
                }
            ]
        },
        {
            'name': 'Tax Filing',
            'slug': 'tax-filing',
            'description': 'Information about the tax filing process',
            'user_type': UserType.BOTH,
            'sort_order': 2,
            'questions': [
                {
                    'question': 'Which cantons are supported?',
                    'answer': 'We currently support all 26 Swiss cantons. Our system automatically applies the correct cantonal and municipal tax rates based on your residence.',
                    'sort_order': 1
                },
                {
                    'question': 'Can I save my progress and return later?',
                    'answer': 'Yes! Your progress is automatically saved. You can log out at any time and return to complete your filing when convenient. All your data is securely encrypted and stored.',
                    'sort_order': 2
                },
                {
                    'question': 'How accurate are the tax calculations?',
                    'answer': 'Our calculations are based on official Swiss federal and cantonal tax regulations. We update our system regularly to reflect any changes in tax law. However, for complex situations, we recommend consulting with a tax professional.',
                    'sort_order': 3
                },
                {
                    'question': 'Can I file for previous years?',
                    'answer': 'Yes, you can file tax returns for previous years. Simply select the tax year when starting your filing. Note that different tax rates and regulations may apply for different years.',
                    'sort_order': 4
                },
                {
                    'question': 'What happens after I submit my tax return?',
                    'answer': 'After submission, you can download your completed tax forms and supporting documents. You\'ll then need to submit these to your cantonal tax authority according to their requirements (usually via mail or their online portal).',
                    'sort_order': 5
                }
            ]
        },
        {
            'name': 'Deductions',
            'slug': 'deductions',
            'description': 'Common tax deductions and how they work',
            'user_type': UserType.BOTH,
            'sort_order': 3,
            'questions': [
                {
                    'question': 'What are the most common deductions I can claim?',
                    'answer': 'Common deductions include professional expenses (commuting, work meals, further education), insurance premiums (pillar 3a, health insurance), childcare costs, mortgage interest, charitable donations, and medical expenses. Our AI will identify all deductions you\'re eligible for.',
                    'sort_order': 1
                },
                {
                    'question': 'How do pillar 3a contributions affect my taxes?',
                    'answer': 'Pillar 3a contributions are fully deductible from your taxable income, up to the annual limit (CHF 7,056 for employed persons or CHF 35,280 for self-employed without a pension fund in 2024). This can significantly reduce your tax burden.',
                    'sort_order': 2
                },
                {
                    'question': 'Can I deduct my commuting costs?',
                    'answer': 'Yes, you can deduct commuting costs between your home and workplace. The deduction amount depends on the distance and your canton\'s regulations. Public transport costs are generally fully deductible with receipts.',
                    'sort_order': 3
                },
                {
                    'question': 'What childcare expenses are deductible?',
                    'answer': 'You can deduct childcare costs for children under 14 years old, including daycare, after-school care, and babysitting expenses. Maximum deductible amounts vary by canton, typically ranging from CHF 10,000 to CHF 25,000 per child.',
                    'sort_order': 4
                }
            ]
        },
        {
            'name': 'Security & Privacy',
            'slug': 'security',
            'description': 'How we protect your data',
            'user_type': UserType.BOTH,
            'sort_order': 4,
            'questions': [
                {
                    'question': 'How is my personal data protected?',
                    'answer': 'We use bank-level AES-256 encryption for all sensitive data. Your tax information is encrypted both in transit and at rest. We comply with Swiss data protection laws and GDPR.',
                    'sort_order': 1
                },
                {
                    'question': 'Where is my data stored?',
                    'answer': 'All data is stored on secure servers in Switzerland, ensuring compliance with Swiss data protection laws. We never transfer your data outside of Switzerland.',
                    'sort_order': 2
                },
                {
                    'question': 'Can I delete my data?',
                    'answer': 'Yes, you have the right to request deletion of your personal data at any time. You can do this from your account settings or by contacting our support team. We will delete your data within 30 days, except where we\'re legally required to retain it.',
                    'sort_order': 3
                },
                {
                    'question': 'Who has access to my tax information?',
                    'answer': 'Only you have access to your tax information. Our staff cannot view your encrypted data. We never share your information with third parties without your explicit consent.',
                    'sort_order': 4
                }
            ]
        },
        {
            'name': 'Support',
            'slug': 'support',
            'description': 'Getting help and support',
            'user_type': UserType.BOTH,
            'sort_order': 5,
            'questions': [
                {
                    'question': 'How can I get help if I\'m stuck?',
                    'answer': 'We offer multiple support options: in-app help tooltips, email support (support@swissai.tax), and comprehensive documentation. Our support team typically responds within 24 hours on business days.',
                    'sort_order': 1
                },
                {
                    'question': 'Do you offer tax advisory services?',
                    'answer': 'SwissAI Tax is a tax preparation tool, not a tax advisory service. For complex tax situations or personalized tax advice, we recommend consulting with a certified tax advisor. We can provide referrals to trusted partners.',
                    'sort_order': 2
                },
                {
                    'question': 'What if I made a mistake in my filing?',
                    'answer': 'If you haven\'t submitted to the tax authority yet, you can edit your filing in your account. If you\'ve already submitted, you can file an amended return through our platform. Contact support if you need assistance.',
                    'sort_order': 3
                },
                {
                    'question': 'Is customer support available in my language?',
                    'answer': 'Yes! We offer support in German, French, Italian, and English - all four Swiss national languages plus English for international residents.',
                    'sort_order': 4
                }
            ]
        },
        {
            'name': 'Pricing & Plans',
            'slug': 'pricing',
            'description': 'Information about pricing and subscription plans',
            'user_type': UserType.BOTH,
            'sort_order': 6,
            'questions': [
                {
                    'question': 'How much does SwissAI Tax cost?',
                    'answer': 'We offer flexible pricing plans starting from CHF 29 for basic filing. Premium plans with additional features and support start at CHF 49. You only pay when you\'re ready to submit your tax return.',
                    'sort_order': 1
                },
                {
                    'question': 'Is there a free trial?',
                    'answer': 'Yes! You can use our platform for free to complete your entire tax filing. You only pay when you want to download and submit your final tax forms.',
                    'sort_order': 2
                },
                {
                    'question': 'What payment methods do you accept?',
                    'answer': 'We accept all major credit cards (Visa, Mastercard, American Express), PostFinance Card, and TWINT for Swiss residents. All payments are processed securely through Stripe.',
                    'sort_order': 3
                },
                {
                    'question': 'Can I get a refund?',
                    'answer': 'We offer a 30-day money-back guarantee. If you\'re not satisfied with our service, contact us within 30 days of payment for a full refund, no questions asked.',
                    'sort_order': 4
                }
            ]
        }
    ]

    # Track created items
    categories_created = 0
    questions_created = 0

    # Create categories and questions
    for cat_data in faq_structure:
        # Check if category already exists
        existing_category = db.query(FAQCategory).filter(
            FAQCategory.slug == cat_data['slug']
        ).first()

        if existing_category:
            print(f"  ℹ️  Category '{cat_data['name']}' already exists, skipping...")
            category = existing_category
        else:
            # Create category
            category = FAQCategory(
                id=str(uuid4()),
                name=cat_data['name'],
                slug=cat_data['slug'],
                description=cat_data['description'],
                user_type=cat_data['user_type'],
                sort_order=cat_data['sort_order'],
                is_active=1
            )
            db.add(category)
            categories_created += 1
            print(f"  ✓ Created category: {cat_data['name']}")

        # Create questions for this category
        for q_data in cat_data['questions']:
            # Check if question already exists (by question text)
            existing_question = db.query(FAQ).filter(
                FAQ.category_id == category.id,
                FAQ.question == q_data['question']
            ).first()

            if existing_question:
                continue

            question = FAQ(
                id=str(uuid4()),
                category_id=category.id,
                question=q_data['question'],
                answer=q_data['answer'],
                user_type=UserType.BOTH,
                sort_order=q_data['sort_order'],
                is_active=1,
                view_count=0,
                helpful_count=0
            )
            db.add(question)
            questions_created += 1

    # Commit all changes
    try:
        db.commit()
        print(f"\n✅ FAQ seeding completed!")
        print(f"   📁 Categories created: {categories_created}")
        print(f"   ❓ Questions created: {questions_created}")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during seeding: {e}")
        raise


def main():
    """Main entry point"""
    # Get database configuration
    db_config = get_db_config()
    database_url = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"

    # Create engine and session
    engine = create_engine(database_url)
    SessionFactory = sessionmaker(bind=engine)
    db = SessionFactory()

    try:
        seed_faq_data(db)
    finally:
        db.close()
        engine.dispose()


if __name__ == "__main__":
    main()
