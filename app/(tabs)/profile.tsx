import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const menuItems = [
  { icon: "person-outline", title: "Edit Profile", color: "#3F56A5" },
  { icon: "heart-outline", title: "Favorites", color: "#e74c3c" },
  { icon: "notifications-outline", title: "Notifications", color: "#f39c12" },
  { icon: "location-outline", title: "Saved Locations", color: "#27ae60" },
  { icon: "time-outline", title: "Booking History", color: "#9b59b6" },
  { icon: "wallet-outline", title: "Payment Methods", color: "#1abc9c" },
  { icon: "shield-checkmark-outline", title: "Privacy & Security", color: "#34495e" },
  { icon: "help-circle-outline", title: "Help & Support", color: "#3498db" },
  { icon: "information-circle-outline", title: "About Us", color: "#7f8c8d" },
];

const COLORS = {
  primary: "#3F56A5",
  background: "#F4F6FB",
  surface: "#FFFFFF",
  text: "#172033",
  muted: "#6D7587",
  border: "#E5E9F4",
  danger: "#E74C3C",
};

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.locationLabel}>Account</Text>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.headerIconBtn}>
            <Ionicons name="settings-outline" size={21} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Manage bookings, saved listings, payments, and account preferences.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: "https://picsum.photos/200?random=50" }} 
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@example.com</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* MEMBERSHIP CARD */}
        <View style={styles.membershipCard}>
          <View style={styles.membershipLeft}>
            <Ionicons name="diamond" size={24} color="#f39c12" />
            <View style={styles.membershipInfo}>
              <Text style={styles.membershipTitle}>Premium Member</Text>
              <Text style={styles.membershipSubtitle}>Valid until Dec 2026</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* MENU ITEMS */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          {menuItems.slice(0, 5).map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + "20" }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Settings</Text>
          {menuItems.slice(5).map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + "20" }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
            </TouchableOpacity>
          ))}
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* VERSION */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    marginTop: 12,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  membershipCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 18,
    padding: 16,
    backgroundColor: COLORS.primary,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  membershipLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  membershipInfo: {
    marginLeft: 12,
  },
  membershipTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
  membershipSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  upgradeBtn: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 14,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.muted,
    marginBottom: 10,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F7",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FAD4D4",
    marginHorizontal: 20,
    marginTop: 25,
    padding: 15,
    borderRadius: 15,
    gap: 10,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: "900",
  },
  versionText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 20,
  },
});
