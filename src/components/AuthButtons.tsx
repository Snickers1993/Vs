"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { data } = useSession();
  const email = data?.user?.email;
  return (
    <div className="flex items-center gap-2">
      {email ? (
        <>
          <span className="text-sm text-slate-700 hidden sm:inline">{email}</span>
          <button
            className="inline-flex h-9 items-center justify-center rounded-md glass-btn px-3 text-sm"
            onClick={() => signOut()}
            aria-label="Sign out"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          className="inline-flex h-9 items-center justify-center rounded-md glass-btn px-3 text-sm"
          onClick={() => signIn("credentials", { callbackUrl: "/" })}
          aria-label="Sign in"
        >
          Sign in
        </button>
      )}
    </div>
  );
}


