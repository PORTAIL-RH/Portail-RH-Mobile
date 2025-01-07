import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Corrected import
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Authentification from './Collaborateur/Authentification';
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator(); // Use the correct Native Stack Navigator

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();  // Hide splash screen once fonts are loaded
    }
  }, [fontsLoaded]);

  // If fonts are not loaded, show splash screen
  if (!fontsLoaded) {
    return null;  // Optionally, render a custom loading screen here
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator>
        {/* Authentication screen */}
        <Stack.Screen name="Authentification" component={Authentification} />
        
        {/* Main app screens */}
        
      </Stack.Navigator>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
