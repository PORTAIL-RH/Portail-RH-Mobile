import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_CONFIG } from "../config/apiConfig"

// Define theme objects
const lightTheme = {
  background: 'transparent',
  card: '#ffffff',
  textPrimary: '#000000',
  textSecondary: '#6c757d',
  accent: '#007bff',
  success: '#28a745',
  error: '#dc3545',
}

const darkTheme = {
  background: 'transparent',
  card: '#1F2846',
  textPrimary: '#ffffff',
  textSecondary: '#adb5bd',
  accent: '#0d6efd',
  success: '#198754',
  error: '#dc3545',
}

const LeaveDaysInfo = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [leaveData, setLeaveData] = useState({
    totalDaysUsed: 0,
    remainingDays: 30,
    maxDaysPerYear: 30,
    year: new Date().getFullYear(),
  })

  const colorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark")
  
  // Get current theme
  const theme = isDarkMode ? darkTheme : lightTheme
  const styles = createStyles(theme)

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("@theme_mode")
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === "dark")
        } else {
          // If no stored preference, use system theme
          setIsDarkMode(colorScheme === "dark")
        }
      } catch (error) {
        console.error("Error loading theme preference:", error)
        // Fallback to system theme on error
        setIsDarkMode(colorScheme === "dark")
      }
    }
    loadThemePreference()
  }, [colorScheme])

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  useEffect(() => {
    const fetchLeaveDays = async () => {
      try {
        setLoading(true)

        const userInfoStr = await AsyncStorage.getItem("userInfo")
        if (!userInfoStr) throw new Error("User information not available")

        const userInfo = JSON.parse(userInfoStr)
        const userId = userInfo.id
        if (!userId) throw new Error("User ID not available")

        const token = await AsyncStorage.getItem("userToken")
        if (!token) throw new Error("Authentication token not available")

        const response = await fetch(
          `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-conge/days-used/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()

        if (data.status === "success") {
          setLeaveData({
            totalDaysUsed: data.totalDaysUsed,
            remainingDays: data.remainingDays,
            maxDaysPerYear: data.maxDaysPerYear,
            year: data.year,
          })
        } else {
          throw new Error(
            data.message || "Failed to fetch leave days information"
          )
        }
      } catch (err) {
        console.error("Error fetching leave days:", err)
        setError(err.message || "An error occurred while fetching leave days")
        setLeaveData((prev) => ({
          ...prev,
          remainingDays: prev.maxDaysPerYear - prev.totalDaysUsed,
        }))
      } finally {
        setLoading(false)
      }
    }

    fetchLeaveDays()
  }, [])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.accent} />
        <Text style={styles.loadingText}>Chargement des jours de congé...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <Text style={styles.infoText}>
          Jours utilisés: {leaveData.totalDaysUsed} / {leaveData.maxDaysPerYear}
        </Text>
        <Text style={styles.infoText}>Jours restants: {leaveData.remainingDays}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.daysContainer}>
        <View style={styles.daysBox}>
          <Text style={styles.daysLabel}>Jours utilisés</Text>
          <Text style={styles.daysValue}>{leaveData.totalDaysUsed}</Text>
        </View>

        <View style={styles.daysBox}>
          <Text style={styles.daysLabel}>Jours restants</Text>
          <Text style={[styles.daysValue, styles.remainingDays]}>
            {leaveData.remainingDays}
          </Text>
        </View>
      </View>

      <Text style={styles.yearText}>Année {leaveData.year}</Text>
      <Text style={styles.maxDaysText}>
        Total jours congés par an: {leaveData.maxDaysPerYear}
      </Text>
    </View>
  )
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.background,
      borderRadius: 8,
      marginVertical: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    loadingText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.textSecondary,
    },
    errorText: {
      color: theme.error,
      marginBottom: 8,
      fontSize: 14,
    },
    infoText: {
      fontSize: 14,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    daysContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    daysBox: {
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.card,
      width: "48%",
    },
    daysLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    daysValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.accent,
    },
    remainingDays: {
      color: theme.success,
    },
    yearText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 4,
    },
    maxDaysText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: "center",
    },
  })

export default LeaveDaysInfo