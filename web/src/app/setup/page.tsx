"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import AppNav from "@/components/AppNav";
import { authFetch } from "@/lib/api";

type Person = {
  id: number;
  name: string;
};

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

export default function SetupPage() {
  const [persons, setPersons] =
    useState<Person[]>([]);

  const [medicines, setMedicines] =
    useState<Medicine[]>([]);

  const [message, setMessage] =
    useState("");

  const [personName, setPersonName] =
    useState("");

  const [
    selectedPersonId,
    setSelectedPersonId,
  ] = useState("");

  const [medicineName, setMedicineName] =
    useState("");

  const [strength, setStrength] =
    useState("");

  const [dosageForm, setDosageForm] =
    useState("Tablet");

  const [note, setNote] =
    useState("");

  const [quantity, setQuantity] =
    useState("10");

  const [expiryDate, setExpiryDate] =
    useState("");

  const [
    selectedMedicineId,
    setSelectedMedicineId,
  ] = useState("");

  const [timeOfDay, setTimeOfDay] =
    useState("08:00");

  const [timezone, setTimezone] =
    useState("Asia/Kolkata");

  const [savingPerson, setSavingPerson] =
    useState(false);

  const [
    savingMedicine,
    setSavingMedicine,
  ] = useState(false);

  const [
    savingSchedule,
    setSavingSchedule,
  ] = useState(false);

  const loadData =
    useCallback(async () => {
      try {
        const [
          personsResponse,
          medicinesResponse,
        ] = await Promise.all([
          authFetch(
            "http://127.0.0.1:8000/api/v1/persons"
          ),

          authFetch(
            "http://127.0.0.1:8000/api/v1/medicines"
          ),
        ]);

        const personsData =
          await personsResponse.json();

        const medicinesData =
          await medicinesResponse.json();

        if (!personsResponse.ok) {
          setMessage(
            getErrorMessage(
              personsData.detail,
              "Could not load people."
            )
          );
          return;
        }

        if (!medicinesResponse.ok) {
          setMessage(
            getErrorMessage(
              medicinesData.detail,
              "Could not load medicines."
            )
          );
          return;
        }

        setPersons(
          Array.isArray(personsData)
            ? personsData
            : []
        );

        setMedicines(
          Array.isArray(medicinesData)
            ? medicinesData
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
            "Could not load setup data."
          );
        }
      }
    }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addPerson(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!personName.trim()) {
      setMessage(
        "Enter a person name."
      );
      return;
    }

    setSavingPerson(true);
    setMessage("");

    try {
      const response =
        await authFetch(
          "http://127.0.0.1:8000/api/v1/persons",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: personName.trim(),
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          getErrorMessage(
            result.detail,
            "Could not add person."
          )
        );
        return;
      }

      setPersonName("");

      setSelectedPersonId(
        String(result.id)
      );

      setMessage(
        `${result.name} added successfully.`
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
          "Could not add person."
        );
      }
    } finally {
      setSavingPerson(false);
    }
  }

  async function addMedicine(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedPersonId) {
      setMessage(
        "Select a person first."
      );
      return;
    }

    if (
      !medicineName.trim() ||
      !strength.trim() ||
      !dosageForm.trim()
    ) {
      setMessage(
        "Enter medicine name, strength and dosage form."
      );
      return;
    }

    const quantityNumber =
      Number(quantity);

    if (
      Number.isNaN(quantityNumber) ||
      quantityNumber < 0
    ) {
      setMessage(
        "Enter a valid remaining quantity."
      );
      return;
    }

    setSavingMedicine(true);
    setMessage("");

    try {
      const response =
        await authFetch(
          "http://127.0.0.1:8000/api/v1/medicines",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              person_id:
                Number(selectedPersonId),

              name:
                medicineName.trim(),

              strength:
                strength.trim(),

              dosage_form:
                dosageForm.trim(),

              note:
                note.trim() || null,

              quantity_remaining:
                quantityNumber,

              expiry_date:
                expiryDate || null,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          getErrorMessage(
            result.detail,
            "Could not add medicine."
          )
        );
        return;
      }

      setMedicineName("");
      setStrength("");
      setDosageForm("Tablet");
      setNote("");
      setQuantity("10");
      setExpiryDate("");

      setSelectedMedicineId(
        String(result.id)
      );

      setMessage(
        `${result.name} added successfully.`
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
          "Could not add medicine."
        );
      }
    } finally {
      setSavingMedicine(false);
    }
  }

  async function addSchedule(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedMedicineId) {
      setMessage(
        "Select a medicine first."
      );
      return;
    }

    if (!timeOfDay || !timezone.trim()) {
      setMessage(
        "Enter time and timezone."
      );
      return;
    }

    const normalizedTime =
      timeOfDay.length === 5
        ? `${timeOfDay}:00`
        : timeOfDay;

    setSavingSchedule(true);
    setMessage("");

    try {
      const response =
        await authFetch(
          `http://127.0.0.1:8000/api/v1/medicines/${selectedMedicineId}/schedules`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              time_of_day:
                normalizedTime,

              timezone:
                timezone.trim(),
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          getErrorMessage(
            result.detail,
            "Could not add schedule."
          )
        );
        return;
      }

      setMessage(
        `Schedule added for ${result.time_of_day}.`
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
          "Could not add schedule."
        );
      }
    } finally {
      setSavingSchedule(false);
    }
  }

  function getPersonName(
    personId: number
  ) {
    return (
      persons.find(
        (person) =>
          person.id === personId
      )?.name ??
      `Person #${personId}`
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />

      <main className="mx-auto max-w-6xl px-6 py-10">

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Family setup
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Set up MedShelf
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Add a family member, add their
            medicine, then create the time
            at which MedShelf should track
            the dose.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
              1
            </div>

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Add Person
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add yourself or a family
              member.
            </p>

            <form
              onSubmit={addPerson}
              className="mt-5"
            >
              <label className="text-sm font-medium text-slate-700">
                Name
              </label>

              <input
                value={personName}
                onChange={(event) =>
                  setPersonName(
                    event.target.value
                  )
                }
                placeholder="e.g. Mom"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />

              <button
                type="submit"
                disabled={savingPerson}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingPerson
                  ? "Adding..."
                  : "Add Person"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 font-bold text-sky-700">
              2
            </div>

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Add Medicine
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose who takes the medicine
              and enter its details.
            </p>

            <form
              onSubmit={addMedicine}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Person
                </label>

                <select
                  value={
                    selectedPersonId
                  }
                  onChange={(event) =>
                    setSelectedPersonId(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">
                    Select person
                  </option>

                  {persons.map(
                    (person) => (
                      <option
                        key={person.id}
                        value={person.id}
                      >
                        {person.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Medicine name
                </label>

                <input
                  value={medicineName}
                  onChange={(event) =>
                    setMedicineName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Paracetamol"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Strength
                  </label>

                  <input
                    value={strength}
                    onChange={(event) =>
                      setStrength(
                        event.target.value
                      )
                    }
                    placeholder="e.g. 500 mg"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Type
                  </label>

                  <input
                    value={dosageForm}
                    onChange={(event) =>
                      setDosageForm(
                        event.target.value
                      )
                    }
                    placeholder="Tablet"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Remaining quantity
                </label>

                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Expiry date
                </label>

                <input
                  type="date"
                  value={expiryDate}
                  onChange={(event) =>
                    setExpiryDate(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Note
                </label>

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(
                      event.target.value
                    )
                  }
                  placeholder="Optional note"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <button
                type="submit"
                disabled={
                  savingMedicine
                }
                className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                {savingMedicine
                  ? "Adding..."
                  : "Add Medicine"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 font-bold text-violet-700">
              3
            </div>

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Add Schedule
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set the daily time and
              timezone for a medicine.
            </p>

            <form
              onSubmit={addSchedule}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Medicine
                </label>

                <select
                  value={
                    selectedMedicineId
                  }
                  onChange={(event) =>
                    setSelectedMedicineId(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">
                    Select medicine
                  </option>

                  {medicines.map(
                    (medicine) => (
                      <option
                        key={medicine.id}
                        value={
                          medicine.id
                        }
                      >
                        {
                          medicine.name
                        }{" "}
                        —{" "}
                        {getPersonName(
                          medicine.person_id
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Time
                </label>

                <input
                  type="time"
                  value={timeOfDay}
                  onChange={(event) =>
                    setTimeOfDay(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Timezone
                </label>

                <input
                  value={timezone}
                  onChange={(event) =>
                    setTimezone(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Example: Asia/Kolkata
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  savingSchedule
                }
                className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {savingSchedule
                  ? "Adding..."
                  : "Add Schedule"}
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Current setup
          </h2>

          <div className="mt-5 grid gap-6 md:grid-cols-2">

            <div>
              <p className="text-sm font-semibold text-slate-700">
                People
              </p>

              <div className="mt-3 space-y-2">
                {persons.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No people added yet.
                  </p>
                ) : (
                  persons.map(
                    (person) => (
                      <div
                        key={person.id}
                        className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        {person.name}
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">
                Medicines
              </p>

              <div className="mt-3 space-y-2">
                {medicines.length ===
                0 ? (
                  <p className="text-sm text-slate-500">
                    No medicines added yet.
                  </p>
                ) : (
                  medicines.map(
                    (medicine) => (
                      <div
                        key={
                          medicine.id
                        }
                        className="rounded-xl bg-slate-50 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {
                            medicine.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getPersonName(
                            medicine.person_id
                          )}
                          {" • "}
                          {
                            medicine.strength
                          }
                        </p>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}