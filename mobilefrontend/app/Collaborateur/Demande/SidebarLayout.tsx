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
        </View>
      )}

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => navigation.navigate('AcceuilCollaborateur')}>
            <Image
              source={require('../../../assets/images/fleche.png')}
              style={styles.fleche}
            />
          </TouchableOpacity>
          <Text style={styles.profileName}>Ajouter Demande</Text>
          <TouchableOpacity
            onPress={() => setIsSidebarVisible(true)}
            style={styles.menuImageContainer}
          >
            <Image
              source={require('../../../assets/images/menu.png')}
              style={styles.menu}
            />
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
    backgroundColor: '#fff',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    width: 250,
    height: '100%',
    backgroundColor: '#4c00b4',
    padding: 20,
    zIndex: 10,
  },
  sidebarTitle: {
    fontSize: 27,
    color: '#fff',
    marginBottom: 20,
  },
  sidebarItem: {
    marginBottom: 15,
  },
  sidebarText: {
    color: '#fff',
    fontSize: 18,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  mainContent: {
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  fleche: {
    width: 30,
    height: 30,
  },
  menuImageContainer: {
    width: 40,
    height: 40,
  },
  menu: {
    width: 24,
    height: 24,
  },
});

export default SidebarLayout;
