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
            className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <button
            className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
            onClick={() => signIn("credentials", { callbackUrl: "/" })}
          >
            Sign in
          </button>
        </>
      )}
    </div>
  );
}


