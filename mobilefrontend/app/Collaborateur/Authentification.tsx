import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { API_CONFIG } from '../config';
// Define the navigation stack types
type AuthentificationStackParamList = {
  Authentification: undefined;
  AccueilCollaborateur: undefined;
  AdminDashboard: undefined;
};

// Define the navigation prop type
type AuthentificationNavigationProp = NativeStackNavigationProp<
  AuthentificationStackParamList,
  "Authentification"
>;

const Authentication = () => {
  const navigation = useNavigation<AuthentificationNavigationProp>();
  const [action, setAction] = useState<"Login" | "Sign up">("Login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    Toast.show({
      type,
      text1: type === "success" ? "Success" : "Error",
      text2: message,
    });
  };

  const handleSignUp = async () => {
    if (!username || !matricule || !email || !password || !confirmPassword) {
      showToast("error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/register`, {
        nom: username,
        matricule,
        email,
        motDePasse: password,
        confirmationMotDePasse: confirmPassword,
      });

      if (response.status === 200) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'signup successful 👏',
          position: 'bottom', 
        });
                setAction("Login"); 
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showToast("error", "Failed to create account");
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/login`, {
        matricule,
        motDePasse: password,
      });

      if (response.status === 200) {
        const { token, id, role } = response.data;
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userInfo", JSON.stringify(response.data));

        showToast("success", "Login successful");

        if (role === "admin") {
          navigation.navigate("AdminDashboard");
        } else {
          navigation.navigate("AccueilCollaborateur");
        }
      }
    } catch (error) {
      console.error("Error logging in:", error);
      showToast("error", "Invalid matricule or password");
    }
  };

  return (
    <View style={styles.container}>
      <Toast /> 
      <View style={styles.header}>
        <Text style={styles.text}>{action}</Text>
        <View style={styles.underline} />
        <TouchableOpacity style={styles.switchButton} onPress={() => setAction(action === "Login" ? "Sign up" : "Login")}>
          <Text style={styles.switchText}>{action === "Login" ? "Switch to Sign up" : "Switch to Login"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputs}>
        {action === "Sign up" && (
          <View style={styles.input}>
            <Image source={require("../../assets/images/profil.png")} style={styles.img} />
            <TextInput style={styles.inputField} placeholder="Username" placeholderTextColor="#888" value={username} onChangeText={setUsername} />
          </View>
        )}
        <View style={styles.input}>
          <Image source={require("../../assets/images/code.png")} style={styles.img} />
          <TextInput style={styles.inputField} placeholder="Matricule" placeholderTextColor="#888" value={matricule} onChangeText={setMatricule} />
        </View>
        {action === "Sign up" && (
          <View style={styles.input}>
            <Image source={require("../../assets/images/mail.png")} style={styles.img} />
            <TextInput style={styles.inputField} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} />
          </View>
        )}
        <View style={styles.input}>
          <Image source={require("../../assets/images/pwd.png")} style={styles.img} />
          <TextInput style={styles.inputField} placeholder="Password" secureTextEntry placeholderTextColor="#888" value={password} onChangeText={setPassword} />
        </View>
        {action === "Sign up" && (
          <View style={styles.input}>
            <Image source={require("../../assets/images/pwd.png")} style={styles.img} />
            <TextInput style={styles.inputField} placeholder="Confirm Password" secureTextEntry placeholderTextColor="#888" value={confirmPassword} onChangeText={setConfirmPassword} />
          </View>
        )}
      </View>

      <View style={styles.submitContainer}>
        {action === "Login" ? (
          <TouchableOpacity style={[styles.submit, styles.activeButton]} onPress={handleLogin}>
            <Text style={[styles.submitText, styles.activeText]}>Login</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.submit, styles.activeButton]} onPress={handleSignUp}>
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
    color: '#0e135f',
    fontSize: 48,
    fontWeight: '700',
  },
  underline: {
    width: 61,
    height: 6,
    backgroundColor: '#0e135f',
    borderRadius: 9,
  },
  switchButton: {
    marginTop: 10,
    backgroundColor: '#0e135f',
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
    borderColor: '#cdcbdd',
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
    elevation: 5,
  },
  activeButton: {
    backgroundColor: '#0e135f',
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