"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CalcRow, Unit } from "@/features/home/types";

type TableEditorProps = {
  title: string;
  rows: CalcRow[];
  setRows: (rows: CalcRow[]) => void;
  defaultRow: CalcRow;
  calcDose: (row: CalcRow) => { doseAmount: number; doseUnit: string };
  calcVolumeMl: (row: CalcRow) => number | null;
  format: (n?: number | null, digits?: number) => string;
};

function TableEditor({ title, rows, setRows, defaultRow, calcDose, calcVolumeMl, format }: TableEditorProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="text-left p-2 border-b border-slate-200">Drug</th>
              <th className="text-left p-2 border-b border-slate-200">Concentration</th>
              <th className="text-left p-2 border-b border-slate-200">Dosage</th>
              <th className="text-right p-2 border-b border-slate-200">Dose</th>
              <th className="text-right p-2 border-b border-slate-200">Volume</th>
              <th className="text-right p-2 border-b border-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const { doseAmount, doseUnit } = calcDose(row);
              const volume = calcVolumeMl(row);
              return (
                <tr key={idx} className="odd:bg-white even:bg-slate-50 align-top">
                  <td className="p-2 border-b border-slate-200">
                    <input
                      className="w-full rounded border px-2 py-1"
                      value={row.name}
                      onChange={(event) => {
                        const copy = [...rows];
                        copy[idx] = { ...row, name: event.target.value };
                        setRows(copy);
                      }}
                    />
                  </td>
                  <td className="p-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 rounded border px-2 py-1"
                        value={row.conc}
                        onChange={(event) => {
                          const copy = [...rows];
                          copy[idx] = { ...row, conc: parseFloat(event.target.value) || 0 };
                          setRows(copy);
                        }}
                      />
                      <select
                        className="rounded border px-2 py-1"
                        value={row.concUnit}
                        onChange={(event) => {
                          const copy = [...rows];
                          copy[idx] = { ...row, concUnit: event.target.value };
                          setRows(copy);
                        }}
                      >
                        <option>mg/mL</option>
                        <option>mcg/mL</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 rounded border px-2 py-1"
                        value={row.dosePerKg}
                        onChange={(event) => {
                          const copy = [...rows];
                          copy[idx] = { ...row, dosePerKg: parseFloat(event.target.value) || 0 };
                          setRows(copy);
                        }}
                      />
                      <select
                        className="rounded border px-2 py-1"
                        value={row.unit}
                        onChange={(event) => {
                          const copy = [...rows];
                          copy[idx] = { ...row, unit: event.target.value as Unit };
                          setRows(copy);
                        }}
                      >
                        <option>mg/kg</option>
                        <option>mcg/kg</option>
                        <option>mL/kg</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-2 border-b border-slate-200 text-right whitespace-nowrap">{format(doseAmount)} {doseUnit}</td>
                  <td className="p-2 border-b border-slate-200 text-right whitespace-nowrap">{format(volume)} mL</td>
                  <td className="p-2 border-b border-slate-200 text-right">
                    <button
                      className="inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs hover:bg-red-50 text-red-600"
                      onClick={() => setRows(rows.filter((_, rowIndex) => rowIndex !== idx))}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
          onClick={() => setRows([...rows, { ...defaultRow }])}
        >
          <Plus size={16} /> Add item
        </button>
      </div>
    </div>
  );
}

export default function FastCalculations() {
  const [weightKg, setWeightKg] = useState<number | string>("");
  const [emergencyDrugs, setEmergencyDrugs] = useState<CalcRow[]>([
    { name: "Epinephrine (IV)", conc: 1, concUnit: "mg/mL", dosePerKg: 0.01, unit: "mg/kg" },
    { name: "Atropine (IV)", conc: 0.4, concUnit: "mg/mL", dosePerKg: 0.02, unit: "mg/kg" },
    { name: "Lidocaine 2% (dogs)", conc: 20, concUnit: "mg/mL", dosePerKg: 2, unit: "mg/kg" },
  ]);
  const [commonMeds, setCommonMeds] = useState<CalcRow[]>([
    { name: "Maropitant (Cerenia)", conc: 10, concUnit: "mg/mL", dosePerKg: 1, unit: "mg/kg" },
    { name: "Ondansetron", conc: 2, concUnit: "mg/mL", dosePerKg: 0.5, unit: "mg/kg" },
    { name: "Metoclopramide", conc: 5, concUnit: "mg/mL", dosePerKg: 0.5, unit: "mg/kg" },
  ]);
  const [sedation, setSedation] = useState<CalcRow[]>([
    { name: "Dexmedetomidine", conc: 0.5, concUnit: "mg/mL", dosePerKg: 5, unit: "mcg/kg" },
    { name: "Butorphanol", conc: 10, concUnit: "mg/mL", dosePerKg: 0.2, unit: "mg/kg" },
    { name: "Propofol", conc: 10, concUnit: "mg/mL", dosePerKg: 4, unit: "mg/kg" },
  ]);

  const weight = typeof weightKg === "number" ? weightKg : parseFloat(`${weightKg}`) || 0;

  function calcDose(row: CalcRow): { doseAmount: number; doseUnit: string } {
    if (row.unit === "mg/kg") return { doseAmount: weight * row.dosePerKg, doseUnit: "mg" };
    if (row.unit === "mcg/kg") return { doseAmount: weight * row.dosePerKg, doseUnit: "mcg" };
    if (row.unit === "mL/kg") return { doseAmount: weight * row.dosePerKg, doseUnit: "mL" };
    return { doseAmount: 0, doseUnit: "mg" };
  }

  function calcVolumeMl(row: CalcRow): number | null {
    const { doseAmount, doseUnit } = calcDose(row);
    if (row.conc <= 0) return null;
    if (doseUnit === "mg" && /mg\/mL/i.test(row.concUnit)) return doseAmount / row.conc;
    if (doseUnit === "mcg" && /mcg\/mL/i.test(row.concUnit)) return doseAmount / row.conc;
    return null;
  }

  const format = (n?: number | null, digits = 2) => (n == null || !isFinite(n) ? "-" : n.toFixed(digits));

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Patient weight (kg)</label>
          <input
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            type="number"
            step="0.01"
            className="mt-1 w-36 rounded-md border px-3 py-2"
            placeholder="e.g. 6.4"
          />
        </div>
        <div className="text-sm text-slate-600">Auto-calculated doses are estimates. Verify clinically.</div>
      </div>

      <div className="space-y-6">
        <TableEditor
          title="Common medications"
          rows={commonMeds}
          setRows={setCommonMeds}
          defaultRow={{ name: "New medication", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" }}
          calcDose={calcDose}
          calcVolumeMl={calcVolumeMl}
          format={format}
        />
        <TableEditor
          title="Emergency drugs"
          rows={emergencyDrugs}
          setRows={setEmergencyDrugs}
          defaultRow={{ name: "New emergency drug", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" }}
          calcDose={calcDose}
          calcVolumeMl={calcVolumeMl}
          format={format}
        />
      </div>

      <TableEditor
        title="Anesthetics / Sedatives"
        rows={sedation}
        setRows={setSedation}
        defaultRow={{ name: "New sedative", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" }}
        calcDose={calcDose}
        calcVolumeMl={calcVolumeMl}
        format={format}
      />
    </div>
  );
}
