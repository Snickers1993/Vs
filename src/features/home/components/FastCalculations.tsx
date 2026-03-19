"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CalcRow, Unit } from "@/features/home/types";
import {
  DEFAULT_EMERGENCY_DRUGS,
  DEFAULT_COMMON_MEDS,
  DEFAULT_SEDATION,
  NEW_MEDICATION_DEFAULT,
  NEW_EMERGENCY_DEFAULT,
  NEW_SEDATION_DEFAULT,
} from "@/features/home/data/drug-defaults";

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
      <div className="glass overflow-x-auto rounded-md">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-white/20 text-slate-700">
            <tr>
              <th className="text-left p-2 border-b border-white/20">Drug</th>
              <th className="text-left p-2 border-b border-white/20">Concentration</th>
              <th className="text-left p-2 border-b border-white/20">Dosage</th>
              <th className="text-right p-2 border-b border-white/20">Dose</th>
              <th className="text-right p-2 border-b border-white/20">Volume</th>
              <th className="text-right p-2 border-b border-white/20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const { doseAmount, doseUnit } = calcDose(row);
              const volume = calcVolumeMl(row);
              return (
                <tr key={idx} className="odd:bg-white/5 even:bg-white/15 align-top">
                  <td className="p-2 border-b border-white/20">
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
                  <td className="p-2 border-b border-white/20">
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
                  <td className="p-2 border-b border-white/20">
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
                  <td className="p-2 border-b border-white/20 text-right whitespace-nowrap">{format(doseAmount)} {doseUnit}</td>
                  <td className="p-2 border-b border-white/20 text-right whitespace-nowrap">{format(volume)} mL</td>
                  <td className="p-2 border-b border-white/20 text-right">
                    <button
                      className="glass-btn inline-flex h-8 items-center justify-center rounded-md px-2 text-xs text-red-600 hover:!bg-red-500/20"
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
          className="glass-btn inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm"
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
  const [emergencyDrugs, setEmergencyDrugs] = useState<CalcRow[]>(() => [...DEFAULT_EMERGENCY_DRUGS]);
  const [commonMeds, setCommonMeds] = useState<CalcRow[]>(() => [...DEFAULT_COMMON_MEDS]);
  const [sedation, setSedation] = useState<CalcRow[]>(() => [...DEFAULT_SEDATION]);

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
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Patient weight (kg)</label>
          <input
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            type="number"
            step="0.01"
            className="mt-1 w-36 rounded-md glass-input px-3 py-2"
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
          defaultRow={NEW_MEDICATION_DEFAULT}
          calcDose={calcDose}
          calcVolumeMl={calcVolumeMl}
          format={format}
        />
        <TableEditor
          title="Emergency drugs"
          rows={emergencyDrugs}
          setRows={setEmergencyDrugs}
          defaultRow={NEW_EMERGENCY_DEFAULT}
          calcDose={calcDose}
          calcVolumeMl={calcVolumeMl}
          format={format}
        />
      </div>

      <TableEditor
        title="Anesthetics / Sedatives"
        rows={sedation}
        setRows={setSedation}
        defaultRow={NEW_SEDATION_DEFAULT}
        calcDose={calcDose}
        calcVolumeMl={calcVolumeMl}
        format={format}
      />
    </div>
  );
}
