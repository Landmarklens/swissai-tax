"""
Tax calculation models for SwissAI Tax
Maps to swisstax.tax_calculations, tax_rates, standard_deductions, and tax_years tables
"""

from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Date, DateTime, Boolean, ForeignKey, Numeric, JSON, text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class TaxYear(Base):
    """
    Tax year configuration
    Tracks filing deadlines and current year
    """
    __tablename__ = "tax_years"

    id = Column(Integer, primary_key=True, autoincrement=True)
    year = Column(Integer, unique=True, nullable=False)
    is_current = Column(Boolean, server_default='false')
    filing_deadline = Column(Date)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<TaxYear(year={self.year}, current={self.is_current})>"


class TaxRate(Base):
    """
    Tax rates for different cantons and municipalities
    Supports progressive tax brackets
    """
    __tablename__ = "tax_rates"

    id = Column(Integer, primary_key=True, autoincrement=True)

    canton = Column(String(2), nullable=False)  # ZH, BE, GE, etc.
    municipality = Column(String(100))  # Optional for cantonal rates
    tax_year = Column(Integer, nullable=False)
    rate_type = Column(String(20))  # federal, cantonal, municipal

    # Tax bracket
    tax_bracket_min = Column(Numeric(12, 2))
    tax_bracket_max = Column(Numeric(12, 2))

    # Tax calculation
    tax_rate = Column(Numeric(5, 4))  # Percentage as decimal (0.1234 = 12.34%)
    fixed_amount = Column(Numeric(12, 2))  # Fixed amount for this bracket

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Ensure unique rates per jurisdiction and bracket
    __table_args__ = (
        UniqueConstraint(
            'canton', 'municipality', 'tax_year', 'rate_type', 'tax_bracket_min',
            name='uq_tax_rate'
        ),
        {'schema': 'swisstax'}
    )

    def __repr__(self):
        return f"<TaxRate(canton={self.canton}, type={self.rate_type}, year={self.tax_year})>"


class StandardDeduction(Base):
    """
    Standard deduction limits and rules
    Canton-specific deduction configurations
    """
    __tablename__ = "standard_deductions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    canton = Column(String(2))  # Null for federal deductions
    deduction_type = Column(String(50), nullable=False)  # pillar_3a, health_insurance, etc.

    # Multi-language names
    deduction_name_de = Column(String(255))
    deduction_name_fr = Column(String(255))
    deduction_name_en = Column(String(255))
    deduction_name_it = Column(String(255))

    # Deduction calculation
    amount = Column(Numeric(12, 2))  # Fixed amount
    percentage = Column(Numeric(5, 2))  # Percentage of income
    max_amount = Column(Numeric(12, 2))  # Maximum deduction allowed
    min_amount = Column(Numeric(12, 2))  # Minimum to qualify

    tax_year = Column(Integer, nullable=False)
    conditions = Column(JSON)  # Additional conditions for eligibility

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<StandardDeduction(type={self.deduction_type}, canton={self.canton}, year={self.tax_year})>"


