import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';

interface AdminSideBarProps {
  navigation: NavigationProp<RootStackParamList, 'AdminDashboard'>;
  onClose: () => void; // Add a prop to handle closing the sidebar
}

export type RootStackParamList = {
  AdminDashboard: undefined;
  Personnel: undefined;
  Notifications: undefined;
  Settings: undefined;
  Authentification: undefined;
  DemandesAdmin:undefined;
};

const AdminSideBar: React.FC<AdminSideBarProps> = ({ navigation, onClose }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <MaterialCommunityIcons name="close" size={24} color="white" />
      </TouchableOpacity>

      <ScrollView style={styles.sidebar}>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminDashboard')}>
          <MaterialCommunityIcons name="view-dashboard" size={24} color="white" />
          <Text style={styles.sidebarText}>Tableau de Bord</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Personnel')}>
          <MaterialCommunityIcons name="account-group" size={24} color="white" />
          <Text style={styles.sidebarText}>Liste des personnels</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('DemandesAdmin')}>
          <MaterialCommunityIcons name="cogs" size={24} color="white" />
          <Text style={styles.sidebarText}>Demandes</Text>
        </TouchableOpacity>



        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Notifications')}>
          <MaterialCommunityIcons name="bell" size={24} color="white" />
          <Text style={styles.sidebarText}>Notifications</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Authentification')}>
          <MaterialCommunityIcons name="logout" size={24} color="white" />
          <Text style={styles.sidebarText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
    width: 250,
    paddingTop: 20,
    position: 'absolute', // Position the sidebar absolutely
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1000, // Ensure it appears above other content
  },
  sidebar: {
    flex: 1,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#34495E',
  },
  sidebarText: {
    marginLeft: 10,
    color: 'white',
    fontSize: 18,
  },
  closeButton: {
    padding: 10,
    alignSelf: 'flex-end',
  },
});

export default AdminSideBar;