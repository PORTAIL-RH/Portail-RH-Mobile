import React, { useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SidebarLayout from './SidebarLayout';
import axios from 'axios'; // You'll need to install axios (npm install axios)
import * as DocumentPicker from 'expo-document-picker';

const Conge = () => {
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [heureDebut, setHeureDebut] = useState(new Date());
  const [heureFin, setHeureFin] = useState(new Date());
  const [showPickerDebut, setShowPickerDebut] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);
  const [showPickerHeureDebut, setShowPickerHeureDebut] = useState(false);
  const [showPickerHeureFin, setShowPickerHeureFin] = useState(false);
  const [file, setFile] = useState(null); // Store file object
  const [texteDemande, settexteDemande] = useState('');

  const onChangeDebut = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPickerDebut(false);
    if (selectedDate) setDateDebut(selectedDate);
  };

  const onChangeFin = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPickerFin(false);
    if (selectedDate) setDateFin(selectedDate);
  };

  const onChangeHeureDebut = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowPickerHeureDebut(false);
    if (selectedTime) setHeureDebut(selectedTime);
  };

  const onChangeHeureFin = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowPickerHeureFin(false);
    if (selectedTime) setHeureFin(selectedTime);
  };

  const handleFileUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (res.type === 'success') {
        setFile(res); // Save the file object
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('dateDebut', dateDebut.toISOString().split('T')[0]);
    formData.append('dateFin', dateFin.toISOString().split('T')[0]);
    formData.append('heureDebut', heureDebut.toTimeString().split(' ')[0]);
    formData.append('heureFin', heureFin.toTimeString().split(' ')[0]);
    formData.append('texteDemande', texteDemande);
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'application/octet-stream',
      name: file.name,
    });

    try {
      const response = await axios.post('http://localhost:8080/api/demande-conge/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.status === 200) {
        Alert.alert('Succès', 'Demande soumise avec succès!');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Une erreur est survenue lors de l'envoi de la demande.");
    }
  };

  return (
    <SidebarLayout>
      <ScrollView>
        <View style={styles.header}>
          <Icon name="assignment-add" size={24} color="#4c00b4" />
          <Text style={styles.title}>Ajouter congé</Text>
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

        <Text style={styles.label}>Heure de début</Text>
        <TouchableOpacity onPress={() => setShowPickerHeureDebut(true)}>
          <View style={styles.inputContainer}>
            <Icon name="schedule" size={20} color="#999" />
            <TextInput
              style={styles.input}
              value={heureDebut.toLocaleTimeString()}
              editable={false}
            />
          </View>
        </TouchableOpacity>
        {showPickerHeureDebut && (
          <DateTimePicker
            value={heureDebut}
            mode="time"
            display="default"
            onChange={onChangeHeureDebut}
          />
        )}

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

        <Text style={styles.label}>Heure de fin</Text>
        <TouchableOpacity onPress={() => setShowPickerHeureFin(true)}>
          <View style={styles.inputContainer}>
            <Icon name="schedule" size={20} color="#999" />
            <TextInput
              style={styles.input}
              value={heureFin.toLocaleTimeString()}
              editable={false}
            />
          </View>
        </TouchableOpacity>
        {showPickerHeureFin && (
          <DateTimePicker
            value={heureFin}
            mode="time"
            display="default"
            onChange={onChangeHeureFin}
          />
        )}

        <Text style={styles.label}>Texte de la demande</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Entrez une demande"
            value={texteDemande}
            onChangeText={settexteDemande}
          />
        </View>

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
    color: '#4c00b4',
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
    backgroundColor: '#4c00b4',
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

export default Conge;
