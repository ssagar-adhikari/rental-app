import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { ApiError, authApi } from "@/services/authApi";
import { getPasswordRules, getPasswordStrength, isStrongPassword, isValidEmail } from "@/utils/formValidation";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const passwordRules = useMemo(() => getPasswordRules(password), [password]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const emailError = email && !isValidEmail(email) ? "Enter a valid email address." : null;
  const passwordError = password && !isStrongPassword(password) ? "Password does not meet all rules yet." : null;
  const confirmationError =
    passwordConfirmation && passwordConfirmation !== password ? "Passwords do not match." : null;
  const canSubmit = Boolean(params.token) && isValidEmail(email) && isStrongPassword(password) && passwordConfirmation === password;

  async function submit() {
    if (!params.token) {
      setError("Missing reset token.");
      return;
    }

    if (!canSubmit) {
      setError("Complete the password rules before resetting your password.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await authApi.resetPassword({
        email,
        token: params.token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setMessage("Password reset successfully.");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityLabel="Back to log in"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => router.replace("/login" as Href)}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>Password reset</Text>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Use at least 8 characters with uppercase, lowercase, and a number.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={Colors.light.muted}
            style={styles.input}
            value={email}
          />
          {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          <TextInput
            accessibilityLabel="New password"
            autoComplete="new-password"
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor={Colors.light.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          <View style={styles.strengthWrap}>
            <View style={styles.strengthTrack}>
              <View
                style={[
                  styles.strengthFill,
                  { backgroundColor: passwordStrength.color, width: `${(passwordStrength.value / 3) * 100}%` },
                ]}
              />
            </View>
            <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
          </View>
          {passwordRules.map((rule) => (
            <View key={rule.label} style={styles.ruleRow}>
              <Ionicons
                name={rule.valid ? "checkmark-circle" : "ellipse-outline"}
                size={15}
                color={rule.valid ? Colors.light.success : Colors.light.muted}
              />
              <Text style={[styles.ruleText, rule.valid && styles.ruleTextValid]}>{rule.label}</Text>
            </View>
          ))}
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          <TextInput
            accessibilityLabel="Confirm new password"
            autoComplete="new-password"
            onChangeText={setPasswordConfirmation}
            placeholder="Confirm new password"
            placeholderTextColor={Colors.light.muted}
            secureTextEntry
            style={styles.input}
            value={passwordConfirmation}
          />
          {confirmationError ? <Text style={styles.fieldError}>{confirmationError}</Text> : null}

          {message ? (
            <View style={styles.messageBox}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.light.success} />
              <Text style={styles.message}>{message}</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.light.danger} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityLabel="Reset password"
            accessibilityRole="button"
            accessibilityState={{ disabled: loading || !canSubmit, busy: loading }}
            disabled={loading || !canSubmit}
            style={[styles.submitButton, (loading || !canSubmit) && styles.disabledButton]}
            onPress={submit}
          >
            <Text style={styles.submitText}>{loading ? "Please wait..." : "Reset password"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  backButton: {
    alignItems: "center",
    borderColor: Colors.light.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  header: {
    marginTop: 48,
  },
  eyebrow: {
    color: Colors.light.primary,
    ...Typography.eyebrow,
  },
  title: {
    color: Colors.light.text,
    marginTop: Spacing.sm,
    ...Typography.heroTitle,
  },
  subtitle: {
    color: Colors.light.muted,
    marginTop: Spacing.sm,
    ...Typography.body,
  },
  form: {
    gap: Spacing.md,
    marginTop: 40,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.light.text,
    minHeight: 54,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    justifyContent: "center",
    minHeight: 54,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
  message: {
    color: Colors.light.success,
    flex: 1,
    ...Typography.body,
  },
  error: {
    color: Colors.light.danger,
    flex: 1,
    ...Typography.body,
  },
  fieldError: {
    color: Colors.light.danger,
    ...Typography.eyebrow,
  },
  messageBox: {
    alignItems: "flex-start",
    backgroundColor: "#EAF8F0",
    borderColor: "#BFE8D1",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  errorBox: {
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  strengthWrap: {
    gap: Spacing.xs,
  },
  strengthTrack: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.pill,
    height: 7,
    overflow: "hidden",
  },
  strengthFill: {
    borderRadius: Radius.pill,
    height: "100%",
  },
  strengthText: {
    ...Typography.eyebrow,
    fontWeight: "900",
  },
  ruleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  ruleText: {
    color: Colors.light.muted,
    ...Typography.eyebrow,
  },
  ruleTextValid: {
    color: Colors.light.success,
  },
});
