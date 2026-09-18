import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">

        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
              M
            </div>

            <span className="text-xl font-bold text-slate-900">
              MedShelf
            </span>
          </div>

          <Link
            href="/login"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Sign in
          </Link>
        </header>

        <section className="flex flex-1 items-center py-16">
          <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Family medicine tracking
              </p>

              <h1 className="mt-4 max-w-2xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Keep your family&apos;s
                medicines organised.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                MedShelf brings medicine
                schedules, dose reminders,
                stock alerts, history and
                caregiver access together
                in one simple place.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Open MedShelf
                </Link>

                <a
                  href="#features"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View features
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Today
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Family Overview
                  </h2>
                </div>

                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  MedShelf
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Scheduled
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    6
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-700">
                    Taken
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-800">
                    4
                  </p>
                </div>

                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="text-xs text-sky-700">
                    Remaining
                  </p>

                  <p className="mt-2 text-2xl font-bold text-sky-800">
                    2
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">
                      Mom
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      Medicine reminder
                    </p>

                    <p className="text-sm text-slate-500">
                      08:00 AM
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Taken
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">
                      Dad
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      Medicine reminder
                    </p>

                    <p className="text-sm text-slate-500">
                      08:00 PM
                    </p>
                  </div>

                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="grid gap-5 border-t border-slate-200 py-14 md:grid-cols-3"
        >
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              Dose reminders
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Track scheduled doses with
              Taken, Skip and Snooze
              actions.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              Stock & expiry
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              See low-stock and upcoming
              expiry alerts for family
              medicines.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              Caregiver access
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Share selected family
              summaries with another
              MedShelf user.
            </p>
          </div>
        </section>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          MedShelf supports medicine
          tracking and reminders. It does
          not provide medical advice.
        </footer>
      </div>
    </main>
  );
}