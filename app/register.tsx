import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/authApi";
import type { UserRole } from "@/types/auth";

type RegisterRole = Exclude<UserRole, "admin">;

const roles: { label: string; value: RegisterRole; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Customer", value: "customer", icon: "bag-handle-outline" },
  { label: "Vendor", value: "vendor", icon: "storefront-outline" },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [role, setRole] = useState<RegisterRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });
      router.replace("/(tabs)/profile");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity activeOpacity={0.8} style={styles.backButton} onPress={() => router.back()}>
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
                <Text style={styles.cardSubtitle}>Choose your role and add your sign-in details.</Text>
              </View>
            </View>

            <View style={styles.roleSection}>
              <Text style={styles.fieldLabel}>Account type</Text>
              <View style={styles.roleRow}>
                {roles.map((item) => {
                  const selected = role === item.value;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      key={item.value}
                      style={[styles.roleButton, selected && styles.selectedRole]}
                      onPress={() => setRole(item.value)}
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
                <Text style={styles.fieldLabel}>Full name</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="person-outline" size={19} color={Colors.light.muted} />
                  <TextInput
                    autoComplete="name"
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="#98A1B3"
                    style={styles.input}
                    value={name}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="mail-outline" size={19} color={Colors.light.muted} />
                  <TextInput
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
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="lock-closed-outline" size={19} color={Colors.light.muted} />
                  <TextInput
                    autoComplete="new-password"
                    onChangeText={setPassword}
                    placeholder="Create password"
                    placeholderTextColor="#98A1B3"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="shield-checkmark-outline" size={19} color={Colors.light.muted} />
                  <TextInput
                    autoComplete="new-password"
                    onChangeText={setPasswordConfirmation}
                    placeholder="Repeat password"
                    placeholderTextColor="#98A1B3"
                    secureTextEntry
                    style={styles.input}
                    value={passwordConfirmation}
                  />
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.light.danger} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity activeOpacity={0.88} disabled={loading} style={[styles.submitButton, loading && styles.disabledButton]} onPress={submit}>
                <Ionicons name="arrow-forward" size={20} color="white" />
                <Text style={styles.submitText}>{loading ? "Please wait..." : "Create account"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.75} style={styles.singleLink} onPress={() => router.push("/login" as Href)}>
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
