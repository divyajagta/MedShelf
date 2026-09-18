"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function HistoryPage() {
  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [message, setMessage] =
    useState("Loading...");

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await authFetch(
          "http://127.0.0.1:8000/api/v1/history"
        );

        const result = await response.json();

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

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">

        <div className="flex gap-4">
          <Link href="/today">
            Today
          </Link>

          <Link href="/medicines">
            Medicines
          </Link>

          <Link href="/history">
            History
          </Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold">
          7-Day History
        </h1>

        {message && (
          <p className="mt-4">
            {message}
          </p>
        )}

        {!message &&
          history.length === 0 && (
            <p className="mt-4">
              No history found.
            </p>
          )}

        <div className="mt-6 space-y-4">
          {history.map((item) => (
            <div
              key={item.occurrence_id}
              className="rounded-lg border p-4"
            >
              <p className="font-bold">
                {item.person.name}
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {item.medicine.name}
              </h2>

              <p>
                {item.medicine.strength}
              </p>

              <p className="mt-2">
                Status: {item.status}
              </p>

              <p>
                Scheduled:{" "}
                {new Date(
                  item.scheduled_for
                ).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}