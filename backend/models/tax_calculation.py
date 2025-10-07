"""Tax Calculation Model - Stores calculated tax amounts and breakdowns"""

import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from models.swisstax.base import Base


class CalculationType(str, enum.Enum):
    """Types of tax calculations"""
    ESTIMATE = "estimate"  # Preliminary estimate during interview
    DRAFT = "draft"  # Draft calculation for review
    FINAL = "final"  # Final submitted calculation
    REVISED = "revised"  # Revised after corrections


class TaxCalculation(Base):
    """
    Stores detailed tax calculation results

    Contains calculated tax amounts, deductions, and breakdowns.
    Links to the filing session and provides audit trail.
    """
    __tablename__ = "tax_calculations"
    __table_args__ = {'schema': 'swisstax'}

    # Core Identification
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    filing_session_id = Column(String(36), ForeignKey('public.tax_filing_sessions.id'), nullable=False, index=True)

    # Calculation Type & Version
    calculation_type = Column(
        SQLEnum(CalculationType),
        default=CalculationType.ESTIMATE,
        nullable=False,
        index=True
    )
    version = Column(Integer, default=1, nullable=False)  # Increments with each recalculation

    # Tax Year & Jurisdiction
    tax_year = Column(Integer, nullable=False, index=True)
    canton = Column(String(2), nullable=False, index=True)  # ZH, BE, GE, etc.
    municipality = Column(String(100), nullable=True)

    # === INCOME BREAKDOWN ===
    # All amounts in CHF, stored as integers (cents) for precision
    gross_income = Column(Integer, default=0)  # Total gross income
    employment_income = Column(Integer, default=0)  # Salary, wages
    self_employment_income = Column(Integer, default=0)  # Self-employed income
    pension_income = Column(Integer, default=0)  # Retirement pensions
    investment_income = Column(Integer, default=0)  # Dividends, interest
    rental_income = Column(Integer, default=0)  # Property rental income
    other_income = Column(Integer, default=0)  # Other sources

    # === DEDUCTIONS ===
    total_deductions = Column(Integer, default=0)  # Sum of all deductions
    pillar_2_deduction = Column(Integer, default=0)  # Pension fund contributions
    pillar_3a_deduction = Column(Integer, default=0)  # Private pension (max 7,056 CHF)
    social_security_deduction = Column(Integer, default=0)  # AHV/IV/EO contributions
    professional_expenses = Column(Integer, default=0)  # Work-related expenses
    commuting_costs = Column(Integer, default=0)  # Transportation to work
    charitable_donations = Column(Integer, default=0)  # Donations deduction
    medical_expenses = Column(Integer, default=0)  # Medical expenses deduction
    alimony_deduction = Column(Integer, default=0)  # Alimony payments
    childcare_costs = Column(Integer, default=0)  # Child care expenses
    insurance_premiums = Column(Integer, default=0)  # Health/life insurance
    other_deductions = Column(Integer, default=0)  # Other deductible expenses

    # === TAX CALCULATION ===
    taxable_income = Column(Integer, default=0)  # After deductions

    # Federal Tax
    federal_tax = Column(Integer, default=0)  # Direct federal tax
    federal_tax_rate = Column(Numeric(5, 2), default=0)  # Percentage

    # Cantonal/Municipal Tax
    cantonal_tax = Column(Integer, default=0)  # Cantonal income tax
    municipal_tax = Column(Integer, default=0)  # Municipal/communal tax
    church_tax = Column(Integer, default=0)  # Church tax (optional)

    # Total Tax
    total_tax = Column(Integer, default=0)  # Sum of all taxes
    effective_tax_rate = Column(Numeric(5, 2), default=0)  # % of gross income

    # === ADDITIONAL CALCULATIONS ===
    wealth_tax = Column(Integer, default=0)  # Wealth/property tax
    capital_gains_tax = Column(Integer, default=0)  # Capital gains (if applicable)

    # Tax Credits & Reductions
    total_tax_credits = Column(Integer, default=0)
    family_tax_credit = Column(Integer, default=0)  # Child/family credits

    # Net Amount
    net_tax_due = Column(Integer, default=0)  # Final amount owed/refund
    is_refund = Column(Integer, default=0)  # 1 if refund expected, 0 if payment due

    # === METADATA ===
    # Detailed breakdown (JSON)
    calculation_details = Column(Text, nullable=True)  # JSON with full breakdown

    # Applied Tax Rules
    tax_rules_applied = Column(Text, nullable=True)  # JSON array of rule IDs used

    # Confidence & Validation
    confidence_score = Column(Numeric(3, 2), default=0.95)  # 0.00-1.00
    validation_warnings = Column(Text, nullable=True)  # JSON array of warnings

    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships - temporarily disabled
    # filing_session = relationship("TaxFilingSession", back_populates="calculations")

    def __repr__(self):
        return f"<TaxCalculation(id='{self.id}', type='{self.calculation_type}', total={self.total_tax/100:.2f} CHF)>"

    def to_dict(self, include_details=True):
        """
        Convert model to dictionary

        Args:
            include_details: Include detailed calculation breakdown
        """
        import json

        result = {
            'id': self.id,
            'filing_session_id': self.filing_session_id,
            'calculation_type': self.calculation_type.value if isinstance(self.calculation_type, CalculationType) else self.calculation_type,
            'version': self.version,
            'tax_year': self.tax_year,
            'canton': self.canton,
            'municipality': self.municipality,

            # Income (convert cents to CHF)
            'gross_income': self.gross_income / 100 if self.gross_income else 0,
            'employment_income': self.employment_income / 100 if self.employment_income else 0,
            'taxable_income': self.taxable_income / 100 if self.taxable_income else 0,

            # Deductions
            'total_deductions': self.total_deductions / 100 if self.total_deductions else 0,
            'pillar_3a_deduction': self.pillar_3a_deduction / 100 if self.pillar_3a_deduction else 0,

            # Taxes
            'federal_tax': self.federal_tax / 100 if self.federal_tax else 0,
            'cantonal_tax': self.cantonal_tax / 100 if self.cantonal_tax else 0,
            'municipal_tax': self.municipal_tax / 100 if self.municipal_tax else 0,
            'church_tax': self.church_tax / 100 if self.church_tax else 0,
            'total_tax': self.total_tax / 100 if self.total_tax else 0,

            # Rates
            'effective_tax_rate': float(self.effective_tax_rate) if self.effective_tax_rate else 0,

            # Net
            'net_tax_due': self.net_tax_due / 100 if self.net_tax_due else 0,
            'is_refund': bool(self.is_refund),

            # Metadata
            'confidence_score': float(self.confidence_score) if self.confidence_score else 0.95,
            'calculated_at': self.calculated_at.isoformat() if self.calculated_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_details:
            # Parse JSON fields
            if self.calculation_details:
                try:
                    result['calculation_details'] = json.loads(self.calculation_details)
                except:
                    result['calculation_details'] = {}

            if self.validation_warnings:
                try:
                    result['validation_warnings'] = json.loads(self.validation_warnings)
                except:
                    result['validation_warnings'] = []

        return result

    @staticmethod
    def from_chf(amount: float) -> int:
        """Convert CHF amount to cents (integer)"""
        return int(round(amount * 100))

    @staticmethod
    def to_chf(cents: int) -> float:
        """Convert cents (integer) to CHF amount"""
        return cents / 100 if cents else 0.0
