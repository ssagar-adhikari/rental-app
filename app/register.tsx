import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useUserLocation } from "@/context/LocationContext";
import { ApiError } from "@/services/authApi";
import type { UserRole } from "@/types/auth";
import { getPostAuthRoute } from "@/utils/authRoutes";
import { getPasswordRules, getPasswordStrength, isStrongPassword, isValidEmail } from "@/utils/formValidation";

type RegisterRole = Exclude<UserRole, "admin">;

const roles: { label: string; value: RegisterRole; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Customer", value: "customer", icon: "bag-handle-outline" },
  { label: "Vendor", value: "vendor", icon: "storefront-outline" },
];

export default function RegisterScreen() {
  const { activeRole, register, resendEmailVerification } = useAuth();
  const { error: locationError, loading: locating, location, requestCurrentLocation } = useUserLocation();
  const [selectedRoles, setSelectedRoles] = useState<RegisterRole[]>(["customer"]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [postRegisterRoute, setPostRegisterRoute] = useState<Href | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const passwordRules = useMemo(() => getPasswordRules(password), [password]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const validRegistrationLocation = location?.source === "manual" || location?.source === "gps";
  const registrationLocation = validRegistrationLocation ? location : null;
  const nameError = name && name.trim().length < 2 ? "Enter your full name." : null;
  const emailError = email && !isValidEmail(email) ? "Enter a valid email address." : null;
  const passwordError = password && !isStrongPassword(password) ? "Password does not meet all rules yet." : null;
  const confirmationError =
    passwordConfirmation && passwordConfirmation !== password ? "Passwords do not match." : null;
  const canSubmit =
    selectedRoles.length > 0 &&
    name.trim().length >= 2 &&
    isValidEmail(email) &&
    isStrongPassword(password) &&
    passwordConfirmation === password &&
    validRegistrationLocation &&
    !postRegisterRoute;

  function toggleRole(role: RegisterRole) {
    setSelectedRoles((current) => {
      if (current.includes(role)) {
        return current.length === 1 ? current : current.filter((item) => item !== role);
      }

      return [...current, role];
    });
  }

  async function submit() {
    if (!canSubmit) {
      setError("Complete the required fields before creating your account.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!location || !validRegistrationLocation) {
        setError("Use your current location or choose your area on the map before creating an account.");
        return;
      }

      const user = await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        roles: selectedRoles,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setSuccess("Account created. Please verify your email when the verification message arrives.");
      setPostRegisterRoute(getPostAuthRoute(user, activeRole));
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendingVerification(true);
    setError(null);

    try {
      await resendEmailVerification();
      setSuccess("Verification email sent again.");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "Unable to resend verification email.");
    } finally {
      setResendingVerification(false);
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
                <Ionicons name="person-add-outline" size={22} color="white" />
              </View>
            </View>

            <Text style={styles.eyebrow}>Join Rental App</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Set up your marketplace profile for bookings, listings, and saved rentals.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIcon}>
                <Ionicons name="sparkles-outline" size={23} color={Colors.light.primary} />
              </View>
              <View style={styles.cardTitleText}>
                <Text style={styles.cardTitle}>Account details</Text>
                <Text style={styles.cardSubtitle}>Choose one or more roles and add your sign-in details.</Text>
              </View>
            </View>

            <View style={styles.roleSection}>
              <Text style={styles.fieldLabel}>Account type</Text>
              <View style={styles.roleRow}>
                {roles.map((item) => {
                  const selected = selectedRoles.includes(item.value);

                  return (
                    <TouchableOpacity
                      accessibilityLabel={item.label}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      activeOpacity={0.85}
                      key={item.value}
                      style={[styles.roleButton, selected && styles.selectedRole]}
                      onPress={() => toggleRole(item.value)}
                    >
                      <View style={[styles.roleIcon, selected && styles.selectedRoleIcon]}>
                        <Ionicons name={item.icon} size={20} color={selected ? "white" : Colors.light.primary} />
                      </View>
                      <Text style={[styles.roleText, selected && styles.selectedRoleText]}>{item.label}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={18} color={Colors.light.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location</Text>
                <TouchableOpacity
                  accessibilityLabel={registrationLocation ? `Change location, currently ${registrationLocation.label}` : "Set your location"}
                  accessibilityRole="button"
                  activeOpacity={0.86}
                  style={[styles.locationSelector, validRegistrationLocation && styles.selectedLocationSelector]}
                  onPress={() => router.push("/location-picker" as Href)}
                >
                  <View style={styles.locationIcon}>
                    <Ionicons name="location-outline" size={20} color={Colors.light.primary} />
                  </View>
                  <View style={styles.locationTextWrap}>
                    <Text style={styles.locationTitle}>
                      {registrationLocation ? registrationLocation.label : "Set your location"}
                    </Text>
                    <Text style={styles.locationSubtitle}>
                      {registrationLocation
                        ? `${registrationLocation.source === "gps" ? "Current GPS" : "Map location"} - ${registrationLocation.latitude.toFixed(5)}, ${registrationLocation.longitude.toFixed(5)}`
                        : "Use GPS or choose your area on the map"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityLabel="Use current GPS location"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: locating, busy: locating }}
                  activeOpacity={0.85}
                  disabled={locating}
                  style={styles.gpsButton}
                  onPress={requestCurrentLocation}
                >
                  {locating ? (
                    <Ionicons name="sync-outline" size={17} color={Colors.light.primary} />
                  ) : (
                    <Ionicons name="navigate-outline" size={17} color={Colors.light.primary} />
                  )}
                  <Text style={styles.gpsButtonText}>{locating ? "Finding current location..." : "Use current GPS location"}</Text>
                </TouchableOpacity>
                {location?.source === "default" ? (
                  <Text style={styles.fieldError}>Kathmandu is only a fallback. Confirm your actual location before registration.</Text>
                ) : null}
                {locationError ? <Text style={styles.fieldError}>{locationError}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="person-outline" size={19} color={Colors.light.muted} />
                  <TextInput
                    accessibilityLabel="Full name"
                    autoComplete="name"
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="#98A1B3"
                    style={styles.input}
                    value={name}
                  />
                </View>
                {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="mail-outline" size={19} color={Colors.light.muted} />
                  <TextInput
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoComplete="email"
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

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="lock-closed-outline" size={19} color={Colors.light.muted} />
                  <TextInput
                    accessibilityLabel="Password"
                    autoComplete="new-password"
                    onChangeText={setPassword}
                    placeholder="Create password"
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
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="shield-checkmark-outline" size={19} color={Colors.light.muted} />
                  <TextInput
                    accessibilityLabel="Confirm password"
                    autoComplete="new-password"
                    onChangeText={setPasswordConfirmation}
                    placeholder="Repeat password"
                    placeholderTextColor="#98A1B3"
                    secureTextEntry={!showPasswordConfirmation}
                    style={styles.input}
                    value={passwordConfirmation}
                  />
                  <TouchableOpacity
                    accessibilityLabel={showPasswordConfirmation ? "Hide password" : "Show password"}
                    accessibilityRole="button"
                    activeOpacity={0.7}
                    hitSlop={8}
                    onPress={() => setShowPasswordConfirmation((current) => !current)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPasswordConfirmation ? "eye-off-outline" : "eye-outline"}
                      size={19}
                      color={Colors.light.muted}
                    />
                  </TouchableOpacity>
                </View>
                {confirmationError ? <Text style={styles.fieldError}>{confirmationError}</Text> : null}
              </View>

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

              {postRegisterRoute ? (
                <>
                  <TouchableOpacity
                    accessibilityLabel="Continue"
                    accessibilityRole="button"
                    activeOpacity={0.88}
                    style={styles.submitButton}
                    onPress={() => router.replace(postRegisterRoute)}
                  >
                    <Ionicons name="arrow-forward" size={20} color="white" />
                    <Text style={styles.submitText}>Continue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel="Resend verification email"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: resendingVerification, busy: resendingVerification }}
                    activeOpacity={0.88}
                    disabled={resendingVerification}
                    style={styles.secondaryButton}
                    onPress={resendVerification}
                  >
                    <Ionicons name="mail-outline" size={19} color={Colors.light.primary} />
                    <Text style={styles.secondaryButtonText}>{resendingVerification ? "Sending..." : "Resend verification email"}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  accessibilityLabel="Create account"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading || !canSubmit, busy: loading }}
                  activeOpacity={0.88}
                  disabled={loading || !canSubmit}
                  style={[styles.submitButton, (loading || !canSubmit) && styles.disabledButton]}
                  onPress={submit}
                >
                  <Ionicons name="arrow-forward" size={20} color="white" />
                  <Text style={styles.submitText}>{loading ? "Please wait..." : "Create account"}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              accessibilityLabel="Already have an account, log in"
              accessibilityRole="button"
              activeOpacity={0.75}
              style={styles.singleLink}
              onPress={() => router.push("/login" as Href)}
            >
              <Text style={styles.linkText}>Already have an account?</Text>
            </TouchableOpacity>
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
  roleSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  roleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  roleButton: {
    alignItems: "center",
    backgroundColor: "#FBFCFF",
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 58,
    paddingHorizontal: Spacing.md,
  },
  selectedRole: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: Colors.light.primary,
  },
  roleIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.sm,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  selectedRoleIcon: {
    backgroundColor: Colors.light.primary,
  },
  roleText: {
    flex: 1,
    color: Colors.light.text,
    ...Typography.label,
    fontWeight: "900",
  },
  selectedRoleText: {
    color: Colors.light.primary,
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
  locationSelector: {
    alignItems: "center",
    backgroundColor: "#FBFCFF",
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: 66,
    paddingHorizontal: Spacing.md,
  },
  selectedLocationSelector: {
    borderColor: Colors.light.primary,
  },
  gpsButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  gpsButtonText: {
    color: Colors.light.primary,
    ...Typography.label,
  },
  locationIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.sm,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationTitle: {
    color: Colors.light.text,
    ...Typography.label,
    fontWeight: "900",
  },
  locationSubtitle: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.eyebrow,
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
  secondaryButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.primary,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 52,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
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
});
