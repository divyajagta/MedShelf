"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Alert = {
  type: "expiry" | "low_stock";
  medicine_id: number;
  medicine_name: string;
  person_name: string;
  expiry_date?: string;
  quantity_remaining?: number;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [message, setMessage] = useState("Loading...");

  const router = useRouter();

  useEffect(() => {
    async function loadAlerts() {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/alerts",
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
          result.detail ?? "Failed to load alerts"
        );
        return;
      }

      setAlerts(result);
      setMessage("");
    }

    loadAlerts();
  }, [router]);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">

        <div className="flex gap-4">
          <Link href="/today">Today</Link>
          <Link href="/medicines">Medicines</Link>
          <Link href="/history">History</Link>
          <Link href="/alerts">Alerts</Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold">
          Medicine Alerts
        </h1>

        {message && (
          <p className="mt-4">{message}</p>
        )}

        {!message && alerts.length === 0 && (
          <p className="mt-4">
            No stock or expiry alerts.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={`${alert.type}-${alert.medicine_id}-${index}`}
              className="rounded-lg border p-4"
            >
              <p className="font-bold">
                {alert.person_name}
              </p>

              <h2 className="text-xl font-semibold">
                {alert.medicine_name}
              </h2>

              {alert.type === "low_stock" && (
                <p className="mt-2">
                  Low stock:{" "}
                  {alert.quantity_remaining} remaining
                </p>
              )}

              {alert.type === "expiry" && (
                <p className="mt-2">
                  Expiring soon: {alert.expiry_date}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}