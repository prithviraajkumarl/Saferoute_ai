from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.user_repo import UserRepository
from app.db.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserOut
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    existing = repo.get_by_email(req.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    valid_roles = ["tourist", "responder", "administrator"]
    role = req.role.lower() if req.role.lower() in valid_roles else "tourist"

    new_user = User(
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        phone_number=req.phone_number,
        role=role,
    )
    user = repo.create(new_user)
    token = create_access_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(req.email)
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account is deactivated.")

    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return user
