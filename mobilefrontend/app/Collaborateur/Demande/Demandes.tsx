import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Navbar from '../../Components/NavBar';
import Footer from '../../Components/Footer';

// Define the types for demandes
interface Demande {
  type: 'autorisation' | 'formation' | 'conge';
  id: string;
  dateDebut: string;
  dateFin: string;
  dateDemande: string;
  typeDemande: string;
  matPers: {
    id: string;
    codeSoc: string;
    prenom: string;
    nom: string;
  };
  texteDemande: string;
  reponseChef?: string;
  reponseRH?: string;
  heureSortie?: string;
  heureRetour?: string;
  codAutorisation?: string;
  titre?: {
    id: string;
    nom: string;
  };
  theme?: {
    id: string;
    nom: string;
  };
  annee_f?: string;
  files?: {
    id: string;
    nom: string;
    type: string;
  }[];
  nbrJours?: number;
}

// Define the props for the DemandeItem component
interface DemandeItemProps {
  item: Demande;
}

const DemandeItem: React.FC<DemandeItemProps> = ({ item }) => {
  let statusColor = '#ADD8E6'; // Default color
  let statusText = 'Pending';

  if (item.type === 'autorisation') {
    statusColor = {
      I: '#80C4E9', // Instantannée (Light blue)
      A: '#90EE90', // Approved (Light green)
      R: '#D3D3D3', // Rejected (Light gray)
    }[item.reponseChef || 'I'] || '#ADD8E6';
    statusText = item.reponseChef === 'I' ? 'Instantannée' : item.reponseChef === 'A' ? 'Approved' : 'Rejected';
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.demandeId}>#{item.id}</Text>
        {item.type === 'autorisation' && (
          <Badge style={[styles.badge, { backgroundColor: statusColor }]}>{statusText}</Badge>
        )}
      </View>
      <View style={styles.content}>
        <Icon name="account-circle" size={20} color="#555" />
        <Text style={styles.user}>{item.matPers.nom}</Text>
      </View>
      <Text style={styles.detail}>Type: {item.typeDemande}</Text>
      <Text style={styles.detail}>Start Date: {new Date(item.dateDebut).toLocaleDateString()}</Text>
      <Text style={styles.detail}>Text: {item.texteDemande}</Text>
      {item.type === 'formation' && (
        <>
          <Text style={styles.detail}>Titre: {item.titre?.nom}</Text>
          <Text style={styles.detail}>Thème: {item.theme?.nom}</Text>
        </>
      )}
      {item.type === 'conge' && (
        <Text style={styles.detail}>Nombre de Jours: {item.nbrJours}</Text>
      )}
      <Text style={styles.date}>Requested on: {new Date(item.dateDemande).toLocaleDateString()}</Text>
    </View>
  );
};

const ListDemandesScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch demandes from the backend
  const fetchDemandes = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (!userInfoString) {
        console.error('User info not found');
        return;
      }

      const userInfo = JSON.parse(userInfoString);
      const matPersId = userInfo.id;

      // Fetch all demandes in parallel
      const [autorisationResponse, formationResponse, congeResponse] = await Promise.all([
        axios.get(`http://192.168.1.32:8080/api/demande-autorisation/personnel/${matPersId}`),
        axios.get(`http://192.168.1.32:8080/api/demande-formation/personnel/${matPersId}`),
        axios.get(`http://192.168.1.32:8080/api/demande-conge/personnel/${matPersId}`),
      ]);

      // Combine all demandes into a single array with a type field
      const combinedDemandes: Demande[] = [
        ...(autorisationResponse.data.map((item: any) => ({ ...item, type: 'autorisation' }))),
        ...(formationResponse.data.map((item: any) => ({ ...item, type: 'formation' }))),
        ...(congeResponse.data.map((item: any) => ({ ...item, type: 'conge' }))),
      ];

      setDemandes(combinedDemandes);
    } catch (error) {
      console.error('Error fetching demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load theme preference and fetch demandes on component mount
  useEffect(() => {
    loadThemePreference();
    fetchDemandes();
  }, []);

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

  // Placeholder for logout functionality
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
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} />

      {/* Demandes List */}
      <Text style={styles.title}>List des Demandes</Text>
      <FlatList
        data={demandes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DemandeItem item={item} />}
      />

      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    margin: 30,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  demandeId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  user: {
    marginLeft: 5,
    fontSize: 15,
    fontWeight: '600',
  },
  detail: {
    fontSize: 14,
    color: '#555',
  },
  date: {
    marginTop: 5,
    fontSize: 12,
    color: '#888',
  },
});

export default ListDemandesScreen;