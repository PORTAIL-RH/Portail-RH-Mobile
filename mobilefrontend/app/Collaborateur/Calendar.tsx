import { useEffect, useState, useCallback } from "react"
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
  RefreshControl,
  Modal,
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
} from "lucide-react-native"
import Footer from "../Components/Footer"
import { API_CONFIG } from "../config/apiConfig"
import useApiPooling from "../useApiPooling"

type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Demandestot: undefined
  Authentification: undefined
  Notifications: undefined
  Autorisation: undefined
  AjouterDemande: undefined
  Calendar: undefined
}

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList, "Calendar">

const { width } = Dimensions.get("window")

type CalendarEvent = {
  id: string
  title: string
  type: string
  startDate: Date
  endDate: Date
  status: "approved"
  duration: string
  comment?: string
}

const CalendarPage = () => {
  const navigation = useNavigation<CalendarNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refresh: refreshUserData,
  } = useApiPooling<{ nom: string; prenom: string; role: string }>({
    apiCall: async () => {
      const userInfoStr = await AsyncStorage.getItem("userInfo")
      const token = await AsyncStorage.getItem("userToken")

      if (!userInfoStr || !token) {
        throw new Error("User information not available")
      }

      const parsedUser = JSON.parse(userInfoStr)
      const userId = parsedUser.id
      setUserId(userId)

      if (!userId) {
        throw new Error("User ID not available")
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/byId/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user information")
      }

      const data = await response.json()
      return {
        nom: data.nom || "User",
        prenom: data.prenom || "",
        role: data.role || "Collaborateur",
      }
    },
    storageKey: "user_profile_data",
    poolingInterval: 300000,
    dependsOnAuth: true,
  })

  const {
    data: calendarEvents,
    loading: eventsLoading,
    error: eventsError,
    refresh: refreshEvents,
  } = useApiPooling<CalendarEvent[]>({
    apiCall: async () => {
      if (!userId) {
        throw new Error("User ID not available")
      }

      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        throw new Error("Authentication token not available")
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-conge/personnel/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch leave requests")
      }

      const conges = await response.json()
      return mapEvents(conges, "congé")
    },
    storageKey: "user_calendar_events",
    poolingInterval: 60000,
    initialData: [],
    dependsOnAuth: true,
  })

  const mapEvents = (data: any[], type: string): CalendarEvent[] => {
    if (!Array.isArray(data)) return []

    return data
      .filter((item) => item.dateDebut && item.reponseChef === "O")
      .map((item) => {
        const startDate = new Date(item.dateDebut)
        const endDate = item.dateFin ? new Date(item.dateFin) : startDate

        return {
          id: item.id_libre_demande || item.id,
          title: `Demande de ${type}`,
          type: type,
          startDate: startDate,
          endDate: endDate,
          status: "approved",
          duration: item.nbrJours ? `${item.nbrJours} jour(s)` : "1 jour",
          comment: item.texteDemande || "",
        }
      })
  }

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

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("theme", newTheme)
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refreshUserData(true), refreshEvents(true)])
    setRefreshing(false)
  }, [refreshUserData, refreshEvents])

  const themeStyles = isDarkMode ? darkStyles : lightStyles

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    const days: { day: number | null; date: Date | null }[] = []

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, date: null })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      days.push({ day: i, date })
    }

    return days
  }

  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth)
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    setCurrentMonth(previousMonth)
  }

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setCurrentMonth(nextMonth)
  }

  const formatMonthName = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  const getDateEvents = (date: Date | null) => {
    if (!date || !calendarEvents) return []
    return calendarEvents.filter((event) => {
      const eventStartDate = new Date(event.startDate)
      const eventEndDate = new Date(event.endDate)

      const compareDate = new Date(date)
      compareDate.setHours(0, 0, 0, 0)

      const compareStartDate = new Date(eventStartDate)
      compareStartDate.setHours(0, 0, 0, 0)

      const compareEndDate = new Date(eventEndDate)
      compareEndDate.setHours(0, 0, 0, 0)

      return compareDate >= compareStartDate && compareDate <= compareEndDate
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  }

  const getApprovedEvents = () => {
    if (!calendarEvents) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return calendarEvents
      .filter(event => new Date(event.endDate) >= today)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
  }

  const handleDateSelect = (date: Date | null) => {
    if (!date) return
    setSelectedDate(date)
    const events = getDateEvents(date)
    if (events.length > 0) {
      setSelectedEvent(events[0])
      setShowEventModal(true)
    }
  }

  const daysOfWeek = ["D", "L", "M", "M", "J", "V", "S"]
  const daysInMonth = getDaysInMonth(currentMonth)
  const approvedEvents = getApprovedEvents()
  const isLoading = userLoading && eventsLoading && !calendarEvents

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={[styles.loadingText, themeStyles.text]}>Chargement du calendrier...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={[styles.calendarHeader, themeStyles.card]}>
            <View style={styles.userInfo}>
              <CalendarIcon size={24} color={isDarkMode ? "#4285F4" : "#4285F4"} />
              <Text style={[styles.userName, themeStyles.text]}>
                {userData ? `${userData.prenom} ${userData.nom}` : "Calendrier"}
              </Text>
            </View>
            <Text style={[styles.calendarSubtitle, themeStyles.text]}>Nombre total de jours congés par an :</Text>

            <Text style={[styles.calendarSubtitle, themeStyles.subtleText]}>Vos congés approuvés</Text>

          </View>

          <View style={[styles.monthNavigation, themeStyles.card]}>
            <TouchableOpacity style={styles.monthButton} onPress={goToPreviousMonth}>
              <ChevronLeft size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, themeStyles.text]}>{formatMonthName(currentMonth)}</Text>
            <TouchableOpacity style={styles.monthButton} onPress={goToNextMonth}>
              <ChevronRight size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
          </View>

          <View style={[styles.calendarContainer, themeStyles.card]}>
            <View style={styles.daysOfWeek}>
              {daysOfWeek.map((day, index) => (
                <View key={index} style={styles.dayOfWeekCell}>
                  <Text style={[styles.dayOfWeekText, themeStyles.subtleText]}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {daysInMonth.map((day, index) => {
                if (!day.date) {
                  return <View key={index} style={[styles.calendarCell, styles.emptyCell]} />
                }

                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isToday = day.date && 
                              day.date.getDate() === today.getDate() && 
                              day.date.getMonth() === today.getMonth() && 
                              day.date.getFullYear() === today.getFullYear()

                const isSelected =
                  day.date.getDate() === selectedDate.getDate() &&
                  day.date.getMonth() === selectedDate.getMonth() &&
                  day.date.getFullYear() === selectedDate.getFullYear()

                const dateEvents = getDateEvents(day.date)
                const hasEvents = dateEvents.length > 0

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarCell,
                      isToday && styles.todayCell,
                      isSelected && styles.selectedCell,
                      hasEvents && styles.approvedCell,
                    ]}
                    onPress={() => handleDateSelect(day.date)}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        themeStyles.text,
                        isToday && styles.todayText,
                        isSelected && styles.selectedText,
                        hasEvents && styles.approvedText,
                      ]}
                    >
                      {day.day}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <View style={[styles.legendContainer, themeStyles.card]}>
            <Text style={[styles.legendTitle, themeStyles.text]}>Légende</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColorBox, { backgroundColor: "rgba(76, 175, 80, 0.2)" }]} />
                <Text style={[styles.legendText, themeStyles.text]}>Jour de congé approuvé</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, themeStyles.text]}>Prochains congés</Text>

            {approvedEvents.length === 0 ? (
              <View style={[styles.emptyEvents, themeStyles.card]}>
                <Text style={[styles.emptyEventsText, themeStyles.subtleText]}>Aucun congé approuvé à venir</Text>
              </View>
            ) : (
              approvedEvents.slice(0, 3).map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, themeStyles.card]}
                  onPress={() => {
                    setSelectedEvent(event)
                    setShowEventModal(true)
                  }}
                >
                  <View style={styles.eventCardHeader}>
                    <View style={styles.eventTypeContainer}>
                      <Text style={[styles.eventType, themeStyles.text]}>{event.title}</Text>
                      <CheckCircle2 size={16} color="#4CAF50" />
                    </View>
                    <Text style={[styles.eventDuration, themeStyles.subtleText]}>{event.duration}</Text>
                  </View>

                  <View style={styles.eventDates}>
                    <View style={styles.dateContainer}>
                      <Text style={[styles.dateLabel, themeStyles.subtleText]}>Du:</Text>
                      <Text style={[styles.dateValue, themeStyles.text]}>{formatDate(new Date(event.startDate))}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Text style={[styles.dateLabel, themeStyles.subtleText]}>Au:</Text>
                      <Text style={[styles.dateValue, themeStyles.text]}>{formatDate(new Date(event.endDate))}</Text>
                    </View>
                  </View>

                  {event.comment && (
                    <Text style={[styles.eventComment, themeStyles.subtleText]} numberOfLines={2}>
                      Note: {event.comment}
                    </Text>
                  )}

                  <View style={[styles.eventStatusBar, { backgroundColor: "#4CAF50" }]} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, themeStyles.card]}>
            {selectedEvent && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, themeStyles.text]}>{selectedEvent.title}</Text>
                  <TouchableOpacity onPress={() => setShowEventModal(false)}>
                    <XCircle size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.modalStatusContainer}>
                    <CheckCircle2 size={24} color="#4CAF50" />
                    <Text style={[styles.modalStatusText, { color: "#4CAF50" }]}>Approuvé</Text>
                  </View>

                  <View style={styles.modalInfoItem}>
                    <Text style={[styles.modalInfoLabel, themeStyles.subtleText]}>Type:</Text>
                    <Text style={[styles.modalInfoValue, themeStyles.text]}>{selectedEvent.type}</Text>
                  </View>

                  <View style={styles.modalInfoItem}>
                    <Text style={[styles.modalInfoLabel, themeStyles.subtleText]}>Durée:</Text>
                    <Text style={[styles.modalInfoValue, themeStyles.text]}>{selectedEvent.duration}</Text>
                  </View>

                  <View style={styles.modalInfoItem}>
                    <Text style={[styles.modalInfoLabel, themeStyles.subtleText]}>Date de début:</Text>
                    <Text style={[styles.modalInfoValue, themeStyles.text]}>
                      {formatDate(new Date(selectedEvent.startDate))}
                    </Text>
                  </View>

                  <View style={styles.modalInfoItem}>
                    <Text style={[styles.modalInfoLabel, themeStyles.subtleText]}>Date de fin:</Text>
                    <Text style={[styles.modalInfoValue, themeStyles.text]}>
                      {formatDate(new Date(selectedEvent.endDate))}
                    </Text>
                  </View>

                  {selectedEvent.comment && (
                    <View style={styles.modalInfoItem}>
                      <Text style={[styles.modalInfoLabel, themeStyles.subtleText]}>Commentaire:</Text>
                      <Text style={[styles.modalInfoValue, themeStyles.text]}>{selectedEvent.comment}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalCloseButton, { backgroundColor: "#4CAF50" }]}
                  onPress={() => setShowEventModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Footer />
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
    paddingTop: 40,
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    backgroundColor: "rgba(0, 51, 133, 0.88)",
    borderRadius: 20,
  },
  selectedCell: {
    backgroundColor: "#4285F4",
  },
  approvedCell: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
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
  approvedText: {
    color: "#4CAF50",
    fontWeight: "bold",
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
  legendColorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
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
  emptyEvents: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyEventsText: {
    fontSize: 16,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventType: {
    fontSize: 16,
    fontWeight: "600",
  },
  eventDuration: {
    fontSize: 14,
  },
  eventDates: {
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
  eventComment: {
    fontSize: 14,
    fontStyle: "italic",
  },
  eventStatusBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    marginBottom: 16,
  },
  modalStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalInfoItem: {
    marginBottom: 12,
  },
  modalInfoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalCloseButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})

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
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1f38",
  },
  header: {
    backgroundColor: "#1F2846",
    borderBottomColor: "#1a1f38",
  },
  text: {
    color: "#E0E0E0",
  },
  subtleText: {
    color: "#AAAAAA",
  },
  card: {
    backgroundColor: "#1F2846",
    borderColor: "#1a1f38",
    borderWidth: 1,
  },
})

export default CalendarPage