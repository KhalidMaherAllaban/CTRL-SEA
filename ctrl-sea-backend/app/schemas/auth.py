from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    user: "UserRead"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=256)
    remember: bool = True

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 UTF-8 bytes or fewer")
        return value


class RegisterRequest(LoginRequest):
    full_name: str = Field(min_length=2, max_length=160)


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
