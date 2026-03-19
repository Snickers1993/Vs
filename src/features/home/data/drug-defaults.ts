import type { CalcRow } from "@/features/home/types";

export const DEFAULT_EMERGENCY_DRUGS: CalcRow[] = [
  { name: "Epinephrine (IV)", conc: 1, concUnit: "mg/mL", dosePerKg: 0.01, unit: "mg/kg" },
  { name: "Atropine (IV)", conc: 0.4, concUnit: "mg/mL", dosePerKg: 0.02, unit: "mg/kg" },
  { name: "Lidocaine 2% (dogs)", conc: 20, concUnit: "mg/mL", dosePerKg: 2, unit: "mg/kg" },
];

export const DEFAULT_COMMON_MEDS: CalcRow[] = [
  { name: "Maropitant (Cerenia)", conc: 10, concUnit: "mg/mL", dosePerKg: 1, unit: "mg/kg" },
  { name: "Ondansetron", conc: 2, concUnit: "mg/mL", dosePerKg: 0.5, unit: "mg/kg" },
  { name: "Metoclopramide", conc: 5, concUnit: "mg/mL", dosePerKg: 0.5, unit: "mg/kg" },
];

export const DEFAULT_SEDATION: CalcRow[] = [
  { name: "Dexmedetomidine", conc: 0.5, concUnit: "mg/mL", dosePerKg: 5, unit: "mcg/kg" },
  { name: "Butorphanol", conc: 10, concUnit: "mg/mL", dosePerKg: 0.2, unit: "mg/kg" },
  { name: "Propofol", conc: 10, concUnit: "mg/mL", dosePerKg: 4, unit: "mg/kg" },
];

export const NEW_MEDICATION_DEFAULT: CalcRow = { name: "New medication", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" };
export const NEW_EMERGENCY_DEFAULT: CalcRow = { name: "New emergency drug", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" };
export const NEW_SEDATION_DEFAULT: CalcRow = { name: "New sedative", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" };
