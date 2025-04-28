import type React from "react"
import { StyleSheet, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

interface BackgroundGradientProps {
  isDarkMode: boolean
  children: React.ReactNode
}

const BackgroundGradient = ({ isDarkMode, children }: BackgroundGradientProps) => {
  return (
    <View style={styles.container}>
      {/* Rich gradient background - matches Authentification.tsx */}
      <LinearGradient
        colors={isDarkMode
          ? ["#1a1f38", "#2d3a65", "#1a1f38"]  // Dark theme gradient colors (left to right)
          : ["#f0f4f8", "#e2eaf2", "#f0f4f8"] // Light theme gradient colors (left to right)
        }
        start={{ x: 0, y: 0 }}  // Start from left
        end={{ x: 1, y: 0 }}    // End at right
        style={styles.backgroundGradient}
      />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
})

export default BackgroundGradient
