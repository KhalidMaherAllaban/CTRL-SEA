from functools import lru_cache
import json
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CTRL SEA API"
    environment: str = "development"
    database_url: str = "mssql+pyodbc://@localhost\\SQLEXPRESS/ITI_Graduation_PortWatch?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes"
    jwt_secret: str = "change-this-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    auth_cookie_secure: bool = False
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    power_bi_reports_json: str = "[]"
    seed_admin_enabled: bool = False
    seed_admin_email: str = "admin@example.com"
    seed_admin_password: str = Field(default="replace-with-a-local-password", min_length=8)
    seed_admin_name: str = "CTRL SEA Admin"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def power_bi_reports(self) -> list[dict]:
        try:
            value = json.loads(self.power_bi_reports_json)
        except json.JSONDecodeError as exc:
            raise ValueError("POWER_BI_REPORTS_JSON must contain valid JSON") from exc
        if not isinstance(value, list):
            raise ValueError("POWER_BI_REPORTS_JSON must contain a JSON array")
        return value

    @model_validator(mode="after")
    def validate_secure_settings(self) -> "Settings":
        self.power_bi_reports
        if self.environment.lower() in {"production", "prod"}:
            if self.jwt_secret == "change-this-before-production" or len(self.jwt_secret) < 32:
                raise ValueError("JWT_SECRET must be changed in production and contain at least 32 characters")
            self.auth_cookie_secure = True
            self.seed_admin_enabled = False
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
