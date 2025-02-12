import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DatePicker from 'react-native-date-picker';
import { Picker } from '@react-native-picker/picker';

// Define the props for the DemandeItem component
interface Demande {
  id_libre_demande: string;
  reponseChef: string;
  typeDemande: string;
  dateDebut: string;
  dateFin: string;
  texteDemande: string;
  heureSortie?: string;
  heureRetour?: string;
  snjTempDep?: string;
  snjTempRetour?: string;
  nbrJours?: number;
  dateDemande: string;
  matPers: {
    nom: string;
  };
}

interface DemandeItemProps {
  item: Demande;
}

const DemandeItem: React.FC<DemandeItemProps> = ({ item }) => {
  const statusColor: { [key: string]: string } = {
    I: '#80C4E9', // Pending (Light blue)
    A: '#90EE90', // Approved (Light green)
    R: '#D3D3D3', // Rejected (Light gray)
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.demandeId}>#{item.id_libre_demande}</Text>
        <Badge style={[styles.badge, { backgroundColor: statusColor[item.reponseChef] || '#ADD8E6' }]}>
          {item.reponseChef === 'I' ? 'Pending' : item.reponseChef === 'A' ? 'Approved' : 'Rejected'}
        </Badge>
      </View>
      <View style={styles.content}>
        <Icon name="account-circle" size={20} color="#555" />
        <Text style={styles.user}>{item.matPers.nom}</Text>
      </View>
      <Text style={styles.detail}>Type: {item.typeDemande}</Text>
      <Text style={styles.detail}>Start Date: {new Date(item.dateDebut).toLocaleDateString()}</Text>
      <Text style={styles.detail}>End Date: {new Date(item.dateFin).toLocaleDateString()}</Text>
      <Text style={styles.detail}>Text: {item.texteDemande}</Text>
      {item.typeDemande === 'autorisation' && (
        <>
          <Text style={styles.detail}>Departure Time: {item.heureSortie}</Text>
          <Text style={styles.detail}>Return Time: {item.heureRetour}</Text>
        </>
      )}
      {item.typeDemande === 'congé' && (
        <>
          <Text style={styles.detail}>Departure Time: {item.snjTempDep}</Text>
          <Text style={styles.detail}>Return Time: {item.snjTempRetour}</Text>
          <Text style={styles.detail}>Number of Days: {item.nbrJours}</Text>
        </>
      )}
      <Text style={styles.date}>Requested on: {new Date(item.dateDemande).toLocaleDateString()}</Text>
    </View>
  );
};

const ListDemandesScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredDemandes, setFilteredDemandes] = useState<Demande[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

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

  const fetchDemandes = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (!userInfoString) {
        console.error('User info not found');
        return;
      }

      const userInfo = JSON.parse(userInfoString);
      const matPersId = userInfo.id;

      const responseAutorisation = await axios.get(
        `http://192.168.1.32:8080/api/demande-autorisation`
      );

      const responseConge = await axios.get(
        `http://192.168.1.32:8080/api/demande-conge`
      );

      const combinedDemandes = [
        ...responseAutorisation.data.map((d: any) => ({ ...d, typeDemande: 'autorisation' })),
        ...responseConge.data.map((d: any) => ({ ...d, typeDemande: 'congé' })),
      ];

      setDemandes(combinedDemandes);
      setFilteredDemandes(combinedDemandes);
    } catch (error) {
      console.error('Error fetching demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThemePreference();
    fetchDemandes();
  }, []);

  useEffect(() => {
    let filtered = demandes;

    if (selectedType !== 'all') {
      filtered = filtered.filter(demande => demande.typeDemande === selectedType);
    }

    if (selectedDate) {
      filtered = filtered.filter(demande => new Date(demande.dateDebut).toDateString() === selectedDate.toDateString());
    }

    setFilteredDemandes(filtered);
  }, [selectedType, selectedDate, demandes]);

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    try {
      await AsyncStorage.setItem('@theme_mode', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const handleLogout = () => {
    console.log('User logged out');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#333' : '#F9F9F9' }]}>
            <Text style={styles.title}>List des Demandes</Text>

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedType}
          style={styles.picker}
          onValueChange={(itemValue: string) => setSelectedType(itemValue)}
        >
          <Picker.Item label="All Types" value="all" />
          <Picker.Item label="Autorisation" value="autorisation" />
          <Picker.Item label="Congé" value="congé" />
        </Picker>

        <Text style={styles.datePickerLabel} onPress={() => setDatePickerVisible(true)}>
          {selectedDate ? selectedDate.toDateString() : 'Select Start Date'}
        </Text>
        <DatePicker
          modal
          open={datePickerVisible}
          date={selectedDate || new Date()}
          mode="date"
          onConfirm={(date) => {
            setDatePickerVisible(false);
            setSelectedDate(date);
          }}
          onCancel={() => setDatePickerVisible(false)}
        />
      </View>

      <FlatList
        data={filteredDemandes}
        renderItem={({ item }) => <DemandeItem item={item} />}
        keyExtractor={(item) => item.id_libre_demande}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demandeId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  user: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    marginTop: 5,
  },
  date: {
    fontSize: 14,
    marginTop: 5,
    color: '#555',
  },
  filterContainer: {
    marginBottom: 20,
  },
  picker: {
    height: 50,
    marginBottom: 10,
  },
  datePickerLabel: {
    fontSize: 16,
    color: '#007BFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  // Add the 'card' style here
  card: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // For Android
  },
});

export default ListDemandesScreen;
