import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.eyebrow}>Join Rental App</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Choose how you want to use the marketplace.</Text>
          </View>

          <View style={styles.roleRow}>
            {roles.map((item) => {
              const selected = role === item.value;

              return (
                <Pressable
                  key={item.value}
                  style={[styles.roleButton, selected && styles.selectedRole]}
                  onPress={() => setRole(item.value)}
                >
                  <Ionicons name={item.icon} size={20} color={selected ? "white" : Colors.light.primary} />
                  <Text style={[styles.roleText, selected && styles.selectedRoleText]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.form}>
            <TextInput
              autoComplete="name"
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={Colors.light.muted}
              style={styles.input}
              value={name}
            />
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
            <TextInput
              autoComplete="new-password"
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={Colors.light.muted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <TextInput
              autoComplete="new-password"
              onChangeText={setPasswordConfirmation}
              placeholder="Confirm password"
              placeholderTextColor={Colors.light.muted}
              secureTextEntry
              style={styles.input}
              value={passwordConfirmation}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable disabled={loading} style={[styles.submitButton, loading && styles.disabledButton]} onPress={submit}>
              <Text style={styles.submitText}>{loading ? "Please wait..." : "Create account"}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.linkButton} onPress={() => router.push("/login" as Href)}>
            <Text style={styles.linkText}>Already have an account?</Text>
          </Pressable>
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
    marginTop: 40,
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
  roleRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 32,
  },
  roleButton: {
    alignItems: "center",
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 54,
  },
  selectedRole: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  roleText: {
    color: Colors.light.text,
    ...Typography.label,
  },
  selectedRoleText: {
    color: "white",
  },
  form: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
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
    marginTop: Spacing.xl,
  },
  linkText: {
    color: Colors.light.primary,
    ...Typography.label,
  },
});
