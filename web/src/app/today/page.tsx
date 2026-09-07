"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

export default function TodayPage() {
  const [data, setData] = useState<unknown>(null);
  const [message, setMessage] = useState("Loading...");

  const router = useRouter();

  useEffect(() => {
    async function loadToday() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/occurrences/today?tz=Asia/Kolkata",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.detail ?? "Failed to load doses");
        return;
      }

      setData(result);
      setMessage("");
    }

    loadToday();
  }, [router]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Today's Doses</h1>

      {message && <p className="mt-4">{message}</p>}

      {data !== null && (
        <pre className="mt-6 border p-4">{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}
