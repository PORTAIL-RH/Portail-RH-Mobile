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
  Modal,
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
import axios from "axios"
import type { Request } from "./Demandes"

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
  horaireSortie?: string
  horaireRetour?: string
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
  onClose: () => void
}

const DemandesEditModal: React.FC<DemandesEditFormProps> = ({
  editingRequest,
  editableData,
  setEditableData,
  isDarkMode,
  themeStyles,
  userId,
  onSave,
  onClose,
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
  const [showIOSPicker, setShowIOSPicker] = useState(false);

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
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 30000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Fetch titres from API

  const fetchTitres = async (retryCount = 0, maxRetries = 3) => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        console.error("Authentication token not found")
        return
      }

      console.log("Fetching titres, attempt:", retryCount + 1)

      const data = await fetchWithTimeout(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/titres/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const transformedTitres = data.map((titre: { id: string; titre: string }) => ({
        id: titre.id,
        name: titre.titre,
      }))

      setTitres(transformedTitres)

      if (editableData.titre) {
        const matchingTitre = transformedTitres.find((t: { id: string; name: string }) => t.name === editableData.titre)
        if (matchingTitre) {
          setSelectedTitreId(matchingTitre.id)
          await fetchTypesByTitreId(matchingTitre.id)
        }
      }
    } catch (error) {
      console.error("Error fetching titres:", error)

      // Implement retry logic
      if (retryCount < maxRetries) {
        console.log(`Retrying fetch titres (${retryCount + 1}/${maxRetries})...`)
        setTimeout(() => fetchTitres(retryCount + 1, maxRetries), 2000) // Wait 2 seconds before retrying
      } else {
        showToast("error", "Erreur", "La requête a pris trop de temps. Veuillez réessayer plus tard.")
      }
    }
  }

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
    if (Platform.OS === 'ios') {
      setShowIOSPicker(true)
    } else {
      setDatePickerVisible(true)
    }
  }

  // Handle date/time selection
  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      // Don't hide the picker on iOS
      if (!selectedDate) return
    } else {
      setDatePickerVisible(false)
      if (event.type === 'dismissed' || !selectedDate) return
    }

    console.log("Date selected:", selectedDate, "for field:", currentEditField)

    switch (currentEditField) {
      case "dateDebut":
        setDateDebut(selectedDate)
        // Format date as YYYY-MM-DD for the backend
        const startDateStr = selectedDate.toISOString().split('T')[0]
        console.log("Setting start date to:", startDateStr)
        
        setEditableData(prev => ({
          ...prev,
          startDate: startDateStr
        }))

        // If start date is after end date, update end date
        if (selectedDate > dateFin) {
          setDateFin(selectedDate)
          setEditableData(prev => ({
            ...prev,
            endDate: startDateStr
          }))
        }
        break

      case "dateFin":
        setDateFin(selectedDate)
        // Format date as YYYY-MM-DD for the backend
        const endDateStr = selectedDate.toISOString().split('T')[0]
        console.log("Setting end date to:", endDateStr)
        
        setEditableData(prev => ({
          ...prev,
          endDate: endDateStr
        }))
        break

      case "horaireSortie":
        setTimeSortie(selectedDate)
        const hoursSortie = selectedDate.getHours().toString().padStart(2, "0")
        const minutesSortie = selectedDate.getMinutes().toString().padStart(2, "0")
        console.log("Setting sortie time to:", hoursSortie, ":", minutesSortie)
        
        setEditableData(prev => ({
          ...prev,
          horaireSortie: hoursSortie,
          minuteSortie: minutesSortie
        }))
        break

      case "horaireRetour":
        setTimeRetour(selectedDate)
        const hoursRetour = selectedDate.getHours().toString().padStart(2, "0")
        const minutesRetour = selectedDate.getMinutes().toString().padStart(2, "0")
        console.log("Setting retour time to:", hoursRetour, ":", minutesRetour)
        
        setEditableData(prev => ({
          ...prev,
          horaireRetour: hoursRetour,
          minuteRetour: minutesRetour
        }))
        break
    }
  }

  // Format time for display
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
          // Add time component and handle timezone properly
          const startDateStr = editableData.startDate
          // Ensure we're working with YYYY-MM-DD format
          const [year, month, day] = startDateStr.split("-").map(Number)
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            // Create date at noon to avoid timezone issues
            const startDate = new Date(year, month - 1, day, 12, 0, 0)
            if (!isNaN(startDate.getTime())) {
              setDateDebut(startDate)
              console.log("Start date initialized:", startDate.toLocaleDateString())
            }
          }
        } catch (error) {
          console.error("Error parsing start date:", error)
        }
      }

      if (editableData.endDate) {
        try {
          // Add time component and handle timezone properly
          const endDateStr = editableData.endDate
          // Ensure we're working with YYYY-MM-DD format
          const [year, month, day] = endDateStr.split("-").map(Number)
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            // Create date at noon to avoid timezone issues
            const endDate = new Date(year, month - 1, day, 12, 0, 0)
            if (!isNaN(endDate.getTime())) {
              setDateFin(endDate)
              console.log("End date initialized:", endDate.toLocaleDateString())
            }
          }
        } catch (error) {
          console.error("Error parsing end date:", error)
        }
      }

      // Pour les heures de sortie et retour (autorisation)
      if (editableData.horaireSortie && editableData.minuteSortie) {
        try {
          const sortieTime = new Date()
          sortieTime.setHours(
            Number.parseInt(editableData.horaireSortie) || 0,
            Number.parseInt(editableData.minuteSortie) || 0,
            0,
          )
          setTimeSortie(sortieTime)
        } catch (error) {
          console.error("Error parsing heure sortie:", error)
        }
      }

      if (editableData.horaireRetour && editableData.minuteRetour) {
        try {
          const retourTime = new Date()
          retourTime.setHours(
            Number.parseInt(editableData.horaireRetour) || 0,
            Number.parseInt(editableData.minuteRetour) || 0,
            0,
          )
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

  // Add a useEffect hook to calculate the number of days for congé requests
  // Add this after the existing useEffect hooks

  // Calculate number of days between start and end dates for congé requests
  useEffect(() => {
    if (editingRequest && editingRequest.type.toLowerCase().includes("congé")) {
      try {
        // Only calculate if we have both dates
        if (dateDebut && dateFin) {
          const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
          const diffTime = dateFin.getTime() - dateDebut.getTime()
          const diffDays = Math.round(diffTime / oneDay) + 1 // Include both start and end days

          // Adjust for half days based on periodeDebut and periodeFin
          let adjustedDays = diffDays

          // If periodeDebut is afternoon, subtract half a day
          if (periodeDebut === "après-midi" || periodeDebut === "S") {
            adjustedDays -= 0.5
          }

          // If periodeFin is morning, subtract half a day
          if (periodeFin === "matin" || periodeFin === "M") {
            adjustedDays -= 0.5
          }

          // Ensure we don't have negative days
          const finalDays = Math.max(adjustedDays, 0)

          // Update the duration in editableData
          setEditableData((prev) => ({
            ...prev,
            duration: finalDays.toString(),
          }))

          console.log("Calculated days:", finalDays)
        }
      } catch (error) {
        console.error("Error calculating days:", error)
      }
    }
  }, [dateDebut, dateFin, periodeDebut, periodeFin, editingRequest])

  // Function to show toast messages
  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    Toast.show({
      type: type,
      text1: title,
      text2: message,
      position: "bottom",
      visibilityTime: 2000,
      autoHide: true,
      topOffset: 30,
      bottomOffset: 40,
    });
  }

  const handleGoBack = () => {
    onClose();
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
              <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>{item.name}</Text>
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
          <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>Matin</Text>
          {selectedPeriode === "matin" && <CheckCircle size={20} color="#9370DB" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectorItem, selectedPeriode === "après-midi" && styles.activeFilterOption]}
          onPress={() => handlePeriodeSelection("après-midi", type)}
        >
          <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>Après-midi</Text>
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
            <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>{type.name}</Text>
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
            <Text style={[styles.selectorItemText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>{type.name}</Text>
            {type.selected && <CheckCircle size={20} color="#9370DB" />}
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const handleUpdate = async () => {
    if (!editingRequest?.id) {
      showToast("error", "Erreur", "Impossible de trouver la demande à modifier");
      setTimeout(() => {
        onClose();
      }, 2000);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        showToast("error", "Erreur", "Session expirée");
        setTimeout(() => {
          onClose();
        }, 2000);
        return;
      }

      let requestData: any = {};
      const requestType = editingRequest.type.toLowerCase();

      // Only include fields that have been modified
      if (editableData.description !== editingRequest.description) {
        requestData.texteDemande = editableData.description;
      }

      if (requestType.includes("congé")) {
        if (editableData.startDate) requestData.dateDebut = editableData.startDate;
        if (editableData.endDate) requestData.dateFin = editableData.endDate;
        if (editableData.periodeDebut) requestData.snjTempDep = editableData.periodeDebut === "matin" ? "M" : "S";
        if (editableData.periodeFin) requestData.snjTempRetour = editableData.periodeFin === "matin" ? "M" : "S";
        if (editableData.duration) requestData.nbrJours = editableData.duration;
      } 
      else if (requestType.includes("autorisation")) {
        if (editableData.startDate) requestData.dateDebut = editableData.startDate;
        if (editableData.horaireSortie) requestData.horaireSortie = editableData.horaireSortie;
        if (editableData.minuteSortie) requestData.minuteSortie = editableData.minuteSortie;
        if (editableData.horaireRetour) requestData.horaireRetour = editableData.horaireRetour;
        if (editableData.minuteRetour) requestData.minuteRetour = editableData.minuteRetour;
      } 
      else if (requestType.includes("document")) {
        // Add required fields for document requests
        requestData = {
          id: editingRequest.id,
          typeDemande: "Document",
          texteDemande: editableData.description || editingRequest.description,
          typeDocument: editableData.typeDocument || editingRequest.details.typeDocument,
          matPers: editingRequest.details.matPers,
          codeSoc: editingRequest.details.codeSoc
        };
      } 
      else if (requestType.includes("formation")) {
        if (editableData.titreId) requestData.titre = { id: editableData.titreId };
        if (editableData.typeId) requestData.type = { id: editableData.typeId };
        if (editableData.themeId) requestData.theme = { id: editableData.themeId };
        if (editableData.startDate) requestData.dateDebut = editableData.startDate;
        if (editableData.duration) requestData.nbrJours = editableData.duration;
      } 
      else if (requestType.includes("pre-avance")) {
        if (editableData.typePreavance) requestData.type = editableData.typePreavance;
        if (editableData.montant) requestData.montant = editableData.montant;
      }

      // Only proceed with update if there are changes
      if (Object.keys(requestData).length === 0) {
        showToast("info", "Information", "Aucune modification n'a été effectuée");
        setTimeout(() => {
          onClose();
        }, 2000);
        return;
      }

      const response = await axios.put(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/${getApiEndpoint(requestType)}/${editingRequest.id}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        showToast("success", "Succès", "Demande modifiée avec succès");
        setTimeout(() => {
          onSave();
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error updating request:", error);
      const errorMessage = error.response?.data?.message || "Erreur lors de la modification de la demande";
      showToast("error", "Erreur", errorMessage);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const getApiEndpoint = (requestType: string): string => {
    if (requestType.includes("congé")) return "demande-conge";
    if (requestType.includes("autorisation")) return "demande-autorisation";
    if (requestType.includes("document")) return "demande-document";
    if (requestType.includes("formation")) return "demande-formation";
    if (requestType.includes("pre-avance")) return "demande-pre-avance";
    return "";
  };

  // Initialize form with existing data
  useEffect(() => {
    if (editingRequest) {
      console.log("Initializing form with data:", editingRequest);
      const details = editingRequest.details;
      console.log("Original dates from details:", {
        startDate: details.startDate,
        endDate: details.endDate,
        originalData: editingRequest.originalData
      });

      // Try to get dates from originalData first, then fallback to details
      const startDateStr = editingRequest.originalData?.dateDebut || details.startDate;
      const endDateStr = editingRequest.originalData?.dateFin || details.endDate;

      console.log("Using dates:", { startDateStr, endDateStr });

      if (startDateStr) {
        try {
          // Handle different date formats
          let startDate;
          if (startDateStr.includes('T')) {
            // Handle ISO format
            startDate = new Date(startDateStr);
          } else if (startDateStr.includes('/')) {
            // Handle DD/MM/YYYY format
            const [day, month, year] = startDateStr.split('/').map(Number);
            startDate = new Date(year, month - 1, day);
          } else {
            // Handle YYYY-MM-DD format
            const [year, month, day] = startDateStr.split('-').map(Number);
            startDate = new Date(year, month - 1, day);
          }
          
          if (!isNaN(startDate.getTime())) {
            console.log("Setting start date to:", startDate);
            setDateDebut(startDate);
          }
        } catch (error) {
          console.error("Error parsing start date:", error);
        }
      }

      if (endDateStr) {
        try {
          // Handle different date formats
          let endDate;
          if (endDateStr.includes('T')) {
            // Handle ISO format
            endDate = new Date(endDateStr);
          } else if (endDateStr.includes('/')) {
            // Handle DD/MM/YYYY format
            const [day, month, year] = endDateStr.split('/').map(Number);
            endDate = new Date(year, month - 1, day);
          } else {
            // Handle YYYY-MM-DD format
            const [year, month, day] = endDateStr.split('-').map(Number);
            endDate = new Date(year, month - 1, day);
          }

          if (!isNaN(endDate.getTime())) {
            console.log("Setting end date to:", endDate);
            setDateFin(endDate);
          }
        } catch (error) {
          console.error("Error parsing end date:", error);
        }
      }

      // For autorisation, initialize time fields
      if (details.horaireSortie && details.minuteSortie) {
        try {
          const sortieTime = new Date();
          sortieTime.setHours(Number(details.horaireSortie), Number(details.minuteSortie), 0);
          console.log("Setting sortie time to:", sortieTime);
          setTimeSortie(sortieTime);
        } catch (error) {
          console.error("Error setting sortie time:", error);
        }
      }

      if (details.horaireRetour && details.minuteRetour) {
        try {
          const retourTime = new Date();
          retourTime.setHours(Number(details.horaireRetour), Number(details.minuteRetour), 0);
          console.log("Setting retour time to:", retourTime);
          setTimeRetour(retourTime);
        } catch (error) {
          console.error("Error setting retour time:", error);
        }
      }

      let initialData: EditableRequestData = {
        description: editingRequest.description || "",
        startDate: startDateStr || "",
        endDate: endDateStr || "",
        duration: details.nbrJours?.toString() || "",
        
        // Document fields
        typeDocument: details.typeDocument || "",
        
        // Formation fields
        titre: typeof details.titre === 'object' ? details.titre.titre : (details.titre || ""),
        titreId: typeof details.titre === 'object' ? details.titre.id : undefined,
        typeFormation: typeof details.typeFormation === 'object' ? details.typeFormation.type : (details.typeFormation || ""),
        typeId: typeof details.typeFormation === 'object' ? details.typeFormation.id : undefined,
        theme: typeof details.theme === 'object' ? details.theme.theme : (details.theme || ""),
        themeId: typeof details.theme === 'object' ? details.theme.id : undefined,
        
        // Autorisation fields
        horaireSortie: details.horaireSortie || "",
        horaireRetour: details.horaireRetour || "",
        minuteSortie: details.minuteSortie || "",
        minuteRetour: details.minuteRetour || "",
        
        // Congé fields
        periodeDebut: editingRequest.originalData?.snjTempDep === "M" ? "matin" : "après-midi",
        periodeFin: editingRequest.originalData?.snjTempRetour === "M" ? "matin" : "après-midi",
        
        // Pre-avance fields
        typePreavance: details.typePreavance || "",
        montant: details.montant || "",
      };

      console.log("Setting initial editable data:", initialData);
      setEditableData(initialData);

      // Initialize other form state based on the type
      if (editingRequest.type.toLowerCase().includes("document")) {
        setSelectedDocumentType(details.typeDocument || "Attestation de travail");
        setDocumentTypes(prev => prev.map(type => ({
          ...type,
          selected: type.name === details.typeDocument
        })));
      }
      
      if (editingRequest.type.toLowerCase().includes("pre-avance")) {
        setSelectedTypeAvance(details.typePreavance || "MEDICAL");
        setTypesAvance(prev => prev.map(type => ({
          ...type,
          selected: type.name === details.typePreavance
        })));
      }
    }
  }, [editingRequest]);

  // Update the onSave button press handler
  const handleSave = () => {
    handleUpdate();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[
          styles.modalContainer,
          isDarkMode ? styles.darkContainer : styles.lightContainer
        ]}>
          {Platform.OS === 'ios' ? (
            // iOS Header
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <ArrowLeft size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
              </TouchableOpacity>
              <Text style={[
                styles.headerTitle,
                isDarkMode ? styles.textLight : styles.textDark
              ]}>
                Modifier la demande
              </Text>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveIconButton}
              >
                <Save size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
              </TouchableOpacity>
            </View>
          ) : (
            // Android Header
            <>
              <View style={[
                styles.statusBarSpace,
                { backgroundColor: isDarkMode ? '#1a1f38' : '#FFFFFF' }
              ]} />
              <View style={[
                styles.androidHeader,
                { backgroundColor: isDarkMode ? '#1a1f38' : '#FFFFFF' }
              ]}>
                <TouchableOpacity 
                  style={styles.androidBackButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ArrowLeft size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
                </TouchableOpacity>

                <View style={styles.androidTitleContainer}>
                  <Text style={[styles.androidTitle, { color: isDarkMode ? "#E0E0E0" : "#333" }]} numberOfLines={1}>
                    Modifier
                  </Text>
                  <Text style={[styles.androidSubtitle, { color: isDarkMode ? "#E0E0E0" : "#333" }]} numberOfLines={1}>
                    la demande
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.androidSaveButton}
                  onPress={handleSave}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Save size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
                </TouchableOpacity>
              </View>
            </>
          )}

          <ScrollView
            style={[
              styles.scrollView,
              { backgroundColor: isDarkMode ? '#1a1f38' : '#F5F5F5' }
            ]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollViewContent,
              { paddingTop: Platform.OS === 'android' ? 8 : 16 }
            ]}
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
                  Modifiez les champs que vous souhaitez mettre à jour
                </Text>
              </View>
            </View>

            {/* Form Container */}
            <View
              style={[styles.formContainer, { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF" }]}
            >
              {/* Description field */}
              <View style={styles.formField}>
                <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                  Description
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
                      Date de début
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
                      Titre
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
                      Type
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
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
                      Thème
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
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
                      Nombre de jours
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
                      <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {editableData.duration || "0"} jour(s)
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {/* Champs spécifiques pour les documents */}
              {editingRequest && editingRequest.type.toLowerCase().includes("document") && (
                <View style={styles.formField}>
                  <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                    Type de document
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
                      Type de préavance
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
                      Montant
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
                      Date
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
                      Heure de sortie
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => showDateTimePicker("time", "horaireSortie")}
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
                      Heure de retour
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
                          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                      onPress={() => showDateTimePicker("time", "horaireRetour")}
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
                      Date de début
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
                      Période de début
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
                      Date de fin
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
                      Période de fin
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

                  {/* Nombre de jours */}
                  <View style={styles.formField}>
                    <Text style={[styles.formFieldLabel, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                      Nombre de jours
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
                      <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
                      <Text style={[styles.inputText, { color: isDarkMode ? "#E0E0E0" : "#333" }]}>
                        {editableData.duration || "0"} jour(s)
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Android DateTimePicker */}
      {Platform.OS === 'android' && datePickerVisible && (
        <DateTimePicker
          testID="dateTimePicker"
          value={
            currentEditField === "dateDebut"
              ? dateDebut
              : currentEditField === "dateFin"
                ? dateFin
                : currentEditField === "horaireSortie"
                  ? timeSortie
                  : timeRetour
          }
          mode={currentPickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateTimeChange}
          minimumDate={currentEditField === "dateFin" ? dateDebut : undefined}
          maximumDate={currentEditField === "dateDebut" ? dateFin : undefined}
        />
      )}

      {/* iOS DateTimePicker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showIOSPicker}
          onRequestClose={() => {
            setShowIOSPicker(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={[styles.modalView, { backgroundColor: isDarkMode ? '#1a1f38' : '#FFFFFF' }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowIOSPicker(false)}
                >
                  <Text style={[styles.pickerButtonText, { color: isDarkMode ? '#E0E0E0' : '#007AFF' }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    setShowIOSPicker(false);
                    // The date will already be updated by handleDateTimeChange
                  }}
                >
                  <Text style={[styles.pickerButtonText, { color: isDarkMode ? '#E0E0E0' : '#007AFF' }]}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                testID="dateTimePicker"
                value={
                  currentEditField === "dateDebut"
                    ? dateDebut
                    : currentEditField === "dateFin"
                      ? dateFin
                      : currentEditField === "horaireSortie"
                        ? timeSortie
                        : timeRetour
                }
                mode={currentPickerMode}
                is24Hour={true}
                display="spinner"
                onChange={handleDateTimeChange}
                minimumDate={currentEditField === "dateFin" ? dateDebut : undefined}
                maximumDate={currentEditField === "dateDebut" ? dateFin : undefined}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      <Toast />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    width: "100%",
  },
  darkContainer: {
    backgroundColor: "#1a1f38",
  },
  lightContainer: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  textLight: {
    color: "#E0E0E0",
  },
  textDark: {
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  saveIconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
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
  saveButtonIcon: {
    padding: 8,
    marginRight: 8,
  },
  saveButtonContainer: {
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
  statusBarSpace: {
    height: StatusBar.currentHeight || 24,
    width: '100%',
  },
  androidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 4,
  },
  androidBackButton: {
    padding: 12,
    marginLeft: 0,
  },
  androidTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  androidSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  androidSaveButton: {
    padding: 12,
    marginRight: 0,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  pickerButton: {
    padding: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosDatePicker: {
    height: 200,
    width: '100%',
  },
})

export default DemandesEditModal
