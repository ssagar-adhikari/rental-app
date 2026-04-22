import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3F56A5",
        tabBarInactiveTintColor: "#8A93A6",
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#E5E9F4",
          elevation: 12,
          shadowColor: "#22315F",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="category"
        options={{
          title: "Category",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          )
        }}
      />

    </Tabs>
  );
}
