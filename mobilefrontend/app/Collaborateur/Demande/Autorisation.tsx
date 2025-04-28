import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Platform,
  Modal,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import * as DocumentPicker from "expo-document-picker"
import axios from "axios"
import { Calendar, Clock, FileText, Send, Paperclip, CheckCircle, XCircle, AlertTriangle } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import Footer from "../../Components/Footer"
import { API_CONFIG } from "../../config/apiConfig"
import SidebarLayout from "./SidebarLayout"
import Toast from 'react-native-toast-message';

// Define the navigation stack types
export type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Demandestot: undefined
  Authentification: undefined
  Notifications: undefined
  Autorisation: undefined
  AjouterDemande: undefined
}

// Define the navigation prop type
type AutorisationNavigationProp = NativeStackNavigationProp<RootStackParamList, "Autorisation">

// Define the type for the file state
type DocumentPickerAsset = {
  uri: string
  name: string
  mimeType?: string
}

const AutorisationPage = () => {
  const navigation = useNavigation<AutorisationNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const showToast = (type: 'success' | 'error', message: string, shouldNavigate = false) => {
      Toast.show({
        type,
        text1: type === 'success' ? 'Succès' : 'Erreur',
        text2: message,
        position: 'bottom',
        visibilityTime: 3000,
        onHide: () => {
          if (shouldNavigate) {
            navigation.navigate('AccueilCollaborateur');
          }
        }
      });
    };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  // Form state
  const [dateDebut, setDateDebut] = useState(new Date())
  const [timeSortie, setTimeSortie] = useState(new Date())
  const [timeRetour, setTimeRetour] = useState(new Date(new Date().setHours(new Date().getHours() + 1)))
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<DocumentPickerAsset | null>(null)
  const [codeSoc, setCodeSoc] = useState<string | null>(null)

  // Date/time picker visibility
  const [showPickerDebut, setShowPickerDebut] = useState(false)
  const [showPickerSortie, setShowPickerSortie] = useState(false)
  const [showPickerRetour, setShowPickerRetour] = useState(false)
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date")
  const [showPickerModal, setShowPickerModal] = useState(false)
  const [activePickerType, setActivePickerType] = useState<"date" | "sortie" | "retour">("date")

  // Load theme preference and codeSoc on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference()
      await loadCodeSoc()
    }
    loadData()
  }, [])

  // Load theme preference from AsyncStorage
  const loadThemePreference = async () => {
    try {
      // Use the standard 'theme' key instead of '@theme_mode'
      const storedTheme = await AsyncStorage.getItem("theme")
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark")
      }
    } catch (error) {
      console.error("Error loading theme preference:", error)
    }
  }

  // Load codeSoc from AsyncStorage
  const loadCodeSoc = async () => {
    try {
      const userCodeSoc = await AsyncStorage.getItem("userCodeSoc")
      if (userCodeSoc) {
        setCodeSoc(userCodeSoc)
      }
    } catch (error) {
      console.error("Error loading codeSoc:", error)
    }
  }

  // Toggle theme between light and dark mode
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      // Update both keys for backward compatibility
      await AsyncStorage.setItem("theme", newTheme)
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  // Handle file upload
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      })

      if (result.canceled) {
        console.log("File selection cancelled by the user.")
        return
      }

      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0]
        setFile(selectedFile)
        console.log("File selected:", selectedFile.name)
        showToast("success", `Fichier "${selectedFile.name}" sélectionné`)
      } else {
        console.log("No file selected.")
      }
    } catch (err) {
      console.error("Error picking file:", err)
      showToast("error", "Une erreur est survenue lors de la sélection du fichier.")
    }
  }

  // Date picker handlers
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      if (activePickerType === "date") {
        setDateDebut(selectedDate)
      } else if (activePickerType === "sortie") {
        setTimeSortie(selectedDate)
      } else if (activePickerType === "retour") {
        setTimeRetour(selectedDate)
      }
    }

    if (Platform.OS === "android") {
      setShowPickerModal(false)
    }
  }

  // Show date picker
  const showDatePicker = (type: "date" | "sortie" | "retour") => {
    setActivePickerType(type)

    if (type === "date") {
      setPickerMode("date")
    } else {
      setPickerMode("time")
    }

    setShowPickerModal(true)
  }

  // Validate form
  const validateForm = () => {
    if (!description.trim()) {
      showToast("error", "Veuillez entrer une description.")
      return false
    }

    if (!codeSoc) {
      showToast("error", "Code société non trouvé. Veuillez vous reconnecter.")
      return false
    }

    // Check if return time is after departure time
    if (timeRetour <= timeSortie) {
      showToast("error", "L'heure de retour doit être après l'heure de sortie.")
      return false
    }

    return true
  }

  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const userInfoString = await AsyncStorage.getItem("userInfo")

      if (!userInfoString) {
        showToast("error", "Informations utilisateur non trouvées. Veuillez vous reconnecter.")
        setSubmitting(false)
        return
      }

      const userInfo = JSON.parse(userInfoString)
      const matPersId = userInfo.id

      if (!matPersId) {
        showToast("error", "Matricule utilisateur non trouvé. Veuillez vous reconnecter.")
        setSubmitting(false)
        return
      }

      const formData = new FormData()
      formData.append("dateDebut", dateDebut.toISOString().split("T")[0])
      formData.append("dateFin", dateDebut.toISOString().split("T")[0])
      formData.append("texteDemande", description)
      formData.append("heureSortie", formatTime(timeSortie))
      formData.append("heureRetour", formatTime(timeRetour))
      formData.append("codAutorisation", "AUTORISATION_VALIDE")
      formData.append("codeSoc", codeSoc as string)
      formData.append("matPersId", matPersId)

      // Append the file only if it exists
      if (file) {
        const fileUri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "")
        formData.append("file", {
          uri: fileUri,
          type: file.mimeType || "application/octet-stream",
          name: file.name,
        } as any)
      }

      const token = await AsyncStorage.getItem("userToken")

      if (!token) {
        showToast("error", "Vous devez être connecté pour soumettre une demande.")
        setSubmitting(false)
        return
      }

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-autorisation/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      )
      showToast("success", "Demande d'autorisation soumise avec succès!", true);

      if (response.status === 200) {
        showToast("success", "Demande d'autorisation soumise avec succès!", true);
        // Reset form
        setDescription("")
        setFile(null)
        // Navigate back to home after a short delay
        setTimeout(() => {
          navigation.navigate("AccueilCollaborateur")
        }, 1500)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      if (axios.isAxiosError(error)) {
        console.error("Server Response:", error.response?.data)
        showToast("error", error.response?.data?.message || "Une erreur est survenue lors de l'envoi de la demande.")
      } else if (error instanceof Error) {
        showToast("error", error.message)
      } else {
        showToast("error", "Une erreur inconnue est survenue.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <LinearGradient colors={isDarkMode ? ["#1a1f38", "#2d3a65"] : ["#f0f4f8", "#e2eaf2"]} style={styles.container}>
      <SidebarLayout title="Demande d'autorisation">
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Header */}
          <View style={[styles.formHeader, themeStyles.card]}>
            <View style={styles.formHeaderIcon}>
              <Clock size={24} color={isDarkMode ? "#CCCCCC" : "#0e135f"} />
            </View>
            <View style={styles.formHeaderContent}>
              <Text style={[styles.formHeaderTitle, themeStyles.text]}>Nouvelle demande d'autorisation</Text>
              <Text style={[styles.formHeaderSubtitle, themeStyles.subtleText]}>
                Remplissez le formulaire ci-dessous pour soumettre votre demande
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, themeStyles.card]}>
            {/* Date de début */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, themeStyles.text]}>
                Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.inputContainer, themeStyles.inputContainer]}
                onPress={() => showDatePicker("date")}
              >
                <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                <Text style={[styles.inputText, themeStyles.text]}>
                  {dateDebut.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Heure sortie */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, themeStyles.text]}>
                Heure de sortie <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.inputContainer, themeStyles.inputContainer]}
                onPress={() => showDatePicker("sortie")}
              >
                <Clock size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                <Text style={[styles.inputText, themeStyles.text]}>{formatTime(timeSortie)}</Text>
              </TouchableOpacity>
            </View>

            {/* Heure retour */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, themeStyles.text]}>
                Heure de retour <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.inputContainer, themeStyles.inputContainer]}
                onPress={() => showDatePicker("retour")}
              >
                <Clock size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                <Text style={[styles.inputText, themeStyles.text]}>{formatTime(timeRetour)}</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, themeStyles.text]}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.textAreaContainer, themeStyles.inputContainer]}>
                <FileText size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textArea, themeStyles.text]}
                  multiline
                  numberOfLines={4}
                  placeholder="Motif de la demande d'autorisation..."
                  placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Pièce jointe */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, themeStyles.text]}>Pièce jointe (optionnel)</Text>
              <TouchableOpacity style={[styles.inputContainer, themeStyles.inputContainer]} onPress={handleFileUpload}>
                <Paperclip size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                <Text style={[styles.inputText, themeStyles.subtleText]}>
                  {file ? file.name : "Sélectionner un fichier"}
                </Text>
              </TouchableOpacity>
              {file && (
                <View style={styles.fileInfo}>
                  <FileText size={16} color={isDarkMode ? "#CCCCCC" : "#0e135f"} />
                  <Text style={[styles.fileName, themeStyles.subtleText]} numberOfLines={1} ellipsizeMode="middle">
                    {file.name}
                  </Text>
                  <TouchableOpacity style={styles.removeFile} onPress={() => setFile(null)}>
                    <XCircle size={16} color={isDarkMode ? "#E0E0E0" : "#757575"} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Note */}
            <View style={[styles.noteContainer, themeStyles.noteContainer]}>
              <AlertTriangle size={16} color="#FFC107" />
              <Text style={[styles.noteText, themeStyles.subtleText]}>
                Les champs marqués d'un astérisque (*) sont obligatoires
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={20} color="#FFFFFF" style={styles.submitButtonIcon} />
                  <Text style={styles.submitButtonText}>Soumettre la demande</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Date/Time Picker Modal */}
          <Modal
            visible={showPickerModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPickerModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.pickerModalContainer, themeStyles.card]}>
                <View style={styles.pickerModalHeader}>
                  <Text style={[styles.pickerModalTitle, themeStyles.text]}>
                    {activePickerType === "date"
                      ? "Sélectionner une date"
                      : activePickerType === "sortie"
                        ? "Heure de sortie"
                        : "Heure de retour"}
                  </Text>
                  <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                    <XCircle size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
                  </TouchableOpacity>
                </View>

                <DateTimePicker
                  value={
                    activePickerType === "date" ? dateDebut : activePickerType === "sortie" ? timeSortie : timeRetour
                  }
                  mode={pickerMode}
                  is24Hour={true}
                  display="spinner"
                  onChange={onChangeDate}
                  themeVariant={isDarkMode ? "dark" : "light"}
                />

                <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setShowPickerModal(false)}>
                  <Text style={styles.pickerDoneButtonText}>Terminé</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>


        {/* Footer */}
        <Footer />

        {/* Toast Message */}
        <Toast />
        
      </SidebarLayout>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  formHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(147, 112, 219, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  formHeaderContent: {
    flex: 1,
  },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  formHeaderSubtitle: {
    fontSize: 14,
  },
  formContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  required: {
    color: "#F44336",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  textAreaContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  removeFile: {
    padding: 4,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 14,
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181E33",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#0e135f80",
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerContainer: {
    borderRadius: 12,
    marginTop: 16,
    overflow: "hidden",
  },
  pickerDoneButton: {
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  pickerDoneButtonText: {
    color: "#0e135f",
    fontSize: 16,
    fontWeight: "600",
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContainer: {
    width: "90%",
    borderRadius: 12,
    padding: 16,
    overflow: "hidden",
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
})

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: "#f0f4f8",
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
  inputContainer: {
    backgroundColor: "#ffffff",
    borderColor: "#d0d8e0",
  },
  noteContainer: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
  },
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1f38",
  },
  text: {
    color: "#e2e8f0",
  },
  subtleText: {
    color: "#a0aec0",
  },
  card: {
    backgroundColor: "#8989A733",
    borderColor: "#2D2F3DFA",
    borderWidth: 1,
  },
  inputContainer: {
    backgroundColor: "#8989A733",
    borderColor: "#2D2F3DFA",
  },
  noteContainer: {
    backgroundColor: "rgba(255, 193, 7, 0.05)",
  },
})

export default AutorisationPage

