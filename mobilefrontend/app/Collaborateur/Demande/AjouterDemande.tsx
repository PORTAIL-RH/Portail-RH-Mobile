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
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Calendar, FileText, Clock, BookOpen, DollarSign, ChevronRight, ArrowLeft } from "lucide-react-native"

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
        const storedTheme = await AsyncStorage.getItem("@theme_mode")
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

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  // Demand types with icons and descriptions
  const demandTypes = [
    {
      id: 1,
      title: "Autorisation d'absence",
      icon: <Clock size={24} color={isDarkMode ? "#9370DB" : "#9370DB"} />,
      description: "Demander une autorisation pour une absence ou un retard.",
      navigateTo: "Autorisation",
      color: "rgba(147, 112, 219, 0.15)",
    },
    {
      id: 2,
      title: "Congé",
      icon: <Calendar size={24} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />,
      description: "Demander un congé pour des raisons personnelles ou médicales.",
      navigateTo: "Conge",
      color: "rgba(76, 175, 80, 0.15)",
    },
    {
      id: 3,
      title: "Formation",
      icon: <BookOpen size={24} color={isDarkMode ? "#FF9800" : "#FF9800"} />,
      description: "Demander une formation pour améliorer vos compétences.",
      navigateTo: "Formation",
      color: "rgba(255, 152, 0, 0.15)",
    },
    {
      id: 4,
      title: "Document",
      icon: <FileText size={24} color={isDarkMode ? "#2196F3" : "#2196F3"} />,
      description: "Demander un document officiel ou une attestation.",
      navigateTo: "Document",
      color: "rgba(33, 150, 243, 0.15)",
    },
    {
      id: 5,
      title: "Prêt",
      icon: <DollarSign size={24} color={isDarkMode ? "#F44336" : "#F44336"} />,
      description: "Demander un prêt financier pour des besoins personnels.",
      navigateTo: "Pret",
      color: "rgba(244, 67, 54, 0.15)",
    },
  ]

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9370DB" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* Header */}
      <View style={[styles.header, themeStyles.header]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
          <ArrowLeft size={24} color={isDarkMode ? "#E0E0E0" : "#333333"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, themeStyles.text]}>Ajouter une Demande</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Introduction */}
      <View style={[styles.introContainer, themeStyles.card]}>
        <Text style={[styles.introTitle, themeStyles.text]}>Quel type de demande souhaitez-vous soumettre ?</Text>
        <Text style={[styles.introText, themeStyles.subtleText]}>
          Sélectionnez une option ci-dessous pour commencer votre demande. Vous pourrez suivre l'état de votre demande
          dans la section "Mes demandes".
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  introContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
})

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
  },
  text: {
    color: "#333333",
  },
  subtleText: {
    color: "#757575",
  },
  card: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoContainer: {
    backgroundColor: "rgba(33, 150, 243, 0.08)",
  },
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
  },
  text: {
    color: "#E0E0E0",
  },
  subtleText: {
    color: "#AAAAAA",
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
    borderWidth: 1,
  },
  infoContainer: {
    backgroundColor: "rgba(33, 150, 243, 0.15)",
  },
})

export default AjouterDemande

