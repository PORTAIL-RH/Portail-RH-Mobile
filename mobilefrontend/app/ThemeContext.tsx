import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  isThemeLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Load theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("@theme_mode");
        
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === "dark");
        } else {
          setIsDarkMode(systemColorScheme === "dark");
        }
      } catch (error) {
        console.error("Failed to load theme", error);
        setIsDarkMode(false);
      } finally {
        setIsThemeLoaded(true);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    try {
      await AsyncStorage.setItem("@theme_mode", newMode ? "dark" : "light");
      console.log("Theme saved:", newMode ? "dark" : "light");
    } catch (error) {
      console.error("Failed to save theme", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, isThemeLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Add default export to fix the warning
export default ThemeProvider;