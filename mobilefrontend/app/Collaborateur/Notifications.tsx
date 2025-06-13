/*import { useEffect, useState } from "react"
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
  Alert,
  Modal,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ArrowLeft, Bell, Check, Clock, FileText, Moon, Sun, X } from "lucide-react-native"
import Footer from "../Components/Footer"
import useNotifications from "./useNotifications"
import { format } from "date-fns"*/

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
  Alert,
  Modal,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ArrowLeft, Bell, Check, Clock, FileText, Moon, Sun, X } from "lucide-react-native"
import Footer from "../Components/Footer"
import useNotifications from "./useNotifications"
import { format } from "date-fns"

// Define the notification type
type Notification = {
  id: string
  message: string
  timestamp: string
  viewed: boolean
  role?: string
  serviceId?: string
  personnelId?: string
  codeSoc?: string
}

// Define the navigation stack types
export type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Demandestot: undefined
  Authentification: undefined
  Notifications: undefined
  Autorisation: undefined
  AjouterDemande: undefined
}

// Define the navigation prop type
type NotificationsNavigationProp = NativeStackNavigationProp<RootStackParamList, "Notifications">

const { width } = Dimensions.get("window")

const NotificationsPage = () => {
  const navigation = useNavigation<NotificationsNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Use the custom hook for notifications
  const { notifications, unviewedCount, loading, error, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications()

  // Load theme preference on component mount
  useEffect(() => {
    loadThemePreference()
  }, [])

  // Load theme preference from AsyncStorage
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

  // Toggle theme between light and dark mode
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme)
      await AsyncStorage.setItem("theme", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  // Delete notification
  const deleteNotification = (id: string) => {
    Alert.alert("Supprimer la notification", "Êtes-vous sûr de vouloir supprimer cette notification ?", [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Supprimer",
        onPress: () => {
          Alert.alert("Fonctionnalité non disponible", "La suppression des notifications n'est pas encore implémentée.")
        },
        style: "destructive",
      },
    ])
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "Date inconnue"

    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return "Date inconnue"

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) {
      return `Aujourd'hui, ${format(date, "HH:mm")}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier, ${format(date, "HH:mm")}`
    } else {
      return format(date, "dd/MM/yyyy, HH:mm")
    }
  }

  // Open notification details modal
  const openNotificationDetails = async (notification: Notification) => {
    setSelectedNotification(notification)
    setModalVisible(true)

    // Mark as read when opened
    if (!notification.viewed) {
      const success = await markAsRead(notification.id)
      if (success) {
        console.log("Notification marked as read:", notification.id)
      }
    }
  }

  // Close notification details modal
  const closeNotificationDetails = () => {
    setModalVisible(false)
    setSelectedNotification(null)
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (unviewedCount === 0) {
      Alert.alert("Information", "Toutes les notifications sont déjà lues.")
      return
    }

    const success = await markAllAsRead()
    if (success) {
      Alert.alert("Succès", "Toutes les notifications ont été marquées comme lues.")
    } else {
      Alert.alert("Erreur", "Une erreur est survenue lors du marquage des notifications.")
    }
  }

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  // Get status icon based on notification content
  const getStatusIcon = (message: string) => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("approuvée") || lowerMessage.includes("acceptée")) {
      return <Check size={20} color="#4CAF50" />
    } else if (lowerMessage.includes("rejetée") || lowerMessage.includes("refusée")) {
      return <X size={20} color="#F44336" />
    } else if (lowerMessage.includes("attente") || lowerMessage.includes("en cours")) {
      return <Clock size={20} color="#FFC107" />
    } else if (lowerMessage.includes("document") || lowerMessage.includes("fichier")) {
      return <FileText size={20} color="#2196F3" />
    } else {
      return <Bell size={20} color="#9370DB" />
    }
  }

  // Get status color based on notification content
  const getStatusColor = (message: string) => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("approuvée") || lowerMessage.includes("acceptée")) {
      return "#4CAF50"
    } else if (lowerMessage.includes("rejetée") || lowerMessage.includes("refusée")) {
      return "#F44336"
    } else if (lowerMessage.includes("attente") || lowerMessage.includes("en cours")) {
      return "#FFC107"
    } else if (lowerMessage.includes("document") || lowerMessage.includes("fichier")) {
      return "#2196F3"
    } else {
      return "#9370DB"
    }
  }

  // Get notification title based on message content
  const getNotificationTitle = (message: string) => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("approuvée") || lowerMessage.includes("acceptée")) {
      return "Demande approuvée"
    } else if (lowerMessage.includes("rejetée") || lowerMessage.includes("refusée")) {
      return "Demande rejetée"
    } else if (lowerMessage.includes("attente") || lowerMessage.includes("en cours")) {
      return "Demande en attente"
    } else if (lowerMessage.includes("document") || lowerMessage.includes("fichier")) {
      return "Nouveau document"
    } else {
      return "Notification"
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchNotifications()
  }

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* Custom Header */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
            <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#0e135f"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, themeStyles.text]}>Notifications</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
            {isDarkMode ? <Sun size={22} color="#E0E0E0" /> : <Moon size={22} color="#333" />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={[styles.refreshText, themeStyles.text]}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9370DB" />
        </View>
      ) : (
        <>
          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, themeStyles.card]}>
              <Text style={[styles.errorText, themeStyles.text]}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              

              {/* Notifications List */}
              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {notifications.length === 0 ? (
                  <View style={[styles.emptyContainer, themeStyles.card]}>
                    <Bell size={48} color={isDarkMode ? "#555" : "#ccc"} />
                    <Text style={[styles.emptyText, themeStyles.text]}>Aucune notification</Text>
                    <Text style={[styles.emptySubtext, themeStyles.subtleText]}>
                      Vous n'avez pas de notifications pour le moment
                    </Text>
                  </View>
                ) : (
                  [...notifications]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((notification) => (
                      <TouchableOpacity
                        key={notification.id}
                        style={[
                          styles.notificationCard,
                          themeStyles.card,
                          !notification.viewed && styles.unreadNotification,
                          !notification.viewed && themeStyles.unreadNotification,
                        ]}
                        onPress={() => openNotificationDetails(notification)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.notificationContent}>
                          <View
                            style={[
                              styles.notificationIconContainer,
                              { backgroundColor: `${getStatusColor(notification.message)}15` },
                            ]}
                          >
                            {getStatusIcon(notification.message)}
                          </View>
                          <View style={styles.notificationTextContainer}>
                            <Text style={[styles.notificationTitle, themeStyles.text]}>
                              {getNotificationTitle(notification.message)}
                              {!notification.viewed && (
                                <View style={styles.unreadDot}>
                                  <Text> </Text>
                                </View>
                              )}
                            </Text>
                            <Text style={[styles.notificationDescription, themeStyles.subtleText]}>
                              {notification.message}
                            </Text>
                            <View style={styles.notificationMeta}>
                              <Text style={[styles.notificationDate, themeStyles.subtleText]}>
                                {formatTimestamp(notification.timestamp)}
                              </Text>
                            </View>
                          </View>
                          
                        </View>
                      </TouchableOpacity>
                    ))
                )}
              </ScrollView>
            </>
          )}
        </>
      )}

      {/* Notification Details Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeNotificationDetails}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, themeStyles.card]}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIconContainer,
                      { backgroundColor: `${getStatusColor(selectedNotification.message)}15` },
                    ]}
                  >
                    {getStatusIcon(selectedNotification.message)}
                  </View>
                  <Text style={[styles.modalTitle, themeStyles.text]}>
                    {getNotificationTitle(selectedNotification.message)}
                  </Text>
                  <TouchableOpacity onPress={closeNotificationDetails} style={styles.closeButton}>
                    <X size={24} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={[styles.modalMessage, themeStyles.text]}>{selectedNotification.message}</Text>

                  <View style={styles.modalDetails}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, themeStyles.subtleText]}>Date:</Text>
                      <Text style={[styles.detailValue, themeStyles.text]}>
                        {formatTimestamp(selectedNotification.timestamp)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, themeStyles.subtleText]}>Statut:</Text>
                      <Text style={[styles.detailValue, themeStyles.text]}>
                        {selectedNotification.viewed ? "Lu" : "Non lu"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#9370DB" }]}
                    onPress={closeNotificationDetails}
                  >
                    <Text style={styles.buttonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Footer */}
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
    paddingTop: 40,
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
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
  refreshText: {
    color: "#9370DB",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#9370DB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: "white",
    fontWeight: "500",
  },
  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: "#9370DB",
    fontWeight: "500",
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  notificationCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: "#9370DB",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9370DB",
    marginLeft: 6,
  },
  notificationDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  modalDetails: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "500",
  },
})

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: "#f0f4f8",
  },
  header: {
    backgroundColor: "#e2eaf2",
    borderBottomColor: "#d0d8e0",
  },
  notificationsHeader: {
    backgroundColor: "#e2eaf2",
    borderBottomColor: "#d0d8e0",
    borderBottomWidth: 1,
  },
  text: {
    color: "#1a1f38",
  },
  subtleText: {
    color: "#4a5568",
  },
  card: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: "#f0f4ff",
  },
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1f38",
  },
  header: {
    backgroundColor: "#1F2846",
    borderBottomColor: "#3a4a7a",
  },
  notificationsHeader: {
    backgroundColor: "#1a1f38",
    borderBottomColor: "#1a1f38",
    borderBottomWidth: 1,
  },
  text: {
    color: "#e2e8f0",
  },
  subtleText: {
    color: "#a0aec0",
  },
  card: {
    backgroundColor: "#1F2846",
    borderColor: "#3a4a7a",
    borderWidth: 1,
  },
  unreadNotification: {
    backgroundColor: "#3a4a7a",
  },
})

export default NotificationsPage
