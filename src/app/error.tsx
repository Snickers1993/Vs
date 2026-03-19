"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
      <p className="max-w-md text-sm text-slate-600">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
