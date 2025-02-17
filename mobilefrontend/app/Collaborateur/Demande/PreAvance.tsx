import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SidebarLayout from './SidebarLayout';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config';
import Toast from 'react-native-toast-message';

const DemandePretAvance = () => {
  const [texteDemande, setTexteDemande] = useState('');
  const [matPersId, setMatPersId] = useState('');
  const [typeAvance, setTypeAvance] = useState('');
  const [montant, setMontant] = useState('');
  const [typesAvance, setTypesAvance] = useState<[string, unknown][]>([]);
  const [montantMax, setMontantMax] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    Toast.show({
      type,
      text1: type === 'success' ? 'Success' : 'Error',
      text2: message,
    });
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        setMatPersId(userInfo.id || '');
      }
    };

    const fetchTypesAvance = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-pre-avance/types`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTypesAvance(Object.entries(response.data));
      } catch (error) {
        console.error('Error fetching types of advances:', error);
      }
    };

    fetchUserInfo();
    fetchTypesAvance();
  }, []);

  const validateForm = () => {
    if (!matPersId.trim()) {
      showToast('error', 'L\'ID personnel est requis.');
      return false;
    }
    if (!typeAvance.trim()) {
      showToast('error', 'Le type d\'avance est requis.');
      return false;
    }
    if (!montant.trim() || isNaN(Number(montant))) {
      showToast('error', 'Le montant doit être un nombre valide.');
      return false;
    }
    if (Number(montant) > Number(montantMax)) {
      showToast('error', `Le montant ne doit pas dépasser ${montantMax} € pour ce type d'avance.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showToast('error', 'Vous devez être connecté pour soumettre une demande.');
        return;
      }

      // Prepare the form data
      const formData = {
        typeDemande: typeAvance,
        montant: Number(montant),
        matPers: {
          id: matPersId, // Send only the id if the backend can handle it
        },
      };

      console.log('Submitting form data:', formData);

      // Submit the form
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-pre-avance/create`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response from backend:', response.data);

      if (response.status === 200) {
        showToast('success', 'Demande soumise avec succès!');
        // Reset form fields after successful submission
        setTypeAvance('');
        setMontant('');
        setMontantMax('');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error Response:', error.response?.data);
        showToast('error', error.response?.data?.message || 'Une erreur est survenue lors de l\'envoi de la demande.');
      } else if (error instanceof Error) {
        showToast('error', error.message);
      } else {
        showToast('error', 'Une erreur inconnue est survenue.');
      }
    }
  };

  const renderTypeItem = ({ item }: { item: [string, unknown] }) => (
    <TouchableOpacity
      style={[styles.typeCard, typeAvance === item[0] && styles.selectedTypeCard]}
      onPress={() => {
        setTypeAvance(item[0]);
        setMontantMax(String(item[1])); // Set the max amount for selected type
        setModalVisible(false);
      }}
    >
      <Text style={styles.typeText}>{item[0]}</Text>
    </TouchableOpacity>
  );

  return (
    <SidebarLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.header}>
            <Icon name="assignment-add" size={24} color="#0e135f" />
            <Text style={styles.title}>Ajouter une Demande de Pre-Avance</Text>
          </View>

          <Text style={styles.label}>Type</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.input}>
              {typeAvance ? typeAvance : "Sélectionner un type d'avance"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Montant</Text>
          <View style={styles.montantContainer}>
            <TextInput
              style={styles.input}
              placeholder="Entrez le montant"
              value={montant}
              onChangeText={setMontant}
              keyboardType="numeric"
            />
            {montantMax ? (
              <Text style={styles.maxMontantText}>Max: {montantMax} €</Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Soumettre</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={typesAvance}
              keyExtractor={(item) => item[0]}
              renderItem={renderTypeItem}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </SidebarLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#0e135f',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0e135f',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  typeCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  selectedTypeCard: {
    backgroundColor: '#e0e0e0',
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0e135f',
  },
  montantText: {
    fontSize: 14,
    color: '#666',
  },
  montantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  maxMontantText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalCloseButton: {
    marginTop: 10,
    backgroundColor: '#0e135f',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default DemandePretAvance;