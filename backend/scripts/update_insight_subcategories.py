"""
Script to update existing tax insights with proper subcategories based on their titles
"""
import sys
import os

# Add parent directory to path to import models
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.tax_insight import TaxInsight, InsightSubcategory
from config.database import get_database_url

def update_insight_subcategories():
    """Update all existing insights with proper subcategories based on title"""

    # Create database session
    engine = create_engine(get_database_url())
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        # Title to subcategory mapping
        title_mapping = {
            'Personal Information': InsightSubcategory.PERSONAL,
            'Location': InsightSubcategory.LOCATION,
            'Family': InsightSubcategory.KIDS,
            'Employment': InsightSubcategory.EMPLOYMENT,
            'Retirement & Savings': InsightSubcategory.RETIREMENT_SAVINGS,
            'Property & Assets': InsightSubcategory.PROPERTY_ASSETS,
            'Deductions': InsightSubcategory.DEDUCTIONS,

            # Action required insights
            'Complete Pillar 3a Question': InsightSubcategory.RETIREMENT_SAVINGS,
            'Maximize Pillar 3a Contributions': InsightSubcategory.RETIREMENT_SAVINGS,
            'Complete Employment Question': InsightSubcategory.EMPLOYMENT,
            'Multiple Employer Deductions Available': InsightSubcategory.EMPLOYMENT,
            'Complete Children Question': InsightSubcategory.KIDS,
            'Maximize Child Tax Credits and Deductions': InsightSubcategory.KIDS,
            'Complete Donation Question': InsightSubcategory.DEDUCTIONS,
            'Charitable Donation Deductions': InsightSubcategory.DEDUCTIONS,
            'Document Your Charitable Donations': InsightSubcategory.DEDUCTIONS,
            'Complete Property Question': InsightSubcategory.PROPERTY_ASSETS,
            'Property Owner Tax Deductions': InsightSubcategory.PROPERTY_ASSETS,
            'Complete Medical Expenses Question': InsightSubcategory.DEDUCTIONS,
            'Medical Expense Deductions': InsightSubcategory.DEDUCTIONS,
        }

        # Get all insights
        insights = db.query(TaxInsight).all()

        updated_count = 0
        for insight in insights:
            # Check if title matches our mapping
            if insight.title in title_mapping:
                new_subcategory = title_mapping[insight.title]
                if insight.subcategory != new_subcategory:
                    insight.subcategory = new_subcategory
                    updated_count += 1
            elif 'Upload' in insight.title:
                # Document upload insights
                if insight.subcategory != InsightSubcategory.GENERAL:
                    insight.subcategory = InsightSubcategory.GENERAL
                    updated_count += 1

        db.commit()
        print(f"✓ Updated {updated_count} insights with proper subcategories")
        print(f"Total insights in database: {len(insights)}")

        # Show summary by subcategory
        from collections import Counter
        subcategories = Counter([i.subcategory.value for i in insights])
        print("\nInsights by subcategory:")
        for subcat, count in sorted(subcategories.items()):
            print(f"  - {subcat}: {count}")

    except Exception as e:
        print(f"✗ Error updating insights: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Updating existing tax insights with proper subcategories...")
    update_insight_subcategories()
    print("Done!")
