"""
Base model for SwissAI Tax schema
IMPORTANT: All swisstax models inherit from SwissTaxBase which automatically sets schema='swisstax'
"""

from sqlalchemy.ext.declarative import declared_attr
from db.base import Base as OriginalBase


class SwissTaxBase:
    """
    Mixin that automatically sets schema to 'swisstax' for all models
    """

    @declared_attr
    def __table_args__(cls):
        # Get existing __table_args__ from subclass if any
        args = getattr(cls, '_SwissTaxBase__table_args__', None)
        if args is None:
            return {'schema': 'swisstax'}
        elif isinstance(args, dict):
            return {**args, 'schema': 'swisstax'}
        else:
            # args is a tuple
            return (*args, {'schema': 'swisstax'})


# Export a Base class that includes the mixin
# All swisstax models should inherit from this
Base = OriginalBase

__all__ = ['Base', 'SwissTaxBase']
