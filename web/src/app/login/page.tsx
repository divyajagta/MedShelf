"use client";

import {
  useState,
  type SubmitEvent,
} from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(
  event: SubmitEvent<HTMLFormElement>
) {
    event.preventDefault();
    
    setMessage("Logging in...");

    const response = await fetch(
      "http://127.0.0.1:8000/api/v1/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email,
          password: password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.detail ?? "Login failed"
      );
      return;
    }

    localStorage.setItem(
      "access_token",
      data.access_token
    );

    setMessage("Login successful");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">
          Login to MedShelf
        </h1>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-4"
        >
          <div>
            <label className="block">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="mt-1 w-full border p-2"
              required
            />
          </div>

          <div>
            <label className="block">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="mt-1 w-full border p-2"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full border p-2 font-bold"
          >
            Login
          </button>
        </form>

        <p className="mt-4">
          {message}
        </p>
      </div>
    </main>
  );
}