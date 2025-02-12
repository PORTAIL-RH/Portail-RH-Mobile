import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient'; 

export type RootStackParamList = {
    AccueilCollaborateur: undefined;
    Calendar: undefined;
    Notifications: undefined;
    Profile: undefined;
  };
  
const Footer = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <LinearGradient
    colors={['#102C57', '#17153B']}
    style={styles.bottomNavigation}
    >
      {/* Home Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AccueilCollaborateur')}
        style={styles.navItem}
      >
        <Image
          source={require('../../assets/images/homee.png')}
          style={styles.navIcon}
        />
        <Text style={styles.navTextActive}>Home</Text>
      </TouchableOpacity>

      {/* Calendar Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Calendar')}
        style={styles.navItem}
      >
        <Image
          source={require('../../assets/images/calendar.png')}
          style={styles.navIcon}
        />
        <Text style={styles.navText}>Calendar</Text>
      </TouchableOpacity>

      {/* Notifications Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Notifications')}
        style={styles.navItem}
      >
        <Image
          source={require('../../assets/images/notif.png')}
          style={styles.navIcon}
        />
        <Text style={styles.navText}>Notifications</Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        style={styles.navItem}
      >
        <Image
          source={require('../../assets/images/user.png')}
          style={styles.navIcon}
        />
        <Text style={styles.navText}>Profile</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFF',
  },
  navText: {
    fontSize: 12,
    color: '#FFF',
  },
  navTextActive: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
  },
});

export default Footer;