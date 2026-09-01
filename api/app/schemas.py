from datetime import date, datetime, time

from pydantic import BaseModel, EmailStr, Field


class PersonCreate(BaseModel):
    name: str

class PersonUpdate(BaseModel):
    name: str

class MedicineCreate(BaseModel):
    person_id: int
    name: str
    strength: str
    dosage_form: str
    note: str | None = None
    quantity_remaining: int = 0
    expiry_date: date | None = None

class MedicineUpdate(BaseModel):
    name: str
    strength: str
    dosage_form: str
    note: str | None = None
    quantity_remaining: int = 0
    expiry_date: date | None = None

class MedicineScheduleCreate(BaseModel):
    time_of_day: time
    timezone: str = "Asia/Kolkata"

class MedicineScheduleUpdate(BaseModel):
    is_active: bool

class DoseOccurrenceCreate(BaseModel):
    scheduled_for: datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str