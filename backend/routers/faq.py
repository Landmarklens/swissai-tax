"""
FAQ Router
Handles FAQ operations - public endpoints (no authentication required)
"""
import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from db.session import get_db
from models.faq import FAQ, FAQCategory, UserType
from schemas.faq import (
    FAQCategoryResponse,
    FAQCategoryWithCount,
    FAQListResponse,
    FAQResponse,
    FAQSearchResult,
    FAQStats,
    FAQWithCategory,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== Helper Functions ====================

def get_user_type_filter(user_type: str = None):
    """
    Get SQLAlchemy filter for user type
    Note: Currently all FAQs are for everyone, so this just returns a truthy filter
    Kept for future extensibility
    """
    # All FAQs are for all users
    return FAQ.user_type == UserType.ALL


def category_user_type_filter(user_type: str = None):
    """
    Get SQLAlchemy filter for category user type
    Note: Currently all categories are for everyone
    Kept for future extensibility
    """
    # All categories are for all users
    return FAQCategory.user_type == UserType.ALL


# ==================== Endpoints ====================

@router.get("/", response_model=FAQListResponse)
async def get_all_faqs(
    db: Session = Depends(get_db)
):
    """
    Get all FAQs organized by categories

    - Returns structured FAQ data with categories
    - Only active FAQs and categories
    - Sorted by sort_order
    """
    try:
        # Get all active categories
        categories = db.query(FAQCategory).filter(
            FAQCategory.is_active == 1,
            category_user_type_filter()
        ).order_by(FAQCategory.sort_order).all()

        result_categories = []

        for category in categories:
            # Get FAQs for this category
            faqs = db.query(FAQ).filter(
                FAQ.category_id == category.id,
                FAQ.is_active == 1,
                get_user_type_filter()
            ).order_by(FAQ.sort_order).all()

            # Format questions
            questions = []
            for faq in faqs:
                faq_dict = faq.to_dict()
                questions.append({
                    'id': faq_dict['id'],
                    'question': faq_dict['question'],
                    'answer': faq_dict['answer'],
                    'bulletPoints': faq_dict.get('bulletPoints', []),
                    'detailedPoints': faq_dict.get('detailedPoints', []),
                    'conclusion': faq_dict.get('conclusion'),
                })

            if questions:  # Only include categories that have questions
                result_categories.append({
                    'name': category.name,
                    'slug': category.slug,
                    'description': category.description,
                    'questions': questions
                })

        return {
            'title': 'Frequently Asked Questions',
            'categories': result_categories
        }

    except Exception as e:
        logger.error(f"Error fetching FAQs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch FAQs: {str(e)}"
        )


@router.get("/categories", response_model=List[FAQCategoryWithCount])
async def get_categories(
    db: Session = Depends(get_db)
):
    """
    Get all FAQ categories with question counts

    - Returns all active categories
    - Includes count of active FAQs in each category
    - Sorted by sort_order
    """
    try:
        categories = db.query(FAQCategory).filter(
            FAQCategory.is_active == 1,
            category_user_type_filter()
        ).order_by(FAQCategory.sort_order).all()

        result = []
        for category in categories:
            # Count FAQs in this category
            count = db.query(FAQ).filter(
                FAQ.category_id == category.id,
                FAQ.is_active == 1,
                get_user_type_filter()
            ).count()

            category_dict = category.to_dict()
            category_dict['question_count'] = count
            result.append(category_dict)

        return result

    except Exception as e:
        logger.error(f"Error fetching categories: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch categories: {str(e)}"
        )


@router.get("/search", response_model=List[FAQWithCategory])
async def search_faqs(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db)
):
    """
    Search FAQs by keyword

    - Searches in question and answer text
    - Returns results with category information
    - Ordered by popularity (view count)
    """
    try:
        search_term = f"%{q.lower()}%"

        # Search in questions and answers
        faqs = db.query(FAQ).join(FAQCategory).filter(
            FAQ.is_active == 1,
            get_user_type_filter(),
            or_(
                func.lower(FAQ.question).like(search_term),
                func.lower(FAQ.answer).like(search_term),
                func.lower(FAQ.meta_keywords).like(search_term)
            )
        ).order_by(FAQ.view_count.desc()).all()

        # Format results with category
        results = []
        for faq in faqs:
            faq_dict = faq.to_dict()
            faq_dict['category'] = faq.category.name if faq.category else "General"

            # Increment view count for searched FAQs
            faq.increment_view_count()

            results.append(faq_dict)

        db.commit()

        return results

    except Exception as e:
        logger.error(f"Error searching FAQs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search FAQs: {str(e)}"
        )


@router.get("/popular", response_model=List[FAQWithCategory])
async def get_popular_faqs(
    
    limit: int = Query(5, ge=1, le=20, description="Number of FAQs to return"),
    db: Session = Depends(get_db)
):
    """
    Get most popular FAQs based on view count

    - Returns top N FAQs by popularity
    - Filters by user type
    - Includes category information
    """
    try:
        faqs = db.query(FAQ).join(FAQCategory).filter(
            FAQ.is_active == 1,
            get_user_type_filter()
        ).order_by(FAQ.view_count.desc()).limit(limit).all()

        results = []
        for faq in faqs:
            faq_dict = faq.to_dict()
            faq_dict['category'] = faq.category.name if faq.category else "General"
            results.append(faq_dict)

        return results

    except Exception as e:
        logger.error(f"Error fetching popular FAQs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch popular FAQs: {str(e)}"
        )


@router.get("/category/{category_name}", response_model=List[FAQResponse])
async def get_category_faqs(
    category_name: str,
    
    db: Session = Depends(get_db)
):
    """
    Get all FAQs for a specific category

    - Returns FAQs filtered by category slug or name
    - Filters by user type
    - Sorted by sort_order
    """
    try:
        # Find category by slug or name
        category = db.query(FAQCategory).filter(
            FAQCategory.is_active == 1,
            or_(
                FAQCategory.slug == category_name,
                FAQCategory.name == category_name
            )
        ).first()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category '{category_name}' not found"
            )

        # Get FAQs for this category
        faqs = db.query(FAQ).filter(
            FAQ.category_id == category.id,
            FAQ.is_active == 1,
            get_user_type_filter()
        ).order_by(FAQ.sort_order).all()

        return [faq.to_dict() for faq in faqs]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching category FAQs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch category FAQs: {str(e)}"
        )


@router.get("/{faq_id}", response_model=FAQWithCategory)
async def get_faq_by_id(
    faq_id: str,
    
    db: Session = Depends(get_db)
):
    """
    Get a specific FAQ by ID

    - Returns single FAQ with full details
    - Increments view count
    - Includes category information
    """
    try:
        faq = db.query(FAQ).filter(
            FAQ.id == faq_id,
            FAQ.is_active == 1
        ).first()

        if not faq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ '{faq_id}' not found"
            )

        # Increment view count
        faq.increment_view_count()
        db.commit()

        faq_dict = faq.to_dict()
        faq_dict['category'] = faq.category.name if faq.category else "General"

        return faq_dict

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching FAQ: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch FAQ: {str(e)}"
        )


@router.get("/{faq_id}/related", response_model=List[FAQResponse])
async def get_related_faqs(
    faq_id: str,
    
    limit: int = Query(3, ge=1, le=10, description="Number of related FAQs"),
    db: Session = Depends(get_db)
):
    """
    Get related FAQs for a specific FAQ

    - Returns related FAQs based on related_faq_ids
    - Falls back to same category if no related FAQs defined
    - Filters by user type
    """
    try:
        faq = db.query(FAQ).filter(FAQ.id == faq_id).first()

        if not faq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ '{faq_id}' not found"
            )

        related_faqs = []

        # Try to get explicitly related FAQs
        if faq.related_faq_ids:
            try:
                related_ids = json.loads(faq.related_faq_ids)
                related_faqs = db.query(FAQ).filter(
                    FAQ.id.in_(related_ids),
                    FAQ.is_active == 1,
                    get_user_type_filter()
                ).limit(limit).all()
            except:
                pass

        # If not enough related FAQs, get from same category
        if len(related_faqs) < limit:
            remaining = limit - len(related_faqs)
            same_category = db.query(FAQ).filter(
                FAQ.category_id == faq.category_id,
                FAQ.id != faq_id,
                FAQ.is_active == 1,
                get_user_type_filter()
            ).order_by(FAQ.view_count.desc()).limit(remaining).all()

            related_faqs.extend(same_category)

        return [f.to_dict() for f in related_faqs]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching related FAQs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch related FAQs: {str(e)}"
        )


@router.get("/stats", response_model=FAQStats)
async def get_faq_stats(db: Session = Depends(get_db)):
    """
    Get FAQ statistics

    - Total FAQs and categories
    - Total views
    - Most viewed FAQs
    - Breakdown by category and user type
    """
    try:
        # Total counts
        total_faqs = db.query(FAQ).filter(FAQ.is_active == 1).count()
        total_categories = db.query(FAQCategory).filter(FAQCategory.is_active == 1).count()

        # Total views
        total_views = db.query(func.sum(FAQ.view_count)).scalar() or 0

        # Most viewed FAQs
        most_viewed = db.query(FAQ).join(FAQCategory).filter(
            FAQ.is_active == 1
        ).order_by(FAQ.view_count.desc()).limit(5).all()

        most_viewed_list = []
        for faq in most_viewed:
            most_viewed_list.append({
                'id': faq.id,
                'question': faq.question,
                'category': faq.category.name if faq.category else "General",
                'view_count': faq.view_count
            })

        # FAQs by category
        categories = db.query(FAQCategory).filter(FAQCategory.is_active == 1).all()
        faqs_by_category = {}
        for category in categories:
            count = db.query(FAQ).filter(
                FAQ.category_id == category.id,
                FAQ.is_active == 1
            ).count()
            faqs_by_category[category.name] = count

        # FAQs by user type (simplified - all FAQs are for all users)
        all_count = db.query(FAQ).filter(
            FAQ.is_active == 1,
            FAQ.user_type == UserType.ALL
        ).count()

        faqs_by_user_type = {
            'all': all_count
        }

        return {
            'total_faqs': total_faqs,
            'total_categories': total_categories,
            'total_views': total_views,
            'most_viewed_faqs': most_viewed_list,
            'faqs_by_category': faqs_by_category,
            'faqs_by_user_type': faqs_by_user_type
        }

    except Exception as e:
        logger.error(f"Error fetching FAQ stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch FAQ stats: {str(e)}"
        )


@router.post("/cache/clear", response_model=dict)
async def clear_faq_cache(db: Session = Depends(get_db)):
    """
    Clear FAQ cache (admin only)

    Note: This is a placeholder endpoint for future caching implementation
    Currently just returns success
    """
    # TODO: Implement cache clearing when caching is added
    logger.info("FAQ cache clear requested")
    return {
        'success': True,
        'message': 'FAQ cache cleared successfully'
    }


@router.post("/{faq_id}/helpful")
async def mark_faq_helpful(
    faq_id: str,
    db: Session = Depends(get_db)
):
    """
    Mark an FAQ as helpful

    - Increments helpful_count
    - Used for tracking FAQ effectiveness
    """
    try:
        faq = db.query(FAQ).filter(FAQ.id == faq_id).first()

        if not faq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ '{faq_id}' not found"
            )

        faq.increment_helpful_count()
        db.commit()

        return {
            'success': True,
            'helpful_count': faq.helpful_count
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking FAQ as helpful: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark FAQ as helpful: {str(e)}"
        )
