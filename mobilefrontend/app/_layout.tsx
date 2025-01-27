import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Authentification from './Collaborateur/Authentification';
import AcceuilCollaborateur from './Collaborateur/AcceuilCollaborateur';
import { useColorScheme } from '@/hooks/useColorScheme';
import Profile from './Collaborateur/Profile';
import Demande from './Collaborateur/Demande';
import Calendar from './Collaborateur/Calendar';
import Autorisation from './Collaborateur/Demande/Autorisation';
import Conge from './Collaborateur/Demande/Conge';
import Formation from './Collaborateur/Demande/Formation';
import SidebarLayout from './Collaborateur/Demande/SidebarLayout';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator(); // Use the correct Native Stack Navigator

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded or if there's an error
    }
  }, [fontsLoaded, fontError]);

  // If fonts are not loaded, show splash screen
  if (!fontsLoaded && !fontError) {
    return null; // Optionally, render a custom loading screen here
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Authentication screen */}
        <Stack.Screen
          name="Authentification"
          component={Authentification}
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name="AcceuilCollaborateur"
          component={AcceuilCollaborateur}
          options={{ title: 'AcceuilCollaborateur' }}
        />
        <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ title: 'Profile' }}
        />
        <Stack.Screen 
        name="Demande" 
        component={Demande} 
        options={{ title: 'Demande' }}
        />
        <Stack.Screen 
        name="Calendar" 
        component={Calendar} 
        options={{ title: 'Calendar' }}
        />
        <Stack.Screen 
        name="Autorisation" 
        component={Autorisation} 
        options={{ title: 'Autorisation' }}
        />
        <Stack.Screen 
        name="Conge" 
        component={Conge} 
        options={{ title: 'Conge' }}
        />
        <Stack.Screen 
        name="Formation" 
        component={Formation} 
        options={{ title: 'Formation' }}
        />
        <Stack.Screen 
        name="SidebarLayout" 
        component={SidebarLayout} 
        options={{ title: 'SidebarLayout' }}
        />
        

      </Stack.Navigator>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}