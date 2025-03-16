import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  Bell,
  Calendar,
  FileText,
  LogOut,
  Moon,
  Sun,
  User,
  Clock,
  ChevronRight,
  PlusCircle,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react-native"
import Navbar from "../Components/NavBar"
import Footer from "../Components/Footer"
import { API_CONFIG } from "../config/apiConfig"
// Définir les types de navigation
export type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Demandestot: undefined
  Authentification: undefined
  Notifications: undefined
  Autorisation: undefined
  AjouterDemande: undefined
  Calendar: undefined
}

// Définir le type de navigation
type AccueilCollaborateurNavigationProp = NativeStackNavigationProp<RootStackParamList, "AccueilCollaborateur">

const { width } = Dimensions.get("window")

// Définir le type pour le statut des demandes
type RequestStatus = "approved" | "rejected" | "pending"

const AccueilCollaborateur = () => {
  const navigation = useNavigation<AccueilCollaborateurNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)

  // Charger les préférences de thème et les informations de l'utilisateur au montage du composant
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference()
      await getUserInfo()
    }
    loadData()
  }, [])

  // Charger les préférences de thème depuis AsyncStorage
  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("@theme_mode")
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark")
      }
    } catch (error) {
      console.error("Erreur lors du chargement des préférences de thème:", error)
    }
  }

  // Basculer entre le mode sombre et le mode clair
  const toggleTheme = useCallback(async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des préférences de thème:", error)
    }
  }, [isDarkMode])

  // Récupérer les informations de l'utilisateur et les demandes
  const getUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem("userInfo")
      const token = await AsyncStorage.getItem("userToken")

      if (userInfo && token) {
        const parsedUser = JSON.parse(userInfo)
        setUserId(parsedUser.id)
        setUserToken(token)

        // Récupérer les informations de l'utilisateur
        const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/byId/${parsedUser.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Échec de la récupération des informations de l'utilisateur")
        }

        const data = await response.json()
        setUserName(data.nom || "Utilisateur")
        setUserRole(data.role || "Collaborateur")

        
      } else {
        throw new Error("Informations de l'utilisateur ou token manquants")
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations de l'utilisateur:", error)
    } finally {
      setLoading(false)
    }
  }


  // Gérer la déconnexion
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userInfo")
      await AsyncStorage.removeItem("userToken")
      navigation.navigate("Authentification")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  // Appliquer les styles en fonction du thème
  const themeStyles = isDarkMode ? darkStyles : lightStyles



  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <Navbar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme} // Passer toggleTheme ici
        handleLogout={handleLogout}
      />

      {/* Contenu */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0e135f" />
          </View>
        ) : (
          <>
            {/* Section de bienvenue */}
            <View style={[styles.welcomeContainer, themeStyles.card]}>
              <View style={styles.welcomeContent}>
                <Text style={[styles.welcomeText, themeStyles.subtleText]}>Bienvenue,</Text>
                <Text style={[styles.userName, themeStyles.text]}>{userName}</Text>
                <Text style={[styles.userRole, themeStyles.subtleText]}>{userRole}</Text>

                <TouchableOpacity
                  style={[styles.calendarButton, themeStyles.calendarButton]}
                  onPress={() => navigation.navigate("Calendar")}
                >
                  <Calendar size={16} color={isDarkMode ? "#E0E0E0" : "#333"} />
                  <Text style={[styles.calendarButtonText, themeStyles.text]}>Mon calendrier</Text>
                </TouchableOpacity>
              </View>
            </View>



            {/* Actions rapides */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, themeStyles.text]}>Actions rapides</Text>

              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={[styles.actionCard, themeStyles.card]}
                  onPress={() => navigation.navigate("AjouterDemande")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: "#0e135f" }]}>
                    <PlusCircle size={24} color="#fff" />
                  </View>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle, themeStyles.text]}>Nouvelle demande</Text>
                    <Text style={[styles.actionCardSubtitle, themeStyles.subtleText]}>
                      Créer une demande
                    </Text>
                  </View>
                  <ChevronRight size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, themeStyles.card]}
                  onPress={() => navigation.navigate("Demandestot")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: "#4CAF50" }]}>
                    <FileText size={24} color="#fff" />
                  </View>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle, themeStyles.text]}>Mes demandes</Text>
                    <Text style={[styles.actionCardSubtitle, themeStyles.subtleText]}>
                      Voir toutes
                    </Text>
                  </View>
                  <ChevronRight size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, themeStyles.card]}
                  onPress={() => navigation.navigate("Calendar")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: "#2196F3" }]}>
                    <Calendar size={24} color="#fff" />
                  </View>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle, themeStyles.text]}>Calendrier</Text>
                    <Text style={[styles.actionCardSubtitle, themeStyles.subtleText]}>
                      Mes congés
                    </Text>
                  </View>
                  <ChevronRight size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, themeStyles.card]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: "#FF9800" }]}>
                    <BarChart3 size={24} color="#fff" />
                  </View>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle, themeStyles.text]}>Statistiques</Text>
                    <Text style={[styles.actionCardSubtitle, themeStyles.subtleText]}>
                      Mes activités
                    </Text>
                  </View>
                  <ChevronRight size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                </TouchableOpacity>
              </View>
            </View>


          </>
        )}
      </ScrollView>

      {/* Pied de page */}
      <Footer />
    </SafeAreaView>
  )
}

// Styles
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
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 300,
  },
  welcomeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },
  userRole: {
    fontSize: 14,
    marginBottom: 12,
  },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  calendarButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#191970",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: (width - 48) / 3,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  viewAllText: {
    color: "#0e135f",
    fontWeight: "500",
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 12,
  },
  requestsContainer: {
    gap: 12,
  },
  requestCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },
  requestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requestStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  requestStatusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  requestDate: {
    fontSize: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
  },
  requestStatusBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  logoutText: {
    marginLeft: 8,
    fontWeight: "500",
  },
})

// Styles pour le mode clair
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
  },
  text: {
    color: "#333333",
  },
  subtleText: {
    color: "#757575",
  },
  card: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEEEE",
  },
  calendarButton: {
    backgroundColor: "#F5F5F5",
    borderColor: "#EEEEEE",
  },
  logoutButton: {
    backgroundColor: "#F5F5F5",
    borderColor: "#DDDDDD",
  },
})

// Styles pour le mode sombre
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
  },
  text: {
    color: "#E0E0E0",
  },
  subtleText: {
    color: "#AAAAAA",
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
    borderWidth: 1,
    shadowColor: "transparent",
  },
  profileButton: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
  },
  calendarButton: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
  },
  logoutButton: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
  },
})

export default AccueilCollaborateur