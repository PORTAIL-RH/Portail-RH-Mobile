import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/apiConfig"; // Make sure to import your API config

type LeaveDaysInfoProps = {
  isDarkMode: boolean;
};

interface LeaveData {
  remainingDays: number;
  totalDaysUsed: number;
  status: string;
  maxDaysPerYear: number;
  year: number;
  matPersId: string;
}

const LeaveDaysInfo: React.FC<LeaveDaysInfoProps> = ({ isDarkMode }) => {
  const [leaveData, setLeaveData] = useState<LeaveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = isDarkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found");
        }

        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch(
          `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-conge/days-used/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: LeaveData = await response.json();
        if (data.status !== "success") {
          throw new Error("Failed to fetch leave data");
        }

        setLeaveData(data);
      } catch (err) {
        console.error("Error fetching leave data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.daysLabel, { color: "#FF0000" }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  if (!leaveData) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.daysLabel}>No leave data available</Text>
      </View>
    );
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
  );
};

// Keep your existing theme and style definitions
const lightTheme = {
  background: '#FFFFFF',
  card: '#F8F9FA',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  accent: '#0D6EFD',
  success: '#198754',
};

const darkTheme = {
  background: '#1F2846',
  card: '#2A3655',
  textPrimary: '#F8F9FA',
  textSecondary: '#ADB5BD',
  accent: '#4D8AF0',
  success: '#2AAA6E',
};

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
});

export default LeaveDaysInfo;