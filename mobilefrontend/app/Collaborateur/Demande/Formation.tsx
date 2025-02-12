import React, { useState, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableHighlight,
  FlatList,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SidebarLayout from './SidebarLayout';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import { API_CONFIG } from '../../config';

// Define interfaces for types, titles, and themes
interface Titre {
  id: string;
  name: string;
}

interface Type {
  id: string;
  name: string;
}

interface Theme {
  id: string;
  name: string;
}

const Formation = () => {
  const [selectedTitre, setSelectedTitre] = useState<{ id: string; name: string } | null>(null);
  const [selectedType, setSelectedType] = useState<{ id: string; name: string } | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<{ id: string; name: string } | null>(null);
  const [requestText, setRequestText] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [showPickerDebut, setShowPickerDebut] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);
  const [titres, setTitres] = useState<Titre[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'titre' | 'type' | 'theme' | null>(null);

  // Request file permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'You need to grant permission to access files.');
      }
    };
    requestPermissions();
  }, []);

  // Fetch titres on component mount
  useEffect(() => {
    fetchTitres();
  }, []);

  // Fetch all titres from the backend
  const fetchTitres = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No token found. User is not authenticated.');
        return;
      }

      const response = await axios.get(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Transform the data to match the expected structure
      const transformedTitres = response.data.map((titre: { id: string; titre: string }) => ({
        id: titre.id,
        name: titre.titre, // Use `titre.titre` as the name
      }));

      setTitres(transformedTitres); // Set the transformed titres in the state
    } catch (error) {
      console.error('Error fetching titres:', error);
      Alert.alert('Error', 'Failed to fetch titres. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch types by titreId
  const fetchTypesByTitreId = async (titreId: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No token found. User is not authenticated.');
        return;
      }

      const response = await axios.get(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/${titreId}/types`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Transform the data to match the expected structure
      const transformedTypes = response.data
        .filter((type: { id: string; type: string | null }) => type.type !== null) // Filter out null types
        .map((type: { id: string; type: string }) => ({
          id: type.id,
          name: type.type, // Use `type.type` as the name
        }));

      setTypes(transformedTypes);
    } catch (error) {
      console.error('Error fetching types:', error);
      Alert.alert('Error', 'Failed to fetch types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch themes by typeId
  const fetchThemesByTypeId = async (typeId: string) => {
    if (!selectedTitre) {
      console.error('No titre selected.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No token found. User is not authenticated.');
        return;
      }

      // Use selectedTitre.id from state
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/${selectedTitre.id}/types/${typeId}/themes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Transform the data to match the expected structure
      const transformedThemes = response.data
        .filter((theme: { id: string; theme: string | null }) => theme.theme !== null) // Filter out null themes
        .map((theme: { id: string; theme: string }) => ({
          id: theme.id,
          name: theme.theme, // Use `theme.theme` as the name
        }));

      setThemes(transformedThemes);
    } catch (error) {
      console.error('Error fetching themes:', error);
      Alert.alert('Error', 'Failed to fetch themes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
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
        console.log('File selected:', file.name); // Log the selected file
      } else {
        console.log('No file selected.');
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection du fichier.');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedTitre || !selectedType || !selectedTheme || !requestText || !file) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et sélectionner un fichier.');
      return;
    }

    const userInfoString = await AsyncStorage.getItem('userInfo');
    if (!userInfoString) {
      Alert.alert('Erreur', 'Informations utilisateur non trouvées. Veuillez vous reconnecter.');
      return;
    }

    const userInfo = JSON.parse(userInfoString);
    const matPersId = userInfo.id;

    if (!matPersId) {
      Alert.alert('Erreur', 'Matricule utilisateur non trouvé. Veuillez vous reconnecter.');
      return;
    }

    const formData = new FormData();
    formData.append('dateDebut', dateDebut.toISOString().split('T')[0]);
    formData.append('dateFin', dateFin.toISOString().split('T')[0]);
    formData.append('typeDemande', "formation");
    formData.append('texteDemande', requestText);
    formData.append('titre', selectedTitre.id);
    formData.append('type', selectedType.id);
    formData.append('theme', selectedTheme.id);
    formData.append('annee_f', new Date().getFullYear().toString());
    formData.append('codeSoc', userInfo.codeSoc || 'defaultValue');
    formData.append('matPersId', matPersId);

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
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour soumettre une demande.');
        return;
      }

      const response = await axios.post(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-formation/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('Succès', 'Demande de formation soumise avec succès.');
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la soumission de la demande.');
    }
  };

  // Handle date picker change for dateDebut
  const onChangeDebut = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || dateDebut;
    setShowPickerDebut(false);
    setDateDebut(currentDate);
  };

  // Handle date picker change for dateFin
  const onChangeFin = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || dateFin;
    setShowPickerFin(false);
    setDateFin(currentDate);
  };

  const renderModal = () => {
    const data = modalType === 'titre' ? titres : modalType === 'type' ? types : themes;
    const onSelect = (item: { id: string; name: string }) => {
      if (modalType === 'titre') {
        setSelectedTitre(item);
        setSelectedType(null);
        setSelectedTheme(null);
        fetchTypesByTitreId(item.id);
      } else if (modalType === 'type') {
        setSelectedType(item);
        setSelectedTheme(null);
        fetchThemesByTypeId(item.id);
      } else if (modalType === 'theme') {
        setSelectedTheme(item);
      }
      setModalVisible(false);
    };

    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableHighlight
                  style={styles.modalItem}
                  onPress={() => onSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableHighlight>
              )}
            />
            <Button onPress={() => setModalVisible(false)}>Close</Button>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SidebarLayout>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.header}>
            <Icon name="fact-check" size={24} color="#0e135f" />
            <Text style={styles.title}>Ajouter une Demande de Formation</Text>
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

          {/* Titre Picker */}
          <Text style={styles.label}>Choisir le titre</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => {
              setModalType('titre');
              setModalVisible(true);
            }}
          >
            <Text style={styles.input}>
              {selectedTitre ? selectedTitre.name : 'Sélectionner un titre'}
            </Text>
          </TouchableOpacity>

          {/* Type Picker */}
          {selectedTitre && (
            <>
              <Text style={styles.label}>Choisir le type</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => {
                  setModalType('type');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.input}>
                  {selectedType ? selectedType.name : 'Sélectionner un type'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Theme Picker */}
          {selectedType && (
            <>
              <Text style={styles.label}>Choisir le thème</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => {
                  setModalType('theme');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.input}>
                  {selectedTheme ? selectedTheme.name : 'Sélectionner un thème'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Texte de la demande */}
          <Text style={styles.label}>Texte de la demande</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Entrez une demande"
            value={requestText}
            onChangeText={setRequestText}
          />

          {/* Sélection de fichier */}
          <Text style={styles.label}>Pièce jointe</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={handleFileUpload}>
            <Icon name="attach-file" size={20} color="#999" />
            <Text style={styles.input}>{file ? file.name : 'Choisir un fichier'}</Text>
          </TouchableOpacity>

          {/* Bouton de soumission */}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Soumettre</Text>
          </TouchableOpacity>
        </View>
        {renderModal()}
      </ScrollView>
    </SidebarLayout>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#0e135f',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#0e135f',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalItemText: {
    fontSize: 16,
  },
});

export default Formation;