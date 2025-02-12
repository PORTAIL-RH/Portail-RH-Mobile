import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Collaborateur/AcceuilCollaborateur'; 
import { LinearGradient } from 'expo-linear-gradient';

type NavbarProps = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  handleLogout: () => void;
};

const Navbar = ({ isDarkMode, toggleTheme, handleLogout }: NavbarProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <LinearGradient colors={['#102C57', '#17153B']}
    style={styles.headernav}
    >
      <TouchableOpacity onPress={toggleTheme}>
        <Image source={require('../../assets/images/theme-icon.png')} style={styles.icon} />
      </TouchableOpacity>
      <Text style={[styles.titlenav, isDarkMode ? darkStyles.textH : lightStyles.textH]}>Accueil</Text>
      <TouchableOpacity onPress={handleLogout}>
        <Image source={require('../../assets/images/logout.png')} style={styles.icon} />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    headernav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#FFF',
  },
  titlenav: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

const lightStyles = StyleSheet.create({
    headernav: {
    backgroundColor: '#9370DB', 
  },
  textH: {
    color: '#FFF',
  },
});

const darkStyles = StyleSheet.create({
    headernav: {
    backgroundColor: '#444',
  },
  textH: {
    color: '#FFF',
  },
});

export default Navbar;
