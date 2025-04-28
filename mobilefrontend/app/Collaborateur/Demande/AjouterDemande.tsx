import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  useColorScheme,
  ActivityIndicator,
  Image,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Calendar, FileText, Clock, BookOpen, DollarSign, ChevronRight, ArrowLeft } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"

// Define the navigation stack types
export type RootStackParamList = {
  AjouterDemande: undefined
  Autorisation: undefined
  Conge: undefined
  Formation: undefined
  Document: undefined
  Pret: undefined
  AccueilCollaborateur: undefined
}

// Define the navigation prop type
type AjouterDemandeNavigationProp = NativeStackNavigationProp<RootStackParamList, "AjouterDemande">

const { width } = Dimensions.get("window")

const AjouterDemande = () => {
  const navigation = useNavigation<AjouterDemandeNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [loading, setLoading] = useState(true)

  // Load theme preference from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("theme")
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === "dark")
        }
        setLoading(false)
      } catch (error) {
        console.error("Error loading theme preference:", error)
        setLoading(false)
      }
    }

    loadThemePreference()
  }, [])

  // Toggle theme between light and dark mode
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme);
      await AsyncStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  // Demand types with icons and descriptions
  const demandTypes = [
    {
      id: 1,
      title: "Autorisation d'absence",
      icon: <Clock size={24} color="#9370DB" />,
      description: "Demander une autorisation pour une absence ou un retard.",
      navigateTo: "Autorisation",
      color: "rgba(147, 112, 219, 0.15)",
    },
    {
      id: 2,
      title: "Congé",
      icon: <Calendar size={24} color="#4CAF50" />,
      description: "Demander un congé pour des raisons personnelles ou médicales.",
      navigateTo: "Conge",
      color: "rgba(76, 175, 80, 0.15)",
    },
    {
      id: 3,
      title: "Formation",
      icon: <BookOpen size={24} color="#FF9800" />,
      description: "Demander une formation pour améliorer vos compétences.",
      navigateTo: "Formation",
      color: "rgba(255, 152, 0, 0.15)",
    },
    {
      id: 4,
      title: "Document",
      icon: <FileText size={24} color="#2196F3" />,
      description: "Demander un document officiel ou une attestation.",
      navigateTo: "Document",
      color: "rgba(33, 150, 243, 0.15)",
    },
    {
      id: 5,
      title: "Prêt",
      icon: <DollarSign size={24} color="#F44336" />,
      description: "Demander un prêt financier pour des besoins personnels.",
      navigateTo: "Pret",
      color: "rgba(244, 67, 54, 0.15)",
    },
  ]

  if (loading) {
    return (
      <LinearGradient
        colors={isDarkMode ? ["#1a1f38", "#2d3a65"] : ["#f0f4f8", "#e2eaf2"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9370DB" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={isDarkMode ? ["#1a1f38", "#2d3a65"] : ["#f0f4f8", "#e2eaf2"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={isDarkMode ? ["#1a1f38", "#2d3a65"] : ["#f0f4f8", "#e2eaf2"]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[styles.header, themeStyles.header]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
            <ArrowLeft size={24} color={isDarkMode ? "#E0E0E0" : "#1a1f38"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, themeStyles.text]}>Ajouter une Demande</Text>
          <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
          <View style={[styles.iconButtonInner, isDarkMode ? styles.iconButtonInnerDark : styles.iconButtonInnerLight]}>
            {isDarkMode ? (
              <Feather name="sun" size={22} color="#E0E0E0" />
            ) : (
              <Feather name="moon" size={22} color="#333" />
            )}
          </View>
        </TouchableOpacity>
        </LinearGradient>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={[styles.introContainer, themeStyles.card]}>
            <Text style={[styles.introTitle, themeStyles.text]}>Quel type de demande souhaitez-vous soumettre ?</Text>
            <Text style={[styles.introText, themeStyles.subtleText]}>
              Sélectionnez une option ci-dessous pour commencer votre demande. Vous pourrez suivre l'état de votre demande
              dans la section "Mes demandes".
            </Text>
          </View>

          {/* Demand Types */}
          {demandTypes.map((demand) => (
            <TouchableOpacity
              key={demand.id}
              style={[styles.demandCard, themeStyles.card]}
              onPress={() => navigation.navigate(demand.navigateTo as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.demandIconContainer, { backgroundColor: demand.color }]}>{demand.icon}</View>
              <View style={styles.demandTextContainer}>
                <Text style={[styles.demandTitle, themeStyles.text]}>{demand.title}</Text>
                <Text style={[styles.demandDescription, themeStyles.subtleText]}>{demand.description}</Text>
              </View>
              <ChevronRight size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
            </TouchableOpacity>
          ))}

          {/* Additional information */}
          <View style={[styles.infoContainer, themeStyles.infoContainer]}>
            <Text style={[styles.infoText, themeStyles.subtleText]}>
              Besoin d'aide ? Contactez le service RH pour plus d'informations sur les différents types de demandes.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40, // More space for status bar
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  themeButton: {
    padding: 8,
  },
  themeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
  },
  introContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
  },
  demandCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  demandIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  demandTextContainer: {
    flex: 1,
  },
  demandTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  demandDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  iconButton: {
    marginLeft: 8,
    position: "relative",
  },
  iconButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonInnerLight: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  iconButtonInnerDark: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
})

const lightStyles = StyleSheet.create({
  header: {
    backgroundColor: "#e2eaf2",
    borderBottomColor: "#d0d8e0",
  },
  text: {
    color: "#1a1f38",
  },
  subtleText: {
    color: "#4a5568",
  },
  card: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoContainer: {
    backgroundColor: "rgba(147, 112, 219, 0.08)",
  },
})

const darkStyles = StyleSheet.create({
  header: {
    backgroundColor: "#2d3a65",
    borderBottomColor: "#3a4a7a",
  },
  text: {
    color: "#e2e8f0",
  },
  subtleText: {
    color: "#a0aec0",
  },
  card: {
    backgroundColor: "#2d3a65",
    borderColor: "#3a4a7a",
    borderWidth: 1,
  },
  infoContainer: {
    backgroundColor: "rgba(147, 112, 219, 0.15)",
  },
})

export default AjouterDemande