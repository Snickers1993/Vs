"use client";

import type { Handout } from "@/lib/db";
import { addHandoutFromFile, deleteHandout } from "@/lib/db";

export default function HandoutsManager({ handouts, userId }: { handouts: Handout[]; userId?: string }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Handouts</h2>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="file"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await addHandoutFromFile(file, userId);
              event.currentTarget.value = "";
            }
          }}
        />
        <span className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50 cursor-pointer">
          Upload handout
        </span>
      </label>
      <ul className="divide-y">
        {handouts.map((handout) => (
          <li key={handout.id} className="py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium truncate max-w-[28rem]" title={handout.name}>{handout.name}</div>
              <div className="text-xs text-slate-600">{(handout.size / 1024).toFixed(1)} KB</div>
            </div>
            <div className="flex items-center gap-2">
              <a
                className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
                href={URL.createObjectURL(handout.blob)}
                download={handout.name}
              >
                Download
              </a>
              <button
                className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-red-50 text-red-600"
                onClick={() => deleteHandout(handout.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {handouts.length === 0 && (
          <li className="text-sm text-slate-600 py-6 text-center">No handouts uploaded yet.</li>
        )}
      </ul>
    </div>
  );
}
