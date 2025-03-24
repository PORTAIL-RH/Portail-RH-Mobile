"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react-native"
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

// Définir le type de navigation pour la page Calendrier
type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList, "Calendar">

const { width } = Dimensions.get("window")

// Définir le type de congé
type Leave = {
  id: string
  type: string
  startDate: Date
  endDate: Date
  status: "approved" | "rejected" | "pending"
  duration: string
  comment?: string
}

const CalendarPage = () => {
  const navigation = useNavigation<CalendarNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [userName, setUserName] = useState("Nom Utilisateur")

  // Charger les préférences de thème, les informations utilisateur et les demandes de congé
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference()
      const userId = await getUserInfo()
      if (userId) {
        await fetchLeaveRequests(userId)
      }
      // Simuler un délai d'appel API
      setTimeout(() => {
        setLoading(false)
        console.log("Chargement terminé") // Debug log
      }, 1000)
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

  // Basculer entre le mode clair et sombre
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des préférences de thème:", error)
    }
  }

  // Récupérer les informations utilisateur depuis AsyncStorage
  const getUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem("userInfo")
      if (userInfo) {
        const parsedUser = JSON.parse(userInfo)
        const userId = parsedUser.id
        const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/byId/${userId}`)
        if (!response.ok) {
          throw new Error("Échec de la récupération des informations utilisateur")
        }
        const data = await response.json()
        console.log("Informations utilisateur:", data) // Debug log
        setUserName(data.nom || "Utilisateur")
        return userId
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations utilisateur:", error)
    }
  }

  // Récupérer les demandes de congé depuis l'API
  const fetchLeaveRequests = async (userId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-conge/personnel/${userId}`)
      if (!response.ok) {
        throw new Error("Échec de la récupération des demandes de congé")
      }
      const data = await response.json()
      console.log("Demandes de congé:", data) // Debug log

      const formattedLeaves = data.map((leave: any) => ({
        id: leave.id,
        type: leave.typeDemande || "N/A",
        startDate: parseDate(leave.dateDebut),
        endDate: parseDate(leave.dateFin),
        status: mapStatus(leave.reponseChef, leave.reponseRH),
        duration: leave.nbrJours ? `${leave.nbrJours} jours` : "N/A",
        comment: leave.texteDemande || "Aucun commentaire",
      }))

      console.log("Demandes de congé formatées:", formattedLeaves) // Debug log
      setLeaves(formattedLeaves)
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes de congé:", error)
    }
  }

  // Parser les dates
  const parseDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.error("Date invalide:", dateString)
      return new Date() // Retourner la date actuelle en cas d'erreur
    }
    return date
  }

  // Mapper les statuts
  const mapStatus = (reponseChef: string, reponseRH: string) => {
    if (reponseChef === "O") {
      return "approved" // Seulement si reponseChef est "O"
    } else if (reponseChef === "N" || reponseRH === "I") {
      return "rejected"
    } 
  }

  // Appliquer les styles en fonction du thème
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  // Obtenir les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    // Ajuster pour le dimanche comme premier jour (0)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    const days: { day: number | null; date: Date | null }[] = []

    // Ajouter des emplacements vides pour les jours avant le premier jour du mois
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, date: null })
    }

    // Ajouter les jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      days.push({ day: i, date })
    }

    return days
  }

  // Aller au mois précédent
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth)
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    setCurrentMonth(previousMonth)
  }

  // Aller au mois suivant
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setCurrentMonth(nextMonth)
  }

  // Formater le nom du mois
  const formatMonthName = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  // Vérifier si une date a un congé
  const hasLeave = (date: Date) => {
    for (const leave of leaves) {
      const startDate = new Date(leave.startDate)
      const endDate = new Date(leave.endDate)

      // Vérifier si la date est comprise entre startDate et endDate
      if (date >= startDate && date <= endDate) {
        return { has: true, status: leave.status }
      }
    }
    return { has: false }
  }

  // Obtenir la couleur du statut du congé
  const getLeaveStatusColor = (status: "approved" | "rejected" | "pending") => {
    switch (status) {
      case "approved":
        return "#4CAF50"
      

    }
  }

  // Obtenir l'icône du statut du congé
  const getLeaveStatusIcon = (status: "approved" | "rejected" | "pending") => {
    switch (status) {
      case "approved":
        return <CheckCircle2 size={16} color="#4CAF50" />
       

    }
  }

  // Formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  }

  // Obtenir tous les congés approuvés
  const getApprovedLeaves = () => {
    return leaves
      .filter((leave) => leave.status === "approved") // Filtrer uniquement les congés approuvés
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) // Trier par date de début
  }

  // Jours de la semaine
  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

  // Jours du mois actuel
  const daysInMonth = getDaysInMonth(currentMonth)
  console.log("Jours du mois:", daysInMonth) // Debug log

  // Congés approuvés
  const approvedLeaves = getApprovedLeaves()
  console.log("Congés approuvés:", approvedLeaves) // Debug log

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* En-tête personnalisé */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
            <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, themeStyles.text]}>Calendrier des congés</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
            {isDarkMode ? <Sun size={22} color="#E0E0E0" /> : <Moon size={22} color="#333" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9370DB" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* En-tête du calendrier */}
          <View style={[styles.calendarHeader, themeStyles.card]}>
            <View style={styles.userInfo}>
              <CalendarIcon size={24} color={isDarkMode ? "#9370DB" : "#9370DB"} />
              <Text style={[styles.userName, themeStyles.text]}>{userName}</Text>
            </View>
            <Text style={[styles.calendarSubtitle, themeStyles.subtleText]}>Visualisez vos congés et demandes</Text>
          </View>

          {/* Navigation entre les mois */}
          <View style={[styles.monthNavigation, themeStyles.card]}>
            <TouchableOpacity style={styles.monthButton} onPress={goToPreviousMonth}>
              <ChevronLeft size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, themeStyles.text]}>{formatMonthName(currentMonth)}</Text>
            <TouchableOpacity style={styles.monthButton} onPress={goToNextMonth}>
              <ChevronRight size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
          </View>

          {/* Calendrier */}
          <View style={[styles.calendarContainer, themeStyles.card]}>
            {/* Jours de la semaine */}
            <View style={styles.daysOfWeek}>
              {daysOfWeek.map((day, index) => (
                <View key={index} style={styles.dayOfWeekCell}>
                  <Text style={[styles.dayOfWeekText, themeStyles.subtleText]}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Grille du calendrier */}
            <View style={styles.calendarGrid}>
              {daysInMonth.map((day, index) => {
                const isToday =
                  day.date &&
                  day.date.getDate() === new Date().getDate() &&
                  day.date.getMonth() === new Date().getMonth() &&
                  day.date.getFullYear() === new Date().getFullYear()

                const isSelected =
                  day.date &&
                  day.date.getDate() === selectedDate.getDate() &&
                  day.date.getMonth() === selectedDate.getMonth() &&
                  day.date.getFullYear() === selectedDate.getFullYear()

                const leaveInfo = day.date ? hasLeave(day.date) : { has: false }
                console.log("Informations sur le congé:", leaveInfo) // Debug log

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarCell,
                      isToday && styles.todayCell,
                      isToday && themeStyles.todayCell,
                      isSelected && styles.selectedCell,
                      isSelected && themeStyles.selectedCell,
                      !day.day && styles.emptyCell,
                    ]}
                    onPress={() => day.date && setSelectedDate(day.date)}
                    disabled={!day.day}
                  >
                    {day.day && (
                      <>
                        <Text
                          style={[
                            styles.calendarDayText,
                            themeStyles.text,
                            isToday && styles.todayText,
                            isSelected && styles.selectedText,
                          ]}
                        >
                          {day.day}
                        </Text>
                        {leaveInfo.has && (
                          <View
                            style={[styles.leaveIndicator, { backgroundColor: getLeaveStatusColor(leaveInfo.status) }]}
                          />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Légende */}
          <View style={[styles.legendContainer, themeStyles.card]}>
            <Text style={[styles.legendTitle, themeStyles.text]}>Légende</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
                <Text style={[styles.legendText, themeStyles.text]}>Approuvé</Text>
              </View>
              
            </View>
          </View>

          {/* Congés approuvés */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, themeStyles.text]}>Congés Approuvés</Text>

            {approvedLeaves.length === 0 ? (
              <View style={[styles.emptyLeaves, themeStyles.card]}>
                <Text style={[styles.emptyLeavesText, themeStyles.subtleText]}>Aucun congé approuvé</Text>
              </View>
            ) : (
              approvedLeaves.map((leave) => (
                <View key={leave.id} style={[styles.leaveCard, themeStyles.card]}>
                  <View style={styles.leaveCardHeader}>
                    <View style={styles.leaveTypeContainer}>
                      <Text style={[styles.leaveType, themeStyles.text]}>{leave.type}</Text>
                      {getLeaveStatusIcon(leave.status)}
                    </View>
                    <Text style={[styles.leaveDuration, themeStyles.subtleText]}>{leave.duration}</Text>
                  </View>

                  <View style={styles.leaveDates}>
                    <View style={styles.dateContainer}>
                      <Text style={[styles.dateLabel, themeStyles.subtleText]}>Du:</Text>
                      <Text style={[styles.dateValue, themeStyles.text]}>{formatDate(leave.startDate)}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Text style={[styles.dateLabel, themeStyles.subtleText]}>Au:</Text>
                      <Text style={[styles.dateValue, themeStyles.text]}>{formatDate(leave.endDate)}</Text>
                    </View>
                  </View>

                  {leave.comment && (
                    <Text style={[styles.leaveComment, themeStyles.subtleText]}>Note: {leave.comment}</Text>
                  )}

                  <View style={[styles.leaveStatusBar, { backgroundColor: getLeaveStatusColor(leave.status) }]} />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

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
  backButton: {
    padding: 8,
    marginRight: 8,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  calendarHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  calendarSubtitle: {
    fontSize: 14,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  daysOfWeek: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  dayOfWeekCell: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: "500",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  emptyCell: {
    backgroundColor: "transparent",
  },
  todayCell: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  selectedCell: {
    backgroundColor: "#9370DB",
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: "500",
  },
  todayText: {
    fontWeight: "bold",
  },
  selectedText: {
    color: "white",
  },
  leaveIndicator: {
    position: "absolute",
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyLeaves: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyLeavesText: {
    fontSize: 16,
  },
  leaveCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  leaveCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leaveTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: "600",
  },
  leaveDuration: {
    fontSize: 14,
  },
  leaveDates: {
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    width: 30,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  leaveComment: {
    fontSize: 14,
    fontStyle: "italic",
  },
  leaveStatusBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
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
  todayCell: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  selectedCell: {
    backgroundColor: "#9370DB",
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
  },
  todayCell: {
    backgroundColor: "rgba(147, 112, 219, 0.2)",
  },
  selectedCell: {
    backgroundColor: "#9370DB",
  },
})

export default CalendarPage