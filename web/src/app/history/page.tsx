"use client";

import {
  useEffect,
  useState,
} from "react";

import AppNav from "@/components/AppNav";
import { authFetch } from "@/lib/api";

type HistoryItem = {
  occurrence_id: number;

  person: {
    id: number;
    name: string;
  };

  medicine: {
    id: number;
    name: string;
    strength: string;
  };

  scheduled_for: string;
  status: string;
  acted_at: string | null;
};

function statusClasses(status: string) {
  if (status === "taken") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "skipped") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-rose-50 text-rose-700";
}

export default function HistoryPage() {
  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [message, setMessage] =
    useState("Loading...");

  useEffect(() => {
    async function loadHistory() {
      try {
        const response =
          await authFetch(
            "http://127.0.0.1:8000/api/v1/history"
          );

        const result =
          await response.json();

        if (!response.ok) {
          setMessage(
            result.detail ??
              "Failed to load history"
          );
          return;
        }

        setHistory(
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
            "Failed to load history"
          );
        }
      }
    }

    loadHistory();
  }, []);

  const takenCount =
    history.filter(
      (item) =>
        item.status === "taken"
    ).length;

  const skippedCount =
    history.filter(
      (item) =>
        item.status === "skipped"
    ).length;

  const missedCount =
    history.filter(
      (item) =>
        item.status === "missed"
    ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />

      <main className="mx-auto max-w-6xl px-6 py-10">

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Dose activity
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            7-Day History
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review recent Taken, Skipped
            and Missed dose activity.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-700">
              Taken
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-800">
              {takenCount}
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-700">
              Skipped
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-800">
              {skippedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-rose-50 p-5">
            <p className="text-sm font-medium text-rose-700">
              Missed
            </p>

            <p className="mt-2 text-3xl font-bold text-rose-800">
              {missedCount}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        {!message &&
          history.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold text-slate-800">
                No dose history yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Completed dose actions will
                appear here.
              </p>
            </div>
          )}

        <div className="mt-8 space-y-4">
          {history.map((item) => (
            <article
              key={
                item.occurrence_id
              }
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-emerald-600">
                  {item.person.name}
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {
                    item.medicine
                      .name
                  }
                </h2>

                <p className="text-sm text-slate-500">
                  {
                    item.medicine
                      .strength
                  }
                </p>

                <p className="mt-3 text-sm text-slate-500">
                  {new Date(
                    item.scheduled_for
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                  item.status
                )}`}
              >
                {item.status}
              </span>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}