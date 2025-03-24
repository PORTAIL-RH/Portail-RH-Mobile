import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Platform,
  Modal,
  FlatList,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import * as DocumentPicker from "expo-document-picker"
import * as MediaLibrary from "expo-media-library"
import axios from "axios"
import {
  ArrowLeft,
  Moon,
  Sun,
  Calendar,
  FileText,
  Send,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  Search,
} from "lucide-react-native"
import Footer from "../../Components/Footer"
import { API_CONFIG } from "../../config/apiConfig"
import SidebarLayout from "./SidebarLayout"

// Define the navigation stack types
export type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Demandestot: undefined
  Authentification: undefined
  Notifications: undefined
  Autorisation: undefined
  AjouterDemande: undefined
  Formation: undefined
}

// Define the navigation prop type
type FormationNavigationProp = NativeStackNavigationProp<RootStackParamList, "Formation">

// Define interfaces for types, titles, and themes
interface Titre {
  id: string
  name: string
}

interface Type {
  id: string
  name: string
}

interface Theme {
  id: string
  name: string
}

const FormationPage = () => {
  const navigation = useNavigation<FormationNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")

  // Form state
  const [dateDebut, setDateDebut] = useState(new Date())
  const [nbrJours, setNbrJours] = useState("")
  const [texteDemande, setTexteDemande] = useState("")
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null)
  const [selectedTitre, setSelectedTitre] = useState<Titre | null>(null)
  const [selectedType, setSelectedType] = useState<Type | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [titres, setTitres] = useState<Titre[]>([])
  const [types, setTypes] = useState<Type[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState<Titre[] | Type[] | Theme[]>([])

  // Date picker visibility
  const [showDatePickerModal, setShowDatePickerModal] = useState(false)

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<"titre" | "type" | "theme" | null>(null)

  // Load theme preference and request permissions on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference()
      await requestMediaLibraryPermissions()
      await fetchTitres()
    }
    loadData()
  }, [])

  // Request media library permissions
  const requestMediaLibraryPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== "granted") {
        displayToast("error", "Vous devez autoriser l'accès aux fichiers pour joindre des documents.")
      }
    } catch (error) {
      console.error("Error requesting permissions:", error)
    }
  }

  // Load theme preference from AsyncStorage
  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("@theme_mode")
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark")
      }
    } catch (error) {
      console.error("Error loading theme preference:", error)
    }
  }

  // Toggle theme between light and dark mode
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  // Fetch titres from API
  const fetchTitres = async () => {
    setLoading(true)
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        displayToast("error", "Vous devez être connecté pour accéder à cette fonctionnalité.")
        return
      }

      const response = await axios.get(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Transform the data to match the expected structure
      const transformedTitres = response.data.map((titre: { id: string; titre: string }) => ({
        id: titre.id,
        name: titre.titre, // Use `titre.titre` as the name
      }))

      setTitres(transformedTitres)
    } catch (error) {
      console.error("Error fetching titres:", error)
      displayToast("error", "Erreur lors de la récupération des titres. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch types by titreId
  const fetchTypesByTitreId = async (titreId: string) => {
    setLoading(true)
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        displayToast("error", "Vous devez être connecté pour accéder à cette fonctionnalité.")
        return
      }

      const response = await axios.get(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/${titreId}/types`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Transform the data to match the expected structure
      const transformedTypes = response.data
        .filter((type: { id: string; type: string | null }) => type.type !== null) // Filter out null types
        .map((type: { id: string; type: string }) => ({
          id: type.id,
          name: type.type, // Use `type.type` as the name
        }))

      setTypes(transformedTypes)
    } catch (error) {
      console.error("Error fetching types:", error)
      displayToast("error", "Erreur lors de la récupération des types. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch themes by typeId
  const fetchThemesByTypeId = async (typeId: string) => {
    if (!selectedTitre) {
      displayToast("error", "Aucun titre sélectionné.")
      return
    }

    setLoading(true)
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        displayToast("error", "Vous devez être connecté pour accéder à cette fonctionnalité.")
        return
      }

      // Use selectedTitre.id from state
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/${selectedTitre.id}/types/${typeId}/themes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Transform the data to match the expected structure
      const transformedThemes = response.data
        .filter((theme: { id: string; theme: string | null }) => theme.theme !== null) // Filter out null themes
        .map((theme: { id: string; theme: string }) => ({
          id: theme.id,
          name: theme.theme, // Use `theme.theme` as the name
        }))

      setThemes(transformedThemes)
    } catch (error) {
      console.error("Error fetching themes:", error)
      displayToast("error", "Erreur lors de la récupération des thèmes. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

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
        displayToast("success", `Fichier "${selectedFile.name}" sélectionné`)
      } else {
        console.log("No file selected.")
      }
    } catch (err) {
      console.error("Error picking file:", err)
      displayToast("error", "Une erreur est survenue lors de la sélection du fichier.")
    }
  }

  // Date picker handlers
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDateDebut(selectedDate)
    }

    if (Platform.OS === "android") {
      setShowDatePickerModal(false)
    }
  }

  // Show date picker
  const showDatePicker = () => {
    setShowDatePickerModal(true)
  }

  // Open modal for selection
  const openModal = (type: "titre" | "type" | "theme") => {
    setModalType(type)
    setSearchQuery("")

    if (type === "titre") {
      setFilteredItems(titres)
    } else if (type === "type") {
      setFilteredItems(types)
    } else {
      setFilteredItems(themes)
    }

    setModalVisible(true)
  }

  // Handle selection from modal
  const handleSelect = (item: Titre | Type | Theme) => {
    if (modalType === "titre") {
      setSelectedTitre(item as Titre)
      setSelectedType(null)
      setSelectedTheme(null)
      fetchTypesByTitreId(item.id)
    } else if (modalType === "type") {
      setSelectedType(item as Type)
      setSelectedTheme(null)
      fetchThemesByTypeId(item.id)
    } else if (modalType === "theme") {
      setSelectedTheme(item as Theme)
    }
    setModalVisible(false)
  }

  // Filter items in modal
  const filterItems = (query: string) => {
    setSearchQuery(query)

    let items: (Titre | Type | Theme)[] = []
    if (modalType === "titre") {
      items = titres
    } else if (modalType === "type") {
      items = types
    } else if (modalType === "theme") {
      items = themes
    }

    if (query.trim() === "") {
      setFilteredItems(items)
    } else {
      const filtered = items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      setFilteredItems(filtered)
    }
  }

  // Validate form
  const validateForm = () => {
    if (!selectedTitre) {
      displayToast("error", "Veuillez sélectionner un titre.")
      return false
    }

    if (!selectedType) {
      displayToast("error", "Veuillez sélectionner un type.")
      return false
    }

    if (!selectedTheme) {
      displayToast("error", "Veuillez sélectionner un thème.")
      return false
    }

    if (!texteDemande.trim()) {
      displayToast("error", "Veuillez entrer une description pour votre demande.")
      return false
    }

    if (!nbrJours.trim() || isNaN(Number(nbrJours)) || Number(nbrJours) <= 0) {
      displayToast("error", "Veuillez entrer un nombre de jours valide.")
      return false
    }

    return true
  }

  // Display toast message
  const displayToast = (type: "success" | "error", message: string) => {
    setToastType(type)
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
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
        displayToast("error", "Informations utilisateur non trouvées. Veuillez vous reconnecter.")
        setSubmitting(false)
        return
      }

      const userInfo = JSON.parse(userInfoString)
      const matPersId = userInfo.id

      if (!matPersId) {
        displayToast("error", "Matricule utilisateur non trouvé. Veuillez vous reconnecter.")
        setSubmitting(false)
        return
      }

      const formData = new FormData()
      formData.append("dateDebut", dateDebut.toISOString().split("T")[0])
      formData.append("nbrJours", nbrJours)
      formData.append("typeDemande", "formation")
      formData.append("texteDemande", texteDemande)
      formData.append("titre", selectedTitre.id)
      formData.append("type", selectedType.id)
      formData.append("theme", selectedTheme.id)
      formData.append("annee_f", new Date().getFullYear().toString())
      formData.append("codeSoc", userInfo.codeSoc || "defaultValue")
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
        displayToast("error", "Vous devez être connecté pour soumettre une demande.")
        setSubmitting(false)
        return
      }

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-formation/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 200) {
        displayToast("success", "Demande de formation soumise avec succès!")
        // Reset form
        setTexteDemande("")
        setNbrJours("")
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
        displayToast("error", error.response?.data?.message || "Une erreur est survenue lors de l'envoi de la demande.")
      } else if (error instanceof Error) {
        displayToast("error", error.message)
      } else {
        displayToast("error", "Une erreur inconnue est survenue.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SidebarLayout title="Demande de formation">
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Header */}
        <View style={[styles.formHeader, themeStyles.card]}>
          <View style={styles.formHeaderIcon}>
            <FileText size={24} color={isDarkMode ? "#0e135f" : "#0e135f"} />
          </View>
          <View style={styles.formHeaderContent}>
            <Text style={[styles.formHeaderTitle, themeStyles.text]}>Nouvelle demande de formation</Text>
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
              Date de début <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={[styles.inputContainer, themeStyles.inputContainer]} onPress={showDatePicker}>
              <Calendar size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.text]}>
                {dateDebut.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre de jours */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Nombre de jours <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, themeStyles.inputContainer]}>
              <Clock size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputText, themeStyles.text]}
                placeholder="Entrez le nombre de jours"
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                value={nbrJours}
                onChangeText={setNbrJours}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Titre */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Titre <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.inputContainer, themeStyles.inputContainer]}
              onPress={() => openModal("titre")}
              disabled={loading}
            >
              <FileText size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.text]}>
                {selectedTitre ? selectedTitre.name : "Sélectionner un titre"}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#0e135f" style={styles.dropdownIcon} />
              ) : (
                <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} style={styles.dropdownIcon} />
              )}
            </TouchableOpacity>
          </View>

          {/* Type */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Type <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.inputContainer, themeStyles.inputContainer]}
              onPress={() => selectedTitre && openModal("type")}
              disabled={!selectedTitre || loading}
            >
              <FileText size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.text, !selectedTitre && themeStyles.disabledText]}>
                {selectedType
                  ? selectedType.name
                  : selectedTitre
                    ? "Sélectionner un type"
                    : "Veuillez d'abord sélectionner un titre"}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#0e135f" style={styles.dropdownIcon} />
              ) : (
                <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} style={styles.dropdownIcon} />
              )}
            </TouchableOpacity>
          </View>

          {/* Thème */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Thème <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.inputContainer, themeStyles.inputContainer]}
              onPress={() => selectedType && openModal("theme")}
              disabled={!selectedType || loading}
            >
              <FileText size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.text, !selectedType && themeStyles.disabledText]}>
                {selectedTheme
                  ? selectedTheme.name
                  : selectedType
                    ? "Sélectionner un thème"
                    : "Veuillez d'abord sélectionner un type"}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#0e135f" style={styles.dropdownIcon} />
              ) : (
                <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} style={styles.dropdownIcon} />
              )}
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.textAreaContainer, themeStyles.inputContainer]}>
              <FileText size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} style={styles.inputIcon} />
              <TextInput
                style={[styles.textArea, themeStyles.text]}
                multiline
                numberOfLines={4}
                placeholder="Décrivez votre demande de formation..."
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                value={texteDemande}
                onChangeText={setTexteDemande}
              />
            </View>
          </View>

          {/* Pièce jointe */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>Pièce jointe (optionnel)</Text>
            <TouchableOpacity style={[styles.inputContainer, themeStyles.inputContainer]} onPress={handleFileUpload}>
              <Paperclip size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.subtleText]}>
                {file ? file.name : "Sélectionner un fichier"}
              </Text>
            </TouchableOpacity>
            {file && (
              <View style={styles.fileInfo}>
                <FileText size={16} color={isDarkMode ? "#0e135f" : "#0e135f"} />
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
            <AlertTriangle size={16} color={isDarkMode ? "#FFC107" : "#FFC107"} />
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

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePickerModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePickerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModalContainer, themeStyles.card]}>
              <View style={styles.pickerModalHeader}>
                <Text style={[styles.pickerModalTitle, themeStyles.text]}>Date de début</Text>
                <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                  <XCircle size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={dateDebut}
                mode="date"
                display="spinner"
                onChange={onChangeDate}
                themeVariant={isDarkMode ? "dark" : "light"}
              />
              
              <TouchableOpacity
                style={styles.pickerDoneButton}
                onPress={() => setShowDatePickerModal(false)}
              >
                <Text style={styles.pickerDoneButtonText}>Terminé</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Selection Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, themeStyles.card]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, themeStyles.text]}>
                  {modalType === "titre"
                    ? "Sélectionner un titre"
                    : modalType === "type"
                      ? "Sélectionner un type"
                      : "Sélectionner un thème"}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <XCircle size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
                </TouchableOpacity>
              </View>

              <View style={[styles.searchContainer, themeStyles.inputContainer]}>
                <Search size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, themeStyles.text]}
                  placeholder="Rechercher..."
                  placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                  value={searchQuery}
                  onChangeText={filterItems}
                />
              </View>

              {loading ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#0e135f" />
                </View>
              ) : filteredItems.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Text style={[styles.modalEmptyText, themeStyles.subtleText]}>Aucun résultat trouvé</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, themeStyles.modalItem]}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={[styles.modalItemText, themeStyles.text]}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.modalList}
                />
              )}

              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Toast Message */}
      {showToast && (
        <View
          style={[
            styles.toast,
            toastType === "success" ? styles.toastSuccess : styles.toastError,
            { bottom: 70 }, // Position above footer
          ]}
        >
          {toastType === "success" ? <CheckCircle size={20} color="#FFFFFF" /> : <XCircle size={20} color="#FFFFFF" />}
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Footer */}
      <Footer />
    </SidebarLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
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
  dropdownIcon: {
    marginLeft: 8,
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
    backgroundColor: "#0e135f",
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
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  modalList: {
    paddingBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
  modalLoadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  modalEmptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  modalEmptyText: {
    fontSize: 16,
  },
  modalCloseButton: {
    backgroundColor: "#0e135f",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  toast: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toastSuccess: {
    backgroundColor: "#4CAF50",
  },
  toastError: {
    backgroundColor: "#F44336",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
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
  disabledText: {
    color: "#AAAAAA",
  },
  card: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEEEE",
  },
  noteContainer: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
  },
  modalItem: {
    borderBottomColor: "#EEEEEE",
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
  disabledText: {
    color: "#666666",
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
    borderWidth: 1,
    shadowColor: "transparent",
  },
  inputContainer: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
  },
  noteContainer: {
    backgroundColor: "rgba(255, 193, 7, 0.05)",
  },
  modalItem: {
    borderBottomColor: "#333333",
  },
})

export default FormationPage
