"use client";

import {
  useEffect,
  useState,
} from "react";

import AppNav from "@/components/AppNav";
import { authFetch } from "@/lib/api";

type Medicine = {
  id: number;
  person_id: number;
  name: string;
  strength: string;
  dosage_form: string;
  note: string | null;
  quantity_remaining: number;
  expiry_date: string | null;
};

export default function MedicinesPage() {
  const [
    medicines,
    setMedicines,
  ] = useState<Medicine[]>([]);

  const [message, setMessage] =
    useState("Loading...");

  useEffect(() => {
    async function loadMedicines() {
      try {
        const response =
          await authFetch(
            "http://127.0.0.1:8000/api/v1/medicines"
          );

        const result =
          await response.json();

        if (!response.ok) {
          setMessage(
            result.detail ??
              "Failed to load medicines"
          );
          return;
        }

        setMedicines(
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
            "Failed to load medicines"
          );
        }
      }
    }

    loadMedicines();
  }, []);

  const lowStockCount =
    medicines.filter(
      (medicine) =>
        medicine.quantity_remaining <=
        5
    ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />

      <main className="mx-auto max-w-6xl px-6 py-10">

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Medicine cabinet
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Medicines
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View medicine details,
            remaining stock and expiry
            information.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total medicines
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {medicines.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Low stock
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {lowStockCount}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        {!message &&
          medicines.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold text-slate-800">
                No medicines found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Medicines added to your
                family cabinet will appear
                here.
              </p>
            </div>
          )}

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {medicines.map(
            (medicine) => {
              const isLowStock =
                medicine
                  .quantity_remaining <=
                5;

              return (
                <article
                  key={medicine.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {
                          medicine.name
                        }
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          medicine.strength
                        }
                        {" • "}
                        {
                          medicine.dosage_form
                        }
                      </p>
                    </div>

                    {isLowStock && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Low stock
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Remaining
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-800">
                        {
                          medicine
                            .quantity_remaining
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Expiry
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {medicine.expiry_date ??
                          "Not set"}
                      </p>
                    </div>
                  </div>

                  {medicine.note && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Note
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {
                          medicine.note
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