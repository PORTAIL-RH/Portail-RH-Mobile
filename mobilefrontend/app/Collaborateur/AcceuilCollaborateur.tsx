import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Switch, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';  

// Define the navigation stack types
export type RootStackParamList = {
  AcceuilCollaborateur: undefined;
  Profile: undefined;
};

// Define the navigation prop type
type AcceuilCollaborateurNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AcceuilCollaborateur'
>;

const AcceuilCollaborateur = () => {
  const navigation = useNavigation<AcceuilCollaborateurNavigationProp>();
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);  // Etat du mode

  const toggleSwitch = () => {
    setIsEnabled(previousState => !previousState);
    setIsDarkMode(previousState => !previousState);  // Basculer le mode
  };

  // Sauvegarde dans AsyncStorage
  const storeThemePreference = async () => {
    try {
      await AsyncStorage.setItem('@theme_mode', JSON.stringify(isDarkMode));
    } catch (error) {
      console.log('Erreur de stockage du mode', error);
    }
  };

  // Récupérer la préférence du mode au démarrage
  const getStoredTheme = async () => {
    try {
      const storedMode = await AsyncStorage.getItem('@theme_mode');
      if (storedMode !== null) {
        setIsDarkMode(JSON.parse(storedMode));
        setIsEnabled(JSON.parse(storedMode));  // Mettre à jour le switch
      }
    } catch (error) {
      console.log('Erreur de récupération du mode', error);
    }
  };

  // Utiliser useEffect pour récupérer et stocker le mode lorsque le composant se monte
  useEffect(() => {
    getStoredTheme();
  }, []);

  useEffect(() => {
    storeThemePreference();
  }, [isDarkMode]);

  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, themeStyles.container]}>
      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profile}>
            <View style={styles.profileImageContainer}>
              <Image source={require('../../assets/images/profile.png')} style={styles.profileImage} />
            </View>
            <Text style={[styles.profileName, themeStyles.text]}>Fida</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Image source={require('../../assets/images/notification.png')} style={styles.notificationIcon} />
          </TouchableOpacity>
           {/*<View style={styles.switchContainer}>
           <Switch
              trackColor={{ false: "#767577", true: "#9370DB" }}
              thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
           
          </View>*/}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={[styles.titleMauve, themeStyles.text]}>
            Welcome!<Text style={styles.titleBold}> </Text>
          </Text>
        </View>

        {/* Destination Section */}
        <View style={styles.destinationSection}>
          <Text style={[styles.destinationTitle, themeStyles.text]}>Demandes</Text>
          <Text style={styles.viewAll}>View all</Text>
        </View>

        {/* Add Request Section */}
        <View style={styles.addRequestContainer}>
          <Text style={styles.addRequestText}>Ajouter une nouvelle demande</Text>
          <TouchableOpacity
            style={styles.addRequestButton}
            onPress={() => navigation.navigate('Demande')}
          >
            <Text style={styles.addRequestButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNavigation, themeStyles.bottomNav]}>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../../assets/images/home.png')} style={styles.navIcon} />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../../assets/images/calendar.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../../assets/images/cloche.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.navItem}>
          <Image source={require('../../assets/images/profile.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};



const lightStyles = {
  container: {
    backgroundColor: '#F5F5F5',
  },
  text: {
    color: '#333',
  },
  bottomNav: {
    backgroundColor: '#FFF',
  },
};

const darkStyles = {
  container: {
    backgroundColor: '#333',
  },
  text: {
    color: '#FFF',
  },
  bottomNav: {
    backgroundColor: '#444',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 100, // Add padding to avoid overlapping with the bottom navigation
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 24,
    height: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  mainContent: {
    marginBottom: 20,
  },
  titleMauve: {
    fontSize: 36,
  },
  titleBold: {
    fontWeight: '700',
  },
  destinationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  destinationTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 16,
    color: '#9370DB',
  },
  addRequestContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  addRequestText: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
  },
  addRequestButton: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#9370DB',
    alignItems: 'center',
  },
  addRequestButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#DDD',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navText: {
    fontSize: 12,
    color: '#888',
  },
  navTextActive: {
    fontSize: 12,
    color: '#9370DB',
    fontWeight: '700',
  },
});

export default AcceuilCollaborateur;
