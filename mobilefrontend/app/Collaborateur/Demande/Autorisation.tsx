import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  View,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SidebarLayout from './SidebarLayout';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config';

// Define the type for the file state
type DocumentPickerAsset = {
  uri: string;
  name: string;
  mimeType?: string;
};

const Autorisation = () => {
  const [dateDebut, setDateDebut] = useState(new Date());
  const [timeSortie, setTimeSortie] = useState(new Date());
  const [timeRetour, setTimeRetour] = useState(new Date());
  const [showPickerDebut, setShowPickerDebut] = useState(false);
  const [showPickerSortie, setShowPickerSortie] = useState(false);
  const [showPickerRetour, setShowPickerRetour] = useState(false);
  const [file, setFile] = useState<DocumentPickerAsset | null>(null); // Properly type the file state
  const [description, setDescription] = useState('');

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
      });

      if (result.canceled) {
        console.log('File selection cancelled by the user.');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0]; // Access the first selected file
        setFile(file);
        console.log('File selected:', file.name);
      } else {
        console.log('No file selected.');
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection du fichier.');
    }
  };

  const onChangeDebut = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') setShowPickerDebut(false);
    if (selectedDate) setDateDebut(selectedDate);
  };

  const onChangeSortie = (event: DateTimePickerEvent, selectedTime: Date | undefined) => {
    setShowPickerSortie(false);
    if (selectedTime) setTimeSortie(selectedTime);
  };

  const onChangeRetour = (event: DateTimePickerEvent, selectedTime: Date | undefined) => {
    setShowPickerRetour(false);
    if (selectedTime) setTimeRetour(selectedTime);
  };

  const validateForm = () => {
    if (!dateDebut || !timeSortie || !timeRetour || !description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
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

    const userInfoString = await AsyncStorage.getItem('userInfo');
    console.log('User Info:', userInfoString);

    if (!userInfoString) {
      Alert.alert('Erreur', 'Informations utilisateur non trouvées. Veuillez vous reconnecter.');
      return;
    }

    const userInfo = JSON.parse(userInfoString);
    const matPersId = userInfo.id; // Assuming the matricule is stored in the `id` field

    if (!matPersId) {
      Alert.alert('Erreur', 'Matricule utilisateur non trouvé. Veuillez vous reconnecter.');
      return;
    }

    const formData = new FormData();
    formData.append('dateDebut', dateDebut.toISOString().split('T')[0]);
    formData.append('dateFin', dateDebut.toISOString().split('T')[0]);
    formData.append('texteDemande', description);
    formData.append('heureSortie', timeSortie.toTimeString().split(' ')[0]);
    formData.append('heureRetour', timeRetour.toTimeString().split(' ')[0]);
    formData.append('codAutorisation', 'AUTORISATION_CODE');
    formData.append('codeSoc', 'SOC_CODE');
    formData.append('matPersId', matPersId); // Use the actual matPersId from userInfo

    if (file) {
      const fileUri = Platform.OS === 'android' ? file.uri : file.uri.replace('file://', '');
      formData.append('file', {
        uri: fileUri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name,
      } as any);
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('User Token:', token);

      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour soumettre une demande.');
        return;
      }

      const response = await axios.post('${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-autorisation/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API Response:', response.data);

      if (response.status === 200) {
        Alert.alert('Succès', 'Demande soumise avec succès!');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      if (axios.isAxiosError(error)) {
        Alert.alert('Erreur', error.response?.data?.message || "Une erreur est survenue lors de l'envoi de la demande.");
      } else if (error instanceof Error) {
        Alert.alert('Erreur', error.message);
      } else {
        Alert.alert('Erreur', "Une erreur inconnue est survenue.");
      }
    }
  };

  return (
    <SidebarLayout>
      <View style={styles.header}>
        <Icon name="fact-check" size={24} color="#0e135f" />
        <Text style={styles.title}>Ajouter une Demande d'Autorisation</Text>
      </View>

      <Text style={styles.label}>Date de début</Text>
      <TouchableOpacity onPress={() => setShowPickerDebut(true)}>
        <View style={styles.inputContainer}>
          <Icon name="event" size={20} color="#999" />
          <TextInput
            style={styles.input}
            value={dateDebut.toLocaleDateString()}
            editable={false}
          />
        </View>
      </TouchableOpacity>
      {showPickerDebut && (
        <DateTimePicker
          value={dateDebut}
          mode="date"
          display="default"
          onChange={onChangeDebut}
        />
      )}

      <Text style={styles.label}>Heure sortie</Text>
      <TouchableOpacity onPress={() => setShowPickerSortie(true)}>
        <View style={styles.inputContainer}>
          <Icon name="access-time" size={20} color="#999" />
          <TextInput
            style={styles.textArea}
            value={timeSortie.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            editable={false}
          />
        </View>
      </TouchableOpacity>
      {showPickerSortie && (
        <DateTimePicker
          value={timeSortie}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeSortie}
        />
      )}

      <Text style={styles.label}>Heure retour</Text>
      <TouchableOpacity onPress={() => setShowPickerRetour(true)}>
        <View style={styles.inputContainer}>
          <Icon name="access-time" size={20} color="#999" />
          <TextInput
            style={styles.textArea}
            value={timeRetour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            editable={false}
          />
        </View>
      </TouchableOpacity>
      {showPickerRetour && (
        <DateTimePicker
          value={timeRetour}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeRetour}
        />
      )}

      <Text style={styles.label}>Pièce jointe</Text>
      <TouchableOpacity style={styles.inputContainer} onPress={handleFileUpload}>
        <Icon name="attach-file" size={20} color="#999" />
        <Text style={styles.input}>{file ? file.name : 'Choisir un fichier'}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Description</Text>
      <View style={styles.inputContainer}>
        <Icon name="description" size={20} color="#999" />
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Entrez une description"
          onChangeText={(text) => setDescription(text)}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Soumettre</Text>
      </TouchableOpacity>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    padding: 10,
  },
  textArea: {
    flex: 1,
    padding: 10,
    textAlignVertical: 'top',
    height: 100,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#0e135f',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Autorisation;