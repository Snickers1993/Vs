"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    console.log("Sign in response:", res);
    console.log("Response type:", typeof res);
    console.log("Error value:", res?.error);
    console.log("Error type:", typeof res?.error);
    console.log("Error === null:", res?.error === null);
    console.log("Error === undefined:", res?.error === undefined);
    console.log("Truthy check:", !!res?.error);
    
    // Check for success - NextAuth can return different response structures
    if (res?.error === null || res?.error === undefined || res?.ok === true) {
      // Success
      console.log("SUCCESS: Authentication successful");
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } else {
      // Failure
      console.log("FAILURE: Authentication failed");
      setError("Invalid credentials");
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-4">Sign in to VetBlurbs</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Password</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">Log-in successful! Redirecting...</div>}
          <button className="w-full inline-flex h-10 items-center justify-center rounded-md bg-slate-900 text-white hover:bg-slate-800" type="submit">
            Sign in
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-700">
          Don&apos;t have an account? <Link className="underline" href="/auth/signup">Register</Link>
        </div>
      </div>
    </div>
  );
}


