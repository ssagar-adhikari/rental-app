import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/authApi";

export default function LoginScreen() {
  const { login, verifyTwoFactor } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      if (challengeToken) {
        await verifyTwoFactor(email, challengeToken, code);
        router.replace("/(tabs)/profile");
        return;
      }

      const response = await login(email, password);

      if (response.requires_two_factor) {
        setChallengeToken(response.challenge_token);
        return;
      }

      router.replace("/(tabs)/profile");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>{challengeToken ? "Verify code" : "Log in"}</Text>
            <Text style={styles.subtitle}>
              {challengeToken ? "Enter the 6-digit code sent to your email." : "Access rentals, bookings, and listings."}
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!challengeToken}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={Colors.light.muted}
              style={styles.input}
              value={email}
            />

            {!challengeToken ? (
              <TextInput
                autoComplete="password"
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={Colors.light.muted}
                secureTextEntry
                style={styles.input}
                value={password}
              />
            ) : (
              <TextInput
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={setCode}
                placeholder="6-digit code"
                placeholderTextColor={Colors.light.muted}
                style={styles.input}
                value={code}
              />
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable disabled={loading} style={[styles.submitButton, loading && styles.disabledButton]} onPress={submit}>
              <Text style={styles.submitText}>{loading ? "Please wait..." : challengeToken ? "Verify" : "Log in"}</Text>
            </Pressable>
          </View>

          {!challengeToken ? (
            <View style={styles.linkStack}>
              <Pressable style={styles.linkButton} onPress={() => router.push("/forgot-password" as Href)}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={() => router.push("/register" as Href)}>
                <Text style={styles.linkText}>Create a new account</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={[styles.linkButton, styles.singleLink]} onPress={() => setChallengeToken(null)}>
              <Text style={styles.linkText}>Use a different account</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  error: {
    color: "#c0392b",
    ...Typography.body,
  },
  linkButton: {
    alignItems: "center",
  },
  linkStack: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  singleLink: {
    marginTop: Spacing.xl,
  },
  linkText: {
    color: Colors.light.primary,
    ...Typography.label,
  },
});
