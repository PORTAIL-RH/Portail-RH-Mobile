import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navbar from '../Components/NavBar'; 
import Footer from '../Components/Footer'; 

type RootStackParamList = {
  AccueilCollaborateur: undefined;
  Profile: undefined;
  Calendar: undefined;
  Notifications: undefined;
};

const ProfilePage = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userInfo, setUserInfo] = useState<any>(null);
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

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

  // Fetch user data from AsyncStorage and API
  const getUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUser = JSON.parse(userInfo);
        const response = await fetch(`http://192.168.1.32:8080/api/Personnel/byId/${parsedUser.id}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.log('Erreur lors de la récupération des infos utilisateur', error);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  if (!userInfo) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode ? darkStyles.container : lightStyles.container]}>
        <Text style={isDarkMode ? darkStyles.text : lightStyles.text}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* Navbar */}
      <Navbar 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        handleLogout={() => { /* Add your logout logic here */ }} 
      />

      <View style={styles.contentContainer}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <Image
            source={userInfo.profileImage ? { uri: userInfo.profileImage } : require('../../assets/images/profile.png')}
            style={styles.profileImage}
          />
          <Text style={[styles.profileName, themeStyles.text]}>{userInfo.nom}</Text>

          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, themeStyles.text]}>Email:</Text>
            <Text style={[styles.infoText, themeStyles.text]}>{userInfo.email}</Text>

            <Text style={[styles.infoLabel, themeStyles.text]}>Matricule:</Text>
            <Text style={[styles.infoText, themeStyles.text]}>{userInfo.matricule}</Text>

            <Text style={[styles.infoLabel, themeStyles.text]}>Role:</Text>
            <Text style={[styles.infoText, themeStyles.text]}>{userInfo.role}</Text>
          </View>
        </View>
      </View>
      
      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
  },
  text: {
    color: '#000',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
  },
  text: {
    color: '#FFF',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#FFF',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#0e135f',
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#0e135f',
  },
  profileName: {
    fontSize: 30,
    fontWeight: '700',
    marginTop: 10,
    color: '#0e135f',
  },
  infoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0e135f',
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
});

export default ProfilePage;
