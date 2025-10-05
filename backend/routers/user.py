from typing import List
from uuid import UUID

from fastapi import Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Request

from models.swisstax import User
from schemas.document import UserDocumentMetadata, UserDocumentContent
from schemas.user import (
    UserProfile,
    UserProfileUpdate,
    AvatarUrl,
    UpdatePassword,
    UpdatePasswordOut,
)
from db.session import get_db
from sqlalchemy.orm import Session
from services import user_service as UserService
from services.pdf_service import PDFService
from utils.auth import get_current_user
from utils.password import verify_password
from utils.router import Router

router = Router()
pdf_service = PDFService()


@router.get("/list", response_model=List[UserProfile])
def list_of_users(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get list of user profiles
    """

    if not user:
        raise HTTPException(status_code=401)
    # Admin check removed - no user types in SwissAI Tax
    if False:  # Placeholder
        raise HTTPException(
            status_code=403, detail="Not authorized to perform this action"
        )
    res = UserService.get_list_of_users(db)
    return res
    # return UserService.get_list_of_users(db)


@router.get("/profile", response_model=UserProfile)
def view_profile(user=Depends(get_current_user)):
    """
    Get user profile. User can view their profile information.
    """

    if not user:
        raise HTTPException(status_code=401)
    return user


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(user=Depends(get_current_user)):
    """
    Get current user profile. Alias for /profile endpoint.
    """
    if not user:
        raise HTTPException(status_code=401)
    return user


# Properties endpoint removed - not needed for SwissAI Tax


@router.put("/profile", response_model=UserProfile)
def update_profile(
    new_profile: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user profile. User can update their profile information. User can't update their email, password, or avatar. User can update their:
    - firstname
    - lastname
    - phone
    - country
    - state
    - city
    - zip_code
    - address
    - language
    """
    return UserService.update_user(db, user, new_profile)


@router.put("/profile/avatar", response_model=AvatarUrl)
def update_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change user avatar. The file must be an image file.
    """

    return UserService.update_avatar(db, file, current_user)


@router.put("/profile/password", response_model=UpdatePasswordOut)
def update_password(
    data: UpdatePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change user password. For change password, user must provide the current password.
    """

    if not verify_password(data.password, current_user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    try:
        UserService.update_password(db, current_user, data.new_password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Password updated successfully"}



@router.post("/{user_id}/documents", response_model=dict)
def create_user_document(
    user_id: UUID,
    document_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create user document metadata"""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Placeholder implementation
    return {"message": "Document created", "document_id": 1}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change status user from active to inactive. Don't delete the user from the database.
    """

    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action",
        )
    UserService.deactivate_user(db, user_id)


@router.post(
    "/{user_id}/pdfs/upload",
    response_model=UserDocumentMetadata,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_pdf(
    user_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a PDF document for a user"""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to upload documents for this user"
        )

    return await pdf_service.upload_pdf_background(db, user_id, file, background_tasks)


@router.get("/{user_id}/pdfs/{pdf_id}", response_model=UserDocumentMetadata)
def get_pdf_metadata(
    user_id: UUID,
    pdf_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve PDF metadata and extraction status"""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to access documents for this user"
        )

    return pdf_service.get_pdf_metadata(db, user_id, pdf_id)


@router.get("/{user_id}/pdfs/{pdf_id}/content", response_model=UserDocumentContent)
def get_pdf_content(
    user_id: UUID,
    pdf_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve extracted content from PDF"""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to access documents for this user"
        )

    return {"full_text": pdf_service.get_pdf_content(db, user_id, pdf_id)}
