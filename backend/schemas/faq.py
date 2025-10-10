"""
FAQ schemas for request/response validation
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class FAQCategoryBase(BaseModel):
    """Base FAQ Category schema"""
    name: str
    slug: str
    description: Optional[str] = None
    user_type: str = "both"
    sort_order: int = 0
    is_active: bool = True


class FAQCategoryCreate(FAQCategoryBase):
    """Schema for creating a new FAQ category"""
    pass


class FAQCategoryUpdate(BaseModel):
    """Schema for updating an FAQ category"""
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    user_type: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class FAQCategoryResponse(FAQCategoryBase):
    """FAQ Category response schema"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FAQCategoryWithCount(FAQCategoryResponse):
    """FAQ Category with question count"""
    question_count: int = 0


class FAQBase(BaseModel):
    """Base FAQ schema"""
    question: str
    answer: str
    user_type: str = "both"
    bulletPoints: Optional[List[str]] = Field(default_factory=list, alias="bulletPoints")
    detailedPoints: Optional[List[dict]] = Field(default_factory=list, alias="detailedPoints")
    conclusion: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class FAQCreate(FAQBase):
    """Schema for creating a new FAQ"""
    category_id: str
    related_faq_ids: Optional[List[str]] = Field(default_factory=list)
    meta_keywords: Optional[str] = None


class FAQUpdate(BaseModel):
    """Schema for updating an FAQ"""
    question: Optional[str] = None
    answer: Optional[str] = None
    category_id: Optional[str] = None
    user_type: Optional[str] = None
    bulletPoints: Optional[List[str]] = None
    detailedPoints: Optional[List[dict]] = None
    conclusion: Optional[str] = None
    related_faq_ids: Optional[List[str]] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    meta_keywords: Optional[str] = None


class FAQResponse(BaseModel):
    """FAQ response schema"""
    id: str
    category_id: str
    question: str
    answer: str
    user_type: str
    bulletPoints: List[str] = Field(default_factory=list)
    detailedPoints: List[dict] = Field(default_factory=list)
    conclusion: Optional[str] = None
    related_faq_ids: List[str] = Field(default_factory=list)
    sort_order: int
    is_active: bool
    view_count: int
    helpful_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class FAQWithCategory(FAQResponse):
    """FAQ response with category name"""
    category: str


class FAQListResponse(BaseModel):
    """Response for FAQ list with categories"""
    title: str = "Frequently Asked Questions"
    categories: List[dict]


class FAQSearchResult(BaseModel):
    """Search result for FAQs"""
    id: str
    question: str
    answer: str
    category: str
    category_id: str
    user_type: str
    relevance_score: Optional[float] = None


class FAQStats(BaseModel):
    """FAQ statistics"""
    total_faqs: int
    total_categories: int
    total_views: int
    most_viewed_faqs: List[dict]
    faqs_by_category: dict
    faqs_by_user_type: dict


class FAQHelpfulRequest(BaseModel):
    """Request to mark FAQ as helpful"""
    helpful: bool = True
