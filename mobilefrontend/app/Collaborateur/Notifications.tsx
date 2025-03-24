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
import { ArrowLeft, Bell, Check, Clock, FileText, Moon, Sun, X } from "lucide-react-native"
import Footer from "../Components/Footer"

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
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "request",
      title: "Demande approuvée",
      description: "Votre demande d'attestation de travail a été approuvée",
      date: "Aujourd'hui",
      time: "10:30",
      read: false,
      status: "approved",
    },
    {
      id: 2,
      type: "request",
      title: "Demande en attente",
      description: "Votre demande de congé est en cours de traitement",
      date: "Aujourd'hui",
      time: "08:15",
      read: false,
      status: "pending",
    },
    {
      id: 3,
      type: "info",
      title: "Rappel",
      description: "Réunion d'équipe demain à 14h00",
      date: "Hier",
      time: "16:45",
      read: true,
      status: "info",
    },
    {
      id: 4,
      type: "request",
      title: "Demande rejetée",
      description: "Votre demande de matériel informatique a été rejetée",
      date: "23/05/2025",
      time: "11:20",
      read: true,
      status: "rejected",
    },
    {
      id: 5,
      type: "info",
      title: "Nouveau document",
      description: "Un nouveau document a été ajouté à votre dossier",
      date: "20/05/2025",
      time: "09:10",
      read: true,
      status: "info",
    },
  ])

  // Load theme preference on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference()
      // Simulate API call
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
    loadData()
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
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  // Get unread count
  const unreadCount = notifications.filter((notification) => !notification.read).length

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  // Get status icon based on notification status
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <Check size={20} color="#4CAF50" />
      case "rejected":
        return <X size={20} color="#F44336" />
      case "pending":
        return <Clock size={20} color="#FFC107" />
      case "info":
        return <FileText size={20} color="#2196F3" />
      default:
        return <Bell size={20} color="#9370DB" />
    }
  }

  // Get status color based on notification status
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#4CAF50"
      case "rejected":
        return "#F44336"
      case "pending":
        return "#FFC107"
      case "info":
        return "#2196F3"
      default:
        return "#9370DB"
    }
  }

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* Custom Header */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
            <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, themeStyles.text]}>Notifications</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
            {isDarkMode ? <Sun size={22} color="#E0E0E0" /> : <Moon size={22} color="#333" />}
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
          {/* Notifications Header */}
          <View style={[styles.notificationsHeader, themeStyles.notificationsHeader]}>
            <View style={styles.notificationsHeaderLeft}>
              <Text style={[styles.notificationsTitle, themeStyles.text]}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                <Text style={styles.markAllText}>Tout marquer comme lu</Text>
              </TouchableOpacity>
            )}
          </View>

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
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    themeStyles.card,
                    !notification.read && styles.unreadNotification,
                    !notification.read && themeStyles.unreadNotification,
                  ]}
                  onPress={() => markAsRead(notification.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationContent}>
                    <View
                      style={[
                        styles.notificationIconContainer,
                        { backgroundColor: `${getStatusColor(notification.status)}15` },
                      ]}
                    >
                      {getStatusIcon(notification.status)}
                    </View>
                    <View style={styles.notificationTextContainer}>
                      <Text style={[styles.notificationTitle, themeStyles.text]}>
                        {notification.title}
                        {!notification.read && (
                          <View style={styles.unreadDot}>
                            <Text> </Text>
                          </View>
                        )}
                      </Text>
                      <Text style={[styles.notificationDescription, themeStyles.subtleText]}>
                        {notification.description}
                      </Text>
                      <View style={styles.notificationMeta}>
                        <Text style={[styles.notificationDate, themeStyles.subtleText]}>
                          {notification.date} • {notification.time}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(notification.id)}>
                      <X size={18} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      )}

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
})

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
  },
  notificationsHeader: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: 1,
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
  unreadNotification: {
    backgroundColor: "#F9F5FF",
  },
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
  },
  notificationsHeader: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
    borderBottomWidth: 1,
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
  unreadNotification: {
    backgroundColor: "#2D2B3D",
  },
})

export default NotificationsPage

