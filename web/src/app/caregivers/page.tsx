"use client";

import {
  useEffect,
  useState,
} from "react";

import AppNav from "@/components/AppNav";
import { authFetch } from "@/lib/api";

type Person = {
  id: number;
  name: string;
};

type Grant = {
  id: number;
  person_id: number;
  person_name: string;
  caregiver_user_id: number;
  caregiver_email: string;
};

type SharedPerson = {
  person_id: number;
  person_name: string;
};

type Summary = {
  person_id: number;
  person_name: string;
  days: number;
  taken_count: number;
  skipped_count: number;
  missed_count: number;
};

function getErrorMessage(
  detail: unknown,
  fallback: string
) {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((error) => {
        if (
          typeof error === "object" &&
          error !== null &&
          "msg" in error
        ) {
          return String(error.msg);
        }

        return "Invalid input";
      })
      .join(", ");
  }

  return fallback;
}

export default function CaregiversPage() {
  const [persons, setPersons] =
    useState<Person[]>([]);

  const [grants, setGrants] =
    useState<Grant[]>([]);

  const [
    sharedPeople,
    setSharedPeople,
  ] = useState<SharedPerson[]>([]);

  const [personId, setPersonId] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [message, setMessage] =
    useState("");

  async function loadData() {
    try {
      const [
        personsResponse,
        grantsResponse,
        sharedResponse,
      ] = await Promise.all([
        authFetch(
          "http://127.0.0.1:8000/api/v1/persons"
        ),

        authFetch(
          "http://127.0.0.1:8000/api/v1/caregivers/grants"
        ),

        authFetch(
          "http://127.0.0.1:8000/api/v1/caregivers/shared-with-me"
        ),
      ]);

      if (
        !personsResponse.ok ||
        !grantsResponse.ok ||
        !sharedResponse.ok
      ) {
        setMessage(
          "Could not load caregiver data."
        );
        return;
      }

      const [
        personsData,
        grantsData,
        sharedData,
      ] = await Promise.all([
        personsResponse.json(),
        grantsResponse.json(),
        sharedResponse.json(),
      ]);

      setPersons(
        Array.isArray(personsData)
          ? personsData
          : []
      );

      setGrants(
        Array.isArray(grantsData)
          ? grantsData
          : []
      );

      setSharedPeople(
        Array.isArray(sharedData)
          ? sharedData
          : []
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !==
          "Session expired" &&
        error.message !==
          "Authentication required"
      ) {
        setMessage(
          "Could not load caregiver data."
        );
      }
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function grantAccess() {
    if (!personId || !email.trim()) {
      setMessage(
        "Select a person and enter a caregiver email."
      );
      return;
    }

    try {
      const response = await authFetch(
        "http://127.0.0.1:8000/api/v1/caregivers/grant",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            person_id:
              Number(personId),
            caregiver_email:
              email.trim(),
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          getErrorMessage(
            result.detail,
            "Grant failed"
          )
        );
        return;
      }

      setMessage(
        "Caregiver access granted."
      );

      setEmail("");

      await loadData();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !==
          "Session expired" &&
        error.message !==
          "Authentication required"
      ) {
        setMessage(
          "Could not grant access."
        );
      }
    }
  }

  async function revokeAccess(
    personId: number,
    caregiverUserId: number
  ) {
    try {
      const response = await authFetch(
        `http://127.0.0.1:8000/api/v1/caregivers/${personId}/${caregiverUserId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        setMessage(
          "Could not revoke access."
        );
        return;
      }

      setMessage(
        "Caregiver access revoked."
      );

      await loadData();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !==
          "Session expired" &&
        error.message !==
          "Authentication required"
      ) {
        setMessage(
          "Could not revoke access."
        );
      }
    }
  }

  async function loadSummary(
    personId: number
  ) {
    try {
      const response = await authFetch(
        `http://127.0.0.1:8000/api/v1/caregivers/${personId}/summary`
      );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          getErrorMessage(
            result.detail,
            "Could not load summary."
          )
        );
        return;
      }

      setSummary(result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !==
          "Session expired" &&
        error.message !==
          "Authentication required"
      ) {
        setMessage(
          "Could not load summary."
        );
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />

      <main className="mx-auto max-w-6xl px-6 py-10">

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Family access
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Caregivers
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Share a family member's
            medicine summary with another
            MedShelf user and revoke access
            whenever needed.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Grant caregiver access
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose a person and enter the
            email address of another
            MedShelf account.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <select
              value={personId}
              onChange={(event) =>
                setPersonId(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">
                Select person
              </option>

              {persons.map((person) => (
                <option
                  key={person.id}
                  value={person.id}
                >
                  {person.name}
                </option>
              ))}
            </select>

            <input
              type="email"
              placeholder="Caregiver email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <button
            onClick={grantAccess}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Grant Access
          </button>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Access I granted
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              People you currently share.
            </p>

            <div className="mt-5 space-y-3">
              {grants.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No caregiver access
                  granted yet.
                </p>
              )}

              {grants.map((grant) => (
                <div
                  key={grant.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {grant.person_name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      grant.caregiver_email
                    }
                  </p>

                  <button
                    onClick={() =>
                      revokeAccess(
                        grant.person_id,
                        grant.caregiver_user_id
                      )
                    }
                    className="mt-4 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Revoke access
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Shared with me
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              People whose summaries you
              can currently view.
            </p>

            <div className="mt-5 space-y-3">
              {sharedPeople.length ===
                0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Nothing has been shared
                  with you yet.
                </p>
              )}

              {sharedPeople.map(
                (person) => (
                  <div
                    key={
                      person.person_id
                    }
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {
                        person.person_name
                      }
                    </p>

                    <button
                      onClick={() =>
                        loadSummary(
                          person.person_id
                        )
                      }
                      className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                      View 7-Day Summary
                    </button>
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        {summary && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div>
              <p className="text-sm font-medium text-slate-500">
                7-Day Summary
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {summary.person_name}
              </h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">
                  Taken
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {summary.taken_count}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm text-amber-700">
                  Skipped
                </p>

                <p className="mt-1 text-2xl font-bold text-amber-800">
                  {summary.skipped_count}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50 p-4">
                <p className="text-sm text-rose-700">
                  Missed
                </p>

                <p className="mt-1 text-2xl font-bold text-rose-800">
                  {summary.missed_count}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}