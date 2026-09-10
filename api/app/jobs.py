from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from api.app.push import send_push_to_user
from api.app.database import SessionLocal
from api.app.models import (
    Medicine,
    Person,
    DoseOccurrence,
    DoseStatus,
    MedicineSchedule,
)


def generate_today_occurrences_for_all_schedules():
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
                local_timezone = ZoneInfo(
                    schedule.timezone
                )

            except ZoneInfoNotFoundError:
                invalid_timezone_count += 1
                continue

            now_local = datetime.now(
                local_timezone
            )

            scheduled_local = datetime.combine(
                now_local.date(),
                schedule.time_of_day,
                tzinfo=local_timezone,
            )

            scheduled_utc = (
                scheduled_local.astimezone(
                    timezone.utc
                )
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

            insert_result = session.execute(
                statement
            )

            if insert_result.rowcount == 1:
                created_count += 1

        session.commit()

        return {
            "created_count": created_count,
            "invalid_timezone_count":
                invalid_timezone_count,
        }

def process_due_reminders():
    now_utc = datetime.now(timezone.utc)

    with SessionLocal() as session:
        result = session.execute(
            select(DoseOccurrence).where(
                DoseOccurrence.status == DoseStatus.PENDING,
                DoseOccurrence.scheduled_for <= now_utc,
            )
        )

        occurrences = result.scalars().all()

        first_reminder_count = 0
        second_reminder_count = 0

        for occurrence in occurrences:
            dose_details = session.execute(
                select(
                    Person.user_id,
                    Person.name,
                    Medicine.name,
                    Medicine.strength,
                )
                .join(
                    Medicine,
                    Medicine.person_id == Person.id,
                )
                .join(
                    MedicineSchedule,
                    MedicineSchedule.medicine_id
                    == Medicine.id,
                )
                .where(
                    MedicineSchedule.id
                    == occurrence.schedule_id
                )
            ).first()

            if dose_details is None:
                continue

            (
                user_id,
                person_name,
                medicine_name,
                medicine_strength,
            ) = dose_details

            if occurrence.first_reminder_sent_at is None:
                
                push_result = send_push_to_user(
                    session=session,
                    user_id=user_id,
                    title="MedShelf Reminder",
                    body=(
                        f"{person_name}: "
                        f"{medicine_name} "
                        f"{medicine_strength} is due."
                    ),
                )

                if push_result["sent_count"] > 0:
                    occurrence.first_reminder_sent_at = (
                        now_utc
                    )

                    first_reminder_count += 1

                continue

            second_reminder_due_at = (
                occurrence.first_reminder_sent_at
                + timedelta(minutes=30)
            )

            if (
                occurrence.second_reminder_sent_at is None
                and now_utc >= second_reminder_due_at
            ):
                push_result = send_push_to_user(
                    session=session,
                    user_id=user_id,
                    title="MedShelf Reminder",
                    body=(
                        f"{person_name}: "
                        f"{medicine_name} "
                        f"{medicine_strength} "
                        f"is still pending."
                    ),
                )

                if push_result["sent_count"] > 0:
                    occurrence.second_reminder_sent_at = (
                        now_utc
                    )

                    second_reminder_count += 1

        session.commit()

        return {
            "first_reminder_count": first_reminder_count,
            "second_reminder_count": second_reminder_count,
        }