import React from "react"
import { View, Text, StyleSheet, ActivityIndicator } from "react-native"

type LeaveDaysInfoProps = {
  isDarkMode: boolean
}

const LeaveDaysInfo: React.FC<LeaveDaysInfoProps> = ({ isDarkMode }) => {
  // Example data - replace with your actual data fetching logic
  const leaveData = {
    totalDaysUsed: 5,
    remainingDays: 25,
    maxDaysPerYear: 30,
    year: new Date().getFullYear(),
  }

  const theme = isDarkMode ? darkTheme : lightTheme
  const styles = createStyles(theme)

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

const lightTheme = {
  background: '#FFFFFF',
  card: '#F8F9FA',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  accent: '#0D6EFD',
  success: '#198754',
}

const darkTheme = {
  background: '#1F2846',
  card: '#2A3655',
  textPrimary: '#F8F9FA',
  textSecondary: '#ADB5BD',
  accent: '#4D8AF0',
  success: '#2AAA6E',
}

const createStyles = (theme: any) => StyleSheet.create({
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