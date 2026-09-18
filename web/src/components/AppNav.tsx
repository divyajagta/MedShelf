"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/today",
    label: "Today",
  },
  {
    href: "/setup",
    label: "Setup",
  },
  {
    href: "/medicines",
    label: "Medicines",
  },
  {
    href: "/history",
    label: "History",
  },
  {
    href: "/alerts",
    label: "Alerts",
  },
  {
    href: "/caregivers",
    label: "Caregivers",
  },
];

export default function AppNav() {
  const pathname = usePathname();

  function logout() {
    localStorage.removeItem(
      "access_token"
    );

    window.location.href = "/login";
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/today"
          className="text-xl font-bold text-emerald-700"
        >
          MedShelf
        </Link>

        <nav className="flex items-center gap-2">
          {links.map((link) => {
            const isActive =
              pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={logout}
            className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}