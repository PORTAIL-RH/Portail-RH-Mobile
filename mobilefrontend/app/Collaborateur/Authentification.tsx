import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

const Authentication = () => {
  const [action, setAction] = useState("Login");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}>{action}</Text>
        <View
          style={styles.underline}
          onTouchStart={() => setAction(action === "Login" ? "Sign up" : "Login")}
        />
      </View>

      <View style={styles.inputs}>
        {action === "Sign up" && (
          <View style={styles.input}>
            <Image source={require('../../assets/images/profil.png')} style={styles.img} />
            <TextInput
              style={styles.inputField}
              placeholder="Username"
              placeholderTextColor="#888"
            />
          </View>
        )}
        {action === "Login" && (
          <View style={styles.input}>
            <Image source={require('../../assets/images/code.png')} style={styles.img} />
            <TextInput
              style={styles.inputField}
              placeholder="Code"
              placeholderTextColor="#888"
            />
          </View>
        )}
        <View style={styles.input}>
          <Image source={require('../../assets/images/mail.png')} style={styles.img} />
          <TextInput
            style={styles.inputField}
            placeholder="Email"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.input}>
          <Image source={require('../../assets/images/pwd.png')} style={styles.img} />
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="#888"
          />
        </View>
        {action === "Sign up" && (
          <View style={styles.input}>
            <Image source={require('../../assets/images/pwd.png')} style={styles.img} />
            <TextInput
              style={styles.inputField}
              placeholder="Confirm Password"
              secureTextEntry
              placeholderTextColor="#888"
            />
          </View>
        )}
      </View>

      {action === "Login" && (
        <TouchableOpacity style={styles.forgotPassword}>
          <Text>Forgot password? <Text style={styles.forgotLink}>Click here!</Text></Text>
        </TouchableOpacity>
      )}

      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submit, action === "Login" && styles.activeButton]} // Active button styling for Login
          onPress={() => setAction("Login")}
        >
          <Text style={[styles.submitText, action === "Login" && styles.activeText]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submit, action === "Sign up" && styles.activeButton]} // Active button styling for Sign up
          onPress={() => setAction("Sign up")}
        >
          <Text style={[styles.submitText, action === "Sign up" && styles.activeText]}>Sign up</Text>
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
    width: '100%',
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
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
    cursor: 'pointer',
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
  forgotPassword: {
    marginTop: 27,
    fontSize: 18,
    color: '#797979',
  },
  forgotLink: {
    color: '#4c00b4',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
    backgroundColor: '#fff', // default background color is white
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#4c00b4', // border color for the button
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  },
  activeButton: {
    backgroundColor: '#4c00b4', // active button background color
  },
  submitText: {
    color: '#4c00b4', // default text color
    fontSize: 16,
    fontWeight: '700',
  },
  activeText: {
    color: '#fff', // text color for active button
  },
  gray: {
    backgroundColor: '#eaeaea',
    color: '#676767',
    cursor: 'not-allowed',
  },
});

export default Authentication;
