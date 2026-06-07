from pydantic import BaseModel, Field


class PageParams(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    page: int
    size: int


class KpiCard(BaseModel):
    label: str
    value: float | int | str
    change: float
    tone: str = "cyan"

