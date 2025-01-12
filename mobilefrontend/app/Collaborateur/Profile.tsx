import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

// Définition explicite des types de navigation
type RootStackParamList = {
  AcceuilCollaborateur: undefined;
  Profile: undefined;
};

const ProfilePage = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      {/* Profile Section */}
    
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image source={require('../../assets/images/profile.png')} style={styles.profileImage} />
        <Text style={styles.profileName}>Fida</Text>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoText}>fida@example.com</Text>

          <Text style={styles.infoLabel}>Matricule:</Text>
          <Text style={styles.infoText}>123456</Text>

          <Text style={styles.infoLabel}>Role:</Text>
          <Text style={styles.infoText}>Administrator</Text>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AcceuilCollaborateur')}>
          <Image source={require('../../assets/images/home.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../../assets/images/calendar.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../../assets/images/cloche.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../../assets/images/profile.png')} style={styles.navIcon} />
          <Text style={styles.navTextActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6E6FA',
  },
  profileCard: {
    backgroundColor: '#FFF',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#9370DB',
  },

  profileName: {
    fontSize: 30,
    fontWeight: '700',
    marginTop: 10,
    color: '#4B0082',
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationIcon: {
    width: 24,
    height: 24,
  },
  infoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4B0082',
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navText: {
    fontSize: 14,
    color: '#333',
  },
  navTextActive: {
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: '700',
  },
});

export default ProfilePage;
