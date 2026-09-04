from datetime import date, time, datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    String,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

#{"email": "familytwo@example.com","password": "FamilyTwo123"}
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255)
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

class Person(Base):
    __tablename__ = "persons"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(String(100))

class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(primary_key=True)

    person_id: Mapped[int] = mapped_column(
        ForeignKey("persons.id")
    )

    name: Mapped[str] = mapped_column(String(100))
    strength: Mapped[str] = mapped_column(String(50))
    dosage_form: Mapped[str] = mapped_column(String(50))

    note: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    quantity_remaining: Mapped[int] = mapped_column(default=0)

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

class MedicineSchedule(Base):
    __tablename__ = "medicine_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)

    medicine_id: Mapped[int] = mapped_column(
        ForeignKey("medicines.id")  
    )

    time_of_day: Mapped[time] = mapped_column(Time)

    timezone: Mapped[str] = mapped_column(
        String(64),
        default="Asia/Kolkata",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

class DoseStatus(str, Enum):
    PENDING = "pending"
    TAKEN = "taken"
    SKIPPED = "skipped"
    SNOOZED = "snoozed"
    MISSED = "missed"

class DoseOccurrence(Base):
    __tablename__ = "dose_occurrences"

    __table_args__ = (
        UniqueConstraint(
            "schedule_id",
            "scheduled_for",
            name="uq_dose_schedule_time",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    schedule_id: Mapped[int] = mapped_column(
        ForeignKey("medicine_schedules.id")
    )

    scheduled_for: Mapped[datetime] = mapped_column(
        DateTime(timezone=True)
    )

    status: Mapped[DoseStatus] = mapped_column(
        SqlEnum(DoseStatus, name="dose_status"),
        default=DoseStatus.PENDING,
    )

    snoozed_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    acted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

class CaregiverAccess(Base):
    __tablename__ = "caregiver_access"

    __table_args__ = (
        UniqueConstraint(
            "person_id",
            "caregiver_user_id",
            name="uq_person_caregiver",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    person_id: Mapped[int] = mapped_column(
        ForeignKey("persons.id")
    )

    caregiver_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )