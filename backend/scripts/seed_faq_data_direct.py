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
            'user_type': 'both',
            'sort_order': 1,
            'questions': [
                {
                    'question': 'What is SwissAI Tax and how does it work?',
                    'answer': 'SwissAI Tax is an AI-powered Swiss tax filing platform that simplifies the tax preparation process. Our intelligent system guides you through a series of questions, automatically calculates your taxes based on Swiss federal and cantonal regulations, and helps you maximize deductions.',
                    'sort_order': 1
                },
                {
                    'question': 'Who can use SwissAI Tax?',
                    'answer': 'SwissAI Tax is designed for Swiss residents, including both individuals and families. Whether you are employed, self-employed, or a landlord, our platform handles various tax situations across all Swiss cantons.',
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
                }
            ]
        },
        # Add more categories here as needed
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
                    'user_type': 'both',
                    'sort_order': q_data['sort_order']
                })
                questions_created += 1

    print(f"\n✅ FAQ seeding completed!")
    print(f"   📁 Categories created: {categories_created}")
    print(f"   ❓ Questions created: {questions_created}")


if __name__ == "__main__":
    seed_faq_data()
