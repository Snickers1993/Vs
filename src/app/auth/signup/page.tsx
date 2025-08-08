"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Demo-only: no server persistence. In a real app you would POST to an API to create a user.
    if (!email || !password) {
      setError("Email and password required");
      return;
    }
    // Redirect to sign-in with the email filled via URL param
    router.push(`/auth/signin?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-4">Register</h1>
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
          <button className="w-full inline-flex h-10 items-center justify-center rounded-md bg-slate-900 text-white hover:bg-slate-800" type="submit">
            Create account
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-700">
          Already have an account? <Link className="underline" href="/auth/signin">Sign in</Link>
        </div>
      </div>
    </div>
  );
}


