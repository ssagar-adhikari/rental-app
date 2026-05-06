import type { BillingUnit } from "@/types/rental";

export const billingUnits: { label: string; value: BillingUnit }[] = [
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Person", value: "person" },
];
