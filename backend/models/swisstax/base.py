"""
Base model for SwissAI Tax schema
All models inherit from this base to automatically use the swisstax schema
"""

from sqlalchemy.ext.declarative import declarative_base, declared_attr


class SwissTaxBase:
    """
    Base class that automatically sets schema to 'swisstax' for all models
    """

    @declared_attr
    def __table_args__(cls):
        return {'schema': 'swisstax'}


Base = declarative_base(cls=SwissTaxBase)
