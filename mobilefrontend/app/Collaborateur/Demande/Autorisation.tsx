import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SidebarLayout from './SidebarLayout';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import icon library

const Autorisation = () => {
  const [dateDebut, setDateDebut] = useState(new Date());
  const [timeSortie, setTimeSortie] = useState(new Date());
  const [timeRetour, setTimeRetour] = useState(new Date());

  const [showPickerDebut, setShowPickerDebut] = useState(false);
  const [showPickerSortie, setShowPickerSortie] = useState(false);
  const [showPickerRetour, setShowPickerRetour] = useState(false);

  // Handle date selection for Date de début
  const onChangeDebut = (event, selectedDate) => {
    setShowPickerDebut(false);
    if (selectedDate) setDateDebut(selectedDate);
  };

  // Handle time selection for Heure min sortie
  const onChangeSortie = (event, selectedTime) => {
    setShowPickerSortie(false);
    if (selectedTime) setTimeSortie(selectedTime);
  };

  // Handle time selection for Heure min retour
  const onChangeRetour = (event, selectedTime) => {
    setShowPickerRetour(false);
    if (selectedTime) setTimeRetour(selectedTime);
  };

  const handleSubmit = () => {
    alert('Demande de Formation soumise avec succès!');
  };

  return (
    <SidebarLayout>
      <View style={styles.header}>
        <Icon name="fact-check" size={24} color="#4c00b4" />
        <Text style={styles.title}>Ajouter Autorisation</Text>
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

      {/* Heure min sortie */}
      <Text style={styles.label}>Heure min sortie</Text>
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

      {/* Heure min retour */}
      <Text style={styles.label}>Heure min retour</Text>
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

export default Autorisation;
