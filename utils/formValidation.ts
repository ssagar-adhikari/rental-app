export type PasswordRule = {
  label: string;
  valid: boolean;
};

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getPasswordRules(value: string): PasswordRule[] {
  return [
    { label: "At least 8 characters", valid: value.length >= 8 },
    { label: "Uppercase and lowercase letters", valid: /[A-Z]/.test(value) && /[a-z]/.test(value) },
    { label: "At least one number", valid: /\d/.test(value) },
  ];
}

export function getPasswordStrength(value: string) {
  const passedRules = getPasswordRules(value).filter((rule) => rule.valid).length;

  if (!value) {
    return { label: "Not started", value: 0, color: "#CBD5E1" };
  }

  if (passedRules <= 1) {
    return { label: "Weak", value: 1, color: "#E74C3C" };
  }

  if (passedRules === 2) {
    return { label: "Good", value: 2, color: "#F59E0B" };
  }

  return { label: "Strong", value: 3, color: "#1B9A5A" };
}

export function isStrongPassword(value: string) {
  return getPasswordRules(value).every((rule) => rule.valid);
}
