import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

import Navbar from '../Components/NavBar';
import Footer from '../Components/Footer';
import { API_CONFIG } from '../config';

// Define the navigation stack types
export type RootStackParamList = {
  AccueilCollaborateur: undefined;
  Profile: undefined;
  Demandestot: undefined;
  Authentification: undefined;
  Notifications: undefined;
  Autorisation: undefined;
};

// Define the navigation prop type
type AccueilCollaborateurNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AccueilCollaborateur'
>;

const AccueilCollaborateur = () => {
  const navigation = useNavigation<AccueilCollaborateurNavigationProp>();
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  // Load theme preference and user info on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference();
      await getUserInfo();
    };
    loadData();
  }, []);

  // Load theme preference from AsyncStorage
  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('@theme_mode');
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  // Toggle theme between light and dark mode
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    try {
      await AsyncStorage.setItem('@theme_mode', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Fetch user info from AsyncStorage and API
  const getUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUser = JSON.parse(userInfo);
        const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/byId/${parsedUser.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }
        const data = await response.json();
        setUserName(data.nom || 'Utilisateur');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('userToken');
      navigation.navigate('Authentification');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* Navbar */}
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} />

      {/* Content */}
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#9370DB" />
        ) : (
          <View style={[styles.welcomeContainer, themeStyles.welcomeContainer]}>
            <Text style={[styles.userName, themeStyles.text]}>Bienvenue, {userName} !</Text>
          </View>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
        {/* Requests Section */}
        <View style={styles.destinationSection}>
          <Text style={[styles.destinationTitle, themeStyles.text]}>Demandes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Demandestot')}>
            <Text style={[styles.viewAll, themeStyles.viewalldark]}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Add Request Section */}
        <View style={[styles.addRequestContainer, themeStyles.addRequestContainer]}>
          <Text style={[styles.addRequestText, themeStyles.text]}>Ajouter une nouvelle demande</Text>
          <TouchableOpacity
            style={styles.addRequestButton}
            onPress={() => navigation.navigate('Autorisation')}
          >
            <Text style={styles.addRequestButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
};

// Light and Dark Mode Styles
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
  },
  text: {
    color: '#000',
  },
  textH: {
    color: '#FFF',
  },
  welcomeContainer: {
    backgroundColor: '#FFF',
  },
  addRequestContainer: {
    backgroundColor: '#FFF',
  },
  viewalldark: {
    color: '#0e135f',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
  },
  text: {
    color: '#FFFFFF',
  },
  textH: {
    color: '#FFFFFF',
  },
  welcomeContainer: {
    backgroundColor: '#1E1E1E',
  },
  addRequestContainer: {
    backgroundColor: '#1E1E1E',
  },
  viewalldark: {
    color: '#9370DB',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 40,
  },
  welcomeContainer: {
    padding: 20,
    borderRadius: 15,
    shadowColor: '#191970',
    shadowOpacity: 0.3,
    shadowOffset: { width: 1, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  destinationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  destinationTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 16,
    fontWeight: '600',
  },
  addRequestContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
  },
  addRequestText: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '700',
  },
  addRequestButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#7E99A3',
    alignItems: 'center',
  },
  addRequestButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AccueilCollaborateur;