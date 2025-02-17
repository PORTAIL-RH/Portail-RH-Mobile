import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons'; // For icons
import SidebarLayout from './SidebarLayout';

// Define the navigation stack types
export type RootStackParamList = {
  AjouterDemande: undefined;
  Autorisation: undefined;
  Conge: undefined;
  Formation: undefined;
  Document: undefined;
  Pret: undefined;
};

// Define the navigation prop type
type AjouterDemandeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AjouterDemande'
>;

const AjouterDemande = () => {
  const navigation = useNavigation<AjouterDemandeNavigationProp>();

  // Demand types with icons and descriptions
  const demandTypes = [
    {
      id: 1,
      title: 'Autorisation',
      icon: 'assignment',
      description: 'Demander une autorisation pour une absence ou un retard.',
      navigateTo: 'Autorisation',
    },
    {
      id: 2,
      title: 'Congé',
      icon: 'beach-access',
      description: 'Demander un congé pour des raisons personnelles ou médicales.',
      navigateTo: 'Conge',
    },
    {
      id: 3,
      title: 'Formation',
      icon: 'school',
      description: 'Demander une formation pour améliorer vos compétences.',
      navigateTo: 'Formation',
    },
    {
      id: 4,
      title: 'Document',
      icon: 'description',
      description: 'Demander un document officiel ou une attestation.',
      navigateTo: 'Document',
    },
    {
      id: 5,
      title: 'Prêt',
      icon: 'attach-money',
      description: 'Demander un prêt financier pour des besoins personnels.',
      navigateTo: 'Pret',
    },
  ];

  return (
    <SidebarLayout>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ajouter une Demande</Text>
        </View>

        {/* Scrollable Content */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {demandTypes.map((demand) => (
            <TouchableOpacity
              key={demand.id}
              style={styles.demandCard}
              onPress={() => navigation.navigate(demand.navigateTo as any)}
            >
              <View style={styles.demandIconContainer}>
                <Icon name={demand.icon} size={24} color="#7E99A3" />
              </View>
              <View style={styles.demandTextContainer}>
                <Text style={styles.demandTitle}>{demand.title}</Text>
                <Text style={styles.demandDescription}>{demand.description}</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#7E99A3" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </SidebarLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  scrollContainer: {
    padding: 20,
  },
  demandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
  },
  demandIconContainer: {
    marginRight: 16,
  },
  demandTextContainer: {
    flex: 1,
  },
  demandTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  demandDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default AjouterDemande;