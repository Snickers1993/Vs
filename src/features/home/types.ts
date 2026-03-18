import type { CollectionKey } from "@/lib/db";

export type Section = {
  id: string;
  title: string;
  content: string;
  isPublic?: boolean;
  isStarred?: boolean;
  updatedAt?: number | string;
  createdAt?: number | string;
};

export type TabKey = CollectionKey | "fastCalculations" | "sharedBlurbs" | "monitoring" | "starred";

export const DEFAULT_TABS: { key: TabKey; label: string }[] = [
  { key: "exams", label: "Exams" },
  { key: "diseaseTemplates", label: "Diseases" },
  { key: "medications", label: "Medications" },
  { key: "monitoring", label: "Monitoring" },
  { key: "recommendations", label: "Recommendations" },
  { key: "blurbs", label: "Blurbs" },
  { key: "dischargeTemplates", label: "Discharge" },
  { key: "handouts", label: "Handouts" },
  { key: "fastCalculations", label: "Fast Calculations" },
  { key: "sharedBlurbs", label: "Shared Blurbs" },
  { key: "starred", label: "Starred" },
];

export type Unit = "mg/kg" | "mcg/kg" | "mL/kg";

export type CalcRow = {
  name: string;
  conc: number;
  concUnit: string;
  dosePerKg: number;
  unit: Unit;
};
