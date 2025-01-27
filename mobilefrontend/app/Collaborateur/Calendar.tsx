import React, { useState } from 'react';
import { Platform, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-datepicker'; // Pour le web
import 'react-datepicker/dist/react-datepicker.css'; // Importer les styles de react-datepicker
import { Ionicons } from '@expo/vector-icons'; // Pour les icônes modernes

const Calendar = () => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false); // Fermer le picker sur Android
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={styles.containerc}>
      <Text style={styles.labelc}>Choisissez une date</Text>

      {/* Web: Utilisation de react-datepicker */}
      {Platform.OS === 'web' ? (
        <DatePicker
          selected={date}
          onChange={(selectedDate) => setDate(selectedDate)}
          customInput={
            <TouchableOpacity style={styles.inputContainerc}>
              <Ionicons name="calendar-outline" size={24} color="#6c63ff" />
              <TextInput
                style={styles.inputc}
                value={date.toLocaleDateString()}
                editable={false} // Désactiver la saisie manuelle
                placeholder="Sélectionnez une date"
              />
            </TouchableOpacity>
          }
        />
      ) : (
        <>
          {/* Native: Utilisation de DateTimePicker */}
          <TouchableOpacity style={styles.inputContainerc} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={24} color="#6c63ff" />
            <TextInput
              style={styles.inputc}
              placeholder="Sélectionnez une date"
              value={date.toLocaleDateString()}
              editable={false}
            />
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChange}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerc: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f4f4f9',
  },
  labelc: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainerc: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Pour Android
    marginBottom: 15,
    width: '100%',
  },
  inputc: {
    flex: 1,
    marginLeft: 10,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
});

export default Calendar;
