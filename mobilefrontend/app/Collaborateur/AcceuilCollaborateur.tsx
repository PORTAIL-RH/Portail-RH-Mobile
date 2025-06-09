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
  Modal,
  FlatList,
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

// Type pour les formations
type Formation = {
  id: string
  titre?: any // Can be string or object
  theme?: any // Can be string or object
  dateDebut: string
  dateFin?: string
  texteDemande?: any // Can be string or object
  lieu?: any // Can be string or object
  organisme?: any // Can be string or object
  duree?: any // Can be string, number, or object
  cout?: any // Can be number or object
  types?: any // Additional field that might be present
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
  
  // États pour le modal des formations
  const [formationsModalVisible, setFormationsModalVisible] = useState(false)
  const [formations, setFormations] = useState<Formation[]>([])
  const [formationsLoading, setFormationsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Fonction pour récupérer avec retry
  const fetchWithRetry = async (url: string, options: any = {}, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  // Fonction pour récupérer les formations à venir
  const fetchFormations = useCallback(async (silent = false) => {
    if (!userId) return []
    
    if (!silent) setFormationsLoading(true)
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        throw new Error("Token non disponible")
      }

      const data = await fetchWithRetry(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-formation/personnel/${userId}/approved-by-chef1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
    
      const now = new Date()
      const upcoming = (Array.isArray(data) ? data : [])
        .filter(f => {
          // More robust date filtering
          try {
            return f?.dateDebut && new Date(f.dateDebut) >= now
          } catch {
            return false
          }
        })
        .sort((a, b) => {
          try {
            return new Date(a.dateDebut) - new Date(b.dateDebut)
          } catch {
            return 0
          }
        })
        .slice(0, 10) // Limiter à 10 formations
      
      console.log("Formations fetched:", upcoming) // Debug log
      setFormations(upcoming)
      
      return upcoming
    } catch (error) {
      console.error("Erreur des formations:", error)
      return []
    } finally {
      if (!silent) setFormationsLoading(false)
    }
  }, [userId])

  // Charger l'ID utilisateur au démarrage
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem("userInfo")
        if (userInfoStr) {
          const parsedInfo = JSON.parse(userInfoStr)
          setUserId(parsedInfo.id)
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'ID utilisateur:", error)
      }
    }
    loadUserId()
  }, [])

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

  // Ouvrir le modal des formations
  const openFormationsModal = useCallback(() => {
    setFormationsModalVisible(true)
    fetchFormations()
  }, [fetchFormations])

  // Fermer le modal des formations
  const closeFormationsModal = useCallback(() => {
    setFormationsModalVisible(false)
  }, [])

  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    } catch {
      return dateString
    }
  }

  // Formater la durée
  const formatDuration = (startDate: string, endDate?: string) => {
    try {
      const start = new Date(startDate)
      if (!endDate) return formatDate(startDate)
      
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        return formatDate(startDate)
      } else {
        return `${formatDate(startDate)} - ${formatDate(endDate)} (${diffDays} jours)`
      }
    } catch {
      return formatDate(startDate)
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

  // Rendu d'un élément de formation
  const renderFormationItem = ({ item }: { item: Formation }) => {
    // Helper function to safely render text values
    const safeRenderText = (value: any): string => {
      if (value === null || value === undefined) return ""
      if (typeof value === "string") return value
      if (typeof value === "number") return value.toString()
      if (typeof value === "object") {
        // If it's an object, try to extract meaningful text
        if (value.nom || value.name || value.title || value.titre) {
          return value.nom || value.name || value.title || value.titre
        }
        return JSON.stringify(value)
      }
      return String(value)
    }

    return (
      <View style={[
        styles.formationCard,
        isDarkMode ? styles.cardDark : styles.cardLight
      ]}>
        <View style={styles.formationHeader}>
          <View style={styles.formationIconContainer}>
            <Feather name="book-open" size={20} color="#4CAF50" />
          </View>
          <View style={styles.formationInfo}>
            <Text style={[
              styles.formationTitle,
              isDarkMode ? styles.textLight : styles.textDark
            ]}>
              {safeRenderText(item.titre || item.theme) || "Formation"}
            </Text>
            <Text style={[
              styles.formationDate,
              isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
            ]}>
              {formatDuration(item.dateDebut, item.dateFin)}
            </Text>
          </View>
        </View>
        
        {item.texteDemande && (
          <Text style={[
            styles.formationDescription,
            isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
          ]}>
            {safeRenderText(item.texteDemande)}
          </Text>
        )}
        
        <View style={styles.formationDetails}>
          {item.lieu && (
            <View style={styles.formationDetailItem}>
              <Feather name="map-pin" size={14} color={isDarkMode ? "#AAAAAA" : "#757575"} />
              <Text style={[
                styles.formationDetailText,
                isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
              ]}>
                {safeRenderText(item.lieu)}
              </Text>
            </View>
          )}
          
          {item.organisme && (
            <View style={styles.formationDetailItem}>
              <Feather name="users" size={14} color={isDarkMode ? "#AAAAAA" : "#757575"} />
              <Text style={[
                styles.formationDetailText,
                isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
              ]}>
                {safeRenderText(item.organisme)}
              </Text>
            </View>
          )}
          
          {item.duree && (
            <View style={styles.formationDetailItem}>
              <Feather name="clock" size={14} color={isDarkMode ? "#AAAAAA" : "#757575"} />
              <Text style={[
                styles.formationDetailText,
                isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
              ]}>
                {safeRenderText(item.duree)}
              </Text>
            </View>
          )}
          
          {item.cout && (
            <View style={styles.formationDetailItem}>
              <Feather name="dollar-sign" size={14} color={isDarkMode ? "#AAAAAA" : "#757575"} />
              <Text style={[
                styles.formationDetailText,
                isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
              ]}>
                {safeRenderText(item.cout)}€
              </Text>
            </View>
          )}
        </View>
      </View>
    )
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

                {/* Formations à venir - Nouveau bouton */}
                <TouchableOpacity
                  style={[styles.actionCard, isDarkMode ? styles.cardDark : styles.cardLight]}
                  onPress={openFormationsModal}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["rgba(76, 175, 80, 0.9)", "rgba(56, 142, 60, 0.9)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionIconGradient}
                  >
                    <Feather name="book-open" size={24} color="#fff" />
                  </LinearGradient>
                  <View style={styles.actionCardContent}>
                    <Text style={[styles.actionCardTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                      Formations à venir
                    </Text>
                    <Text
                      style={[
                        styles.actionCardSubtitle,
                        isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary,
                      ]}
                    >
                      Voir mes formations
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
                  <TouchableOpacity onPress={openFormationsModal}>
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
                  {displayStatsData.upcomingTrainings.slice(0, 3).map((training) => (
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

      {/* Modal des formations */}
      <Modal
        visible={formationsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeFormationsModal}
      >
        <SafeAreaView style={[
          styles.modalContainer,
          isDarkMode ? styles.darkBackground : styles.lightBackground
        ]}>
          <View style={[
            styles.modalHeader,
            isDarkMode ? styles.modalHeaderDark : styles.modalHeaderLight
          ]}>
            <Text style={[
              styles.modalTitle,
              isDarkMode ? styles.textLight : styles.textDark
            ]}>
              Formations à venir
            </Text>
            <TouchableOpacity
              onPress={closeFormationsModal}
              style={styles.modalCloseButton}
            >
              <Feather name="x" size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
          </View>

          {formationsLoading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={isDarkMode ? "#ffffff" : "#0e135f"} />
              <Text style={[
                styles.modalLoadingText,
                isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
              ]}>
                Chargement des formations...
              </Text>
            </View>
          ) : formations.length === 0 ? (
            <View style={styles.modalEmptyContainer}>
              <Feather name="book-open" size={48} color={isDarkMode ? "#666" : "#CCC"} />
              <Text style={[
                styles.modalEmptyText,
                isDarkMode ? styles.textLight : styles.textDark
              ]}>
                Aucune formation à venir
              </Text>
              <Text style={[
                styles.modalEmptySubtext,
                isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
              ]}>
                Vos prochaines formations approuvées apparaîtront ici
              </Text>
            </View>
          ) : (
            <FlatList
              data={formations}
              renderItem={renderFormationItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalListContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={formationsLoading}
                  onRefresh={() => fetchFormations()}
                  tintColor={isDarkMode ? "#ffffff" : "#0e135f"}
                />
              }
            />
          )}
        </SafeAreaView>
      </Modal>

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
  // Styles pour le modal des formations
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderLight: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalHeaderDark: {
    backgroundColor: "#1a1f38",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  modalEmptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  modalEmptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  modalListContainer: {
    padding: 16,
  },
  formationCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  formationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  formationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  formationInfo: {
    flex: 1,
  },
  formationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  formationDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  formationDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  formationDetails: {
    gap: 8,
  },
  formationDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formationDetailText: {
    fontSize: 13,
    flex: 1,
  },
})

export default AccueilCollaborateur