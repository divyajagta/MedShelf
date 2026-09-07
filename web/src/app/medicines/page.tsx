"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [medicines, setMedicines] =
    useState<Medicine[]>([]);

  const [message, setMessage] =
    useState("Loading...");

  const router = useRouter();

  useEffect(() => {
    async function loadMedicines() {
      const token = localStorage.getItem(
        "access_token"
      );

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/medicines",
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
          result.detail ?? "Failed to load medicines"
        );
        return;
      }

      setMedicines(result);
      setMessage("");
    }

    loadMedicines();
  }, [router]);

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
          Medicines
        </h1>

        {message && (
          <p className="mt-4">
            {message}
          </p>
        )}

        {!message &&
          medicines.length === 0 && (
            <p className="mt-4">
              No medicines found.
            </p>
          )}

        <div className="mt-6 space-y-4">
          {medicines.map((medicine) => (
            <div
              key={medicine.id}
              className="rounded-lg border p-4"
            >
              <h2 className="text-xl font-semibold">
                {medicine.name}
              </h2>

              <p>
                {medicine.strength}
                {" • "}
                {medicine.dosage_form}
              </p>

              <p className="mt-2">
                Remaining:{" "}
                {medicine.quantity_remaining}
              </p>

              <p>
                Expiry:{" "}
                {medicine.expiry_date ??
                  "Not set"}
              </p>

              {medicine.note && (
                <p className="mt-2">
                  Note: {medicine.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}