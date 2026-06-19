from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token, get_password_hash, verify_password
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserRead

router = APIRouter()
logger = get_logger(__name__)
AUTH_ERROR = "Invalid email or password"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, remember: bool = True) -> None:
    settings = get_settings()
    cookie_options = {
        "httponly": True,
        "secure": settings.auth_cookie_secure,
        "samesite": settings.auth_cookie_samesite,
        "path": "/",
    }
    access_max_age = settings.access_token_expire_minutes * 60 if remember else None
    refresh_max_age = settings.refresh_token_expire_days * 24 * 60 * 60 if remember else None
    response.set_cookie("ctrl_sea_access", access_token, max_age=access_max_age, **cookie_options)
    response.set_cookie("ctrl_sea_refresh", refresh_token, max_age=refresh_max_age, **cookie_options)


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("ctrl_sea_access", path="/")
    response.delete_cookie("ctrl_sea_refresh", path="/")


def _issue_token_pair(user: User, response: Response, remember: bool = True) -> Token:
    claims = {"role": user.role, "uid": user.id, "remember": remember}
    access_token = create_access_token(user.email, claims)
    refresh_token = create_refresh_token(user.email, claims)
    _set_auth_cookies(response, access_token, refresh_token, remember)
    return Token(user=UserRead.model_validate(user))


@router.post("/register", response_model=Token)
def register(payload: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> Token:
    email = str(payload.email).lower()
    logger.info("Registration attempt email=%s client=%s", email, request.client.host if request.client else "unknown")
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            logger.warning("Registration rejected because user already exists email=%s", email)
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")
        user = User(
            email=email,
            full_name=payload.full_name.strip(),
            hashed_password=get_password_hash(payload.password),
            role="analyst",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("Registration succeeded email=%s role=%s", user.email, user.role)
        return _issue_token_pair(user, response, payload.remember)
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
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> Token:
    email = str(payload.email).lower()
    logger.info("Login attempt email=%s client=%s", email, request.client.host if request.client else "unknown")
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning("Login failed email=%s reason=invalid_credentials", email)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=AUTH_ERROR)
        if not user.is_active:
            logger.warning("Login failed because user is disabled email=%s", email)
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")
        if not verify_password(payload.password, user.hashed_password):
            logger.warning("Login failed email=%s reason=invalid_credentials", email)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=AUTH_ERROR)
        logger.info("Login succeeded email=%s role=%s", user.email, user.role)
        return _issue_token_pair(user, response, payload.remember)
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


@router.post("/refresh", response_model=Token)
def refresh(
    response: Response,
    refresh_cookie: Annotated[str | None, Cookie(alias="ctrl_sea_refresh")] = None,
    db: Session = Depends(get_db),
) -> Token:
    if not refresh_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    try:
        payload = decode_refresh_token(refresh_cookie)
    except ValueError as exc:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials") from exc
    email = payload.get("sub")
    if not email:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _issue_token_pair(user, response, bool(payload.get("remember", True)))


@router.post("/logout")
def logout(response: Response) -> dict:
    _clear_auth_cookies(response)
    return {"status": "ok"}
