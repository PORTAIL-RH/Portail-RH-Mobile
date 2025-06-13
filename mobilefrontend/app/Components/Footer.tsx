import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  View,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")

type RootStackParamList = {
  AccueilCollaborateur: undefined
  Demandestot: undefined
  AjouterDemande: undefined
  Calendar: undefined
  Profile: undefined
}

type FooterNavigationProp = NativeStackNavigationProp<RootStackParamList>

const Footer = () => {
  const navigation = useNavigation<FooterNavigationProp>()
  const route = useRoute()
  const [isDarkMode, setIsDarkMode] = useState(false)

  const currentRoute = route.name

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("theme")
        const newIsDarkMode = storedTheme === "dark"
        if (isDarkMode !== newIsDarkMode) {
          console.log("Footer theme updated:", storedTheme)
          setIsDarkMode(newIsDarkMode)
        }
      } catch (error) {
        console.error("Error loading theme in Footer:", error)
      }
    }

    loadTheme()
    const themeCheckInterval = setInterval(loadTheme, 500)
    return () => clearInterval(themeCheckInterval)
  }, [isDarkMode])

  const navigationItems = [
    { name: "AccueilCollaborateur", label: "Accueil", icon: "home" },
    { name: "Demandestot", label: "Demandes", icon: "file-text" },
    { name: "AjouterDemande", label: "Ajouter", icon: "plus-circle", special: true },
    { name: "Calendar", label: "Calendar", icon: "calendar" },
    { name: "Profile", label: "Profil", icon: "user" },
  ]

  return (
    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
      <LinearGradient
        colors={isDarkMode ? ["#1a1f38", "#2d3a65"] : ["#f0f4f8", "#e2eaf2"]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.footer}
      >
        {navigationItems
          .filter((item) => !item.special)
          .map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Feather
                name={item.icon}
                size={22}
                color={
                  currentRoute === item.name
                    ? isDarkMode
                      ? "#B388FF"
                      : "#0e135f"
                    : isDarkMode
                    ? "#AAAAAA"
                    : "#757575"
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentRoute === item.name
                    ? isDarkMode
                      ? styles.activeNavLabelDark
                      : styles.activeNavLabelLight
                    : isDarkMode
                    ? styles.textLight
                    : styles.textDark,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
      </LinearGradient>

      {/* Floating + button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("AjouterDemande")}
        activeOpacity={0.8}
        style={styles.floatingButton}
      >
        <LinearGradient
          colors={["rgba(48, 40, 158, 0.9)", "rgba(13, 15, 46, 0.9)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonContainer}
        >
          <Feather name="plus-circle" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    height: 79,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    width: width / 5,
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  activeNavLabelLight: {
    fontWeight: "600",
    color: "#0e135f",
  },
  activeNavLabelDark: {
    fontWeight: "600",
    color: "#B388FF",
  },
  addButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  textLight: {
    color: "#AAAAAA",
  },
  textDark: {
    color: "#757575",
  },
  floatingButton: {
    position: "absolute",
    bottom: 33,
    left: width / 2 - 28, // Center the button (half of 56px width)
    zIndex: 10,
  },
})

export default Footer
