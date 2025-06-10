import { View, Text, StyleSheet, TouchableOpacity,Image  } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message"
import useNotifications from "../Collaborateur/useNotifications"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"

export type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Notifications: undefined
  Authentification: undefined
}

type NavBarProps = {
  title?: string
  showBackButton?: boolean
  isDarkMode: boolean
  toggleTheme: () => void
  handleLogout: () => void
}

const NavBar = ({ title, showBackButton = false, isDarkMode, toggleTheme, handleLogout }: NavBarProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { unviewedCount , markAllAsRead } = useNotifications()

  const handleNotificationPress = () => {
    if (unviewedCount > 0) {
      markAllAsRead() // Mark all as read first
    }
    navigation.navigate("Notifications") // Then navigate
  }

  const handleLogoutPress = async () => {
    try {
      // Clear all AsyncStorage data
      await AsyncStorage.clear();

      Toast.show({
        type: "success",
        text1: "Déconnexion réussie",
        text2: "Vous avez été déconnecté avec succès.",
        visibilityTime: 2000,
      })

      navigation.navigate("Authentification")
    } catch (error) {
      console.error("Error logging out:", error)
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Échec de la déconnexion. Veuillez réessayer.",
        visibilityTime: 2000,
      })
    }
  }

  return (
    <LinearGradient
      colors={isDarkMode ? ["#1a1f38", "#2d3a65"] : ["#f0f4f8", "#e2eaf2"]}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={styles.header}
    >
      <View style={styles.headerLeft}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
          </TouchableOpacity>
        ) : (
          <View style={styles.branding}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={[
                styles.logo,
                isDarkMode ? { tintColor: '#FFFFFF' } : { tintColor: undefined }
              ]}
              resizeMode="contain"
            />
          </View>
        )}
        {title && (
          <Text style={[
            styles.headerTitle,
            isDarkMode ? styles.textLight : styles.textDark
          ]}>
            {title}
          </Text>
        )}
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
          <View style={[styles.iconButtonInner, isDarkMode ? styles.iconButtonInnerDark : styles.iconButtonInnerLight]}>
            <Feather name="bell" size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
            {unviewedCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unviewedCount > 9 ? "9+" : unviewedCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
          <View style={[styles.iconButtonInner, isDarkMode ? styles.iconButtonInnerDark : styles.iconButtonInnerLight]}>
            {isDarkMode ? (
              <Feather name="sun" size={22} color="#E0E0E0" />
            ) : (
              <Feather name="moon" size={22} color="#333" />
            )}
          </View>
        </TouchableOpacity>

      
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
          <LinearGradient
            colors={["rgba(244, 67, 54, 0.8)", "rgba(229, 57, 53, 0.8)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutGradient}
          >
            <Feather name="log-out" size={20} color="#FFFFFF" />
          </LinearGradient>
          
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40, // More space for status bar
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  logo: {
    width: 150, // Adjust the width as needed
    height: 40, // Adjust the height as needed
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  branding: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandingIcon: {
    marginRight: 8,
    textShadowColor: "rgba(56, 189, 248, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  gradientText: {
    textShadowColor: "rgba(56, 189, 248, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 8,
    position: "relative",
  },
  iconButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonInnerLight: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  iconButtonInnerDark: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    overflow: "hidden",
  },
  logoutGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  textLight: {
    color: "white",
  },
  textDark: {
    color: "#1a1f38",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
})

export default NavBar

