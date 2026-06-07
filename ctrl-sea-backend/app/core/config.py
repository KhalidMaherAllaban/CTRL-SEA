from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CTRL SEA API"
    environment: str = "development"
    database_url: str = "sqlite:///./ctrl_sea_dev.db"
    jwt_secret: str = "change-this-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    seed_admin_enabled: bool = False
    seed_admin_email: str = "admin@example.com"
    seed_admin_password: str = Field(default="replace-with-a-local-password", min_length=8)
    seed_admin_name: str = "CTRL SEA Admin"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_secure_settings(self) -> "Settings":
        if self.environment.lower() in {"production", "prod"}:
            if self.jwt_secret == "change-this-before-production":
                raise ValueError("JWT_SECRET must be changed in production")
            self.seed_admin_enabled = False
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
