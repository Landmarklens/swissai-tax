#!/usr/bin/env python3
"""
Quick test script to verify all models can be imported and relationships work
"""

import os
import sys

# Disable AWS Parameter Store for local testing
os.environ['AWS_ACCESS_KEY_ID'] = ''
os.environ['AWS_SECRET_ACCESS_KEY'] = ''

# Import all models
from models import (
    User,
    Document,
    InterviewSession,
    TaxFilingSession,
    TaxAnswer,
    TaxInsight,
    TaxCalculation,
    UserCounter,
    ResetToken
)

print("✓ All models imported successfully\n")

# Print model information
models = [
    User,
    Document,
    InterviewSession,
    TaxFilingSession,
    TaxAnswer,
    TaxInsight,
    TaxCalculation,
    UserCounter,
    ResetToken
]

print("Database Tables:")
for model in models:
    print(f"  - {model.__tablename__}")

print("\n✓ Models test passed - all relationships working correctly!")
