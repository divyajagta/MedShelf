"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  urlBase64ToUint8Array,
} from "@/lib/push";

type Dose = {
  occurrence_id: number;

  person: {
    id: number;
    name: string;
  };

  medicine: {
    id: number;
    name: string;
    strength: string;
    dosage_form: string;
  };

  schedule_id: number;
  scheduled_for: string;
  status: string;
  snoozed_until: string | null;
  acted_at: string | null;
};

export default function TodayPage() {
  const [doses, setDoses] = useState<Dose[]>([]);
  const [message, setMessage] = useState("Loading...");

  const router = useRouter();

  const loadToday = useCallback(async () => {
    const token = localStorage.getItem(
      "access_token"
    );

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch(
      "http://127.0.0.1:8000/api/v1/occurrences/today?tz=Asia/Kolkata",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      setMessage(
        result.detail ?? "Failed to load doses"
      );
      return;
    }

    setDoses(result);
    setMessage("");
  }, [router]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  async function handleAction(
    occurrenceId: number,
    action: "taken" | "skipped" | "snooze"
  ) {
    const token = localStorage.getItem(
      "access_token"
    );

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch(
      `http://127.0.0.1:8000/api/v1/occurrences/${occurrenceId}/${action}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const result = await response.json();

      setMessage(
        result.detail ?? "Action failed"
      );

      return;
    }

    await loadToday();
  }

  async function enableNotifications() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setMessage(
        "Push notifications are not supported."
      );
      return;
    }

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      setMessage(
        "Notification permission was not granted."
      );
      return;
    }

    await navigator.serviceWorker.register(
    "/sw.js"
    );

    const registration =
      await navigator.serviceWorker.ready;

    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setMessage(
        "VAPID public key is missing."
      );
      return;
    }

    const subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(publicKey),
      });

    const subscriptionJson =
      subscription.toJSON();

    const response = await fetch(
      "http://127.0.0.1:8000/api/v1/push/subscribe",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          endpoint:
            subscriptionJson.endpoint,
          p256dh:
            subscriptionJson.keys?.p256dh,
          auth:
            subscriptionJson.keys?.auth,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      setMessage(
        result.detail ??
        "Could not enable notifications."
      );
      return;
    }

    setMessage(
      "Notifications enabled."
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={enableNotifications}
          className="mt-4 rounded border px-4 py-2"
        >
          Enable Notifications
        </button>
        <h1 className="text-3xl font-bold">
          Today's Doses
        </h1>

        {message && (
          <p className="mt-4">
            {message}
          </p>
        )}

        {!message && doses.length === 0 && (
          <p className="mt-4">
            No doses scheduled for today.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {doses.map((dose) => (
            <div
              key={dose.occurrence_id}
              className="rounded-lg border p-4"
            >
              <p className="font-bold">
                {dose.person.name}
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {dose.medicine.name}
              </h2>

              <p>
                {dose.medicine.strength}
                {" • "}
                {dose.medicine.dosage_form}
              </p>

              <p className="mt-2">
                Time:{" "}
                {new Date(
                  dose.scheduled_for
                ).toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>

              <p className="mt-1">
                Status: {dose.status}
              </p>

              {(dose.status === "pending" ||
                dose.status === "snoozed") && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() =>
                      handleAction(
                        dose.occurrence_id,
                        "taken"
                      )
                    }
                    className="rounded border px-4 py-2"
                  >
                    Taken
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        dose.occurrence_id,
                        "skipped"
                      )
                    }
                    className="rounded border px-4 py-2"
                  >
                    Skip
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        dose.occurrence_id,
                        "snooze"
                      )
                    }
                    className="rounded border px-4 py-2"
                  >
                    Snooze 15 min
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}