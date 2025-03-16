import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  isThemeLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("@theme_mode");
        if (storedTheme) {
          setIsDarkMode(storedTheme === "dark");
        } else if (systemColorScheme === "dark") {
          setIsDarkMode(true);
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      } finally {
        setIsThemeLoaded(true);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newThemeMode = !isDarkMode;
    setIsDarkMode(newThemeMode);
    await AsyncStorage.setItem("@theme_mode", newThemeMode ? "dark" : "light");
  };

  const value: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    isThemeLoaded,
  };

  return (
    <ThemeContext.Provider value={value}>
      {isThemeLoaded ? children : null}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};