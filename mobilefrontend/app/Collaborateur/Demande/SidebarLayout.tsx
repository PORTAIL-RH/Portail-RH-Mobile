import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  useColorScheme,
  SafeAreaView,
  Image,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  ArrowLeft,
  Menu,
  X,
  Calendar,
  FileText,
  Clock,
  DollarSign,
  GraduationCap,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react-native"

const { width } = Dimensions.get("window")
type SidebarLayoutProps = {
  children: React.ReactNode
  title: string
}

const SidebarLayout = ({ children, title }: SidebarLayoutProps) => {
  const navigation = useNavigation()
  const route = useRoute()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarAnimation = useState(new Animated.Value(-width))[0]
  const fadeAnim = useState(new Animated.Value(0))[0]

  // Load theme preference on component mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("@theme_mode")
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === "dark")
        }
      } catch (error) {
        console.error("Error loading theme preference:", error)
      }
    }

    loadThemePreference()
  }, [])

  // Toggle theme between light and dark mode
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    const toValue = sidebarOpen ? -width : 0
    Animated.timing(sidebarAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start()

    Animated.timing(fadeAnim, {
      toValue: sidebarOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start()

    setSidebarOpen(!sidebarOpen)
  }

  // Close sidebar
  const closeSidebar = () => {
    if (sidebarOpen) {
      Animated.timing(sidebarAnimation, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start()

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()

      setSidebarOpen(false)
    }
  }

  // Navigate to a page and close sidebar
  const navigateTo = (routeName: string) => {
    navigation.navigate(routeName)
    closeSidebar()
  }

  // Check if a route is active
  const isRouteActive = (routeName: string) => {
    return route.name === routeName
  }

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  // Menu items
  const menuItems = [
    {
      name: "Conge",
      label: "Congé",
      icon: (active: boolean) => (
        <Calendar size={22} color={active ? themeStyles.activeIconColor.color : themeStyles.iconColor.color} />
      ),
      description: "Demande de congés payés ou spéciaux",
    },
    {
      name: "Autorisation",
      label: "Autorisation",
      icon: (active: boolean) => (
        <Clock size={22} color={active ? themeStyles.activeIconColor.color : themeStyles.iconColor.color} />
      ),
      description: "Demande d'autorisation d'absence",
    },
    {
      name: "Document",
      label: "Document",
      icon: (active: boolean) => (
        <FileText size={22} color={active ? themeStyles.activeIconColor.color : themeStyles.iconColor.color} />
      ),
      description: "Demande de documents administratifs",
    },
    {
      name: "Formation",
      label: "Formation",
      icon: (active: boolean) => (
        <GraduationCap size={22} color={active ? themeStyles.activeIconColor.color : themeStyles.iconColor.color} />
      ),
      description: "Demande de formation professionnelle",
    },
    {
      name: "Pret",
      label: "PrêtAvance",
      icon: (active: boolean) => (
        <DollarSign size={22} color={active ? themeStyles.activeIconColor.color : themeStyles.iconColor.color} />
      ),
      description: "Demande de prêt ou d'avance sur salaire",
    },
  ]

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* Custom Header */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
            <ArrowLeft size={22} color={themeStyles.iconColor.color} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuButton, themeStyles.menuButton]} onPress={toggleSidebar}>
            <Menu size={22} color={themeStyles.iconColor.color} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, themeStyles.text]}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.themeToggle, themeStyles.themeToggle]} onPress={toggleTheme}>
            {isDarkMode ? (
              <Sun size={18} color={themeStyles.themeToggleIcon.color} />
            ) : (
              <Moon size={18} color={themeStyles.themeToggleIcon.color} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, themeStyles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
        <View style={[styles.sidebarHeader, themeStyles.sidebarHeader]}>
          <View style={styles.profileSection}>

          </View>
          <TouchableOpacity style={styles.closeButton} onPress={closeSidebar}>
            <X size={24} color={themeStyles.iconColor.color} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sidebarTitleContainer, themeStyles.sidebarTitleContainer]}>
          <Text style={[styles.sidebarTitle, themeStyles.sidebarTitle]}>Types de demandes</Text>
        </View>

        <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const active = isRouteActive(item.name)
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.sidebarItem,
                  themeStyles.sidebarItem,
                  active && styles.activeSidebarItem,
                  active && themeStyles.activeSidebarItem,
                ]}
                onPress={() => navigateTo(item.name)}
              >
                <View style={styles.sidebarItemContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      themeStyles.iconContainer,
                      active && styles.activeIconContainer,
                      active && themeStyles.activeIconContainer,
                    ]}
                  >
                    {item.icon(active)}
                  </View>
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.sidebarItemText,
                        themeStyles.sidebarItemText,
                        active && styles.activeSidebarItemText,
                        active && themeStyles.activeSidebarItemText,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={[styles.sidebarItemDescription, themeStyles.sidebarItemDescription]}>
                      {item.description}
                    </Text>
                  </View>
                  <ChevronRight
                    size={16}
                    color={active ? themeStyles.activeIconColor.color : themeStyles.chevronColor.color}
                  />
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <View style={[styles.sidebarFooter, themeStyles.sidebarFooter]}>
          <Text style={[styles.footerText, themeStyles.footerText]}>HR Portal v1.0</Text>
        </View>
      </Animated.View>

      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={closeSidebar} />
        </Animated.View>
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 0.85,
    height: "100%",
    zIndex: 100,
    paddingTop: 50,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  profileInfo: {
    justifyContent: "center",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    opacity: 0.7,
  },
  closeButton: {
    padding: 8,
  },
  sidebarTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  sidebarItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activeIconContainer: {
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
  },
  sidebarItemText: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  sidebarItemDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  activeSidebarItem: {
    borderLeftWidth: 4,
  },
  activeSidebarItemText: {
    fontWeight: "700",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 50,
  },
  overlayTouch: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
  },
  sidebarFooter: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
  },
})

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E9ECEF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  text: {
    color: "#212529",
  },
  menuButton: {
    backgroundColor: "#F1F3F5",
  },
  themeToggle: {
    backgroundColor: "#F1F3F5",
  },
  themeToggleIcon: {
    color: "#495057",
  },
  sidebar: {
    backgroundColor: "#FFFFFF",
    borderRightColor: "#E9ECEF",
    borderRightWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#F8F9FA",
  },
  sidebarTitleContainer: {
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#FFFFFF",
  },
  sidebarTitle: {
    color: "#495057",
  },
  profileName: {
    color: "#212529",
  },
  profileRole: {
    color: "#6C757D",
  },
  sidebarItem: {
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#FFFFFF",
  },
  sidebarItemText: {
    color: "#212529",
  },
  sidebarItemDescription: {
    color: "#6C757D",
  },
  iconContainer: {
    backgroundColor: "#F1F3F5",
  },
  iconColor: {
    color: "#495057",
  },
  chevronColor: {
    color: "#ADB5BD",
  },
  activeSidebarItem: {
    backgroundColor: "#F8F9FA",
    borderLeftColor: "#4263EB",
  },
  activeIconContainer: {
    backgroundColor: "#E7F5FF",
  },
  activeIconColor: {
    color: "#4263EB",
  },
  activeSidebarItemText: {
    color: "#4263EB",
  },
  sidebarFooter: {
    borderTopColor: "#E9ECEF",
    backgroundColor: "#F8F9FA",
  },
  footerText: {
    color: "#6C757D",
  },
  avatarContainer: {
    backgroundColor: "#E7F5FF",
    borderWidth: 2,
    borderColor: "#4263EB",
  },
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  text: {
    color: "#E0E0E0",
  },
  menuButton: {
    backgroundColor: "#333333",
  },
  themeToggle: {
    backgroundColor: "#333333",
  },
  themeToggleIcon: {
    color: "#E0E0E0",
  },
  sidebar: {
    backgroundColor: "#1E1E1E",
    borderRightColor: "#333333",
    borderRightWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    borderBottomColor: "#333333",
    backgroundColor: "#252525",
  },
  sidebarTitleContainer: {
    borderBottomColor: "#333333",
    backgroundColor: "#1E1E1E",
  },
  sidebarTitle: {
    color: "#E0E0E0",
  },
  profileName: {
    color: "#E0E0E0",
  },
  profileRole: {
    color: "#AAAAAA",
  },
  sidebarItem: {
    borderBottomColor: "#333333",
    backgroundColor: "#1E1E1E",
  },
  sidebarItemText: {
    color: "#E0E0E0",
  },
  sidebarItemDescription: {
    color: "#AAAAAA",
  },
  iconContainer: {
    backgroundColor: "#333333",
  },
  iconColor: {
    color: "#E0E0E0",
  },
  chevronColor: {
    color: "#666666",
  },
  activeSidebarItem: {
    backgroundColor: "#252525",
    borderLeftColor: "#738ADB",
  },
  activeIconContainer: {
    backgroundColor: "#2D3748",
  },
  activeIconColor: {
    color: "#738ADB",
  },
  activeSidebarItemText: {
    color: "#738ADB",
  },
  sidebarFooter: {
    borderTopColor: "#333333",
    backgroundColor: "#252525",
  },
  footerText: {
    color: "#AAAAAA",
  },
  avatarContainer: {
    backgroundColor: "#2D3748",
    borderWidth: 2,
    borderColor: "#738ADB",
  },
})

export default SidebarLayout

