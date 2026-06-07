from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.logging import get_logger
from app.core.security import create_access_token, get_password_hash, verify_password
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserRead

router = APIRouter()
logger = get_logger(__name__)


@router.post("/register", response_model=Token)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> Token:
    email = str(payload.email).lower()
    logger.info("Registration attempt email=%s client=%s", email, request.client.host if request.client else "unknown")
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            logger.warning("Registration rejected because user already exists email=%s", email)
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")
        first_user = db.query(User).count() == 0
        user = User(
            email=email,
            full_name=payload.full_name.strip(),
            hashed_password=get_password_hash(payload.password),
            role="admin" if first_user else "analyst",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token(user.email, {"role": user.role, "uid": user.id})
        logger.info("Registration succeeded email=%s role=%s", user.email, user.role)
        return Token(access_token=token, user=UserRead.model_validate(user))
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Registration failed because database is unavailable email=%s", email)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc
    except ValueError as exc:
        logger.warning("Registration validation failed email=%s error=%s", email, exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        logger.exception("Unexpected registration failure email=%s", email)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed") from exc


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> Token:
    email = str(payload.email).lower()
    logger.info("Login attempt email=%s client=%s", email, request.client.host if request.client else "unknown")
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning("Login failed because user was not found email=%s", email)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        if not user.is_active:
            logger.warning("Login failed because user is disabled email=%s", email)
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")
        if not verify_password(payload.password, user.hashed_password):
            logger.warning("Login failed because password is invalid email=%s", email)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
        token = create_access_token(user.email, {"role": user.role, "uid": user.id})
        logger.info("Login succeeded email=%s role=%s", user.email, user.role)
        return Token(access_token=token, user=UserRead.model_validate(user))
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        logger.exception("Login failed because database is unavailable email=%s", email)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc
    except Exception as exc:
        logger.exception("Unexpected login failure email=%s", email)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed") from exc


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)) -> UserRead:
    logger.info("Current user loaded email=%s role=%s", user.email, user.role)
    return UserRead.model_validate(user)
