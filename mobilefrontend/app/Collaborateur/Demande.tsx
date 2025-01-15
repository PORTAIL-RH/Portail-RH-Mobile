import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const AjouterDemande = () => {
  const [action, setAction] = useState<'formation' | 'congé' | 'autorisation'>('congé');
  const [formData, setFormData] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderFormFields = () => {
    switch (action) {
      case 'formation':
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Date Début"
              onChangeText={(value) => handleInputChange('dateDebut', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Date Fin"
              onChangeText={(value) => handleInputChange('dateFin', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Code Titre"
              onChangeText={(value) => handleInputChange('codeTitre', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Code Type"
              onChangeText={(value) => handleInputChange('codeType', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Code Thème"
              onChangeText={(value) => handleInputChange('codeTheme', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Année Formation"
              onChangeText={(value) => handleInputChange('anneeFormation', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Titre"
              onChangeText={(value) => handleInputChange('titre', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Thème"
              onChangeText={(value) => handleInputChange('theme', value)}
            />
          </>
        );
      case 'congé':
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Date Début"
              onChangeText={(value) => handleInputChange('dateDebut', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Date Fin"
              onChangeText={(value) => handleInputChange('dateFin', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Temp Début"
              onChangeText={(value) => handleInputChange('tempDebut', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Temp Fin"
              onChangeText={(value) => handleInputChange('tempFin', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Date Reprise Prévue"
              onChangeText={(value) => handleInputChange('dateReprisePrev', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="S Reprise Prévue"
              onChangeText={(value) => handleInputChange('sReprisePrev', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre de Jours"
              onChangeText={(value) => handleInputChange('nbrJour', value)}
            />
          </>
        );
      case 'autorisation':
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Date Début"
              onChangeText={(value) => handleInputChange('dateDebut', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Date Fin"
              onChangeText={(value) => handleInputChange('dateFin', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Heure Sortie"
              onChangeText={(value) => handleInputChange('heurSortie', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Minute Sortie"
              onChangeText={(value) => handleInputChange('minSortie', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Heure Retour"
              onChangeText={(value) => handleInputChange('heurRetour', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Minute Retour"
              onChangeText={(value) => handleInputChange('minRetour', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Code Autorisation"
              onChangeText={(value) => handleInputChange('codeAut', value)}
            />
          </>
        );
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    console.log('Form Data:', formData);
    alert(`Demande ${action} soumise avec succès!`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Ajouter Demande</Text>

      {/* Action Selection Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.switchButton, action === 'congé' && styles.activeButton]}
          onPress={() => setAction('congé')}
        >
          <Text style={styles.buttonText}>Congé</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, action === 'autorisation' && styles.activeButton]}
          onPress={() => setAction('autorisation')}
        >
          <Text style={styles.buttonText}>Autorisation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, action === 'formation' && styles.activeButton]}
          onPress={() => setAction('formation')}
        >
          <Text style={styles.buttonText}>Formation</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Form Fields */}
      {renderFormFields()}

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4c00b4',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#4c00b4',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    color: '#333',
  },
  button: {
    height: 50,
    backgroundColor: '#4c00b4',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AjouterDemande;
