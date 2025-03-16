import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ColorValue } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Home, User, FileText, Bell, Plus } from "lucide-react-native";
import { useTheme } from "../ThemeContext";

const { width } = Dimensions.get("window");

type RootStackParamList = {
  AccueilCollaborateur: undefined;
  Demandestot: undefined;
  AjouterDemande: undefined;
  Notifications: undefined;
  Profile: undefined;
};

type FooterNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Footer = () => {
  const navigation = useNavigation<FooterNavigationProp>();
  const route = useRoute();
  const { isDarkMode } = useTheme(); // Use the theme context


  // Get current route name
  const currentRoute = route.name;

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  // Navigation items
  const navigationItems = [
    {
      name: "AccueilCollaborateur",
      label: "Accueil",
      icon: (active: boolean) => <Home size={22} color={active ? "#0e135f" : themeStyles.iconColor} />,
    },
    {
      name: "Demandestot",
      label: "Demandes",
      icon: (active: boolean) => <FileText size={22} color={active ? "#0e135f" : themeStyles.iconColor} />,
    },
    {
      name: "AjouterDemande",
      label: "Ajouter",
      icon: (active: boolean) => (
        <View style={[styles.addButtonContainer, themeStyles.addButtonContainer]}>
          <Plus size={22} color={themeStyles.addButtonIconColor} />
        </View>
      ),
      special: true,
    },
    {
      name: "Notifications",
      label: "Notifications",
      icon: (active: boolean) => <Bell size={22} color={active ? "#0e135f" : themeStyles.iconColor} />,
    },
    {
      name: "Profile",
      label: "Profil",
      icon: (active: boolean) => <User size={22} color={active ? "#0e135f" : themeStyles.iconColor} />,
    },
  ];

  return (
    <View style={[styles.container, themeStyles.container]}>
      {navigationItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={[
            styles.navItem,
            item.special && styles.specialNavItem,
            currentRoute === item.name && styles.activeNavItem,
          ]}
          onPress={() => navigation.navigate(item.name)}
          activeOpacity={0.7}
        >
          {item.icon(currentRoute === item.name)}
          {!item.special && (
            <Text
              style={[
                styles.navLabel,
                themeStyles.navLabel,
                currentRoute === item.name && styles.activeNavLabel,
                currentRoute === item.name && themeStyles.activeNavLabel,
              ]}
            >
              {item.label}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    width: width / 5,
  },
  specialNavItem: {
    marginBottom: 20,
  },
  activeNavItem: {
    // Active styles applied through text and icon colors
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  activeNavLabel: {
    fontWeight: "600",
    color: "#0e135f",
  },
  addButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
});

// Define theme-specific styles
const lightStyles = {
  container: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#EEEEEE",
  },
  navLabel: {
    color: "#757575",
  },
  activeNavLabel: {
    color: "#0e135f",
  },
  addButtonContainer: {
    backgroundColor: "#0e135f",
  },
  addButtonIconColor: "#FFFFFF" as ColorValue,
  iconColor: "#757575" as ColorValue,
};

const darkStyles = {
  container: {
    backgroundColor: "#1E1E1E",
    borderTopColor: "#333333",
  },
  navLabel: {
    color: "#AAAAAA",
  },
  activeNavLabel: {
    color: "#B388FF",
  },
  addButtonContainer: {
    backgroundColor: "#B388FF",
  },
  addButtonIconColor: "#1E1E1E" as ColorValue,
  iconColor: "#AAAAAA" as ColorValue,
};

export default Footer;