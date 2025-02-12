import React, { useState, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SidebarLayout from './SidebarLayout';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config';

const Conge = () => {
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [periodeDebut, setPeriodeDebut] = useState<'M' | 'S'>('M'); // 'M' for Matin, 'S' for Soir
  const [periodeFin, setPeriodeFin] = useState<'M' | 'S'>('M'); // 'M' for Matin, 'S' for Soir
  const [showPickerDebut, setShowPickerDebut] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [texteDemande, setTexteDemande] = useState('');
  const [nbrJours, setNbrJours] = useState('0');

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'You need to grant permission to access files.');
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    const diffTime = dateFin.getTime() - dateDebut.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setNbrJours(diffDays >= 0 ? diffDays.toString() : '0');
  }, [dateDebut, dateFin]);

  const onChangeDebut = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') setShowPickerDebut(false);
    if (selectedDate) setDateDebut(selectedDate);
  };

  const onChangeFin = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') setShowPickerFin(false);
    if (selectedDate) setDateFin(selectedDate);
  };

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

  const validateForm = () => {
    if (!texteDemande.trim()) {
      Alert.alert('Erreur', 'Le champ texte de demande est requis.');
      return false;
    }
    if (!file) {
      Alert.alert('Erreur', 'Veuillez joindre un fichier.');
      return false;
    }
    if (nbrJours === '0') {
      Alert.alert('Erreur', 'La durée du congé doit être d\'au moins un jour.');
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
    formData.append('dateFin', dateFin.toISOString().split('T')[0]);
    formData.append('texteDemande', texteDemande);
    formData.append('snjTempDep', periodeDebut); // Send "M" or "S" for Matin/Soir
    formData.append('snjTempRetour', periodeFin); // Send "M" or "S" for Matin/Soir
    formData.append('dateReprisePrev', dateFin.toISOString().split('T')[0]);
    formData.append('codeSoc', userInfo.codeSoc || 'defaultValue');
    formData.append('matPersId', matPersId);
    formData.append('nbrJours', nbrJours);

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

      const response = await axios.post('${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-conge/create', formData, {
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
      <ScrollView>
        <View style={styles.header}>
          <Icon name="assignment-add" size={24} color="#0e135f" />
          <Text style={styles.title}>Ajouter une Demande de congé</Text>
        </View>

        {/* Date Pickers */}
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

        <Text style={styles.label}>Période de début</Text>
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodButton, periodeDebut === 'M' && styles.selectedPeriod]}
            onPress={() => setPeriodeDebut('M')}
          >
            <Text style={styles.periodText}>Matin (M)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, periodeDebut === 'S' && styles.selectedPeriod]}
            onPress={() => setPeriodeDebut('S')}
          >
            <Text style={styles.periodText}>Soir (S)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Date de fin</Text>
        <TouchableOpacity onPress={() => setShowPickerFin(true)}>
          <View style={styles.inputContainer}>
            <Icon name="event" size={20} color="#999" />
            <TextInput
              style={styles.input}
              value={dateFin.toLocaleDateString()}
              editable={false}
            />
          </View>
        </TouchableOpacity>
        {showPickerFin && (
          <DateTimePicker
            value={dateFin}
            mode="date"
            display="default"
            onChange={onChangeFin}
          />
        )}

        <Text style={styles.label}>Période de fin</Text>
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodButton, periodeFin === 'M' && styles.selectedPeriod]}
            onPress={() => setPeriodeFin('M')}
          >
            <Text style={styles.periodText}>Matin (M)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, periodeFin === 'S' && styles.selectedPeriod]}
            onPress={() => setPeriodeFin('S')}
          >
            <Text style={styles.periodText}>Soir (S)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nombre de jours</Text>
        <TextInput
          style={styles.input}
          value={nbrJours}
          editable={false}
        />

        <Text style={styles.label}>Texte de la demande</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Entrez une demande"
          value={texteDemande}
          onChangeText={setTexteDemande}
        />

        <Text style={styles.label}>Pièce jointe</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={handleFileUpload}>
          <Icon name="attach-file" size={20} color="#999" />
          <Text style={styles.input}>{file ? file.name : 'Choisir un fichier'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Soumettre</Text>
        </TouchableOpacity>
      </ScrollView>
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
    fontSize: 16,
    color: '#333',
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
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  periodButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedPeriod: {
    backgroundColor: '#F1F0E8',
    borderColor: '#0e135f',
  },
  periodText: {
    fontSize: 16,
    color: '#333',
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

export default Conge;