import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { ApiError, authApi } from "@/services/authApi";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await authApi.forgotPassword(email);
      setMessage("Check your email for a password reset link.");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>Password reset</Text>
          <Text style={styles.title}>Recover access</Text>
          <Text style={styles.subtitle}>We will send a secure reset link if the email exists.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={Colors.light.muted}
            style={styles.input}
            value={email}
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable disabled={loading} style={[styles.submitButton, loading && styles.disabledButton]} onPress={submit}>
            <Text style={styles.submitText}>{loading ? "Please wait..." : "Send reset link"}</Text>
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
    color: "#14804a",
    ...Typography.body,
  },
  error: {
    color: "#c0392b",
    ...Typography.body,
  },
});
