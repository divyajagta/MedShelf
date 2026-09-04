from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from sqlalchemy.dialects.postgresql import insert
from api.app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,

)
from sqlalchemy.exc import IntegrityError

from api.app.database import SessionLocal
from api.app.models import (
    DoseStatus,
    DoseOccurrence,
    Person,
    Medicine,
    MedicineSchedule,
    User,
)
from api.app.schemas import (
    DoseOccurrenceCreate,
    MedicineScheduleCreate,
    MedicineCreate,
    MedicineUpdate,
    MedicineScheduleUpdate,
    PersonCreate,
    PersonUpdate,
    UserCreate,
    UserResponse,
    UserLogin,
    TokenResponse,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

app = FastAPI(
    title="MedShelf API",
    version="0.1.0",
)

bearer_scheme = HTTPBearer(
    auto_error=False
)

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    user_id = decode_access_token(
        credentials.credentials
    )

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    with SessionLocal() as session:
        result = session.execute(
            select(User).where(
                User.id == user_id
            )
        )

        user = result.scalars().first()

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User not found",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="Account is inactive",
            )

        return user

@app.get("/")
def home():
    return {"message": "MedShelf API is running"}


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


@app.post("/api/v1/persons")
def create_person(
    person_data: PersonCreate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        person = Person(
            user_id=current_user.id,
            name=person_data.name,
        )

        session.add(person)
        session.commit()
        session.refresh(person)

        return person

@app.get("/api/v1/persons")
def get_persons(
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        result = session.execute(
            select(Person).where(
                Person.user_id == current_user.id
            )
        )

        return result.scalars().all()

@app.patch("/api/v1/persons/{person_id}")
def update_person(person_id: int, data: PersonUpdate):
    with SessionLocal() as session:
        person = session.get(Person, person_id)

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        person.name = data.name

        session.commit()
        session.refresh(person)

        return {
            "id": person.id,
            "name": person.name,
        }

@app.delete("/api/v1/persons/{person_id}")
def delete_person(person_id: int):
    with SessionLocal() as session:
        person = session.get(Person, person_id)

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        session.delete(person)
        session.commit()

        return {
            "message": "Person deleted"
        }

@app.post("/api/v1/medicines")
def create_medicine(
    data: MedicineCreate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        result = session.execute(
            select(Person).where(
                Person.id == data.person_id,
                Person.user_id == current_user.id,
            )
        )

        person = result.scalars().first()

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        medicine = Medicine(
            person_id=person.id,
            name=data.name,
            strength=data.strength,
            dosage_form=data.dosage_form,
            note=data.note,
            quantity_remaining=data.quantity_remaining,
            expiry_date=data.expiry_date,
        )

        session.add(medicine)
        session.commit()
        session.refresh(medicine)

        return {
            "id": medicine.id,
            "person_id": medicine.person_id,
            "name": medicine.name,
            "strength": medicine.strength,
            "dosage_form": medicine.dosage_form,
            "note": medicine.note,
            "quantity_remaining": medicine.quantity_remaining,
            "expiry_date": medicine.expiry_date,
        }

@app.get("/api/v1/medicines")
def get_medicines(
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        result = session.execute(
            select(Medicine)
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                Person.user_id == current_user.id
            )
        )

        medicines = result.scalars().all()

        return [
            {
                "id": medicine.id,
                "person_id": medicine.person_id,
                "name": medicine.name,
                "strength": medicine.strength,
                "dosage_form": medicine.dosage_form,
                "note": medicine.note,
                "quantity_remaining": medicine.quantity_remaining,
                "expiry_date": medicine.expiry_date,
            }
            for medicine in medicines
        ]

@app.get("/api/v1/persons/{person_id}/medicines")
def get_person_medicines(
    person_id: int,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        person_result = session.execute(
            select(Person).where(
                Person.id == person_id,
                Person.user_id == current_user.id,
            )
        )

        person = person_result.scalars().first()

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        result = session.execute(
            select(Medicine).where(
                Medicine.person_id == person_id
            )
        )

        medicines = result.scalars().all()

        return [
            {
                "id": medicine.id,
                "person_id": medicine.person_id,
                "name": medicine.name,
                "strength": medicine.strength,
                "dosage_form": medicine.dosage_form,
                "note": medicine.note,
                "quantity_remaining": medicine.quantity_remaining,
                "expiry_date": medicine.expiry_date,
            }
            for medicine in medicines
        ]

@app.patch("/api/v1/medicines/{medicine_id}")
def update_medicine(
    medicine_id: int,
    data: MedicineUpdate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        result = session.execute(
            select(Medicine)
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                Medicine.id == medicine_id,
                Person.user_id == current_user.id,
            )
        )

        medicine = result.scalars().first()

        if medicine is None:
            raise HTTPException(
                status_code=404,
                detail="Medicine not found",
            )

        medicine.name = data.name
        medicine.strength = data.strength
        medicine.dosage_form = data.dosage_form
        medicine.note = data.note
        medicine.quantity_remaining = data.quantity_remaining
        medicine.expiry_date = data.expiry_date

        session.commit()
        session.refresh(medicine)

        return {
            "id": medicine.id,
            "person_id": medicine.person_id,
            "name": medicine.name,
            "strength": medicine.strength,
            "dosage_form": medicine.dosage_form,
            "note": medicine.note,
            "quantity_remaining": medicine.quantity_remaining,
            "expiry_date": medicine.expiry_date,
        }

@app.delete("/api/v1/medicines/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        result = session.execute(
            select(Medicine)
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                Medicine.id == medicine_id,
                Person.user_id == current_user.id,
            )
        )

        medicine = result.scalars().first()

        if medicine is None:
            raise HTTPException(
                status_code=404,
                detail="Medicine not found",
            )

        session.delete(medicine)
        session.commit()

        return {
            "message": "Medicine deleted"
        }

@app.post("/api/v1/medicines/{medicine_id}/schedules")
def create_medicine_schedule(
    medicine_id: int,
    data: MedicineScheduleCreate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        result = session.execute(
            select(Medicine)
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                Medicine.id == medicine_id,
                Person.user_id == current_user.id,
            )
        )

        medicine = result.scalars().first()

        if medicine is None:
            raise HTTPException(
                status_code=404,
                detail="Medicine not found",
            )

        schedule = MedicineSchedule(
            medicine_id=medicine.id,
            time_of_day=data.time_of_day,
            timezone=data.timezone,
        )

        session.add(schedule)
        session.commit()
        session.refresh(schedule)

        return {
            "id": schedule.id,
            "medicine_id": schedule.medicine_id,
            "time_of_day": schedule.time_of_day,
            "timezone": schedule.timezone,
            "is_active": schedule.is_active,
        }

@app.get("/api/v1/medicines/{medicine_id}/schedules")
def get_medicine_schedules(
    medicine_id: int,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        medicine_result = session.execute(
            select(Medicine)
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                Medicine.id == medicine_id,
                Person.user_id == current_user.id,
            )
        )

        medicine = medicine_result.scalars().first()

        if medicine is None:
            raise HTTPException(
                status_code=404,
                detail="Medicine not found",
            )

        result = session.execute(
            select(MedicineSchedule).where(
                MedicineSchedule.medicine_id == medicine.id
            )
        )

        return result.scalars().all()

@app.patch("/api/v1/schedules/{schedule_id}")
def update_schedule(
    schedule_id: int,
    data: MedicineScheduleUpdate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        result = session.execute(
            select(MedicineSchedule)
            .join(
                Medicine,
                MedicineSchedule.medicine_id == Medicine.id,
            )
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                MedicineSchedule.id == schedule_id,
                Person.user_id == current_user.id,
            )
        )

        schedule = result.scalars().first()

        if schedule is None:
            raise HTTPException(
                status_code=404,
                detail="Schedule not found",
            )

        schedule.is_active = data.is_active

        session.commit()
        session.refresh(schedule)

        return {
            "id": schedule.id,
            "medicine_id": schedule.medicine_id,
            "time_of_day": schedule.time_of_day,
            "timezone": schedule.timezone,
            "is_active": schedule.is_active,
        }
    
@app.post("/api/v1/schedules/{schedule_id}/occurrences")
def create_dose_occurrence(
    schedule_id: int,
    data: DoseOccurrenceCreate,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        result = session.execute(
            select(MedicineSchedule)
            .join(
                Medicine,
                MedicineSchedule.medicine_id == Medicine.id,
            )
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                MedicineSchedule.id == schedule_id,
                Person.user_id == current_user.id,
            )
        )

        schedule = result.scalars().first()

        if schedule is None:
            raise HTTPException(
                status_code=404,
                detail="Schedule not found",
            )

        if not schedule.is_active:
            raise HTTPException(
                status_code=400,
                detail="Schedule is inactive",
            )

        occurrence = DoseOccurrence(
            schedule_id=schedule.id,
            scheduled_for=data.scheduled_for,
        )

        session.add(occurrence)
        session.commit()
        session.refresh(occurrence)

        return {
            "id": occurrence.id,
            "schedule_id": occurrence.schedule_id,
            "scheduled_for": occurrence.scheduled_for,
            "status": occurrence.status,
            "snoozed_until": occurrence.snoozed_until,
            "acted_at": occurrence.acted_at,
        }
    
@app.get("/api/v1/schedules/{schedule_id}/occurrences")
def get_dose_occurrences(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        schedule_result = session.execute(
            select(MedicineSchedule)
            .join(
                Medicine,
                MedicineSchedule.medicine_id == Medicine.id,
            )
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                MedicineSchedule.id == schedule_id,
                Person.user_id == current_user.id,
            )
        )

        schedule = schedule_result.scalars().first()

        if schedule is None:
            raise HTTPException(
                status_code=404,
                detail="Schedule not found",
            )

        result = session.execute(
            select(DoseOccurrence)
            .where(
                DoseOccurrence.schedule_id == schedule.id
            )
            .order_by(
                DoseOccurrence.scheduled_for
            )
        )

        occurrences = result.scalars().all()

        return [
            {
                "id": occurrence.id,
                "schedule_id": occurrence.schedule_id,
                "scheduled_for": occurrence.scheduled_for,
                "status": occurrence.status,
                "snoozed_until": occurrence.snoozed_until,
                "acted_at": occurrence.acted_at,
            }
            for occurrence in occurrences
        ]

@app.get("/api/v1/occurrences/today")
def get_today_occurrences(
    tz: str = "Asia/Kolkata",
    current_user: User = Depends(get_current_user),
):
    try:
        local_timezone = ZoneInfo(tz)

    except ZoneInfoNotFoundError:
        raise HTTPException(
            status_code=400,
            detail="Invalid timezone",
        )

    now_local = datetime.now(local_timezone)

    start_local = datetime.combine(
        now_local.date(),
        time.min,
        tzinfo=local_timezone,
    )

    end_local = start_local + timedelta(days=1)

    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)

    with SessionLocal() as session:
        result = session.execute(
            select(
                DoseOccurrence,
                MedicineSchedule,
                Medicine,
                Person,
            )
            .join(
                MedicineSchedule,
                DoseOccurrence.schedule_id
                == MedicineSchedule.id,
            )
            .join(
                Medicine,
                MedicineSchedule.medicine_id
                == Medicine.id,
            )
            .join(
                Person,
                Medicine.person_id
                == Person.id,
            )
            .where(
                DoseOccurrence.scheduled_for >= start_utc,
                DoseOccurrence.scheduled_for < end_utc,
                Person.user_id == current_user.id,
            )
            .order_by(DoseOccurrence.scheduled_for)
        )

        rows = result.all()

        return [
            {
                "occurrence_id": occurrence.id,
                "person": {
                    "id": person.id,
                    "name": person.name,
                },
                "medicine": {
                    "id": medicine.id,
                    "name": medicine.name,
                    "strength": medicine.strength,
                    "dosage_form": medicine.dosage_form,
                },
                "schedule_id": schedule.id,
                "scheduled_for": occurrence.scheduled_for.astimezone(
                    local_timezone
                ),
                "status": occurrence.status,
                "snoozed_until": occurrence.snoozed_until,
                "acted_at": occurrence.acted_at,
            }
            for occurrence, schedule, medicine, person in rows
        ]

@app.patch("/api/v1/occurrences/{occurrence_id}/taken")
def mark_dose_taken(
    occurrence_id: int,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        occurrence = result = session.execute(
            select(DoseOccurrence)
            .join(
                MedicineSchedule,
                DoseOccurrence.schedule_id == MedicineSchedule.id,
            )
            .join(
                Medicine,
                MedicineSchedule.medicine_id == Medicine.id,
            )
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                DoseOccurrence.id == occurrence_id,
                Person.user_id == current_user.id,
            )
        )

        occurrence = result.scalars().first()

        if occurrence is None:
            raise HTTPException(
                status_code=404,
                detail="Dose occurrence not found",
            )

        if occurrence.status == DoseStatus.TAKEN:
            return {
                "id": occurrence.id,
                "schedule_id": occurrence.schedule_id,
                "scheduled_for": occurrence.scheduled_for,
                "status": occurrence.status,
                "snoozed_until": occurrence.snoozed_until,
                "acted_at": occurrence.acted_at,
            }

        occurrence.status = DoseStatus.TAKEN
        occurrence.acted_at = datetime.now(timezone.utc)
        occurrence.snoozed_until = None

        session.commit()
        session.refresh(occurrence)

        return {
            "id": occurrence.id,
            "schedule_id": occurrence.schedule_id,
            "scheduled_for": occurrence.scheduled_for,
            "status": occurrence.status,
            "snoozed_until": occurrence.snoozed_until,
            "acted_at": occurrence.acted_at,
        }

@app.patch("/api/v1/occurrences/{occurrence_id}/skipped")
def mark_dose_skipped(
    occurrence_id: int,
    current_user: User = Depends(get_current_user),
):
    with SessionLocal() as session:
        occurrence = result = session.execute(
            select(DoseOccurrence)
            .join(
                MedicineSchedule,
                DoseOccurrence.schedule_id == MedicineSchedule.id,
            )
            .join(
                Medicine,
                MedicineSchedule.medicine_id == Medicine.id,
            )
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                DoseOccurrence.id == occurrence_id,
                Person.user_id == current_user.id,
            )
        )

        occurrence = result.scalars().first()

        if occurrence is None:
            raise HTTPException(
                status_code=404,
                detail="Dose occurrence not found",
            )

        if occurrence.status == DoseStatus.SKIPPED:
            return {
                "id": occurrence.id,
                "schedule_id": occurrence.schedule_id,
                "scheduled_for": occurrence.scheduled_for,
                "status": occurrence.status,
                "snoozed_until": occurrence.snoozed_until,
                "acted_at": occurrence.acted_at,
            }

        if occurrence.status == DoseStatus.TAKEN:
            raise HTTPException(
                status_code=400,
                detail="Taken dose cannot be skipped",
            )

        occurrence.status = DoseStatus.SKIPPED
        occurrence.acted_at = datetime.now(timezone.utc)
        occurrence.snoozed_until = None

        session.commit()
        session.refresh(occurrence)

        return {
            "id": occurrence.id,
            "schedule_id": occurrence.schedule_id,
            "scheduled_for": occurrence.scheduled_for,
            "status": occurrence.status,
            "snoozed_until": occurrence.snoozed_until,
            "acted_at": occurrence.acted_at,
        }

@app.patch("/api/v1/occurrences/{occurrence_id}/snooze")
def snooze_dose(
    occurrence_id: int,
    current_user: User = Depends(get_current_user),
):      
    with SessionLocal() as session:
        occurrence = result = session.execute(
            select(DoseOccurrence)
            .join(
                MedicineSchedule,
                DoseOccurrence.schedule_id == MedicineSchedule.id,
            )
            .join(
                Medicine,
                MedicineSchedule.medicine_id == Medicine.id,
            )
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                DoseOccurrence.id == occurrence_id,
                Person.user_id == current_user.id,
            )
        )

        occurrence = result.scalars().first()

        if occurrence is None:
            raise HTTPException(
                status_code=404,
                detail="Dose occurrence not found",
            )

        if occurrence.status == DoseStatus.TAKEN:
            raise HTTPException(
                status_code=400,
                detail="Taken dose cannot be snoozed",
            )

        if occurrence.status == DoseStatus.SKIPPED:
            raise HTTPException(
                status_code=400,
                detail="Skipped dose cannot be snoozed",
            )

        now = datetime.now(timezone.utc)

        occurrence.status = DoseStatus.SNOOZED
        occurrence.snoozed_until = now + timedelta(minutes=15)
        occurrence.acted_at = now

        session.commit()
        session.refresh(occurrence)

        return {
            "id": occurrence.id,
            "schedule_id": occurrence.schedule_id,
            "scheduled_for": occurrence.scheduled_for,
            "status": occurrence.status,
            "snoozed_until": occurrence.snoozed_until,
            "acted_at": occurrence.acted_at,
        }

@app.patch("/api/v1/occurrences/mark-missed")
def mark_missed_occurrences(
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)

    with SessionLocal() as session:
        result = session.execute(
            select(DoseOccurrence)
            .join(
                MedicineSchedule,
                DoseOccurrence.schedule_id
                == MedicineSchedule.id,
            )
            .join(
                Medicine,
                MedicineSchedule.medicine_id
                == Medicine.id,
            )
            .join(
                Person,
                Medicine.person_id == Person.id,
            )
            .where(
                DoseOccurrence.status == DoseStatus.PENDING,
                DoseOccurrence.scheduled_for < now,
                Person.user_id == current_user.id,
            )
        )

        occurrences = result.scalars().all()

        for occurrence in occurrences:
            occurrence.status = DoseStatus.MISSED

        session.commit()

        return {
            "updated_count": len(occurrences),
            "message": "Overdue doses marked as missed",
        }

@app.post("/api/v1/occurrences/generate-today")
def generate_today_occurrences():
    with SessionLocal() as session:
        result = session.execute(
            select(MedicineSchedule).where(
                MedicineSchedule.is_active == True
            )
        )

        schedules = result.scalars().all()

        created_count = 0
        invalid_timezone_count = 0      

        for schedule in schedules:
            try:
                 local_timezone = ZoneInfo(schedule.timezone)

            except ZoneInfoNotFoundError:
                invalid_timezone_count += 1
                continue

            now_local = datetime.now(local_timezone)

            scheduled_local = datetime.combine(
                now_local.date(),
                schedule.time_of_day,
                tzinfo=local_timezone,
            )

            scheduled_utc = scheduled_local.astimezone(
                timezone.utc
            )

            statement = (
                insert(DoseOccurrence)
                .values(
                    schedule_id=schedule.id,
                    scheduled_for=scheduled_utc,
                    status=DoseStatus.PENDING,
                )
                .on_conflict_do_nothing(
                    constraint="uq_dose_schedule_time"
                )
            )

            insert_result = session.execute(statement)

            if insert_result.rowcount == 1:
                created_count += 1

        session.commit()

        return {
            "created_count": created_count,
            "invalid_timezone_count": invalid_timezone_count,
            "message": "Today's dose occurrences generated",
        }

@app.post(
    "/api/v1/auth/signup",
    response_model=UserResponse,
    status_code=201,
)
def signup(user_data: UserCreate):
    with SessionLocal() as session:
        email = str(user_data.email).lower()

        existing_result = session.execute(
            select(User).where(
                User.email == email
            )
        )

        existing_user = (
            existing_result.scalars().first()
        )

        if existing_user is not None:
            raise HTTPException(
                status_code=409,
                detail="Email already registered",
            )

        user = User(
            email=email,
            password_hash=hash_password(
                user_data.password
            ),
        )

        session.add(user)

        try:
            session.commit()

        except IntegrityError:
            session.rollback()

            raise HTTPException(
                status_code=409,
                detail="Email already registered",
            )

        session.refresh(user)

        return user 

@app.post(
    "/api/v1/auth/login",
  response_model=TokenResponse,
  )
def login(user_data: UserLogin):
    with SessionLocal() as session:
        email = str(user_data.email).lower()

        result = session.execute(
            select(User).where(
                User.email == email
            )
        )

        user = result.scalars().first()

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        password_is_correct = verify_password(
            user_data.password,
            user.password_hash,
        )

        if not password_is_correct:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="Account is inactive",
            )

        access_token = create_access_token(user.id)

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }


@app.get(
    "/api/v1/auth/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user