import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Synchronizes theme settings across the app by ensuring both theme keys
 * (theme and @theme_mode) have the same value.
 */
export const synchronizeThemeSettings = async (): Promise<string | null> => {
  try {
    // Get both theme values
    const standardTheme = await AsyncStorage.getItem("theme")
    const legacyTheme = await AsyncStorage.getItem("@theme_mode")

    // If standard theme exists, use it as the source of truth
    if (standardTheme !== null) {
      // Update legacy theme if different
      if (legacyTheme !== standardTheme) {
        await AsyncStorage.setItem("@theme_mode", standardTheme)
        console.log("Updated @theme_mode to match theme:", standardTheme)
      }
      return standardTheme
    }
    // If only legacy theme exists, use it and update standard theme
    else if (legacyTheme !== null) {
      await AsyncStorage.setItem("theme", legacyTheme)
      console.log("Updated theme to match @theme_mode:", legacyTheme)
      return legacyTheme
    }

    // If neither exists, return null
    return null
  } catch (error) {
    console.error("Error synchronizing theme settings:", error)
    return null
  }
}

/**
 * Sets the theme across all theme keys used in the app
 */
export const setAppTheme = async (isDark: boolean): Promise<void> => {
  const themeValue = isDark ? "dark" : "light"
  try {
    await AsyncStorage.setItem("theme", themeValue)
    await AsyncStorage.setItem("@theme_mode", themeValue)
    console.log("Theme set to", themeValue)
  } catch (error) {
    console.error("Error setting theme:", error)
  }
}

/**
 * Gets the current theme setting, ensuring consistency across keys
 */
export const getAppTheme = async (): Promise<"dark" | "light" | null> => {
  const theme = await synchronizeThemeSettings()
  return theme as "dark" | "light" | null
}

