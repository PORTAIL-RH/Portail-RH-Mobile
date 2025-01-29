import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SidebarLayout from './SidebarLayout'; // Assurez-vous d'avoir ce composant
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import icon library
import { Picker } from '@react-native-picker/picker';

const Formation = () => {
  const [selectedType, setSelectedType] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');

  const data = [
    {
      type: 'Formation Technique',
      titles: [
        {
          title: 'Développeur Front-end',
          themes: ['React', 'Vue.js', 'Angular'],
        },
        {
          title: 'Développeur Back-end',
          themes: ['Node.js', 'Java', 'PHP'],
        },
      ],
    },
    {
      type: 'Formation Soft Skills',
      titles: [
        {
          title: 'Communication',
          themes: ['Écoute active', 'Présentation orale', 'Gestion des conflits'],
        },
        {
          title: 'Gestion du Temps',
          themes: ['Priorisation', 'Gestion des priorités', 'Productivité'],
        },
      ],
    },
  ];

  // Trouver les titres disponibles pour le type sélectionné
  const availableTitles = data.find(item => item.type === selectedType)?.titles || [];

  // Trouver les thèmes disponibles pour le titre sélectionné
  const availableThemes = availableTitles.find(item => item.title === selectedTitle)?.themes || [];

  return (
    <SidebarLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="fact-check" size={24} color="#4c00b4" />
          <Text style={styles.title}>Ajouter Formation</Text>
        </View>

        <Text style={styles.label}>Choisir le type de formation</Text>
        <Picker
          selectedValue={selectedType}
          onValueChange={itemValue => {
            setSelectedType(itemValue);
            setSelectedTitle(''); // Réinitialiser le titre sélectionné
            setSelectedTheme(''); // Réinitialiser le thème sélectionné
          }}
        >
          <Picker.Item label="Sélectionner un type" value="" />
          {data.map((item, index) => (
            <Picker.Item key={index} label={item.type} value={item.type} />
          ))}
        </Picker>

        <Text style={styles.label}>Choisir le titre</Text>
        <Picker
          selectedValue={selectedTitle}
          onValueChange={itemValue => {
            setSelectedTitle(itemValue);
            setSelectedTheme(''); // Réinitialiser le thème sélectionné
          }}
        >
          <Picker.Item label="Sélectionner un titre" value="" />
          {availableTitles.map((item, index) => (
            <Picker.Item key={index} label={item.title} value={item.title} />
          ))}
        </Picker>

        <Text style={styles.label}>Choisir le thème</Text>
        <Picker
          selectedValue={selectedTheme}
          onValueChange={setSelectedTheme}
        >
          <Picker.Item label="Sélectionner un thème" value="" />
          {availableThemes.map((theme, index) => (
            <Picker.Item key={index} label={theme} value={theme} />
          ))}
        </Picker>

        <TouchableOpacity style={styles.button} onPress={() => alert('Formation soumise')}>
          <Text style={styles.buttonText}>Soumettre</Text>
        </TouchableOpacity>
      </View>
    </SidebarLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#4c00b4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#4c00b4',
  },
  header: {
    flexDirection: 'row',  // Aligner l'icône et le texte horizontalement
    alignItems: 'center',  // Centrer verticalement
    marginBottom: 30,      // Espacer du reste du contenu
  },
});

export default Formation;
