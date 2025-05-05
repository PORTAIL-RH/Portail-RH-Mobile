import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { API_CONFIG } from "../config/apiConfig";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

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

// Auth storage functions
const storeAuthData = async (data: any) => {
  try {
    await AsyncStorage.setItem(
      "authData",
      JSON.stringify({
        token: data.token,
        userId: data.user.id,
        userInfo: data.user,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Error storing auth data:", error);
  }
};

const getAuthData = async () => {
  try {
    const data = await AsyncStorage.getItem("authData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error retrieving auth data:", error);
    return null;
  }
};

// Mouse/Touch Effect Background Component
const BackgroundWithMouseEffect = ({ theme }: { theme: string }) => {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  // Animation value for the glow effect
  const animatedPosition = useRef(
    new Animated.ValueXY({
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    })
  ).current;

  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription.remove();
  }, []);

  // Create pan responder to track touch position
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      Animated.spring(animatedPosition, {
        toValue: { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY },
        useNativeDriver: false,
        friction: 5,
      }).start();
    },
  });

  const isDark = theme === "dark";

  return (
    <View style={styles.backgroundContainer}>
      <LinearGradient
        colors={
          isDark
            ? ["#1a1f38", "#2d3a65", "#1a1f38"]
            : ["#f0f4f8", "#e2eaf2", "#f0f4f8"]
        }
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.backgroundGradient}
      />
    </View>
  );
};

const Authentication = () => {
  const navigation = useNavigation<AuthentificationNavigationProp>();
  const [action, setAction] = useState<"Login" | "Sign up">("Login");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockExpiration, setBlockExpiration] = useState<number | null>(null);

  // Initialize theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    loadTheme();
  }, []);

  // Toggle theme function
  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme);
      await AsyncStorage.setItem("@theme_mode", newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    Toast.show({
      type,
      text1: type === "success" ? "Success" : "Error",
      text2: message,
      position: "bottom",
      visibilityTime: 4000,
    });
  };

  const handleSignUp = async () => {
    if (!nom || !prenom || !matricule || !email || !password || !confirmPassword) {
      showToast("error", "Tous les champs sont obligatoires");
      return;
    }

    if (!matricule.match(/^\d{5}$/)) {
      showToast("error", "Le matricule doit être composé de 5 chiffres");
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/register`,
        {
          nom,
          prenom,
          matricule,
          email,
          motDePasse: password,
          confirmationMotDePasse: confirmPassword,
          role: "collaborateur",
          code_soc: "DEFAULT_CODE",
          service: "DEFAULT_SERVICE",
        }
      );

      if (response.status === 200) {
        showToast(
          "success",
          "Enregistrement réussi! Votre compte est en attente d'activation."
        );

        setNom("");
        setPrenom("");
        setMatricule("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          setAction("Login");
        }, 3000);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showToast("error", "Une erreur est survenue lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const blockedUntil = await AsyncStorage.getItem("blockedUntil");
        if (blockedUntil) {
          const expirationTime = Number.parseInt(blockedUntil, 10);
          if (expirationTime > Date.now()) {
            setIsBlocked(true);
            setBlockExpiration(expirationTime);
            const timeRemaining = expirationTime - Date.now();
            setTimeout(() => {
              setIsBlocked(false);
              setFailedAttempts(0);
              AsyncStorage.removeItem("blockedUntil");
            }, timeRemaining);
          } else {
            AsyncStorage.removeItem("blockedUntil");
          }
        }

        const attempts = await AsyncStorage.getItem("failedAttempts");
        if (attempts) {
          setFailedAttempts(Number.parseInt(attempts, 10));
        }
      } catch (error) {
        console.error("Error checking block status:", error);
      }
    };

    checkBlockStatus();
  }, []);

  const handleLogin = async () => {
    if (!matricule?.trim() || !password?.trim()) {
      showToast("error", "Matricule and password are required");
      return;
    }

    const blockedUntil = await AsyncStorage.getItem("blockedUntil");
    if (blockedUntil && Date.now() < parseInt(blockedUntil)) {
      const minutesLeft = Math.ceil((parseInt(blockedUntil) - Date.now()) / 60000);
      showToast("error", `Account locked. Try again in ${minutesLeft} minutes.`);
      return;
    }

    setLoading(true);

    try {
      const loginPayload = {
        matricule: matricule.trim(),
        password: password.trim(),
      };

      console.log("Login payload:", loginPayload);

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/login`,
        loginPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data?.token) {
        await storeAuthData({
          token: response.data.token,
          user: response.data.user,
        });

        await AsyncStorage.multiRemove(["failedAttempts", "blockedUntil"]);
        setFailedAttempts(0);

        showToast("success", "Login successful!");

        setTimeout(() => {
          const { role } = response.data.user;
          if (role === "collaborateur") {
            navigation.navigate("AccueilCollaborateur");
          } else {
            navigation.navigate("AdminDashboard");
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401 && data.error === "Account locked") {
          const lockDuration = 30 * 60 * 1000;
          const expirationTime = Date.now() + lockDuration;

          await AsyncStorage.setItem("blockedUntil", expirationTime.toString());
          setIsBlocked(true);
          setBlockExpiration(expirationTime);

          showToast("error", "Account locked. Try again in 30 minutes.");
          return;
        }

        if (status === 401) {
          const newAttempts = failedAttempts + 1;
          setFailedAttempts(newAttempts);
          await AsyncStorage.setItem("failedAttempts", newAttempts.toString());

          if (newAttempts >= 3) {
            const lockDuration = 30 * 60 * 1000;
            const expirationTime = Date.now() + lockDuration;

            await AsyncStorage.setItem("blockedUntil", expirationTime.toString());
            setIsBlocked(true);
            setBlockExpiration(expirationTime);

            showToast("error", "Too many attempts. Account locked for 30 minutes.");
          } else {
            showToast(
              "error",
              `Invalid credentials (${3 - newAttempts} attempts left)`
            );
          }
          return;
        }

        if (status === 400) {
          const errorMsg = data.message || "Invalid request format";
          showToast("error", `Error: ${errorMsg}`);
          return;
        }
      }

      showToast(
        "error",
        error.message.includes("timeout")
          ? "Connection timeout"
          : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark ? styles.darkBackground : styles.lightBackground]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <BackgroundWithMouseEffect theme={theme} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[
              styles.themeToggle,
              isDark ? styles.themeToggleDark : styles.themeToggleLight,
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Feather
              name={isDark ? "sun" : "moon"}
              size={24}
              color={isDark ? "white" : "#1a1f38"}
            />
          </TouchableOpacity>

          <View style={styles.branding}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={[styles.logo, isDark && { tintColor: "white" }]}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.authCard, isDark ? styles.authCardDark : styles.authCardLight]}>
            <View style={styles.header}>
              <Text
                style={[
                  styles.headerTitle,
                  isDark ? styles.textLight : styles.textDark,
                  styles.gradientText,
                ]}
              >
                {action === "Login" ? "Connexion au portail RH" : "Créer un compte"}
              </Text>

              <Text
                style={[
                  styles.headerSubtitle,
                  isDark ? styles.textLightSecondary : styles.textDarkSecondary,
                ]}
              >
                {action === "Login"
                  ? "Entrez vos identifiants pour accéder à votre espace personnel"
                  : "Remplissez le formulaire pour créer votre compte"}
              </Text>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setAction(action === "Login" ? "Sign up" : "Login");
                  setNom("");
                  setPrenom("");
                  setMatricule("");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                disabled={loading}
              >
                <Text style={styles.switchText}>
                  {action === "Login" ? "Créer un compte" : "Se connecter"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {isBlocked && (
                <View style={styles.blockedMessage}>
                  <Feather
                    name="lock"
                    size={24}
                    color="#F44336"
                    style={styles.blockedIcon}
                  />
                  <Text style={styles.blockedText}>
                    Compte bloqué après 3 tentatives échouées.
                    {blockExpiration && (
                      <Text>
                        {"\n"}Réessayez dans{" "}
                        {Math.ceil((blockExpiration - Date.now()) / 60000)}{" "}
                        minutes.
                      </Text>
                    )}
                  </Text>
                </View>
              )}

              {action === "Sign up" && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>
                      Nom
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        isDark ? styles.inputWrapperDark : styles.inputWrapperLight,
                      ]}
                    >
                      <Feather
                        name="user"
                        size={20}
                        color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                        placeholder="Votre nom"
                        placeholderTextColor={
                          isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"
                        }
                        value={nom}
                        onChangeText={setNom}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>
                      Prénom
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        isDark ? styles.inputWrapperDark : styles.inputWrapperLight,
                      ]}
                    >
                      <Feather
                        name="user"
                        size={20}
                        color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                        placeholder="Votre prénom"
                        placeholderTextColor={
                          isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"
                        }
                        value={prenom}
                        onChangeText={setPrenom}
                        editable={!loading}
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>
                  Matricule
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isDark ? styles.inputWrapperDark : styles.inputWrapperLight,
                  ]}
                >
                  <Feather
                    name="hash"
                    size={20}
                    color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                    placeholder="5 chiffres"
                    placeholderTextColor={
                      isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"
                    }
                    value={matricule}
                    onChangeText={setMatricule}
                    keyboardType="number-pad"
                    maxLength={5}
                    editable={!loading}
                  />
                </View>
              </View>

              {action === "Sign up" && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>
                    Email
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      isDark ? styles.inputWrapperDark : styles.inputWrapperLight,
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={20}
                      color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                      placeholder="Votre email professionnel"
                      placeholderTextColor={
                        isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"
                      }
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>
                  Mot de passe
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isDark ? styles.inputWrapperDark : styles.inputWrapperLight,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={20}
                    color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                    placeholder="Votre mot de passe"
                    placeholderTextColor={
                      isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"
                    }
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>
              </View>

              {action === "Sign up" && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>
                    Confirmer le mot de passe
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      isDark ? styles.inputWrapperDark : styles.inputWrapperLight,
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={20}
                      color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                      placeholder="Confirmez votre mot de passe"
                      placeholderTextColor={
                        isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"
                      }
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      editable={!loading}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={action === "Login" ? handleLogin : handleSignUp}
                disabled={loading || (action === "Sign up" && (!nom || !prenom))}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(48, 40, 158, 0.9)", "rgba(13, 15, 46, 0.9)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={styles.submitButtonContent}>
                      <Feather
                        name={action === "Login" ? "log-in" : "user-plus"}
                        size={20}
                        color="white"
                        style={styles.submitButtonIcon}
                      />
                      <Text style={styles.submitButtonText}>
                        {action === "Login" ? "Se connecter" : "S'inscrire"}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text
                style={[
                  styles.footerText,
                  isDark ? styles.textLightSecondary : styles.textDarkSecondary,
                ]}
              >
                {action === "Login" ? "Portail RH" : ""}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  darkBackground: {
    backgroundColor: "#1a1f38",
  },
  lightBackground: {
    backgroundColor: "#f0f4f8",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  themeToggle: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  themeToggleLight: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  themeToggleDark: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  branding: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 50,
  },
  gradientText: {
    textShadowColor: "rgba(56, 189, 248, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  authCard: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
  },
  authCardLight: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  authCardDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  switchButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  switchText: {
    color: "#384bf8",
    fontWeight: "500",
  },
  formContainer: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
  },
  inputWrapperLight: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderColor: "rgba(26, 31, 56, 0.15)",
  },
  inputWrapperDark: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
  },
  inputLight: {
    color: "#1a1f38",
  },
  inputDark: {
    color: "white",
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  submitButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  textLight: {
    color: "white",
  },
  textDark: {
    color: "#1a1f38",
  },
  textLightSecondary: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  textDarkSecondary: {
    color: "rgba(26, 31, 56, 0.7)",
  },
  blockedMessage: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  blockedIcon: {
    marginRight: 12,
  },
  blockedText: {
    color: "#F44336",
    flex: 1,
    fontWeight: "500",
  },
});

export default Authentication;