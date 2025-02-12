import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Avatar, Button } from 'react-native-paper';

// Définition du type des données
interface Personnel {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  date_naiss: string;
  role: string;
  active: boolean; 
  matricule:string;
}

// URL de l'API
const API_URL = 'http://192.168.1.32:8080/api/Personnel/all';

const PersonnelListScreen: React.FC = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération des données depuis l'API
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        const data: Personnel[] = await response.json();
        setPersonnel(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonnel();
  }, []);

  // Affichage de l'indicateur de chargement ou d'un message d'erreur
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // Fonction pour afficher un élément de la liste
  const renderItem = ({ item }: { item: Personnel }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.id}>#{item.role}</Text>
        <View style={styles.row}>
          <Avatar.Text size={40} label={item.nom.charAt(0)} style={styles.avatar} />
          <View style={styles.details}>
            <Text style={styles.name}>{item.nom} {item.prenom}</Text>
            <Text style={styles.email}>{item.email}</Text>
            {/* Nouvelle disposition : Date de naissance + Bouton */}
            <View style={styles.rowButtonContainer}>
              <Text style={styles.matricule}>matricule :  {item.matricule}</Text>
              <Button
                mode="contained"
                compact
                style={[styles.button, { backgroundColor: item.active ? '#008000' : '#888' }]}
                labelStyle={styles.buttonText}
              >
                {item.active ? 'Activé' : 'Désactivé'}
              </Button>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList<Personnel>
        data={personnel}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

export default PersonnelListScreen;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 16,
    color: 'red',
  },
  card: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: '#fff',
    padding: 10,
    position: 'relative',
  },
  id: {
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6200EE',
  },
  details: {
    marginLeft: 10,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  rowButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Assure l'alignement entre la date et le bouton
    marginTop: 5,
  },
  matricule: {
    fontSize: 12,
    color: '#888',
  },
  button: {
    minWidth: 80, // Taille réduite du bouton
    paddingHorizontal: 5,
  },
  buttonText: {
    fontSize: 12, // Texte plus petit pour un bouton compact
  },
});
