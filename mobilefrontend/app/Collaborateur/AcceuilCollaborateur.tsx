import { useEffect, useState, useCallback, useMemo } from "react"
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
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Navbar from "../Components/NavBar"
import Footer from "../Components/Footer"
import { API_CONFIG } from "../config/apiConfig"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"
import useApiPooling from "../useApiPooling"

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
  Statistics: undefined
  Documents: undefined
}

// Définir le type de navigation
type AccueilCollaborateurNavigationProp = NativeStackNavigationProp<RootStackParamList, "AccueilCollaborateur">

const { width } = Dimensions.get("window")

// Définir le type pour le statut des demandes
type RequestStatus = "approved" | "rejected" | "pending"

// Type pour les statistiques
type Stats = {
  approved: number
  rejected: number
  pending: number
}

// Type pour les demandes récentes
type RecentRequest = {
  id: string
  title: string
  description: string
  status: RequestStatus
  date: string
  time: string
  startDate?: string
  endDate?: string
}

// Type pour les informations utilisateur
type UserInfo = {
  id: string
  nom: string
  role: string
}

// Type pour la réponse combinée des stats
type StatsResponse = {
  stats: Stats
  recentRequests: RecentRequest[]
  upcomingTrainings: RecentRequest[]
}

// Background Component
const BackgroundGradient = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <View style={styles.backgroundContainer}>
      <LinearGradient
        colors={isDarkMode ? ["#1a1f38", "#2d3a65", "#1a1f38"] : ["#f0f4f8", "#e2eaf2", "#f0f4f8"]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.backgroundGradient}
      />
    </View>
  )
}

const AccueilCollaborateur = () => {
  const navigation = useNavigation<AccueilCollaborateurNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [userInfoLocal, setUserInfoLocal] = useState<any>(null)
  const [stableStatsData, setStableStatsData] = useState<StatsResponse | null>(null)
  const [stableUserData, setStableUserData] = useState<{ nom: string; role: string } | null>(null)
  const [dataVersion, setDataVersion] = useState(0)

  // Utiliser useApiPooling pour les statistiques et les demandes récentes
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useApiPooling<StatsResponse>({
    apiCall: async () => {
      const userInfoStr = await AsyncStorage.getItem("userInfo")
      const token = await AsyncStorage.getItem("userToken")
    
      if (!userInfoStr || !token) {
        throw new Error("Informations utilisateur non disponibles")
      }
    
      const parsedUser = JSON.parse(userInfoStr)
      const userId = parsedUser.id
    
      if (!userId) {
        throw new Error("ID utilisateur non disponible")
      }
    
      const endpoints = [
        `/api/demande-autorisation/personnel/${userId}`,
        `/api/demande-conge/personnel/${userId}`,
        `/api/demande-formation/personnel/${userId}`,
        `/api/demande-pre-avance/personnel/${userId}`,
        `/api/demande-document/personnel/${userId}`,
      ]
    
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((response) => {
              if (!response.ok) {
                console.warn(`Échec de la récupération depuis ${endpoint}`)
                return []
              }
              return response.json()
            })
            .catch((error) => {
              console.error(`Erreur lors de la récupération depuis ${endpoint}:`, error)
              return []
            }),
        ),
      )
    
      const allDemandes = responses.flat()
    
      // Compter les demandes par statut (tous types confondus)
      let approved = 0
      let rejected = 0
      let pending = 0
    
      allDemandes.forEach((item) => {
        if (item.reponseChef === "O") {
          approved++
        } else if (item.reponseChef === "N") {
          rejected++
        } else {
          pending++
        }
      })

      // Récupérer les demandes de formation approuvées
      const formationsApprouvees = allDemandes
      .filter(item => (item.titre || item.theme) && item.reponseChef === "O")
      .map(item => {
        const demandDate = new Date(item.dateDemande)
        return {
          id: item.id_libre_demande || item.id,
          title: `Formation: ${item.theme || item.titre || "Sans titre"}`,
          description: item.texteDemande || "Pas de description",
          status: "approved" as const,
          date: demandDate.toLocaleDateString("fr-FR"),
          time: demandDate.toLocaleTimeString("fr-FR"),
          startDate: item.dateDebut,
          endDate: item.dateFin
        }
      })
  

      // Filtrer pour ne garder que les formations à venir
      const formationsAVenir = formationsApprouvees.filter(formation => {
        if (!formation.startDate) return false
        const startDate = new Date(formation.startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return startDate >= today
      })

      return {
        stats: {
          approved,  // Total de toutes les demandes approuvées
          rejected,  // Total de toutes les demandes rejetées
          pending,   // Total de toutes les demandes en attente
        },
        recentRequests: [], // Nous n'affichons plus les demandes récentes
        upcomingTrainings: formationsAVenir
      }
    },
    storageKey: "user_stats_data",
    poolingInterval: 120000,
    initialData: { 
      stats: { approved: 0, rejected: 0, pending: 0 }, 
      recentRequests: [],
      upcomingTrainings: []
    },
    dependsOnAuth: true,
  })

  // Utiliser useApiPooling pour les informations utilisateur
  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refresh: refreshUserData,
  } = useApiPooling<{ nom: string; role: string }>({
    apiCall: async () => {
      const userInfoStr = await AsyncStorage.getItem("userInfo")
      const token = await AsyncStorage.getItem("userToken")

      if (!userInfoStr || !token) {
        throw new Error("Informations utilisateur non disponibles")
      }

      const parsedUser = JSON.parse(userInfoStr)
      const userId = parsedUser.id

      if (!userId) {
        throw new Error("ID utilisateur non disponible")
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/byId/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Échec de la récupération des informations de l'utilisateur")
      }

      const data = await response.json()
      return {
        nom: data.nom || "Utilisateur",
        role: data.role || "Collaborateur",
      }
    },
    storageKey: "user_profile_data",
    poolingInterval: 300000,
    dependsOnAuth: true,
  })

  // Stabiliser les données
  useEffect(() => {
    if (statsData) {
      const currentDataStr = JSON.stringify(statsData)
      const stableDataStr = stableStatsData ? JSON.stringify(stableStatsData) : ""

      if (currentDataStr !== stableDataStr) {
        setStableStatsData(statsData)
        setDataVersion((prev) => prev + 1)
      }
    }

    if (userData) {
      const currentDataStr = JSON.stringify(userData)
      const stableDataStr = stableUserData ? JSON.stringify(stableUserData) : ""

      if (currentDataStr !== stableDataStr) {
        setStableUserData(userData)
        setDataVersion((prev) => prev + 1)
      }
    }
  }, [statsData, userData, stableStatsData, stableUserData])

  // Charger les préférences de thème et les informations de l'utilisateur
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference()
      await loadUserInfoFromStorage()
    }
    loadData()
  }, [])

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshStats()
      refreshUserData()
      return () => {}
    }, [refreshStats, refreshUserData]),
  )

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("theme")
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark")
      }
    } catch (error) {
      console.error("Erreur lors du chargement des préférences de thème:", error)
    }
  }

  const loadUserInfoFromStorage = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem("userInfo")
      if (userInfoStr) {
        const parsedInfo = JSON.parse(userInfoStr)
        setUserInfoLocal(parsedInfo)
        setUserName(parsedInfo.nom || "Utilisateur")
        setUserRole(parsedInfo.role || "Collaborateur")

        if (!stableUserData) {
          setStableUserData({
            nom: parsedInfo.nom || "Utilisateur",
            role: parsedInfo.role || "Collaborateur",
          })
        }
      }
    } catch (error) {
      console.error("Error loading user info from storage:", error)
    }
  }

  const toggleTheme = useCallback(async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("theme", newTheme)
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des préférences de thème:", error)
    }
  }, [isDarkMode])

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userInfo")
      await AsyncStorage.removeItem("userToken")
      navigation.navigate("Authentification")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const displayStatsData = useMemo(() => {
    return (
      stableStatsData || {
        stats: { approved: 0, rejected: 0, pending: 0 },
        recentRequests: [],
        upcomingTrainings: []
      }
    )
  }, [stableStatsData, dataVersion])

  const displayUserData = useMemo(() => {
    return (
      stableUserData || {
        nom: userName,
        role: userRole,
      }
    )
  }, [stableUserData, userName, userRole, dataVersion])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    Promise.all([refreshUserData(true), refreshStats(true)]).finally(() => {
      setRefreshing(false)
    })
  }, [refreshUserData, refreshStats])

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return "#4CAF50"
      case "rejected":
        return "#F44336"
      case "pending":
        return "#FF9800"
      default:
        return "#757575"
    }
  }

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return <Feather name="check-circle" size={16} color="#fff" />
      case "rejected":
        return <Feather name="x-circle" size={16} color="#fff" />
      case "pending":
        return <Feather name="clock" size={16} color="#fff" />
      default:
        return null
    }
  }

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return "Approuvée"
      case "rejected":
        return "Rejetée"
      case "pending":
        return "En attente"
      default:
        return ""
    }
  }

  const isLoading = userLoading && statsLoading && !userInfoLocal

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <BackgroundGradient isDarkMode={isDarkMode} />

      <Navbar 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        handleLogout={handleLogout}
        showBackButton={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDarkMode ? "#ffffff" : "#0e135f"} />
          </View>
        ) : (
          <View>
            {/* Section de bienvenue */}
            <View style={styles.welcomeContainer}>
              <View style={[styles.welcomeCard, isDarkMode ? styles.cardDark : styles.cardLight]}>
                <View style={styles.welcomeContent}>
                  <Text style={[styles.welcomeText, isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary]}>
                    Bienvenue,
                  </Text>
                  <Text style={[styles.userName, isDarkMode ? styles.textLight : styles.textDark, styles.gradientText]}>
                    {displayUserData?.nom || userName}
                  </Text>
                  <Text style={[styles.userRole, isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary]}>
                    {displayUserData?.role || userRole}
                  </Text>

                
                </View>

                <View style={styles.avatarContainer}>
                  <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                    <View style={[styles.userAvatar, isDarkMode ? styles.userAvatarDark : styles.userAvatarLight]}>
                      <Feather name="user" size={40} color={isDarkMode ? "#E0E0E0" : "#0e135f"} />
                    </View>
                    <View style={[styles.avatarBadge, { backgroundColor: "#4CAF50" }]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Statistiques */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, isDarkMode ? styles.textLight : styles.textDark, styles.gradientText]}>
                Mes statistiques
              </Text>

              <View style={styles.statsRow}>
                {/* Approved Stats */}
                <View style={[styles.statCard, isDarkMode ? styles.cardDark : styles.cardLight]}>
                  <View style={[styles.statIconContainer, { backgroundColor: "#4CAF50" }]}>
                    <Feather name="check-circle" size={20} color="#fff" />
                  </View>
                  <Text style={[styles.statValue, isDarkMode ? styles.textLight : styles.textDark]}>
                    {displayStatsData?.stats.approved || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary]}>
                    Approuvées
                  </Text>
                </View>

                {/* Rejected Stats */}
                <View style={[styles.statCard, isDarkMode ? styles.cardDark : styles.cardLight]}>
                  <View style={[styles.statIconContainer, { backgroundColor: "#F44336" }]}>
                    <Feather name="x-circle" size={20} color="#fff" />
                  </View>
                  <Text style={[styles.statValue, isDarkMode ? styles.textLight : styles.textDark]}>
                    {displayStatsData?.stats.rejected || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary]}>
                    Rejetées
                  </Text>
                </View>

                {/* Pending Stats */}
                <View style={[styles.statCard, isDarkMode ? styles.cardDark : styles.cardLight]}>
                  <View style={[styles.statIconContainer, { backgroundColor: "#FF9800" }]}>
                    <Feather name="clock" size={20} color="#fff" />
                  </View>
                  <Text style={[styles.statValue, isDarkMode ? styles.textLight : styles.textDark]}>
                    {displayStatsData?.stats.pending || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary]}>
                    En attente
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions rapides */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, isDarkMode ? styles.textLight : styles.textDark, styles.gradientText]}>
                Actions rapides
              </Text>

              <View style={styles.actionsGrid}>
                {/* Nouvelle demande */}
                <TouchableOpacity
                  style={[styles.actionCard, isDarkMode ? styles.cardDark : styles.cardLight]}
                  onPress={() => navigation.navigate("AjouterDemande")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["rgba(48, 40, 158, 0.9)", "rgba(13, 15, 46, 0.9)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionIconGradient}
                  >
                    <Feather name="plus-circle" size={24} color="#fff" />
                  </LinearGradient>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                      Nouvelle demande
                    </Text>
                    <Text
                      style={[
                        styles.actionCardSubtitle,
                        isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary,
                      ]}
                    >
                      Créer une demande
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                </TouchableOpacity>

                {/* Mes demandes */}
                <TouchableOpacity
                  style={[styles.actionCard, isDarkMode ? styles.cardDark : styles.cardLight]}
                  onPress={() => navigation.navigate("Demandestot")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["rgba(48, 40, 158, 0.9)", "rgba(13, 15, 46, 0.9)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionIconGradient}
                  >
                    <Feather name="file-text" size={24} color="#fff" />
                  </LinearGradient>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                      Mes demandes
                    </Text>
                    <Text
                      style={[
                        styles.actionCardSubtitle,
                        isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary,
                      ]}
                    >
                      Voir toutes
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                </TouchableOpacity>

                {/* Mes documents */}
                <TouchableOpacity
                  style={[styles.actionCard, isDarkMode ? styles.cardDark : styles.cardLight]}
                  onPress={() => navigation.navigate("Documents")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["rgba(48, 40, 158, 0.9)", "rgba(13, 15, 46, 0.9)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionIconGradient}
                  >
                    <Feather name="folder" size={24} color="#fff" />
                  </LinearGradient>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                      Mes documents
                    </Text>
                    <Text
                      style={[
                        styles.actionCardSubtitle,
                        isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary,
                      ]}
                    >
                      Gérer mes fichiers
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Section Rappel de formations */}
            {displayStatsData?.upcomingTrainings && displayStatsData.upcomingTrainings.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionTitle, isDarkMode ? styles.textLight : styles.textDark, styles.gradientText]}
                  >
                    Mes formations à venir
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Demandestot")}>
                    <LinearGradient
                      colors={["rgba(48, 40, 158, 0.9)", "rgba(13, 15, 46, 0.9)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.viewAllButton}
                    >
                      <Text style={styles.viewAllButtonText}>Voir tout</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.requestsContainer}>
                  {displayStatsData.upcomingTrainings.map((training) => (
                    <TouchableOpacity
                      key={training.id}
                      style={[
                        styles.requestCard,
                        isDarkMode ? styles.cardDark : styles.cardLight,
                        { borderLeftWidth: 4, borderLeftColor: getStatusColor(training.status) },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.requestCardHeader}>
                        <View style={styles.requestStatusContainer}>
                          <View
                            style={[styles.statusIconContainer, { backgroundColor: getStatusColor(training.status) }]}
                          >
                            {getStatusIcon(training.status)}
                          </View>
                          <Text style={[styles.requestStatusText, { color: getStatusColor(training.status) }]}>
                            {getStatusText(training.status)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.requestDate,
                            isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary,
                          ]}
                        >
                          {training.startDate ? new Date(training.startDate).toLocaleDateString("fr-FR") : "Date inconnue"}
                          {training.endDate && ` - ${new Date(training.endDate).toLocaleDateString("fr-FR")}`}
                        </Text>
                      </View>
                      <Text style={[styles.requestTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                        {training.title}
                      </Text>
                      <Text
                        style={[
                          styles.requestDescription,
                          isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary,
                        ]}
                      >
                        {training.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  darkBackground: {
    backgroundColor: "#1a1f38",
  },
  lightBackground: {
    backgroundColor: "#f0f4f8",
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
    marginBottom: 24,
  },
  welcomeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
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

  buttonLight: {
    backgroundColor: "#F5F5F5",
    borderColor: "#EEEEEE",
  },
  buttonDark: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  avatarContainer: {
    position: "relative",
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarLight: {
    borderColor: "#191970",
    backgroundColor: "rgba(14, 19, 95, 0.1)",
  },
  userAvatarDark: {
    borderColor: "#E0E0E0",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
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
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewAllButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 3,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
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
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  actionIconGradient: {
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
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
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
  statusIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
  cardLight: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  cardDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  textLight: {
    color: "white",
  },
  textDark: {
    color: "#1a1f38",
  },
  textLightSecondary: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  textDarkSecondary: {
    color: "rgba(26, 31, 56, 0.7)",
  },
  gradientText: {
    textShadowColor: "rgba(56, 189, 248, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
})

export default AccueilCollaborateur