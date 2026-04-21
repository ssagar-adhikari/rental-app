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

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#3F56A5",
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 3,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#3F56A5",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3F56A5",
    borderRadius: 15,
    padding: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3F56A5",
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#ecf0f1",
  },
  membershipCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 15,
    backgroundColor: "#3F56A5",
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
    fontWeight: "600",
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
    color: "#3F56A5",
    fontWeight: "600",
    fontSize: 14,
  },
  menuSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7f8c8d",
    marginBottom: 10,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: "#2c3e50",
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fdf2f2",
    marginHorizontal: 20,
    marginTop: 25,
    padding: 15,
    borderRadius: 15,
    gap: 10,
  },
  logoutText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    color: "#bdc3c7",
    fontSize: 13,
    marginTop: 20,
  },
});