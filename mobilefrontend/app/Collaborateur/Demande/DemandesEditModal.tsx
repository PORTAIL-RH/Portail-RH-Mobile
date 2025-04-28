import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  type ViewStyle,
  type TextStyle,
  SafeAreaView,
} from "react-native"
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  CheckCircle,
  Save,
  AlertTriangle,
} from "lucide-react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { API_CONFIG } from "../../config/apiConfig"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import BackgroundGradient from "../../Components/BackgroundGradient"

const { width, height } = Dimensions.get("window")

// Types
interface EditableRequestData {
  description?: string
  titre?: string
  titreId?: string
  theme?: string
  themeId?: string
  typeFormation?: string
  typeId?: string
  typeDocument?: string
  typePreavance?: string
  montant?: string
  heureSortie?: string
  heureRetour?: string
  startDate?: string
  endDate?: string
  duration?: string
  periodeDebut?: string
  periodeFin?: string
  files?: {
    uri: string
    name: string
    type: string
  }[]
  minuteSortie?: string
  minuteRetour?: string
}

interface Request {
  id: string
  type: string
  description: string
  status: "pending" | "approved" | "rejected"
  date: string
  time: string
  details: {
    startDate?: string
    endDate?: string
    duration?: string
    reason?: string
    comments?: string
    approver?: string
    documents?: string[]
    filesReponse?: string[]
    requestDate?: string
    approvalDate?: string
    rejectionDate?: string
    purpose?: string
    equipment?: string
    provider?: string
    location?: string
    cost?: string
    amount?: string
    repaymentPlan?: string
    titre?: string | { titre: string }
    typeFormation?: string | { type: string }
    theme?: string | { theme: string }
    typeDocument?: string
    typePreavance?: string
    montant?: string
    heureSortie?: string
    heureRetour?: string
    periodeDebut?: string
    periodeFin?: string
  }
  originalData?: {
    dateDebut?: string
    dateFin?: string
  }
}

interface ThemeStyles {
  text: TextStyle
  subtleText: TextStyle
  card: ViewStyle
  searchInputContainer: ViewStyle
  activeFilterOption: ViewStyle
  detailsActionButton: ViewStyle
  detailsActionButtonText: TextStyle
  detailsCancelButton: ViewStyle
  detailsCancelButtonText: TextStyle
  modalItem?: ViewStyle
  modalItemText?: TextStyle
  modalContainer?: ViewStyle
  modalHeader?: ViewStyle
  modalTitle?: TextStyle
  modalCloseButton?: ViewStyle
  modalCloseButtonText?: TextStyle
  inputContainer?: ViewStyle
  inputIcon?: ViewStyle
  inputText?: TextStyle
}

interface DemandesEditFormProps {
  editingRequest: Request | null
  editableData: EditableRequestData
  setEditableData: React.Dispatch<React.SetStateAction<EditableRequestData>>
  isDarkMode: boolean
  themeStyles: ThemeStyles
  userId: string | null
  onSave: () => void
}

const DemandesEditForm: React.FC<DemandesEditFormProps> = ({
  editingRequest,
  editableData,
  setEditableData,
  isDarkMode,
  themeStyles,
  userId,
  onSave,
}) => {
  const navigation = useNavigation()

  // State for formation dropdowns
  const [titres, setTitres] = useState<{ id: string; name: string }[]>([])
  const [types, setTypes] = useState<{ id: string; name: string }[]>([])
  const [themes, setThemes] = useState<{ id: string; name: string }[]>([])
  const [showTitreSelector, setShowTitreSelector] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [selectedTitreId, setSelectedTitreId] = useState<string | null>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [currentPickerMode, setCurrentPickerMode] = useState<"date" | "time">("date")
  const [currentEditField, setCurrentEditField] = useState<string>("")

  // State for date pickers
  const [dateDebut, setDateDebut] = useState(new Date())
  const [dateFin, setDateFin] = useState(new Date())
  const [timeSortie, setTimeSortie] = useState(new Date())
  const [timeRetour, setTimeRetour] = useState(new Date())
  const [periodeDebut, setPeriodeDebut] = useState("matin")
  const [periodeFin, setPeriodeFin] = useState("matin")
  const [showPeriodeDebutSelector, setShowPeriodeDebutSelector] = useState(false)
  const [showPeriodeFinSelector, setShowPeriodeFinSelector] = useState(false)

  const [documentTypes, setDocumentTypes] = useState([
    { id: 1, name: "Attestation de travail", selected: true },
    { id: 2, name: "Attestation de salaire", selected: false },
    { id: 3, name: "Attestation de congé", selected: false },
    { id: 4, name: "Autre document", selected: false },
  ])
  const [selectedDocumentType, setSelectedDocumentType] = useState("Attestation de travail")
  const [showDocumentTypeSelector, setShowDocumentTypeSelector] = useState(false)

  const [showTypeAvanceSelector, setShowTypeAvanceSelector] = useState(false)
  const [typesAvance, setTypesAvance] = useState([
    { id: 1, name: "MEDICAL", selected: true },
    { id: 2, name: "SCOLARITE", selected: false },
    { id: 3, name: "VOYAGE", selected: false },
    { id: 4, name: "INFORMATIQUE", selected: false },
    { id: 5, name: "DEMENAGEMENT", selected: false },
    { id: 6, name: "MARIAGE", selected: false },
    { id: 7, name: "FUNERAILLES", selected: false },
  ])
  const [selectedTypeAvance, setSelectedTypeAvance] = useState("MEDICAL")

  const descriptionInputRef = useRef<TextInput>(null)

// Add timeout to all fetch requests
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Fetch titres from API

const fetchTitres = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      console.error("Authentication token not found");
      return;
    }

    const data = await fetchWithTimeout(
      `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const transformedTitres = data.map((titre: { id: string; titre: string }) => ({
      id: titre.id,
      name: titre.titre,
    }));

    setTitres(transformedTitres);

    if (editableData.titre) {
      const matchingTitre = transformedTitres.find((t) => t.name === editableData.titre);
      if (matchingTitre) {
        setSelectedTitreId(matchingTitre.id);
        await fetchTypesByTitreId(matchingTitre.id); // Make this await to ensure proper sequence
      }
    }
  } catch (error) {
    console.error("Error fetching titres:", error);
    showToast('error', 'Erreur', 'La requête a pris trop de temps. Veuillez réessayer.');
  }
};

  // Fetch types by titreId
  const fetchTypesByTitreId = async (titreId: string) => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        console.error("Authentication token not found")
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/${titreId}/types`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch types")
      }

      const data = await response.json()
      // Transform the data to match the expected structure
      const transformedTypes = data
        .filter((type: { id: string; type: string | null }) => type.type !== null)
        .map((type: { id: string; type: string }) => ({
          id: type.id,
          name: type.type,
        }))

      setTypes(transformedTypes)
    } catch (error) {
      console.error("Error fetching types:", error)
    }
  }

  // Fetch themes by typeId
  const fetchThemesByTypeId = async (titreId: string, typeId: string) => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        console.error("Authentication token not found")
        return
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/${titreId}/types/${typeId}/themes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch themes")
      }

      const data = await response.json()
      // Transform the data to match the expected structure
      const transformedThemes = data
        .filter((theme: { id: string; theme: string | null }) => theme.theme !== null)
        .map((theme: { id: string; theme: string }) => ({
          id: theme.id,
          name: theme.theme,
        }))

      setThemes(transformedThemes)
    } catch (error) {
      console.error("Error fetching themes:", error)
    }
  }

  // Select titre
  const selectTitre = (id: string, name: string) => {
    setSelectedTitreId(id)
    setEditableData({ ...editableData, titre: name, titreId: id })
    setShowTitreSelector(false)
    // Reset type and theme when titre changes
    setSelectedTypeId(null)
    setSelectedThemeId(null)
    setEditableData((prev) => ({ ...prev, typeFormation: "", typeId: "", theme: "", themeId: "" }))
    // Fetch types for the selected titre
    fetchTypesByTitreId(id)
  }

  // Select type
  const selectType = (id: string, name: string) => {
    setSelectedTypeId(id)
    setEditableData({ ...editableData, typeFormation: name, typeId: id })
    setShowTypeSelector(false)
    // Reset theme when type changes
    setSelectedThemeId(null)
    setEditableData((prev) => ({ ...prev, theme: "", themeId: "" }))
    // Fetch themes for the selected type
    if (selectedTitreId) {
      fetchThemesByTypeId(selectedTitreId, id)
    }
  }

  // Select theme
  const selectTheme = (id: string, name: string) => {
    setSelectedThemeId(id)
    setEditableData({ ...editableData, theme: name, themeId: id })
    setShowThemeSelector(false)
  }

  // Select document type
  const selectDocumentType = (id: number) => {
    const updatedTypes = documentTypes.map((type) => ({
      ...type,
      selected: type.id === id,
    }))
    setDocumentTypes(updatedTypes)
    const selectedType = documentTypes.find((type) => type.id === id)
    if (selectedType) {
      setSelectedDocumentType(selectedType.name)
      setEditableData({ ...editableData, typeDocument: selectedType.name })
    }
    setShowDocumentTypeSelector(false)
  }

  // Select type avance
  const selectTypeAvance = (id: number) => {
    const updatedTypes = typesAvance.map((type) => ({
      ...type,
      selected: type.id === id,
    }))
    setTypesAvance(updatedTypes)
    const selectedType = typesAvance.find((type) => type.id === id)
    if (selectedType) {
      setSelectedTypeAvance(selectedType.name)
      // Convert to uppercase to match the backend enum values
      setEditableData({ ...editableData, typePreavance: selectedType.name })
    }
    setShowTypeAvanceSelector(false)
  }

  // Handle periode selection
  const handlePeriodeSelection = (periode: string, type: "debut" | "fin") => {
    if (type === "debut") {
      setPeriodeDebut(periode)
      // Mettre à jour editableData avec la valeur sélectionnée
      setEditableData((prev) => ({
        ...prev,
        periodeDebut: periode,
      }))
      setShowPeriodeDebutSelector(false)
    } else {
      setPeriodeFin(periode)
      // Mettre à jour editableData avec la valeur sélectionnée
      setEditableData((prev) => ({
        ...prev,
        periodeFin: periode,
      }))
      setShowPeriodeFinSelector(false)
    }
  }

  // Show date/time picker
  const showDateTimePicker = (mode: "date" | "time", field: string) => {
    setCurrentPickerMode(mode)
    setCurrentEditField(field)
    setDatePickerVisible(true)
  }

  // Handle date/time selection
  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      switch (currentEditField) {
        case "dateDebut":
          setDateDebut(selectedDate)
          // Format date as YYYY-MM-DD for the backend
          const dateDebutStr = selectedDate.toISOString().split("T")[0]
          setEditableData({
            ...editableData,
            startDate: dateDebutStr,
            // Do NOT update the date field here, as that's the submission date
          })

          // If start date is after end date, update end date
          if (selectedDate > dateFin) {
            const newEndDate = new Date(selectedDate)
            newEndDate.setDate(selectedDate.getDate() + 1)
            setDateFin(newEndDate)
            setEditableData((prev) => ({
              ...prev,
              endDate: newEndDate.toISOString().split("T")[0],
            }))
          }
          break
        case "dateFin":
          setDateFin(selectedDate)
          // Format date as YYYY-MM-DD for the backend
          const dateFinStr = selectedDate.toISOString().split("T")[0]
          setEditableData({
            ...editableData,
            endDate: dateFinStr,
          })
          break
        case "heureSortie":
          setTimeSortie(selectedDate)
          setEditableData({
            ...editableData,
            heureSortie: formatTime(selectedDate),
          })
          break
        case "heureRetour":
          setTimeRetour(selectedDate)
          setEditableData({
            ...editableData,
            heureRetour: formatTime(selectedDate),
          })
          break
      }
    }
    setDatePickerVisible(false)
  }

  // Format time
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  // Fetch formation data when component mounts
  useEffect(() => {
    // Initialiser les dates correctement à partir des données de la demande
    if (editingRequest) {
      console.log("Initializing form with data:", editingRequest)
      console.log("Editable data:", editableData)

      // Pour les dates de début et fin
      if (editableData.startDate) {
        try {
          const startDate = new Date(editableData.startDate)
          if (!isNaN(startDate.getTime())) {
            setDateDebut(startDate)
            console.log("Start date initialized:", startDate.toLocaleDateString())
          }
        } catch (error) {
          console.error("Error parsing start date:", error)
        }
      }

      if (editableData.endDate) {
        try {
          const endDate = new Date(editableData.endDate)
          if (!isNaN(endDate.getTime())) {
            setDateFin(endDate)
            console.log("End date initialized:", endDate.toLocaleDateString())
          }
        } catch (error) {
          console.error("Error parsing end date:", error)
        }
      }

      // Pour les heures de sortie et retour (autorisation)
      if (editableData.heureSortie) {
        try {
          const [hours, minutes] = editableData.heureSortie.split(":").map(Number)
          const sortieTime = new Date()
          sortieTime.setHours(hours || 0, minutes || 0, 0)
          setTimeSortie(sortieTime)
        } catch (error) {
          console.error("Error parsing heure sortie:", error)
        }
      }

      if (editableData.heureRetour) {
        try {
          const [hours, minutes] = editableData.heureRetour.split(":").map(Number)
          const retourTime = new Date()
          retourTime.setHours(hours || 0, minutes || 0, 0)
          setTimeRetour(retourTime)
        } catch (error) {
          console.error("Error parsing heure retour:", error)
        }
      }

      // Pour les périodes de début et fin (congé)
      if (editableData.periodeDebut) {
        // Convertir les valeurs de la base de données (M/S) en valeurs d'affichage (matin/après-midi)
        let periodeDebutValue = editableData.periodeDebut
        if (periodeDebutValue === "M") periodeDebutValue = "matin"
        if (periodeDebutValue === "S") periodeDebutValue = "après-midi"
        setPeriodeDebut(periodeDebutValue)
      }

      if (editableData.periodeFin) {
        // Convertir les valeurs de la base de données (M/S) en valeurs d'affichage (matin/après-midi)
        let periodeFinValue = editableData.periodeFin
        if (periodeFinValue === "M") periodeFinValue = "matin"
        if (periodeFinValue === "S") periodeFinValue = "après-midi"
        setPeriodeFin(periodeFinValue)
      }

      // Pour les types de document
      if (editableData.typeDocument) {
        setSelectedDocumentType(editableData.typeDocument)
        setDocumentTypes((prev) =>
          prev.map((type) => ({
            ...type,
            selected: type.name === editableData.typeDocument,
          })),
        )
      }

      // Pour les types d'avance
      if (editableData.typePreavance) {
        setSelectedTypeAvance(editableData.typePreavance)
        setTypesAvance((prev) =>
          prev.map((type) => ({
            ...type,
            selected: type.name === editableData.typePreavance,
          })),
        )
      }

      // Fetch formation data if needed
      if (editingRequest?.type.toLowerCase().includes("formation")) {
        fetchTitres().then(() => {
          // Une fois les titres chargés, si nous avons un titre sélectionné, charger les types
          if (editableData.titre) {
            // Trouver l'ID du titre correspondant
            const selectedTitre = titres.find((t) => t.name === editableData.titre)
            if (selectedTitre) {
              setSelectedTitreId(selectedTitre.id)
              fetchTypesByTitreId(selectedTitre.id).then(() => {
                // Une fois les types chargés, si nous avons un type sélectionné, charger les thèmes
                if (editableData.typeFormation) {
                  const selectedType = types.find((t) => t.name === editableData.typeFormation)
                  if (selectedType) {
                    setSelectedTypeId(selectedType.id)
                    fetchThemesByTypeId(selectedTitre.id, selectedType.id).then(() => {
                      // Une fois les thèmes chargés, si nous avons un thème sélectionné, le définir
                      if (editableData.theme) {
                        const selectedTheme = themes.find((t) => t.name === editableData.theme)
                        if (selectedTheme) {
                          setSelectedThemeId(selectedTheme.id)
                        }
                      }
                    })
                  }
                }
              })
            }
          }
        })
      }
    }
  }, [editingRequest, titres.length, types.length, themes.length])

  // Function to show toast messages
  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    Toast.show({
      type: type,
      text1: title,
      text2: message,
      position: "bottom",
      visibilityTime: 4000,
      autoHide: true,
    })
  }

  const handleGoBack = () => {
    navigation.goBack()
  }

  const renderSelector = (items: any[], selectedId: string | null, onSelect: (id: string, name: string) => void) => {
    return (
      <View style={styles.selectorContainer}>
        {items.length === 0 ? (
          <Text style={[styles.emptyText, { color: isDarkMode ? "#AAAAAA" : "#757575" }]}>
            Aucun élément disponible
          </Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.selectorItem, selectedId === item.id && styles.activeFilterOption]}
              onPress={() => onSelect(item.id, item.name)}
            >
              <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333333" }]}>{item.name}</Text>
              {selectedId === item.id && <CheckCircle size={20} color="#9370DB" />}
            </TouchableOpacity>
          ))
        )}
      </View>
    )
  }

  const renderPeriodeSelector = (type: "debut" | "fin") => {
    const selectedPeriode = type === "debut" ? periodeDebut : periodeFin

    return (
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.selectorItem, selectedPeriode === "matin" && styles.activeFilterOption]}
          onPress={() => handlePeriodeSelection("matin", type)}
        >
          <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333333" }]}>Matin</Text>
          {selectedPeriode === "matin" && <CheckCircle size={20} color="#9370DB" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectorItem, selectedPeriode === "après-midi" && styles.activeFilterOption]}
          onPress={() => handlePeriodeSelection("après-midi", type)}
        >
          <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333333" }]}>Après-midi</Text>
          {selectedPeriode === "après-midi" && <CheckCircle size={20} color="#9370DB" />}
        </TouchableOpacity>
      </View>
    )
  }

  const renderDocumentTypeSelector = () => {
    return (
      <View style={styles.selectorContainer}>
        {documentTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.selectorItem, type.selected && styles.activeFilterOption]}
            onPress={() => selectDocumentType(type.id)}
          >
            <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333333" }]}>{type.name}</Text>
            {type.selected && <CheckCircle size={20} color="#9370DB" />}
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const renderTypeAvanceSelector = () => {
    return (
      <View style={styles.selectorContainer}>
        {typesAvance.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.selectorItem, type.selected && styles.activeFilterOption]}
            onPress={() => selectTypeAvance(type.id)}
          >
            <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333333" }]}>{type.name}</Text>
            {type.selected && <CheckCircle size={20} color="#9370DB" />}
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Background gradient */}
      <BackgroundGradient isDarkMode={isDarkMode}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <ArrowLeft size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
              {editingRequest ? `Modifier ${editingRequest.type}` : "Modifier la demande"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Form Header */}
            <View style={styles.formHeader}>
              <View style={styles.formHeaderIcon}>
                <FileText size={24} color={isDarkMode ? "#CCCCCC" : "#0e135f"} />
              </View>
              <View style={styles.formHeaderContent}>
                <Text style={[styles.formHeaderTitle, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                  {editingRequest ? editingRequest.type : "Demande"}
                </Text>
                <Text style={[styles.formHeaderSubtitle, { color: isDarkMode ? "#AAAAAA" : "#757575" }]}>
                  Modifiez les informations de votre demande
                </Text>
              </View>
            </View>

            {/* Form Container */}
            <View
              style={[styles.formContainer, { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF" }]}
            >
              {/* Champ de description commun à tous les types */}
              <View style={styles.formField}>
                <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                  Description <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.textAreaContainer,
                    {
                      backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                      borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                    },
                  ]}
                >
                  <TextInput
                    ref={descriptionInputRef}
                    style={[styles.formInput, { color: isDarkMode ? "#E0E0E0" : "#333" }]}
                    value={editableData.description}
                    onChangeText={(text) => setEditableData({ ...editableData, description: text })}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    placeholder="Entrez une description..."
                  />
                </View>
              </View>

              {/* Champs spécifiques pour les formations */}
              {editingRequest && editingRequest.type.toLowerCase().includes("formation") && (
                <>
                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Date de début <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => showDateTimePicker("date", "dateDebut")}
                    >
                      <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {dateDebut.toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Titre <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => setShowTitreSelector(!showTitreSelector)}
                    >
                      <FileText size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {editableData.titre || "Sélectionner un titre"}
                      </Text>
                      <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                    </TouchableOpacity>

                    {showTitreSelector && renderSelector(titres, selectedTitreId, selectTitre)}
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Type <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                          opacity: !selectedTitreId ? 0.6 : 1,
                        },
                      ]}
                      onPress={() => (selectedTitreId ? setShowTypeSelector(!showTypeSelector) : null)}
                      disabled={!selectedTitreId}
                    >
                      <FileText size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text
                        style={[
                          styles.inputText,
                          { color: isDarkMode ? "#E0E0E0" : "#333" },
                          !selectedTitreId && { color: isDarkMode ? "#666666" : "#AAAAAA" },
                        ]}
                      >
                        {editableData.typeFormation ||
                          (selectedTitreId ? "Sélectionner un type" : "Veuillez d'abord sélectionner un titre")}
                      </Text>
                      <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                    </TouchableOpacity>

                    {showTypeSelector && selectedTitreId && renderSelector(types, selectedTypeId, selectType)}
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Thème <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                          opacity: !selectedTypeId ? 0.6 : 1,
                        },
                      ]}
                      onPress={() => (selectedTypeId ? setShowThemeSelector(!showThemeSelector) : null)}
                      disabled={!selectedTypeId}
                    >
                      <FileText size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text
                        style={[
                          styles.inputText,
                          { color: isDarkMode ? "#E0E0E0" : "#333" },
                          !selectedTypeId && { color: isDarkMode ? "#666666" : "#AAAAAA" },
                        ]}
                      >
                        {editableData.theme ||
                          (selectedTypeId ? "Sélectionner un thème" : "Veuillez d'abord sélectionner un type")}
                      </Text>
                      <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                    </TouchableOpacity>

                    {showThemeSelector && selectedTypeId && renderSelector(themes, selectedThemeId, selectTheme)}
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Nombre de jours <Text style={styles.required}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.formInput, { color: isDarkMode ? "#E0E0E0" : "#333" }]}
                        value={editableData.duration}
                        onChangeText={(text) => setEditableData({ ...editableData, duration: text })}
                        keyboardType="numeric"
                        placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                        placeholder="Entrez le nombre de jours"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Champs spécifiques pour les documents */}
              {editingRequest && editingRequest.type.toLowerCase().includes("document") && (
                <View style={styles.formField}>
                  <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                    Type de document <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                        borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                      },
                    ]}
                    onPress={() => setShowDocumentTypeSelector(!showDocumentTypeSelector)}
                  >
                    <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      {selectedDocumentType}
                    </Text>
                    <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                  </TouchableOpacity>

                  {showDocumentTypeSelector && renderDocumentTypeSelector()}
                </View>
              )}

              {/* Champs spécifiques pour les pré-avances */}
              {editingRequest && editingRequest.type.toLowerCase().includes("pre-avance") && (
                <>
                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Type de préavance <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => setShowTypeAvanceSelector(!showTypeAvanceSelector)}
                    >
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {selectedTypeAvance}
                      </Text>
                      <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                    </TouchableOpacity>

                    {showTypeAvanceSelector && renderTypeAvanceSelector()}
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Montant <Text style={styles.required}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.formInput, { color: isDarkMode ? "#E0E0E0" : "#333" }]}
                        value={editableData.montant}
                        onChangeText={(text) => setEditableData({ ...editableData, montant: text })}
                        keyboardType="numeric"
                        placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                        placeholder="Entrez le montant"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Champs spécifiques pour les autorisations */}
              {editingRequest && editingRequest.type.toLowerCase().includes("autorisation") && (
                <>
                  {/* Date */}
                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Date <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => showDateTimePicker("date", "dateDebut")}
                    >
                      <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {dateDebut.toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Heure de sortie */}
                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Heure de sortie <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => showDateTimePicker("time", "heureSortie")}
                    >
                      <Clock size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {formatTime(timeSortie)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Heure de retour */}
                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Heure de retour <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => showDateTimePicker("time", "heureRetour")}
                    >
                      <Clock size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {formatTime(timeRetour)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Champs spécifiques pour les congés */}
              {editingRequest && editingRequest.type.toLowerCase().includes("congé") && (
                <>
                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Date de début <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => showDateTimePicker("date", "dateDebut")}
                    >
                      <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {dateDebut.toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Période de début <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => setShowPeriodeDebutSelector(!showPeriodeDebutSelector)}
                    >
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>{periodeDebut}</Text>
                      <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                    </TouchableOpacity>

                    {showPeriodeDebutSelector && renderPeriodeSelector("debut")}
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Date de fin <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => showDateTimePicker("date", "dateFin")}
                    >
                      <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {dateFin.toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Période de fin <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => setShowPeriodeFinSelector(!showPeriodeFinSelector)}
                    >
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>{periodeFin}</Text>
                      <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                    </TouchableOpacity>

                    {showPeriodeFinSelector && renderPeriodeSelector("fin")}
                  </View>
                </>
              )}

              {/* Note */}
              <View style={styles.noteContainer}>
                <AlertTriangle size={16} color="#FFC107" />
                <Text style={styles.noteText}>
                  Les champs marqués d'un <Text style={styles.required}>*</Text> sont obligatoires
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer with action buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <LinearGradient
                colors={["rgba(13, 15, 46, 0.9)", "rgba(13, 15, 46, 0.9)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Save size={18} color="#FFFFFF" style={styles.saveButtonIcon} />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* DateTimePicker */}
          {datePickerVisible && (
            <DateTimePicker
              value={
                currentEditField === "dateDebut"
                  ? dateDebut
                  : currentEditField === "dateFin"
                    ? dateFin
                    : currentEditField === "heureSortie"
                      ? timeSortie
                      : timeRetour
              }
              mode={currentPickerMode}
              is24Hour={true}
              display="default"
              onChange={handleDateTimeChange}
            />
          )}

          <Toast />
        </KeyboardAvoidingView>
      </BackgroundGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  formHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(147, 112, 219, 0.2)",
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formField: {
    marginBottom: 20,
  },
  formFieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  required: {
    color: "#F44336",
  },
  textAreaContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
  },
  formInput: {
    fontSize: 16,
    padding: 0,
    flex: 1,
    textAlignVertical: "top",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#F44336",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 16,
    overflow: "hidden",
    height: 56,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectorContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
    borderRadius: 12,
    padding: 8,
    maxHeight: 200,
  },
  selectorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectorItemText: {
    fontSize: 16,
  },
  activeFilterOption: {
    backgroundColor: "rgba(147, 112, 219, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(147, 112, 219, 0.5)",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#FFC107",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    padding: 12,
  },
})

export default DemandesEditForm
