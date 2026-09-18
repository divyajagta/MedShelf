"use client";

import {
  useEffect,
  useState,
} from "react";

import AppNav from "@/components/AppNav";
import { authFetch } from "@/lib/api";

type Alert = {
  type:
    | "expiry"
    | "low_stock";

  medicine_id: number;
  medicine_name: string;
  person_name: string;
  expiry_date?: string;
  quantity_remaining?: number;
};

export default function AlertsPage() {
  const [alerts, setAlerts] =
    useState<Alert[]>([]);

  const [message, setMessage] =
    useState("Loading...");

  useEffect(() => {
    async function loadAlerts() {
      try {
        const response =
          await authFetch(
            "http://127.0.0.1:8000/api/v1/alerts"
          );

        const result =
          await response.json();

        if (!response.ok) {
          setMessage(
            result.detail ??
              "Failed to load alerts"
          );
          return;
        }

        setAlerts(
          Array.isArray(result)
            ? result
            : []
        );

        setMessage("");
      } catch (error) {
        if (
          error instanceof Error &&
          error.message !==
            "Session expired" &&
          error.message !==
            "Authentication required"
        ) {
          setMessage(
            "Failed to load alerts"
          );
        }
      }
    }

    loadAlerts();
  }, []);

  const lowStockCount =
    alerts.filter(
      (alert) =>
        alert.type ===
        "low_stock"
    ).length;

  const expiryCount =
    alerts.filter(
      (alert) =>
        alert.type === "expiry"
    ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />

      <main className="mx-auto max-w-6xl px-6 py-10">

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Cabinet health
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Medicine Alerts
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Keep an eye on low stock and
            medicines approaching their
            expiry date.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-700">
              Low stock
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-800">
              {lowStockCount}
            </p>
          </div>

          <div className="rounded-2xl bg-rose-50 p-5">
            <p className="text-sm font-medium text-rose-700">
              Expiring soon
            </p>

            <p className="mt-2 text-3xl font-bold text-rose-800">
              {expiryCount}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        {!message &&
          alerts.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600">
                ✓
              </div>

              <p className="mt-4 font-semibold text-slate-800">
                No medicine alerts
              </p>

              <p className="mt-2 text-sm text-slate-500">
                No low-stock or upcoming
                expiry alerts right now.
              </p>
            </div>
          )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {alerts.map(
            (alert, index) => {
              const isLowStock =
                alert.type ===
                "low_stock";

              return (
                <article
                  key={`${alert.type}-${alert.medicine_id}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-sm font-medium text-emerald-600">
                        {
                          alert.person_name
                        }
                      </p>

                      <h2 className="mt-1 text-xl font-semibold text-slate-900">
                        {
                          alert.medicine_name
                        }
                      </h2>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isLowStock
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {isLowStock
                        ? "Low stock"
                        : "Expiry"}
                    </span>
                  </div>

                  {isLowStock ? (
                    <div className="mt-5 rounded-xl bg-amber-50 p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                        Remaining stock
                      </p>

                      <p className="mt-1 text-2xl font-bold text-amber-800">
                        {
                          alert
                            .quantity_remaining
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl bg-rose-50 p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                        Expiry date
                      </p>

                      <p className="mt-1 font-semibold text-rose-800">
                        {
                          alert.expiry_date
                        }
                      </p>
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
      </main>
    </div>
  );
}