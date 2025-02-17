import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SidebarLayout from './SidebarLayout';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config';
import Toast from 'react-native-toast-message';

const DemandeDocument = () => {
  const [texteDemande, setTexteDemande] = useState('');
  const [codeSoc, setCodeSoc] = useState('');
  const [matPersId, setMatPersId] = useState('');
  const [typeDemande, setTypeDemande] = useState('');
  const [objet, setObjet] = useState('');

  // Helper function to show toast messages
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
        setCodeSoc(userInfo.codeSoc || '');
        setMatPersId(userInfo.id || '');
      }
    };

    fetchUserInfo();
  }, []);

  const validateForm = () => {


    if (!matPersId.trim()) {
      showToast('error', 'L\'ID personnel est requis.');
      return false;
    }

    if (!objet.trim()) {
      showToast('error', 'L\'objet est requis.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    const formData = {
      objet,
      typeDemande: "Document",
      matPers: { id: matPersId },
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('User Token:', token);

      if (!token) {
        showToast('error', 'Vous devez être connecté pour soumettre une demande.');
        return;
      }

      const response = await axios.post(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-document/create`, formData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API Response:', response.data);

      if (response.status === 200) {
        showToast('success', 'Demande soumise avec succès!');
        setTexteDemande('');
        setObjet('');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      if (axios.isAxiosError(error)) {
        showToast('error', error.response?.data?.message || "Une erreur est survenue lors de l'envoi de la demande.");
      } else if (error instanceof Error) {
        showToast('error', error.message);
      } else {
        showToast('error', "Une erreur inconnue est survenue.");
      }
    }
  };

  return (
    <SidebarLayout>
      <ScrollView>
        <View style={styles.header}>
          <Icon name="assignment-add" size={24} color="#0e135f" />
          <Text style={styles.title}>Ajouter une Demande de document</Text>
        </View>

        <Text style={styles.label}>Objet</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez l'objet"
          value={objet}
          onChangeText={setObjet}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Soumettre</Text>
        </TouchableOpacity>
      </ScrollView>
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
    height: 100,
    textAlignVertical: 'top',
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
});

export default DemandeDocument;