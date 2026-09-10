import json
import os

from dotenv import load_dotenv
from pywebpush import WebPushException, webpush
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.app.models import PushSubscription


load_dotenv()

VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY"
)

VAPID_SUBJECT = os.getenv(
    "VAPID_SUBJECT"
)


def send_push_to_user(
    session: Session,
    user_id: int,
    title: str,
    body: str,
):
    result = session.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == user_id
        )
    )

    subscriptions = result.scalars().all()

    sent_count = 0
    failed_count = 0

    for subscription in subscriptions:
        extra_headers = {}

        if ".notify.windows.com" in subscription.endpoint:
            extra_headers = {
                "X-WNS-Type": "wns/raw",
                "Content-Type": "application/octet-stream",
            }
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {
                        "p256dh": subscription.p256dh,
                        "auth": subscription.auth,
                    },
                },
                data=json.dumps({
                    "title": title,
                    "body": body,
                }),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": VAPID_SUBJECT
                },
                headers=extra_headers,
                ttl=600,
            )

            sent_count += 1

        except WebPushException as error:
            print(
                f"PUSH FAILED for subscription "
                f"{subscription.id}: {error}"
            )

            failed_count += 1

    return {
        "sent_count": sent_count,
        "failed_count": failed_count,
    }