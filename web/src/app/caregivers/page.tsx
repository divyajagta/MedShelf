"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function CaregiversPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [sharedPeople, setSharedPeople] =
    useState<SharedPerson[]>([]);

  const [personId, setPersonId] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [message, setMessage] = useState("");

  const router = useRouter();

  async function getToken() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return null;
    }

    return token;
  }

  async function loadData() {
    const token = await getToken();

    if (!token) return;

    const personsResponse = await fetch(
      "http://127.0.0.1:8000/api/v1/persons",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const grantsResponse = await fetch(
      "http://127.0.0.1:8000/api/v1/caregivers/grants",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const sharedResponse = await fetch(
      "http://127.0.0.1:8000/api/v1/caregivers/shared-with-me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setPersons(await personsResponse.json());
    setGrants(await grantsResponse.json());
    setSharedPeople(await sharedResponse.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  async function grantAccess() {
    const token = await getToken();

    if (!token) return;

    const response = await fetch(
      "http://127.0.0.1:8000/api/v1/caregivers/grant",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          person_id: Number(personId),
          caregiver_email: email,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
        if (Array.isArray(result.detail)) {
            setMessage(
            result.detail
                .map((error: { msg?: string }) =>
                error.msg ?? "Invalid input"
                )
                .join(", ")
            );
        } else {
            setMessage(
            result.detail ?? "Grant failed"
            );
        }

        return;
        }

    setMessage("Access granted");
    setEmail("");

    await loadData();
  }

  async function revokeAccess(
    personId: number,
    caregiverUserId: number
  ) {
    const token = await getToken();

    if (!token) return;

    const response = await fetch(
      `http://127.0.0.1:8000/api/v1/caregivers/${personId}/${caregiverUserId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      setMessage("Revoke failed");
      return;
    }

    setMessage("Access revoked");

    await loadData();
  }

  async function loadSummary(
    personId: number
  ) {
    const token = await getToken();

    if (!token) return;

    const response = await fetch(
      `http://127.0.0.1:8000/api/v1/caregivers/${personId}/summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      setMessage(
        result.detail ?? "Summary failed"
      );
      return;
    }

    setSummary(result);
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">

        <div className="flex gap-4">
          <Link href="/today">Today</Link>
          <Link href="/medicines">Medicines</Link>
          <Link href="/history">History</Link>
          <Link href="/alerts">Alerts</Link>
          <Link href="/caregivers">Caregivers</Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold">
          Caregivers
        </h1>

        <h2 className="mt-8 text-xl font-bold">
          Grant Access
        </h2>

        <select
          value={personId}
          onChange={(event) =>
            setPersonId(event.target.value)
          }
          className="mt-3 w-full border p-2"
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
            setEmail(event.target.value)
          }
          className="mt-3 w-full border p-2"
        />

        <button
          onClick={grantAccess}
          className="mt-3 border px-4 py-2"
        >
          Grant Access
        </button>

        {message && (
          <p className="mt-3">
            {message}
          </p>
        )}

        <h2 className="mt-10 text-xl font-bold">
          Access I Granted
        </h2>

        {grants.map((grant) => (
          <div
            key={grant.id}
            className="mt-3 border p-4"
          >
            <p>
              {grant.person_name}
            </p>

            <p>
              {grant.caregiver_email}
            </p>

            <button
              onClick={() =>
                revokeAccess(
                  grant.person_id,
                  grant.caregiver_user_id
                )
              }
              className="mt-2 border px-3 py-1"
            >
              Revoke
            </button>
          </div>
        ))}

        <h2 className="mt-10 text-xl font-bold">
          Shared With Me
        </h2>

        {sharedPeople.map((person) => (
          <div
            key={person.person_id}
            className="mt-3 border p-4"
          >
            <p>
              {person.person_name}
            </p>

            <button
              onClick={() =>
                loadSummary(person.person_id)
              }
              className="mt-2 border px-3 py-1"
            >
              View 7-Day Summary
            </button>
          </div>
        ))}

        {summary && (
          <div className="mt-8 border p-4">
            <h2 className="font-bold">
              {summary.person_name} Summary
            </h2>

            <p>
              Taken: {summary.taken_count}
            </p>

            <p>
              Skipped: {summary.skipped_count}
            </p>

            <p>
              Missed: {summary.missed_count}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}