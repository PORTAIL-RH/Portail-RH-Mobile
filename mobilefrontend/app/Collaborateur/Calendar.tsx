import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Navbar from '../Components/NavBar';
import Footer from '../Components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define DateObject manually
interface DateObject {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

type RootStackParamList = {
  Authentification: undefined;
  Conge: undefined;
  // Add other routes here
};

type CalendarScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Authentification'>;

const CalendarScreen = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const [selectedDate, setSelectedDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference();
      await getUserInfo();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('@theme_mode');
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === 'dark');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème :', error);
      setIsDarkMode(false);
    }
  };

  const getUserInfo = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userInfo');
      if (storedUser) {
        setUserName(JSON.parse(storedUser).name || 'Utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des informations utilisateur :', error);
    }
  };

  const toggleTheme = useCallback(async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    try {
      await AsyncStorage.setItem('@theme_mode', newTheme);
    } catch (error) {
      console.error('Erreur lors de l’enregistrement du thème :', error);
    }
  }, [isDarkMode]);

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('userToken');
      navigation.navigate('Authentification');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  }, [navigation]);

  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.container]}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.cardcalendar, themeStyles.cardcalendar]}>
          <Text style={[styles.title, themeStyles.title]}>📅 Calendrier des événements</Text>
          <Calendar
            key={isDarkMode ? 'dark' : 'light'}
            onDayPress={(day: DateObject) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: '#9370DB' },
              [new Date().toISOString().split('T')[0]]: { selected: true, selectedColor: '#FF4500' },
            }}
            theme={{
              selectedDayBackgroundColor: '#9370DB',
              todayTextColor: '#FF4500',
              arrowColor: '#9370DB',
              monthTextColor: isDarkMode ? '#fff' : '#17153B',
              textSectionTitleColor: '#9370DB',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
              backgroundColor: isDarkMode ? '#17153B' : '#fff',
              calendarBackground: isDarkMode ? '#17153B' : '#fff',
              dayTextColor: isDarkMode ? '#e0e0e0' : '#102C57',
            }}
          />
         
        </View>

        {/* Bouton pour naviguer vers la page Congé */}
        <TouchableOpacity style={[styles.button, themeStyles.button]} onPress={() => navigation.navigate('Conge')}>
          <Text style={styles.buttonText}>📆 Demander un congé</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
};


const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  cardcalendar: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    width: '90%',
    marginVertical: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  selectedDate: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#102C57',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

const lightStyles = StyleSheet.create({
  container: {
    ...baseStyles.container,
    backgroundColor: '#fff',
  },
  cardcalendar: {
    ...baseStyles.cardcalendar,
    backgroundColor: '#fff',
  },
  title: {
    ...baseStyles.title,
    color: '#102C57',
  },
  selectedDate: {
    ...baseStyles.selectedDate,
    color: '#17153B',
  },
  button: {
    backgroundColor: '#102C57',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    ...baseStyles.container,
    backgroundColor: '#17153B',
  },
  cardcalendar: {
    ...baseStyles.cardcalendar,
    backgroundColor: '#102C57',
  },
  title: {
    ...baseStyles.title,
    color: '#17153B',
  },
  selectedDate: {
    ...baseStyles.selectedDate,
    color: '#e0e0e0',
  },
  button: {
    backgroundColor: '#7E99A3',
  },
});

const styles = StyleSheet.create(baseStyles);

export default CalendarScreen;