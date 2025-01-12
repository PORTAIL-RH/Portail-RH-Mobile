import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the navigation stack types
type AuthentificationStackParamList = {
  Authentification: undefined;
  AcceuilCollaborateur: undefined;
};

// Define the navigation prop type
type AuthentificationNavigationProp = NativeStackNavigationProp<AuthentificationStackParamList, 'Authentification'>;

const Authentication = () => {
  const navigation = useNavigation<AuthentificationNavigationProp>(); // Initialize navigation with proper typing
  const [action, setAction] = useState<'Login' | 'Sign up'>('Login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8081/api/Collaborateur/register', {
        username,
        email,
        password,
      });
      if (response.status === 200) {
        Alert.alert('Success', 'Account created successfully');
        setAction('Login'); // Switch to Login after successful registration
      }
    } catch (error) {
      console.error('Error signing up:', error);
      Alert.alert('Error', 'Failed to create account');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:8081/api/Collaborateur/login', {
        email,
        password,
      });
      if (response.status === 200) {
        Alert.alert('Success', 'Login successful');
        navigation.navigate('AcceuilCollaborateur'); // Navigate to AcceuilCollaborateur
      }
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Invalid email or password');
      navigation.navigate('AcceuilCollaborateur'); // Navigate to AcceuilCollaborateur

    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}>{action}</Text>
        <View style={styles.underline} />
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setAction(action === 'Login' ? 'Sign up' : 'Login')}
        >
          <Text style={styles.switchText}>
            {action === 'Login' ? 'Switch to Sign up' : 'Switch to Login'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputs}>
        {action === 'Sign up' && (
          <View style={styles.input}>
            <Image source={require('../../assets/images/profil.png')} style={styles.img} />
            <TextInput
              style={styles.inputField}
              placeholder="Username"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
            />
          </View>
        )}
        <View style={styles.input}>
          <Image source={require('../../assets/images/mail.png')} style={styles.img} />
          <TextInput
            style={styles.inputField}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.input}>
          <Image source={require('../../assets/images/pwd.png')} style={styles.img} />
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {action === 'Sign up' && (
          <View style={styles.input}>
            <Image source={require('../../assets/images/pwd.png')} style={styles.img} />
            <TextInput
              style={styles.inputField}
              placeholder="Confirm Password"
              secureTextEntry
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        )}
      </View>

      <View style={styles.submitContainer}>
        {action === 'Login' ? (
          <TouchableOpacity
            style={[styles.submit, styles.activeButton]}
            onPress={handleLogin}
          >
            <Text style={[styles.submitText, styles.activeText]}>Login</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submit, styles.activeButton]}
            onPress={handleSignUp}
          >
            <Text style={[styles.submitText, styles.activeText]}>Sign up</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5, // For Android
  },
  header: {
    alignItems: 'center',
    gap: 9,
    marginBottom: 30,
  },
  text: {
    color: '#3c009d',
    fontSize: 48,
    fontWeight: '700',
  },
  underline: {
    width: 61,
    height: 6,
    backgroundColor: '#4c00b4',
    borderRadius: 9,
  },
  switchButton: {
    marginTop: 10,
    backgroundColor: '#4c00b4',
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  switchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputs: {
    width: '80%',
    marginTop: 55,
    display: 'flex',
    flexDirection: 'column',
    gap: 25,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 15,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputField: {
    height: 50,
    width: '80%',
    backgroundColor: 'transparent',
    fontSize: 16,
    paddingHorizontal: 10,
    color: '#333',
  },
  img: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  submitContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 30,
  },
  submit: {
    width: 160,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#4c00b4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // For Android
  },
  activeButton: {
    backgroundColor: '#4c00b4',
  },
  submitText: {
    color: '#4c00b4',
    fontSize: 16,
    fontWeight: '700',
  },
  activeText: {
    color: '#fff',
  },
});

export default Authentication;