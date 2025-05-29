import React, { useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { API_CONFIG, setApiConfig } from './config/apiConfig';
import { ThemeProvider, useTheme } from "./ThemeContext";
import Toast from 'react-native-toast-message';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ColorSchemeName } from 'react-native';

// Importation des composants
import Authentification from './Collaborateur/Authentification';
import Documents from './Collaborateur/Documents';
import AccueilCollaborateur from './Collaborateur/AcceuilCollaborateur';
import Profile from './Collaborateur/Profile';
import Demande from './Collaborateur/Demande';
import Calendar from './Collaborateur/Calendar';
import Autorisation from './Collaborateur/Demande/Autorisation';
import Document from './Collaborateur/Demande/Document';
import Pret from './Collaborateur/Demande/PreAvance';
import AjouterDemande from './Collaborateur/Demande/AjouterDemande';
import Notifications from './Collaborateur/Notifications';
import Conge from './Collaborateur/Demande/Conge';
import Formation from './Collaborateur/Demande/Formation';
import SidebarLayout from './Collaborateur/Demande/SidebarLayout';
import AdminDashboard from './Admin/AdminDashboard';
import AdminSideBar from './Admin/AdminSideBar';
import Notificationsadmin from './Admin/Notifications';
import Demandes from './Collaborateur/Demande/Demandes';
import DemandesAdmin from './Admin/DemandesAdmin';
import Personnel from './Admin/Personnel';

// Hook personnalisé
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent auto splash screen hide
SplashScreen.preventAutoHideAsync();

// Define the type for the navigation stack params
export type RootStackParamList = {
  Authentification: undefined;
  AccueilCollaborateur: undefined;
  Profile: undefined;
  Demande: undefined;
  Demandestot: undefined;
  Documents: undefined;
  Calendar: undefined;
  Autorisation: undefined;
  Conge: undefined;
  Document: undefined;
  Pret: undefined;
  AjouterDemande: undefined;
  Notifications: undefined;
  Formation: undefined;
  SidebarLayout: { children: React.ReactNode; title: string };
  AdminDashboard: undefined;
  AdminSideBar: { navigation: any; onClose: () => void };
  Notificationsadmin: undefined;
  DemandesAdmin: undefined;
  Personnel: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface InnerRootLayoutProps {
  colorScheme: ColorSchemeName;
}

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

  useEffect(() => {
    setApiConfig("http://192.168.1.32", "8080");
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Erreur de chargement des polices</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <InnerRootLayout colorScheme={colorScheme || 'light'} />
      <Toast />
    </ThemeProvider>
  );
}

function InnerRootLayout({ colorScheme }: InnerRootLayoutProps) {
  const { isThemeLoaded } = useTheme();

  return (
    <>
      {isThemeLoaded ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Authentification" component={Authentification} options={{ title: 'Connexion' }} />
          <Stack.Screen name="AccueilCollaborateur" component={AccueilCollaborateur} options={{ title: 'AccueilCollaborateur' }} />
          <Stack.Screen name="Profile" component={Profile} options={{ title: 'Profil' }} />
          <Stack.Screen name="Demande" component={Demande} options={{ title: 'Demandes' }} />
          <Stack.Screen name="Demandestot" component={Demandes} options={{ title: 'Demandestot' }} />
          <Stack.Screen name="Documents" component={Documents} options={{ title: 'Documents' }} />
          <Stack.Screen name="Calendar" component={Calendar} options={{ title: 'Calendrier' }} />
          <Stack.Screen name="Autorisation" component={Autorisation} options={{ title: 'Autorisation' }} />
          <Stack.Screen name="Conge" component={Conge} options={{ title: 'Congés' }} />
          <Stack.Screen name="Document" component={Document} options={{ title: 'Document' }} />
          <Stack.Screen name="Pret" component={Pret} options={{ title: 'Pret' }} />
          <Stack.Screen name="AjouterDemande" component={AjouterDemande} options={{ title: 'AjouterDemande' }} />
          <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Notifications' }} />
          <Stack.Screen name="Formation" component={Formation} options={{ title: 'Formation' }} />
          <Stack.Screen 
            name="SidebarLayout" 
            component={SidebarLayout as React.ComponentType<any>}
            options={{ title: 'Sidebar' }} 
          />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Tableau de Bord Admin' }} />
          <Stack.Screen 
            name="AdminSideBar" 
            component={AdminSideBar as React.ComponentType<any>}
            options={{ title: 'Sidebar Admin' }} 
          />
          <Stack.Screen name="Notificationsadmin" component={Notificationsadmin} options={{ title: 'Notifications' }} />
          <Stack.Screen name="DemandesAdmin" component={DemandesAdmin} options={{ title: 'DemandesAdmin' }} />
          <Stack.Screen name="Personnel" component={Personnel} options={{ title: 'Personnel' }} />
        </Stack.Navigator>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading theme...</Text>
        </View>
      )}
      <StatusBar style={(colorScheme || 'light') === 'dark' ? 'light' : 'dark'} />
    </>
  );
}