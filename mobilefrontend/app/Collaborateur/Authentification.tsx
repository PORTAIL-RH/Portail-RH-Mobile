import { useState, useEffect, useRef } from "react"
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
} from "react-native"
import axios from "axios"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message" 
import { API_CONFIG } from "../config/apiConfig"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"

// Define the navigation stack types
type AuthentificationStackParamList = {
  Authentification: undefined
  AccueilCollaborateur: undefined
  AdminDashboard: undefined
}

// Define the navigation prop type
type AuthentificationNavigationProp = NativeStackNavigationProp<AuthentificationStackParamList, "Authentification">

// Mouse/Touch Effect Background Component
const BackgroundWithMouseEffect = ({ theme }: { theme: string }) => {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  })

  // Animation value for the glow effect
  const animatedPosition = useRef(
    new Animated.ValueXY({
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    }),
  ).current

  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height })
    })

    return () => subscription.remove()
  }, [])

  // Create pan responder to track touch position
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      Animated.spring(animatedPosition, {
        toValue: { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY },
        useNativeDriver: false,
        friction: 5,
      }).start()
    },
  })

  const isDark = theme === "dark"

  return (
    <View style={styles.backgroundContainer}>
      {/* Rich gradient background - matches web version */}
      <LinearGradient
        colors={isDark ? ["#1a1f38", "#2d3a65", "#1a1f38"] : ["#f0f4f8", "#e2eaf2", "#f0f4f8"]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.backgroundGradient}
      />
    </View>
  )
}

const Authentication = () => {
  const navigation = useNavigation<AuthentificationNavigationProp>()
  const [action, setAction] = useState<"Login" | "Sign up">("Login")
  const [nom, setNom] = useState("") // Last name
  const [prenom, setPrenom] = useState("") // First name
  const [email, setEmail] = useState("")
  const [matricule, setMatricule] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState("light")

  // Add these new state variables after the existing state declarations (around line 110)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockExpiration, setBlockExpiration] = useState<number | null>(null)

  // Initialize theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme) {
          setTheme(savedTheme)
        }
      } catch (error) {
        console.error("Error loading theme:", error)
      }
    }

    loadTheme()
  }, [])

  // Toggle theme function
  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    try {
      // Update both keys for backward compatibility
      await AsyncStorage.setItem("theme", newTheme)
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  const showToast = (type: "success" | "error", message: string) => {
    Toast.show({
      type,
      text1: type === "success" ? "Success" : "Error",
      text2: message,
      position: "bottom",
      visibilityTime: 4000,
    })
  }

  const handleSignUp = async () => {
    if (!nom || !prenom || !matricule || !email || !password || !confirmPassword) {
      showToast("error", "Tous les champs sont obligatoires")
      return
    }

    if (!matricule.match(/^\d{5}$/)) {
      showToast("error", "Le matricule doit être composé de 5 chiffres")
      return
    }

    if (password !== confirmPassword) {
      showToast("error", "Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/register`, {
        nom, // Last name
        prenom, // First name
        matricule,
        email,
        motDePasse: password,
        confirmationMotDePasse: confirmPassword,
        role: "collaborateur",
        code_soc: "DEFAULT_CODE",
        service: "DEFAULT_SERVICE",
      })

      if (response.status === 200) {
        showToast("success", "Enregistrement réussi! Votre compte est en attente d'activation.")

        // Clear form fields
        setNom("")
        setPrenom("")
        setMatricule("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")

        // Switch to login after successful registration
        setTimeout(() => {
          setAction("Login")
        }, 3000)
      }
    } catch (error) {
      console.error("Error signing up:", error)
      showToast("error", "Une erreur est survenue lors de l'enregistrement")
    } finally {
      setLoading(false)
    }
  }

  // Add this useEffect to check if the user is blocked when the component mounts
  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const blockedUntil = await AsyncStorage.getItem("blockedUntil")
        if (blockedUntil) {
          const expirationTime = Number.parseInt(blockedUntil, 10)
          if (expirationTime > Date.now()) {
            // User is still blocked
            setIsBlocked(true)
            setBlockExpiration(expirationTime)
            // Set a timeout to unblock the user when the block expires
            const timeRemaining = expirationTime - Date.now()
            setTimeout(() => {
              setIsBlocked(false)
              setFailedAttempts(0)
              AsyncStorage.removeItem("blockedUntil")
            }, timeRemaining)
          } else {
            // Block has expired
            AsyncStorage.removeItem("blockedUntil")
          }
        }

        // Load failed attempts
        const attempts = await AsyncStorage.getItem("failedAttempts")
        if (attempts) {
          setFailedAttempts(Number.parseInt(attempts, 10))
        }
      } catch (error) {
        console.error("Error checking block status:", error)
      }
    }

    checkBlockStatus()
  }, [])

  // Replace the handleLogin function with this updated version
  const handleLogin = async () => {
    if (isBlocked) {
      const timeRemaining = blockExpiration ? Math.ceil((blockExpiration - Date.now()) / 60000) : 30
      showToast("error", `Compte bloqué. Réessayez dans ${timeRemaining} minutes.`)
      return
    }

    if (!matricule || !password) {
      showToast("error", "Matricule et mot de passe sont obligatoires")
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/login`, {
        matricule,
        motDePasse: password,
      })

      if (response.status === 200) {
        // Reset failed attempts on successful login
        setFailedAttempts(0)
        await AsyncStorage.setItem("failedAttempts", "0")

        const { token, id } = response.data

        // Fetch user details by ID
        const userResponse = await axios.get(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/byId/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const userData = userResponse.data

        // Extract the role, codeSoc, and Service from the user data
        const role = userData.role
        const codeSoc = userData.code_soc
        const Service = userData.serviceName

        // Check if the role is defined
        if (!role) {
          console.error("Role is undefined in the user data")
          showToast("error", "Role information is missing")
          setLoading(false)
          return
        }

        // Store token, user ID, user details, codeSoc, and Service in AsyncStorage
        await AsyncStorage.setItem("userToken", token)
        await AsyncStorage.setItem("userId", id)
        await AsyncStorage.setItem("userInfo", JSON.stringify(userData))
        await AsyncStorage.setItem("userCodeSoc", codeSoc || "")
        await AsyncStorage.setItem("userService", Service || "")
        await AsyncStorage.setItem("theme", theme) // Save current theme

        showToast("success", "Connexion réussie!")

        // Navigate based on role
        setTimeout(() => {
          if (role === "collaborateur") {
            navigation.navigate("AccueilCollaborateur")
          } else if (role === "admin" || role === "superviseur" || role === "RH" || role === "Chef Hiérarchique") {
            navigation.navigate("AdminDashboard")
          }
        }, 2000)
      }
    } catch (error) {
      console.error("Error logging in:", error)

      // Increment failed attempts
      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)
      await AsyncStorage.setItem("failedAttempts", newFailedAttempts.toString())

      // Check if user should be blocked
      if (newFailedAttempts >= 5) {
        // Block user for 30 minutes
        const blockDuration = 30 * 60 * 1000 // 30 minutes in milliseconds
        const expirationTime = Date.now() + blockDuration
        setIsBlocked(true)
        setBlockExpiration(expirationTime)
        await AsyncStorage.setItem("blockedUntil", expirationTime.toString())

        showToast("error", "Compte bloqué après 5 tentatives échouées. Réessayez dans 30 minutes.")
      } else {
        showToast("error", `Identifiants incorrects (${newFailedAttempts}/5 tentatives)`)
      }
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === "dark"

  return (
    <SafeAreaView style={[styles.safeArea, isDark ? styles.darkBackground : styles.lightBackground]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Background with mouse/touch effect - matches web version */}
      <BackgroundWithMouseEffect theme={theme} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          {/* Theme toggle button */}
          <TouchableOpacity
            style={[styles.themeToggle, isDark ? styles.themeToggleDark : styles.themeToggleLight]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Feather name={isDark ? "sun" : "moon"} size={24} color={isDark ? "white" : "#1a1f38"} />
          </TouchableOpacity>

          {/* Branding - matches web version */}
          <View style={styles.branding}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={[
                styles.logo,
                isDark && { tintColor: "white" }, // Only apply white tint in dark mode
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Auth Card - matches web version */}
          <View style={[styles.authCard, isDark ? styles.authCardDark : styles.authCardLight]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, isDark ? styles.textLight : styles.textDark, styles.gradientText]}>
                {action === "Login" ? "Connexion au portail RH" : "Créer un compte"}
              </Text>

              <Text style={[styles.headerSubtitle, isDark ? styles.textLightSecondary : styles.textDarkSecondary]}>
                {action === "Login"
                  ? "Entrez vos identifiants pour accéder à votre espace personnel"
                  : "Remplissez le formulaire pour créer votre compte"}
              </Text>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setAction(action === "Login" ? "Sign up" : "Login")
                  // Clear form fields
                  setNom("")
                  setPrenom("")
                  setMatricule("")
                  setEmail("")
                  setPassword("")
                  setConfirmPassword("")
                }}
                disabled={loading}
              >
                <Text style={styles.switchText}>{action === "Login" ? "Créer un compte" : "Se connecter"}</Text>
              </TouchableOpacity>
            </View>

            {/* Form Inputs */}
            <View style={styles.formContainer}>
              {action === "Sign up" && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>Nom</Text>
                    <View style={[styles.inputWrapper, isDark ? styles.inputWrapperDark : styles.inputWrapperLight]}>
                      <Feather
                        name="user"
                        size={20}
                        color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                        placeholder="Votre nom"
                        placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"}
                        value={nom}
                        onChangeText={setNom}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>Prénom</Text>
                    <View style={[styles.inputWrapper, isDark ? styles.inputWrapperDark : styles.inputWrapperLight]}>
                      <Feather
                        name="user"
                        size={20}
                        color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                        placeholder="Votre prénom"
                        placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"}
                        value={prenom}
                        onChangeText={setPrenom}
                        editable={!loading}
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>Matricule</Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputWrapperDark : styles.inputWrapperLight]}>
                  <Feather
                    name="hash"
                    size={20}
                    color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                    placeholder="5 chiffres"
                    placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"}
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
                  <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>Email</Text>
                  <View style={[styles.inputWrapper, isDark ? styles.inputWrapperDark : styles.inputWrapperLight]}>
                    <Feather
                      name="mail"
                      size={20}
                      color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                      placeholder="Votre email professionnel"
                      placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"}
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
                <Text style={[styles.inputLabel, isDark ? styles.textLight : styles.textDark]}>Mot de passe</Text>
                <View style={[styles.inputWrapper, isDark ? styles.inputWrapperDark : styles.inputWrapperLight]}>
                  <Feather
                    name="lock"
                    size={20}
                    color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                    placeholder="Votre mot de passe"
                    placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"}
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
                  <View style={[styles.inputWrapper, isDark ? styles.inputWrapperDark : styles.inputWrapperLight]}>
                    <Feather
                      name="lock"
                      size={20}
                      color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                      placeholder="Confirmez votre mot de passe"
                      placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(26, 31, 56, 0.4)"}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      editable={!loading}
                    />
                  </View>
                </View>
              )}

              {/* Add this block of code before the Submit Button in the return statement (around line 350) */}
              {isBlocked && (
                <View style={styles.blockedMessage}>
                  <Feather name="lock" size={24} color="#F44336" style={styles.blockedIcon} />
                  <Text style={styles.blockedText}>
                    Compte bloqué après 5 tentatives échouées.
                    {blockExpiration && (
                      <Text>
                        {"\n"}Réessayez dans {Math.ceil((blockExpiration - Date.now()) / 60000)} minutes.
                      </Text>
                    )}
                  </Text>
                </View>
              )}

              {/* Submit Button - matches web version */}
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
                    <View style={styles.loadingSpinner} />
                  ) : (
                    <View style={styles.submitButtonContent}>
                      <Feather
                        name={action === "Login" ? "log-in" : "user-plus"}
                        size={20}
                        color="white"
                        style={styles.submitButtonIcon}
                      />
                      <Text style={styles.submitButtonText}>{action === "Login" ? "Se connecter" : "S'inscrire"}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, isDark ? styles.textLightSecondary : styles.textDarkSecondary]}>
                {action === "Login" ? "Portail RH" : ""}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // Background styles - matches web version
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  topRightBlob: {
    top: -200,
    right: -200,
  },
  centerBlob: {
    top: "40%",
    right: "35%",
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  bottomLeftBlob: {
    bottom: -200,
    left: -200,
  },
  mouseEffect: {
    position: "absolute",
    width: 800,
    height: 800,
    borderRadius: 400,
  },
  mouseEffectGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 400,
  },

  // Main container styles
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

  // Theme toggle - matches web version
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

  // Branding - matches web version
  branding: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  brandingIcon: {
    marginRight: 10,
    // Add shadow to match web version
    textShadowColor: "rgba(56, 189, 248, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  logo: {
    width: 200, // Adjust the width
    height: 50, // Adjust the height
  },
  gradientText: {
    // Note: React Native doesn't support text gradients directly
    // This is a visual approximation
    textShadowColor: "rgba(56, 189, 248, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  // Auth card
  authCard: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    //elevation: 4,
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

  // Header
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

  // Form
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

  // Submit button
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
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderTopColor: "white",
    transform: [{ rotate: "360deg" }],
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },

  // Text colors - matches web version
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
  // Add these styles to the StyleSheet (at the end of the styles object)
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
})

export default Authentication
