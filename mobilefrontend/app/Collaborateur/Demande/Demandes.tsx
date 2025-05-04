
import type React from "react"
import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  Alert,
  Modal,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ArrowLeft, Bell, Moon, Sun } from "lucide-react-native"
import Footer from "../../Components/Footer"
import { API_CONFIG } from "../../config/apiConfig"
import Toast from "react-native-toast-message"
import useApiPooling from "../../useApiPooling"

// Import our components
import DemandesList from "./DemandesList"
import DemandesDetails from "./DemandesDetails"
import DemandesEditModal from "./DemandesEditModal"

// Définir les types de navigation
export type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Demandestot: undefined
  Authentification: undefined
  Notifications: undefined
  Autorisation: undefined
  AjouterDemande: undefined
  Calendar: undefined
  DemandesEditModal: {
    visible: boolean
    onClose: () => void
    onSave: () => void
    editingRequest: Request | null
    editableData: EditableRequestData
    setEditableData: React.Dispatch<React.SetStateAction<EditableRequestData>>
    isDarkMode: boolean
    themeStyles: any
    userId: string | null
  }
  DemandesDetails: {
    visible: boolean
    onClose: () => void
    onEdit: (request: Request) => void
    onDelete: (requestId: string, requestType: string) => void
    selectedRequest: Request | null
    isDarkMode: boolean
    themeStyles: any
    renderSafeText: (value: any) => string
  }
  DemandesList: {
    filteredRequests: Request[]
    onSelectRequest: (request: Request) => void
    isDarkMode: boolean
    themeStyles: any
    searchQuery: string
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>
    activeFilter: string
    setActiveFilter: React.Dispatch<React.SetStateAction<string>>
    activeTypeFilter: string
    setActiveTypeFilter: React.Dispatch<React.SetStateAction<string>>
    filterRequests: (status: string, type?: string) => void
    searchRequests: (text: string) => void
  }
}

type DemandesNavigationProp = NativeStackNavigationProp<RootStackParamList>

// Get both width and height from Dimensions
const { width, height } = Dimensions.get("window")

// Définir l'interface Request
interface Request {
  id: string
  type: string
  description: string
  status: "pending" | "approved" | "rejected"
  date: string
  time: string
  originalData: {
    dateDebut?: string
    dateFin?: string
    snjTempDep?: string
    snjTempRetour?: string
  }
  details: {
    startDate?: string
    endDate?: string
    duration?: string
    reason?: string
    comments?: string
    approver?: string
    documents?: string[] // URLs or file paths of uploaded files
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
    horaireSortie?: string
    horaireRetour?: string
    minuteSortie?: string
    minuteRetour?: string
    matPers?: any
    periodeDebut?: string
    periodeFin?: string
    nbrJours?: string
  }
}

// Interface pour les données d'édition
interface EditableRequestData {
  description?: string
  titre?: string
  theme?: string
  typeFormation?: string
  typeDocument?: string
  typePreavance?: string
  montant?: string
  horaireSortie?: string
  horaireRetour?: string
  minuteSortie?: string
  minuteRetour?: string
  startDate?: string
  endDate?: string
  duration?: string
  periodeDebut?: string
  periodeFin?: string
  // Attachments: for uploading multiple files
  files?: {
    uri: string
    name: string
    type: string
  }[]
  titreId?: string
  typeId?: string
  themeId?: string
}

const DemandesPage = () => {
  const navigation = useNavigation<DemandesNavigationProp>()
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [activeTypeFilter, setActiveTypeFilter] = useState("all")
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [editableData, setEditableData] = useState<EditableRequestData>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [dateDebut, setDateDebut] = useState<Date | null>(null)
  const [dateFin, setDateFin] = useState<Date | null>(null)

  // Utiliser useApiPooling pour les demandes
  const {
    data: requests,
    loading,
    error,
    refresh: refreshRequests,
  } = useApiPooling<Request[]>({
    apiCall: async () => {
      if (!userId) {
        throw new Error("ID utilisateur non disponible")
      }

      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        throw new Error("Token d'authentification non disponible")
      }

      // Define the API endpoints for different request types
      const endpoints = [
        `/api/demande-autorisation/personnel/${userId}`,
        `/api/demande-conge/personnel/${userId}`,
        `/api/demande-formation/personnel/${userId}`,
        `/api/demande-pre-avance/personnel/${userId}`,
        `/api/demande-document/personnel/${userId}`,
      ]

      // Fetch data from all endpoints
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((response) => {
              if (!response.ok) {
                console.warn(`Failed to fetch from ${endpoint}`)
                return []
              }
              return response.json()
            })
            .catch((error) => {
              console.error(`Error fetching from ${endpoint}:`, error)
              return []
            }),
        ),
      )

      // Process and combine all responses
      const [autorisations, conges, formations, preAvances, documents] = responses

      // Map and normalize the data
      const allDemandes: Request[] = [
        ...mapDemandes(autorisations, "autorisation"),
        ...mapDemandes(conges, "congé"),
        ...mapDemandes(formations, "formation"),
        ...mapDemandes(preAvances, "pre-avance"),
        ...mapDemandes(documents, "document"),
      ]

      // Sort by date (newest first)
      allDemandes.sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"))
        const dateB = new Date(b.date.split("/").reverse().join("-"))
        return dateB.getTime() - dateA.getTime()
      })

      return allDemandes
    },
    storageKey: "user_requests_data",
    poolingInterval: 60000, // 1 minute
    initialData: [],
  })

  // Filtrer les demandes en fonction des critères
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])

  // Mettre à jour les demandes filtrées lorsque les demandes changent
  useEffect(() => {
    if (requests) {
      filterRequests(activeFilter, activeTypeFilter)
    }
  }, [requests, activeFilter, activeTypeFilter, searchQuery])

  // Add this debugging function at the top of your component
  useEffect(() => {
    // This will help us identify what objects are causing problems
    const originalError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === "string" && args[0].includes("Objects are not valid as a React child")) {
        console.log("Problematic object:", args[1])
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  // Charger les préférences de thème et récupérer les demandes
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference()
      await getUserInfo()
    }
    loadData()
  }, [])

  // Récupérer les informations utilisateur
  const getUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem("userInfo")
      const token = await AsyncStorage.getItem("userToken")

      if (userInfo && token) {
        const parsedUser = JSON.parse(userInfo)
        setUserId(parsedUser.id)
        setUserToken(token)
        console.log("User ID set in Demandes:", parsedUser.id)
      } else {
        console.error("User info or token missing in Demandes")
      }
    } catch (error) {
      console.error("Error retrieving user info in Demandes:", error)
    }
  }

  // First, let's make sure our renderSafeText function is robust
  const renderSafeText = (value: any): string => {
    if (value === null || value === undefined) {
      return ""
    }

    if (typeof value === "string") {
      return value
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value)
    }

    if (typeof value === "object") {
      // Handle specific known object structures from your Java models

      // Case for titre object
      if (value.titre) {
        return typeof value.titre === "string" ? value.titre : renderSafeText(value.titre)
      }

      // Case for type object
      if (value.type) {
        return typeof value.type === "string" ? value.type : renderSafeText(value.type)
      }

      // Case for theme object
      if (value.theme) {
        return typeof value.theme === "string" ? value.theme : renderSafeText(value.theme)
      }

      // Specific handling for formation objects that match the model structure
      if (value.id) {
        // If it has an id property, it's likely a database object
        if (value.titre) return value.titre
        if (value.theme) return value.theme
        if (value.type) return value.type
      }

      // For arrays, join the elements
      if (Array.isArray(value)) {
        return value.map(renderSafeText).join(", ")
      }

      // For other objects, convert to JSON string
      try {
        return JSON.stringify(value)
      } catch (e) {
        return "[Object]"
      }
    }

    return String(value)
  }

  // Update the mapDemandes function to handle complex objects from DemandeFormation
  const mapDemandes = (data: any[], type: string): Request[] => {
    if (!Array.isArray(data)) return []

    return data.map((item) => {
      // Determine status based on reponseChef
      let status: "pending" | "approved" | "rejected"
      if (item.reponseChef === "I") {
        status = "pending"
      } else if (item.reponseChef === "O") {
        status = "approved"
      } else {
        status = "rejected"
      }

      const demandDate = new Date(item.dateDemande)

      // Process the data to ensure all values are safe for rendering
      const safeItem = {
        id: item.id_libre_demande || item.id,
        type: renderSafeText(type),
        description: renderSafeText(item.texteDemande) || "Pas de description",
        status: status,
        date: demandDate.toLocaleDateString("fr-FR"), // "14/04/2025"
        time: demandDate.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        originalData: {
          dateDebut: item.dateDebut,
          dateFin: item.dateFin,
          snjTempDep: item.snjTempDep,
          snjTempRetour: item.snjTempRetour,
        },
        details: {
          startDate: item.dateDebut ? new Date(item.dateDebut).toLocaleDateString("fr-FR") : undefined,
          endDate: item.dateFin ? new Date(item.dateFin).toLocaleDateString("fr-FR") : undefined,
          duration: item.nbrJours?.toString(),
          reason: renderSafeText(item.texteDemande),
          documents: item.files?.map((file: any) => renderSafeText(file?.filename) ?? "Aucun fichier fourni") ?? [],
          // Store the original objects for title, type, and theme to be processed later with renderSafeText
          titre: item.titre,
          typeFormation: item.type,
          theme: item.theme,
          typeDocument: renderSafeText(item.typeDocument),
          filesReponse:
            item.filesReponse?.map((file: any) => renderSafeText(file?.filename) ?? "Aucun fichier fourni") ?? [],
          typePreavance: renderSafeText(item.type),
          montant: item.montant?.toString(),
          horaireSortie: renderSafeText(item.horaireSortie),
          horaireRetour: renderSafeText(item.horaireRetour),
          minuteSortie: renderSafeText(item.minuteSortie),
          minuteRetour: renderSafeText(item.minuteRetour),
        },
      }

      return safeItem
    })
  }

  // Charger les préférences de thème
  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("@theme_mode")
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark")
      }
    } catch (error) {
      console.error("Erreur lors du chargement des préférences de thème:", error)
    }
  }

  // Basculer entre les thèmes clair et sombre
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      // Update both keys for backward compatibility
      await AsyncStorage.setItem("theme", newTheme)
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des préférences de thème:", error)
    }
  }

  // Filtrer les demandes par statut et type
  const filterRequests = (status: string, type: string = activeTypeFilter) => {
    setActiveFilter(status)
    if (type !== activeTypeFilter) {
      setActiveTypeFilter(type)
    }

    if (!requests || requests.length === 0) {
      console.log("No requests to filter")
      setFilteredRequests([])
      return
    }

    let filtered = [...requests]

    // Filtrer par statut
    if (status !== "all") {
      filtered = filtered.filter((request) => request.status === status)
    }

    // Filtrer par type
    if (type !== "all") {
      filtered = filtered.filter((request) => {
        const requestType = request.type.toLowerCase()
        switch (type) {
          case "conge":
            return requestType.includes("congé")
          case "formation":
            return requestType.includes("formation")
          case "avance":
            return requestType.includes("pre-avance")
          case "document":
            return requestType.includes("document")
          case "autorisation":
            return requestType.includes("autorisation")
          default:
            return true
        }
      })
    }

    // Appliquer la recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (request) =>
          request.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    console.log(`Filtered requests: ${filtered.length} items`)
    setFilteredRequests(filtered)
  }

  // Rechercher des demandes
  const searchRequests = (text: string) => {
    setSearchQuery(text)
    filterRequests(activeFilter, activeTypeFilter)
  }

  // Gérer le rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true)
    await refreshRequests(true)
    setRefreshing(false)
  }

  // Afficher les détails de la demande
  const viewRequestDetails = (request: Request) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  // Update the prepareForEdit function to initialize all fields based on request type
  const prepareForEdit = (request: Request) => {
    setEditingRequest(request)
    console.log("Editing request:", request)

    // Initialiser les dates avec les valeurs de la base de données
    let startDateObj = null
    let endDateObj = null

    // Essayer d'abord avec originalData, puis avec details.startDate/endDate
    if (request.originalData?.dateDebut) {
      startDateObj = new Date(request.originalData.dateDebut)
      setDateDebut(startDateObj)
    } else if (request.details.startDate) {
      // Convertir le format français (DD/MM/YYYY) en format Date
      const [day, month, year] = request.details.startDate.split("/").map(Number)
      if (day && month && year) {
        startDateObj = new Date(year, month - 1, day)
        setDateDebut(startDateObj)
      }
    }

    if (request.originalData?.dateFin) {
      endDateObj = new Date(request.originalData.dateFin)
      setDateFin(endDateObj)
    } else if (request.details.endDate) {
      // Convertir le format français (DD/MM/YYYY) en format Date
      const [day, month, year] = request.details.endDate.split("/").map(Number)
      if (day && month && year) {
        endDateObj = new Date(year, month - 1, day)
        setDateFin(endDateObj)
      }
    }

    // Formater les dates pour le formulaire (YYYY-MM-DD)
    const startDateStr = startDateObj ? startDateObj.toISOString().split("T")[0] : ""
    const endDateStr = endDateObj ? endDateObj.toISOString().split("T")[0] : ""

    // Déterminer les périodes (matin/après-midi)
    let periodeDebutValue = "matin"
    if (request.details.periodeDebut) {
      periodeDebutValue = request.details.periodeDebut
    } else if (request.originalData && request.originalData.snjTempDep) {
      periodeDebutValue = request.originalData.snjTempDep === "M" ? "matin" : "après-midi"
    }

    let periodeFinValue = "matin"
    if (request.details.periodeFin) {
      periodeFinValue = request.details.periodeFin
    } else if (request.originalData && request.originalData.snjTempRetour) {
      periodeFinValue = request.originalData.snjTempRetour === "M" ? "matin" : "après-midi"
    }

    // Extract IDs for titre, type, and theme if they are objects
    let titreId = ""
    let typeId = ""
    let themeId = ""

    if (request.details.titre && typeof request.details.titre === "object" && "id" in request.details.titre) {
      titreId = request.details.titre.id
    }

    if (
      request.details.typeFormation &&
      typeof request.details.typeFormation === "object" &&
      "id" in request.details.typeFormation
    ) {
      typeId = request.details.typeFormation.id
    }

    if (request.details.theme && typeof request.details.theme === "object" && "id" in request.details.theme) {
      themeId = request.details.theme.id
    }

    // Préparer les données éditables avec toutes les valeurs existantes
    setEditableData({
      description: request.description,
      titre: renderSafeText(request.details.titre),
      titreId: titreId,
      theme: renderSafeText(request.details.theme),
      themeId: themeId,
      typeFormation: renderSafeText(request.details.typeFormation),
      typeId: typeId,
      duration: renderSafeText(request.details.duration || request.details.nbrJours),
      typeDocument: renderSafeText(request.details.typeDocument),
      typePreavance: renderSafeText(request.details.typePreavance),
      montant: renderSafeText(request.details.montant),
      // Pour les dates, utiliser le format ISO pour les inputs de date
      startDate: startDateStr,
      endDate: endDateStr,
      periodeDebut: periodeDebutValue,
      periodeFin: periodeFinValue,
      horaireSortie: renderSafeText(request.details.horaireSortie),
      horaireRetour: renderSafeText(request.details.horaireRetour),
      minuteSortie: renderSafeText(request.details.minuteSortie),
      minuteRetour: renderSafeText(request.details.minuteRetour),
    })

    console.log("Editable data initialized:", {
      startDate: startDateStr,
      endDate: endDateStr,
      periodeDebut: periodeDebutValue,
      periodeFin: periodeFinValue,
      dateDebut: startDateObj ? startDateObj.toLocaleDateString() : "null",
      dateFin: endDateObj ? endDateObj.toLocaleDateString() : "null",
      titreId: titreId,
      typeId: typeId,
      themeId: themeId,
    })

    setShowEditModal(true)
  }

  // Delete request
  const handleDeleteRequest = async (requestId: string, requestType: string) => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        console.error("Authentication token not found")
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Token d'authentification non trouvé",
        })
        return
      }

      const endpointMap: { [key: string]: string } = {
        autorisation: "/api/demande-autorisation",
        congé: "/api/demande-conge",
        formation: "/api/demande-formation",
        "pre-avance": "/api/demande-pre-avance",
        document: "/api/demande-document",
      }

      // Find the correct endpoint based on request type
      let endpoint = ""
      for (const [key, value] of Object.entries(endpointMap)) {
        if (requestType.toLowerCase().includes(key.toLowerCase())) {
          endpoint = value
          break
        }
      }

      if (!endpoint) {
        console.error("Unknown request type:", requestType)
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Type de demande inconnu",
        })
        return
      }

      // Use Alert.alert with proper text components
      Alert.alert("Confirmation", "Êtes-vous sûr de vouloir supprimer cette demande ?", [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(`Deleting request: ${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}/${requestId}`)

              // Add a timeout to the fetch request
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

              // For formation requests, use a different approach
              if (requestType.toLowerCase().includes("formation")) {
                // Try using a POST request to a specific delete endpoint
                const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}/${requestId}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  signal: controller.signal,
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                  const errorText = await response.text()
                  throw new Error(`Failed to delete request: ${errorText}`)
                }
              } else {
                // For other request types, try DELETE first
                let response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}/${requestId}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  signal: controller.signal,
                })

                // If DELETE is not supported, try using a POST request with a special parameter
                if (response.status === 405) {
                  // Method Not Allowed
                  console.log("DELETE method not supported, trying alternative approach")

                  // Try with POST to a delete endpoint
                  response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}/delete/${requestId}`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    signal: controller.signal,
                  })
                }

                clearTimeout(timeoutId)

                if (!response.ok) {
                  const errorText = await response.text()
                  throw new Error(`Failed to delete request: ${errorText}`)
                }
              }

              // Refresh data after successful deletion
              await refreshRequests(true)
              setShowDetailsModal(false)

              Toast.show({
                type: "success",
                text1: "Demande supprimée",
                text2: "Votre demande a été supprimée avec succès",
                position: "bottom",
                visibilityTime: 4000,
                autoHide: true,
              })
            } catch (error) {
              if (error.name === "AbortError") {
                console.error("Request timed out")
                Toast.show({
                  type: "error",
                  text1: "Erreur de connexion",
                  text2: "La requête a pris trop de temps. Veuillez réessayer.",
                  position: "bottom",
                  visibilityTime: 4000,
                  autoHide: true,
                })
              } else {
                console.error("Error deleting request:", error)
                Toast.show({
                  type: "error",
                  text1: "Échec de la suppression",
                  text2: `${error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression"}`,
                  position: "bottom",
                  visibilityTime: 4000,
                  autoHide: true,
                })
              }
            }
          },
        },
      ])
    } catch (error) {
      console.error("Error in delete process:", error)
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: `Une erreur est survenue: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      })
    }
  }

  // Update the handleUpdateRequest function to handle the formation dropdown IDs
  const handleUpdateRequest = async () => {
    if (!editingRequest) {
      console.error("No request is being edited")
      return
    }

    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        console.error("Authentication token not found")
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Token d'authentification non trouvé",
        })
        return
      }

      const endpointMap: { [key: string]: string } = {
        autorisation: "/api/demande-autorisation",
        congé: "/api/demande-conge",
        formation: "/api/demande-formation",
        "pre-avance": "/api/demande-pre-avance",
        document: "/api/demande-document",
      }

      // Find the correct endpoint based on request type
      let endpoint = ""
      for (const [key, value] of Object.entries(endpointMap)) {
        if (editingRequest.type.toLowerCase().includes(key.toLowerCase())) {
          endpoint = value
          break
        }
      }

      if (!endpoint) {
        console.error("Unknown request type:", editingRequest.type)
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Type de demande inconnu",
        })
        return
      }

      // Prepare data to send based on request type
      const requestData: any = {
        // Always include the ID to ensure update rather than create
        id: editingRequest.id,
      }

      // Common field for all request types
      if (editableData.description) {
        requestData.texteDemande = editableData.description
      }

      // Handle congé specific fields
      if (editingRequest.type.toLowerCase().includes("congé")) {
        // Dates de début et fin
        if (editableData.startDate) {
          requestData.dateDebut = editableData.startDate
        }

        if (editableData.endDate) {
          requestData.dateFin = editableData.endDate
        }

        // Périodes de début et fin
        if (editableData.periodeDebut) {
          requestData.snjTempDep = editableData.periodeDebut === "matin" ? "M" : "S"
        }

        if (editableData.periodeFin) {
          requestData.snjTempRetour = editableData.periodeFin === "matin" ? "M" : "S"
        }

        // Nombre de jours
        if (editableData.duration) {
          requestData.nbrJours = editableData.duration
        }

        // Date de reprise prévue (même que la date de fin)
        if (editableData.endDate) {
          requestData.dateReprisePrev = editableData.endDate
        }
      }

      // Handle pre-avance specific fields and validation
      if (editingRequest.type.toLowerCase().includes("pre-avance")) {
        requestData.typeDemande = "PreAvnace"

        // Validate type exists
        if (!editableData.typePreavance) {
          Toast.show({
            type: "error",
            text1: "Type manquant",
            text2: "Veuillez sélectionner un type de pré-avance",
            position: "bottom",
            visibilityTime: 4000,
          })
          return
        }
        requestData.type = editableData.typePreavance

        // Validate amount
        if (!editableData.montant) {
          Toast.show({
            type: "error",
            text1: "Montant manquant",
            text2: "Veuillez saisir un montant",
            position: "bottom",
            visibilityTime: 4000,
          })
          return
        }

        const montant = Number.parseFloat(editableData.montant)
        if (isNaN(montant)) {
          Toast.show({
            type: "error",
            text1: "Montant invalide",
            text2: "Veuillez saisir un nombre valide",
            position: "bottom",
            visibilityTime: 4000,
          })
          return
        }

        // Check against maximum amounts
        const typeMaxAmounts: Record<string, number> = {
          MEDICAL: 2000.0,
          SCOLARITE: 1500.0,
          VOYAGE: 1000.0,
          INFORMATIQUE: 800.0,
          DEMENAGEMENT: 3000.0,
          MARIAGE: 5000.0,
          FUNERAILLES: 2000.0,
        }

        const maxAmount = typeMaxAmounts[requestData.type] || 0

        if (montant > maxAmount) {
          Toast.show({
            type: "error",
            text1: "Montant trop élevé",
            text2: `Le maximum pour ${requestData.type} est ${maxAmount} €`,
            position: "bottom",
            visibilityTime: 5000,
          })
          return
        }

        requestData.montant = montant
      }

      // Handle autorisation specific fields
      if (editingRequest.type.toLowerCase().includes("autorisation")) {
        if (editableData.startDate) {
          requestData.dateDebut = editableData.startDate
        }

        if (editableData.horaireSortie && editableData.minuteSortie) {
          const [hours, minutes] = editableData.horaireSortie.split(":")
          requestData.horaireSortie = hours
          requestData.minuteSortie = minutes
        }

        if (editableData.horaireRetour && editableData.minuteRetour) {
          const [hours, minutes] = editableData.horaireRetour.split(":")
          requestData.horaireRetour = hours
          requestData.minuteRetour = minutes
        }
      }

      // Handle formation specific fields
      if (editingRequest.type.toLowerCase().includes("formation")) {
        if (editableData.startDate) {
          requestData.dateDebut = editableData.startDate
        }

        if (editableData.duration) {
          requestData.nbrJours = editableData.duration
        }

        // For formation requests, we need to send objects with IDs for titre, type, and theme
        if (editableData.titreId && editableData.titre) {
          requestData.titre = { id: editableData.titreId, titre: editableData.titre }
        }

        if (editableData.typeId && editableData.typeFormation) {
          requestData.type = { id: editableData.typeId, type: editableData.typeFormation }
        }

        if (editableData.themeId && editableData.theme) {
          requestData.theme = { id: editableData.themeId, theme: editableData.theme }
        }

        // Important: Do NOT include dateDemande in the request data
        // This ensures the original submission date is preserved
        // The backend should keep the original dateDemande unchanged
      }

      // Handle document specific fields
      if (editingRequest.type.toLowerCase().includes("document")) {
        if (editableData.typeDocument) {
          requestData.typeDocument = editableData.typeDocument
        }
      }

      // Ensure we preserve the personnel reference
      if (editingRequest.details && "matPers" in editingRequest.details) {
        requestData.matPers = editingRequest.details.matPers
      }

      console.log("Sending update with data:", JSON.stringify(requestData))
      console.log(`Update URL: ${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}/${editingRequest.id}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}/${editingRequest.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update request: ${errorText}`)
      }

      // Refresh data after successful update
      await refreshRequests(true)
      setShowEditModal(false)
      setShowDetailsModal(false)

      // Show success toast with specific message based on request type
      Toast.show({
        type: "success",
        text1: "Demande mise à jour",
        text2: `Votre demande de ${editingRequest.type.toLowerCase()} a été modifiée avec succès`,
        position: "bottom",
        visibilityTime: 4000,
        autoHide: true,
      })
    } catch (error) {
      if (error.name === "AbortError") {
        Toast.show({
          type: "error",
          text1: "Erreur de connexion",
          text2: "La requête a pris trop de temps. Veuillez réessayer.",
          position: "bottom",
          visibilityTime: 4000,
          autoHide: true,
        })
      } else {
        console.error("Error updating request:", error)

        let errorMessage = "Erreur lors de la mise à jour"
        if (error instanceof Error) {
          errorMessage = error.message.includes("dépasser") ? error.message : "Erreur serveur lors de la mise à jour"
        }

        Toast.show({
          type: "error",
          text1: "Échec de la mise à jour",
          text2: errorMessage,
          position: "bottom",
          visibilityTime: 4000,
          autoHide: true,
        })
      }
    }
  }

  // Define theme styles
  const darkStyles = StyleSheet.create({
    container: {
      backgroundColor: "#1a1f38",
    },
    header: {
      backgroundColor: "#1F2846",
      borderBottomColor: "#1a1f38",
    },
    searchContainer: {
      borderBottomColor: "#1a1f38",
    },
    searchInputContainer: {
      backgroundColor: "#1a1f38",
      borderColor: "#1F2846",
    },
    searchInput: {
      color: "#E0E0E0",
    },
    filterButton: {
      borderColor: "#1F2846",
    },
    filtersScrollView: {
      borderBottomColor: "#1a1f38",
    },
    filterChip: {
      borderColor: "#1F2846",
      backgroundColor: "#1a1f38",
    },
    filterChipText: {
      color: "#E0E0E0",
    },
    text: {
      color: "#E0E0E0",
    },
    subtleText: {
      color: "#AAAAAA",
    },
    card: {
      backgroundColor: "#1F2846",
    },
    activeFilterOption: {
      backgroundColor: "rgba(147, 112, 219, 0.3)",
    },
    detailsActionButton: {
      backgroundColor: "#1a1f38",
    },
    detailsActionButtonText: {
      color: "#E0E0E0",
    },
    detailsCancelButton: {
      backgroundColor: "#F44336",
    },
    detailsCancelButtonText: {
      color: "#FFFFFF",
    },
  })

  const lightStyles = StyleSheet.create({
    container: {
      backgroundColor: "#F5F5F5",
    },
    header: {
      backgroundColor: "#FFFFFF",
      borderBottomColor: "#E0E0E0",
    },
    searchContainer: {
      backgroundColor: "#FFFFFF",
      borderBottomColor: "#E0E0E0",
    },
    searchInputContainer: {
      backgroundColor: "#FFFFFF",
      borderColor: "#E0E0E0",
    },
    searchInput: {
      color: "#333",
    },
    filterButton: {
      borderColor: "#E0E0E0",
    },
    filtersScrollView: {
      borderBottomColor: "#E0E0E0",
    },
    filterChip: {
      borderColor: "#E0E0E0",
      backgroundColor: "#FFFFFF",
    },
    filterChipText: {
      color: "#333",
    },
    text: {
      color: "#333",
    },
    subtleText: {
      color: "#757575",
    },
    card: {
      backgroundColor: "#FFFFFF",
    },
    activeFilterOption: {
      backgroundColor: "rgba(147, 112, 219, 0.1)",
    },
    detailsActionButton: {
      backgroundColor: "#9370DB",
    },
    detailsActionButtonText: {
      color: "#FFFFFF",
    },
    detailsCancelButton: {
      backgroundColor: "#F44336",
    },
    detailsCancelButtonText: {
      color: "#FFFFFF",
    },
  })

  // Appliquer les styles de thème
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* En-tête */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
            <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[styles.headerTitleText, themeStyles.text]}>Mes demandes</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Notifications")}>
            <Bell size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
            {isDarkMode ? <Sun size={22} color="#E0E0E0" /> : <Moon size={22} color="#333" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu */}
      {loading && !requests ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9370DB" />
        </View>
      ) : (
        <DemandesList
          filteredRequests={filteredRequests}
          onSelectRequest={viewRequestDetails}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          activeTypeFilter={activeTypeFilter}
          setActiveTypeFilter={setActiveTypeFilter}
          filterRequests={filterRequests}
          searchRequests={searchRequests}
        />
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <Modal
          visible={showDetailsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <DemandesDetails
            visible={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            onEdit={prepareForEdit}
            onDelete={handleDeleteRequest}
            selectedRequest={selectedRequest}
            isDarkMode={isDarkMode}
            themeStyles={themeStyles}
            renderSafeText={renderSafeText}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <DemandesEditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateRequest}
          editingRequest={editingRequest}
          editableData={editableData}
          setEditableData={setEditableData}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
          userId={userId}
        />
      </Modal>

      {/* Pied de page */}
      <Footer />
    </SafeAreaView>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleText: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default DemandesPage
