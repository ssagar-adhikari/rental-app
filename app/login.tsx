import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/authApi";
import { getPostAuthRoute } from "@/utils/authRoutes";
import { isValidEmail } from "@/utils/formValidation";

const codeRefreshDelaySeconds = 60;

export default function LoginScreen() {
  const { activeRole, login, verifyTwoFactor } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [challengeExpiresAt, setChallengeExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const emailError = email && !isValidEmail(email) ? "Enter a valid email address." : null;
  const passwordError = password && password.length < 8 ? "Password must be at least 8 characters." : null;
  const codeError = code && !/^\d{6}$/.test(code) ? "Enter the 6-digit code." : null;
  const challengeSecondsLeft = useMemo(() => {
    if (!challengeExpiresAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((challengeExpiresAt - now) / 1000));
  }, [challengeExpiresAt, now]);
  const resendSecondsLeft = useMemo(() => {
    if (!resendAvailableAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
  }, [now, resendAvailableAt]);
  const canSubmit = challengeToken
    ? isValidEmail(email) && /^\d{6}$/.test(code) && challengeSecondsLeft > 0
    : isValidEmail(email) && password.length >= 8;

  useEffect(() => {
    if (!challengeToken) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [challengeToken]);

  function resetChallenge() {
    setChallengeToken(null);
    setChallengeExpiresAt(null);
    setResendAvailableAt(null);
    setCode("");
    setError(null);
  }

  async function submit() {
    if (!canSubmit) {
      setError(
        challengeToken && challengeSecondsLeft <= 0
          ? "This verification code has expired. Request a new code."
          : challengeToken
            ? "Enter the 6-digit verification code."
            : "Enter a valid email and password.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (challengeToken) {
        const user = await verifyTwoFactor(email, challengeToken, code);
        setSuccess("Verification successful. Taking you to your account...");
        router.replace(getPostAuthRoute(user, activeRole));
        return;
      }

      const response = await login(email, password);

      if (response.requires_two_factor) {
        setChallengeToken(response.challenge_token);
        setChallengeExpiresAt(Date.now() + response.expires_in * 1000);
        setResendAvailableAt(Date.now() + codeRefreshDelaySeconds * 1000);
        setCode("");
        setSuccess("Verification code sent. Check your email.");
        return;
      }

      setSuccess("Login successful. Taking you to your account...");
      router.replace(getPostAuthRoute(response.user, activeRole));
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function requestNewCode() {
    if (!isValidEmail(email) || password.length < 8 || resendSecondsLeft > 0) {
      return;
    }

    setResendingCode(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await login(email, password);

      if (response.requires_two_factor) {
        setChallengeToken(response.challenge_token);
        setChallengeExpiresAt(Date.now() + response.expires_in * 1000);
        setResendAvailableAt(Date.now() + codeRefreshDelaySeconds * 1000);
        setCode("");
        setSuccess("New verification code sent.");
        return;
      }

      setSuccess("Login successful. Taking you to your account...");
      router.replace(getPostAuthRoute(response.user, activeRole));
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "Unable to request a new code.");
    } finally {
      setResendingCode(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" activeOpacity={0.8} style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color="white" />
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons name={challengeToken ? "shield-checkmark-outline" : "log-in-outline"} size={22} color="white" />
              </View>
            </View>

            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>{challengeToken ? "Verify code" : "Log in"}</Text>
            <Text style={styles.subtitle}>
              {challengeToken ? "Enter the code sent to your email to finish signing in." : "Access rentals, bookings, and saved listings from your account."}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIcon}>
                <Ionicons name="person-circle-outline" size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.cardTitleText}>
                <Text style={styles.cardTitle}>{challengeToken ? "Security check" : "Account access"}</Text>
                <Text style={styles.cardSubtitle}>{challengeToken ? "Two-factor authentication is enabled." : "Use your registered email and password."}</Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={[styles.inputShell, challengeToken && styles.disabledInputShell]}>
                  <Ionicons name="mail-outline" size={19} color={Colors.light.muted} />
                  <TextInput
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!challengeToken}
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#98A1B3"
                    style={styles.input}
                    value={email}
                  />
                </View>
                {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
              </View>

              {!challengeToken ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="lock-closed-outline" size={19} color={Colors.light.muted} />
                    <TextInput
                      accessibilityLabel="Password"
                      autoComplete="password"
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor="#98A1B3"
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      value={password}
                    />
                    <TouchableOpacity
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      accessibilityRole="button"
                      activeOpacity={0.7}
                      hitSlop={8}
                      onPress={() => setShowPassword((current) => !current)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={19}
                        color={Colors.light.muted}
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
                </View>
              ) : (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Verification code</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="keypad-outline" size={19} color={Colors.light.muted} />
                    <TextInput
                      accessibilityLabel="Verification code"
                      keyboardType="number-pad"
                      maxLength={6}
                      onChangeText={setCode}
                      placeholder="6-digit code"
                      placeholderTextColor="#98A1B3"
                      style={styles.input}
                      value={code}
                    />
                  </View>
                  {codeError ? <Text style={styles.fieldError}>{codeError}</Text> : null}
                  <Text style={styles.helperText}>
                    {challengeSecondsLeft > 0
                      ? `Code expires in ${Math.floor(challengeSecondsLeft / 60)}:${String(challengeSecondsLeft % 60).padStart(2, "0")}.`
                      : "This code may have expired. Request a new code before trying again."}
                  </Text>
                  <TouchableOpacity
                    accessibilityLabel="Request new verification code"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: resendingCode || resendSecondsLeft > 0 }}
                    activeOpacity={0.75}
                    disabled={resendingCode || resendSecondsLeft > 0}
                    style={styles.resendButton}
                    onPress={requestNewCode}
                  >
                    <Text style={[styles.linkText, resendSecondsLeft > 0 && styles.mutedLinkText]}>
                      {resendingCode ? "Sending..." : resendSecondsLeft > 0 ? `Request new code in ${resendSecondsLeft}s` : "Request new code"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {success ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.light.success} />
                  <Text style={styles.success}>{success}</Text>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.light.danger} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                accessibilityLabel={challengeToken ? "Verify code" : "Log in"}
                accessibilityRole="button"
                accessibilityState={{ disabled: loading || !canSubmit, busy: loading }}
                activeOpacity={0.88}
                disabled={loading || !canSubmit}
                style={[styles.submitButton, (loading || !canSubmit) && styles.disabledButton]}
                onPress={submit}
              >
                <Ionicons name={challengeToken ? "checkmark-circle-outline" : "arrow-forward"} size={20} color="white" />
                <Text style={styles.submitText}>{loading ? "Please wait..." : challengeToken ? "Verify" : "Log in"}</Text>
              </TouchableOpacity>
            </View>

            {!challengeToken ? (
              <View style={styles.linkStack}>
                <TouchableOpacity
                  accessibilityLabel="Forgot password"
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  style={styles.linkButton}
                  onPress={() => router.push("/forgot-password" as Href)}
                >
                  <Text style={styles.linkText}>Forgot password?</Text>
                </TouchableOpacity>
                <View style={styles.linkDivider} />
                <TouchableOpacity
                  accessibilityLabel="Create account"
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  style={styles.linkButton}
                  onPress={() => router.push("/register" as Href)}
                >
                  <Text style={styles.linkText}>Create account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                accessibilityLabel="Use a different account"
                accessibilityRole="button"
                activeOpacity={0.75}
                style={styles.singleLink}
                onPress={resetChallenge}
              >
                <Text style={styles.linkText}>Use a different account</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110,
  },
  header: {
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    paddingBottom: 76,
    paddingHorizontal: Spacing.xl,
    paddingTop: 48,
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xxl,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.72)",
    ...Typography.label,
  },
  title: {
    color: "white",
    marginTop: Spacing.sm,
    ...Typography.screenTitle,
  },
  subtitle: {
    color: "rgba(255,255,255,0.82)",
    marginTop: Spacing.sm,
    ...Typography.body,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginHorizontal: Spacing.xl,
    marginTop: -50,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  cardTitleText: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.eyebrow,
  },
  form: {
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    color: Colors.light.text,
    ...Typography.label,
    fontWeight: "900",
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: "#FBFCFF",
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 54,
    paddingHorizontal: Spacing.lg,
  },
  disabledInputShell: {
    backgroundColor: Colors.light.surfaceMuted,
  },
  input: {
    color: Colors.light.text,
    flex: 1,
    paddingVertical: 0,
    ...Typography.body,
  },
  eyeButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 52,
    marginTop: Spacing.sm,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
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
  error: {
    color: Colors.light.danger,
    flex: 1,
    ...Typography.label,
  },
  successBox: {
    alignItems: "flex-start",
    backgroundColor: "#EAF8F0",
    borderColor: "#BFE8D1",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  success: {
    color: Colors.light.success,
    flex: 1,
    ...Typography.label,
  },
  fieldError: {
    color: Colors.light.danger,
    ...Typography.eyebrow,
  },
  helperText: {
    color: Colors.light.muted,
    ...Typography.eyebrow,
  },
  resendButton: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.xs,
  },
  linkStack: {
    alignItems: "center",
    borderTopColor: "#EEF1F7",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  linkButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  linkDivider: {
    backgroundColor: Colors.light.border,
    height: 18,
    width: 1,
  },
  singleLink: {
    alignItems: "center",
    borderTopColor: "#EEF1F7",
    borderTopWidth: 1,
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  linkText: {
    color: Colors.light.primary,
    ...Typography.label,
  },
  mutedLinkText: {
    color: Colors.light.muted,
  },
});
