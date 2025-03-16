import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Bell, Moon, Sun, User, ArrowLeft, LogOut } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// Define the navigation stack types
export type RootStackParamList = {
  AccueilCollaborateur: undefined;
  Profile: undefined;
  Notifications: undefined;
  Authentification: undefined;
};

type NavBarProps = {
  title?: string;
  showBackButton?: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  handleLogout: () => void;
  pendingNotifications?: number;
};

const NavBar = ({
  title = "Portail RH",
  showBackButton = false,
  isDarkMode,
  toggleTheme,
  handleLogout,
  pendingNotifications = 0,
}: NavBarProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogoutPress = async () => {
    try {
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userId");
      await AsyncStorage.removeItem("userInfo");
      await AsyncStorage.removeItem("userCodeSoc");
      await AsyncStorage.removeItem("userService");
      await AsyncStorage.removeItem("@theme_mode");

      // Show a success toast message
      Toast.show({
        type: "success",
        text1: "Logged Out",
        text2: "You have been logged out successfully.",
      });

      // Navigate to the Authentication screen
      navigation.navigate("Authentification");
    } catch (error) {
      console.error("Error logging out:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to log out. Please try again.",
      });
    }
  };

  return (
    <View style={[styles.header, isDarkMode ? darkStyles.header : lightStyles.header]}>
      <View style={styles.headerLeft}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
          </TouchableOpacity>
        ) : null}
        {/* Replace the title with the logo image */}
        <Image
          source={require("../../assets/images/logo.png")} // Path to your logo image
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Notifications")}>
          <Bell size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
          {pendingNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
          {isDarkMode ? <Sun size={22} color="#E0E0E0" /> : <Moon size={22} color="#333" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, isDarkMode ? darkStyles.logoutButton : lightStyles.logoutButton]}
          onPress={handleLogoutPress}
        >
          <LogOut size={20} color={isDarkMode ? "#E0E0E0" : "#333"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  logo: {
    width: 150, // Adjust the width as needed
    height: 40, // Adjust the height as needed
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
    position: "relative",
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
    borderWidth: 1,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF5252",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
    borderWidth: 1,
    backgroundColor: "rgba(255, 82, 82, 0.1)",
  },
});

const lightStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
  },
  text: {
    color: "#333333",
  },
  profileButton: {
    borderColor: "#ddd",
  },
  logoutButton: {
    borderColor: "#ffdddd",
    backgroundColor: "rgba(255, 82, 82, 0.05)",
  },
});

const darkStyles = StyleSheet.create({
  header: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
  },
  text: {
    color: "#E0E0E0",
  },
  profileButton: {
    borderColor: "#444",
  },
  logoutButton: {
    borderColor: "#662222",
    backgroundColor: "rgba(255, 82, 82, 0.1)",
  },
});

export default NavBar;