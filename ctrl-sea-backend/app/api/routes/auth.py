from typing import Annotated
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
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
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


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


def _frontend_url(path: str, **params: str) -> str:
    settings = get_settings()
    base = settings.frontend_url.rstrip("/")
    query = urlencode({key: value for key, value in params.items() if value})
    return f"{base}{path}{f'?{query}' if query else ''}"


def _oauth_redirect_uri() -> str:
    settings = get_settings()
    return settings.google_oauth_redirect_uri.strip() or f"{settings.frontend_url.rstrip('/')}/api/auth/google/callback"


def _create_oauth_state(next_path: str) -> str:
    settings = get_settings()
    payload = {
        "typ": "google_oauth_state",
        "next": next_path,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode_oauth_state(state: str) -> str:
    settings = get_settings()
    try:
        payload = jwt.decode(state, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google sign-in state") from exc
    if payload.get("typ") != "google_oauth_state":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google sign-in state")
    next_path = str(payload.get("next") or "/dashboard")
    return next_path if next_path.startswith("/") and not next_path.startswith("//") else "/dashboard"


def _issue_token_pair(user: User, response: Response, remember: bool = True) -> Token:
    claims = {"role": user.role, "uid": user.id, "remember": remember}
    access_token = create_access_token(user.email, claims)
    refresh_token = create_refresh_token(user.email, claims)
    _set_auth_cookies(response, access_token, refresh_token, remember)
    return Token(user=UserRead.model_validate(user))


@router.get("/google/start")
def google_start(next: str = Query(default="/dashboard")) -> RedirectResponse:
    settings = get_settings()
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        login_url = _frontend_url("/login", next=next, auth_error="google_not_configured")
        return RedirectResponse(login_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    next_path = next if next.startswith("/") and not next.startswith("//") else "/dashboard"
    params = {
        "client_id": settings.google_oauth_client_id,
        "redirect_uri": _oauth_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": _create_oauth_state(next_path),
        "prompt": "select_account",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}", status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/google/callback")
def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    if error:
        return RedirectResponse(_frontend_url("/login", auth_error="google_denied"), status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    if not code or not state:
        return RedirectResponse(_frontend_url("/login", auth_error="google_failed"), status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    try:
        next_path = _decode_oauth_state(state)
    except HTTPException:
        return RedirectResponse(_frontend_url("/login", auth_error="google_failed"), status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    settings = get_settings()
    try:
        with httpx.Client(timeout=10) as client:
            token_response = client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.google_oauth_client_id,
                    "client_secret": settings.google_oauth_client_secret,
                    "redirect_uri": _oauth_redirect_uri(),
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            id_token = token_response.json().get("id_token")
            if not id_token:
                raise ValueError("Google did not return an ID token")
            profile_response = client.get(GOOGLE_TOKENINFO_URL, params={"id_token": id_token})
            profile_response.raise_for_status()
            profile = profile_response.json()

        if profile.get("aud") != settings.google_oauth_client_id or profile.get("email_verified") not in {True, "true", "True"}:
            raise ValueError("Google account could not be verified")
        email = str(profile["email"]).lower()
        full_name = str(profile.get("name") or email.split("@")[0])[:160]
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(f"google-oauth:{profile.get('sub', email)}:{settings.jwt_secret[:16]}"),
                role="analyst",
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.is_active:
            return RedirectResponse(_frontend_url("/login", next=next_path, auth_error="disabled"), status_code=status.HTTP_307_TEMPORARY_REDIRECT)
        elif user.full_name != full_name and full_name:
            user.full_name = full_name
            db.commit()
            db.refresh(user)

        redirect = RedirectResponse(_frontend_url(next_path), status_code=status.HTTP_307_TEMPORARY_REDIRECT)
        _issue_token_pair(user, redirect)
        logger.info("Google login succeeded user_id=%s role=%s", user.id, user.role)
        return redirect
    except (HTTPException, SQLAlchemyError, httpx.HTTPError, KeyError, ValueError) as exc:
        db.rollback()
        logger.warning("Google login failed error=%s", exc)
        return RedirectResponse(_frontend_url("/login", next=next_path, auth_error="google_failed"), status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.post("/register", response_model=Token)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)) -> Token:
    email = str(payload.email).lower()
    logger.info("Registration attempt")
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            logger.warning("Registration rejected because user already exists")
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
        logger.info("Registration succeeded user_id=%s role=%s", user.id, user.role)
        return _issue_token_pair(user, response, payload.remember)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Registration failed because database is unavailable")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc
    except ValueError as exc:
        logger.warning("Registration validation failed error=%s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        logger.exception("Unexpected registration failure")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed") from exc


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> Token:
    email = str(payload.email).lower()
    logger.info("Login attempt")
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning("Login failed reason=invalid_credentials")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=AUTH_ERROR)
        if not user.is_active:
            logger.warning("Login failed because user is disabled user_id=%s", user.id)
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")
        if not verify_password(payload.password, user.hashed_password):
            logger.warning("Login failed reason=invalid_credentials")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=AUTH_ERROR)
        logger.info("Login succeeded user_id=%s role=%s", user.id, user.role)
        return _issue_token_pair(user, response, payload.remember)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        logger.exception("Login failed because database is unavailable")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc
    except Exception as exc:
        logger.exception("Unexpected login failure")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed") from exc


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)) -> UserRead:
    logger.info("Current user loaded user_id=%s role=%s", user.id, user.role)
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
