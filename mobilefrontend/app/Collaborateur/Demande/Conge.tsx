import React, { useState } from 'react';
import {
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import icon library
import SidebarLayout from './SidebarLayout';

const Conge = () => {
  //const [formData, setFormData] = useState({});
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [showPickerDebut, setShowPickerDebut] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);

  const onChangeDebut = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPickerDebut(false);
    if (selectedDate) setDateDebut(selectedDate);
  };

  const onChangeFin = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPickerFin(false);
    if (selectedDate) setDateFin(selectedDate);
  };

  const handleSubmit = () => {
    alert('Demande soumise avec succès!');
  };

  return (
    <SidebarLayout>
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

      <Text style={styles.label}>Description</Text>
      <View style={styles.inputContainer}>
        <Icon name="description" size={20} color="#999" />
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Entrez une description"
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
