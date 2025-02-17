import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import icons

const SidebarLayout = ({ children }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      {isSidebarVisible && (
        <View style={styles.sidebar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsSidebarVisible(false)}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.sidebarTitle}>Demandes</Text>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => navigation.navigate('Autorisation')}
          >
            <Icon name="assignment" size={20} color="#fff" />
            <Text style={styles.sidebarText}>Autorisation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => navigation.navigate('Conge')}
          >
            <Icon name="beach-access" size={20} color="#fff" />
            <Text style={styles.sidebarText}>Congé</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => navigation.navigate('Formation')}
          >
            <Icon name="school" size={20} color="#fff" />
            <Text style={styles.sidebarText}>Formation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => navigation.navigate('Document')}
          >
            <Icon name="description" size={20} color="#fff" />
            <Text style={styles.sidebarText}>Document</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => navigation.navigate('Pret')}
          >
            <Icon name="attach-money" size={20} color="#fff" />
            <Text style={styles.sidebarText}>Pre-Avance</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => navigation.navigate('AccueilCollaborateur')}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.profileName}>Ajouter Demande</Text>
          <TouchableOpacity
            onPress={() => setIsSidebarVisible(true)}
            style={styles.menuImageContainer}
          >
            <Icon name="menu" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        {/* Inject page-specific content */}
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    width: 250,
    height: '100%',
    backgroundColor: 'rgba(14, 19, 95, 0.95)', // Translucent background
    padding: 20,
    zIndex: 10,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 30,
    marginTop: 10,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle hover effect
  },
  sidebarText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  mainContent: {
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  menuImageContainer: {
    padding: 10,
  },
});

export default SidebarLayout;