import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Toast, { BaseToast } from 'react-native-toast-message';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { API_CONFIG, setApiConfig } from './config'; // Import the config

// Importation des composants
import Authentification from './Collaborateur/Authentification';
import AccueilCollaborateur from './Collaborateur/AcceuilCollaborateur';
import Profile from './Collaborateur/Profile';
import Demande from './Collaborateur/Demande';
import Calendar from './Collaborateur/Calendar';
import Autorisation from './Collaborateur/Demande/Autorisation';
import Document from './Collaborateur/Demande/Document';
import Pret from './Collaborateur/Demande/PreAvance';
import AjouterDemande from './Collaborateur/Demande/AjouterDemande';

import Conge from './Collaborateur/Demande/Conge';
import Formation from './Collaborateur/Demande/Formation';
import SidebarLayout from './Collaborateur/Demande/SidebarLayout';
import AdminDashboard from './Admin/AdminDashboard';
import AdminSideBar from './Admin/AdminSideBar';
import Notifications from './Admin/Notifications';
import Demandes from './Collaborateur/Demande/Demandes';
import DemandesAdmin from './Admin/DemandesAdmin'
import Personnel from './Admin/Personnel'

// Hook personnalisé (vérifie bien son chemin)
import { useColorScheme } from '@/hooks/useColorScheme';

// Empêcher la fermeture automatique du Splash Screen
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Set the API configuration dynamically
  useEffect(() => {
    setApiConfig("http://192.168.1.32", "8080"); // Set your desired base URL and port here
  }, []);

  // Écran de chargement si les polices ne sont pas encore chargées
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Gestion d'erreur pour les polices
  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Erreur de chargement des polices</Text>
      </View>
    );
  }

  return (
    <>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Authentification" component={Authentification} options={{ title: 'Connexion' }} />
          <Stack.Screen name="AccueilCollaborateur" component={AccueilCollaborateur} options={{ title: 'AccueilCollaborateur' }} />
          <Stack.Screen name="Profile" component={Profile} options={{ title: 'Profil' }} />
          <Stack.Screen name="Demande" component={Demande} options={{ title: 'Demandes' }} />
          <Stack.Screen name="Demandestot" component={Demandes} options={{ title: 'Demandestot' }} />

          <Stack.Screen name="Calendar" component={Calendar} options={{ title: 'Calendrier' }} />
          <Stack.Screen name="Autorisation" component={Autorisation} options={{ title: 'Autorisation' }} />
          <Stack.Screen name="Conge" component={Conge} options={{ title: 'Congés' }} />
          <Stack.Screen name="Document" component={Document} options={{ title: 'Document' }} />
          <Stack.Screen name="Pret" component={Pret} options={{ title: 'Pret' }} />
          <Stack.Screen name="AjouterDemande" component={AjouterDemande} options={{ title: 'AjouterDemande' }} />

          
          <Stack.Screen name="Formation" component={Formation} options={{ title: 'Formation' }} />
          <Stack.Screen name="SidebarLayout" component={SidebarLayout} options={{ title: 'Sidebar' }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Tableau de Bord Admin' }} />
          <Stack.Screen name="AdminSideBar" component={AdminSideBar} options={{ title: 'Sidebar Admin' }} />
          <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Notifications' }} />
          <Stack.Screen name="DemandesAdmin" component={DemandesAdmin} options={{ title: 'DemandesAdmin' }} />
          <Stack.Screen name="Personnel" component={Personnel} options={{ title: 'Personnel' }} />

        </Stack.Navigator>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>

      {/* Configuration de Toast */}
      <Toast
        config={{
          success: (props) => (
            <BaseToast
              {...props}
              style={{
                borderLeftColor: "green",
                position: "absolute", // Ensure position is absolute
                bottom: 800,
                right: 20,
              }}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{
                fontSize: 16,
                fontWeight: "bold",
              }}
              text2Style={{
                fontSize: 14,
              }}
            />
          ),
          error: (props) => (
            <BaseToast
              {...props}
              style={{
                borderLeftColor: "red",
                bottom: 800,
                right: 20,
              }}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{
                fontSize: 16,
                fontWeight: "bold",
              }}
              text2Style={{
                fontSize: 14,
              }}
            />
          ),
        }}
      />
    </>
  );
}