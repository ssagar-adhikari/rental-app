import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Colors, Typography } from "@/constants/theme";

type BillingUnit = "minute" | "hourly" | "daily" | "weekly" | "monthly" | "custom" | "person" | string;

type PriceTagProps = {
  amount: number | string;
  currency?: string;
  billingUnit?: BillingUnit | null;
  size?: "sm" | "md" | "lg";
  align?: "row" | "column";
  style?: StyleProp<ViewStyle>;
};

const billingUnitSuffix: Record<string, string> = {
  minute: "/ min",
  hourly: "/ hr",
  daily: "/ day",
  weekly: "/ week",
  monthly: "/ month",
  person: "/ person",
};

function formatAmount(amount: number | string, currency: string): string {
  const numeric = typeof amount === "string" ? Number(amount) : amount;

  if (!Number.isFinite(numeric)) {
    return `${currency} —`;
  }

  return `${currency} ${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function PriceTag({
  amount,
  currency = "NPR",
  billingUnit,
  size = "md",
  align = "row",
  style,
}: PriceTagProps) {
  const amountStyle = size === "lg" ? styles.amountLg : size === "sm" ? styles.amountSm : styles.amountMd;
  const suffix = billingUnit ? billingUnitSuffix[billingUnit] ?? `/ ${billingUnit}` : null;

  return (
    <View style={[align === "column" ? styles.column : styles.row, style]}>
      <Text style={[styles.amount, amountStyle]} numberOfLines={1}>
        {formatAmount(amount, currency)}
      </Text>
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 4,
  },
  column: {
    alignItems: "flex-start",
    gap: 2,
  },
  amount: {
    color: Colors.light.text,
  },
  amountSm: {
    ...Typography.bodyStrong,
  },
  amountMd: {
    ...Typography.cardTitle,
  },
  amountLg: {
    ...Typography.sectionTitle,
  },
  suffix: {
    color: Colors.light.muted,
    ...Typography.label,
  },
});
