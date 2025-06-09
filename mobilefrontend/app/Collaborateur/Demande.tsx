import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const AjouterDemande = () => {
  const [action, setAction] = useState<'formation' | 'congé' | 'autorisation'>('congé');
  const [formData, setFormData] = useState({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Sidebar visibility state
  const navigation = useNavigation();
////////////////////////////////////dateee
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
  

  /////////////////////////////////dateee


  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSidebarItemClick = (actionType: string | ((prevState: "formation" | "congé" | "autorisation") => "formation" | "congé" | "autorisation")) => {
    setAction(actionType); // Met à jour l'action sélectionnée
    setIsSidebarVisible(false); // Masque la sidebar
  };
  
  const renderFormFields = () => {
    switch (action) {
      case 'formation':
        return (
          <>
            <Text style={styles.profileName}>Ajouter formation</Text>
             
            <TextInput
              style={styles.input}
              placeholder="date"
              onChangeText={(value) => handleInputChange('date', value)}
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
            <Text style={styles.profileName}>Ajouter congé</Text>
{/*dateeeee */}        
              <Text style={styles.labelc}>Choisissez une date debut</Text>

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
            
{/*dateeeee */}      
            <Text style={styles.labelc}>Choisissez une date fin </Text>

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
{/*dateeeee */}      
          <Text style={styles.labelc}>Description</Text>

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
            <Text style={styles.profileName}>Ajouter Description</Text>

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
    <View style={styles.container}>
      {/* Sidebar */}
      {isSidebarVisible && (
        <View style={styles.sidebar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsSidebarVisible(false)}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          <Text style={styles.sidebarTitle}>Demande</Text>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => navigation.navigate('Autorisation')}
          >
            <Text style={styles.sidebarText}>Autorisation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => navigation.navigate('Conge')}
          >
            <Text style={styles.sidebarText}>Congé</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => navigation.navigate('Formation')}
          >
            <Text style={styles.sidebarText}>Formation</Text>
          </TouchableOpacity>

          {/* Add more sidebar items here */}
        </View>
      )}

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => navigation.navigate('AcceuilCollaborateur')} style={styles.profile}>
            <View style={styles.flecheImageContainer}>
              <Image source={require('../../assets/images/fleche.png')} style={styles.fleche} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>Ajouter Demande</Text>
          <TouchableOpacity onPress={() => setIsSidebarVisible(true)} style={styles.menuImageContainer}>
            <Image source={require('../../assets/images/menu.png')} style={styles.menu} />
          </TouchableOpacity>
        </View>

       
        {/* Dynamic Form Fields */}
        {renderFormFields()}

        {/* Submit Button */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flexGrow: 1,
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 10,
    marginBottom:20,
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
    height: 70,
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
  flecheImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fleche: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  menuImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: 24,
    height: 24,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 250,
    height: '100%',
    backgroundColor: '#4c00b4',
    padding: 20,
    zIndex: 1000,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  sidebarItem: {
    marginBottom: 20,
  },
  sidebarTitle: {
    marginBottom: 20,
    fontSize: 25,
    color: '#fff',
    fontWeight: '900',
  },
  sidebarText: {
    color: '#fff',
    fontSize: 16,
  },
  //dateee
  selectedDateText: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '500',
  },
  openButton: {
    padding: 15,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  openButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FF4D4D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },


//calendar
  labelc: {
    fontSize: 16,
    //fontWeight: 'bold',
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

export default AjouterDemande;
