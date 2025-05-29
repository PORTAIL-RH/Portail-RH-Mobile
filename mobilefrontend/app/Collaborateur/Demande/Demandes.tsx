import React, { useState, useEffect } from "react"
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
  Platform,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ArrowLeft, Bell, Moon, Sun } from "lucide-react-native"
import Footer from "../../Components/Footer"
import { API_CONFIG } from "../../config/apiConfig"
import Toast from "react-native-toast-message"
import useApiPooling from "../../useApiPooling"
import NavBar from "../../Components/NavBar"

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

// Export the interfaces for use in other components
export interface FormationTitle {
  id: string;
  titre: string;
}

export interface FormationType {
  id: string;
  type: string;
}

export interface FormationTheme {
  id: string;
  theme: string;
}

export interface Request {
  id: string;
  type: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  time: string;
  originalData?: {
    dateDebut?: string;
    dateFin?: string;
    snjTempDep?: string;
    snjTempRetour?: string;
  };
  responseChefs?: {
    id?: string;
    demandeId?: string;
    responseChef1: "O" | "N" | "I";
    observationChef1?: string;
    dateChef1?: string;
    responseChef2: "O" | "N" | "I";
    observationChef2?: string;
    dateChef2?: string;
    responseChef3: "O" | "N" | "I";
    observationChef3?: string;
    dateChef3?: string;
  };
  responseRh?: "T" | "N" | "I";
  details: {
    titre?: string | FormationTitle;
    typeFormation?: string | FormationType;
    theme?: string | FormationTheme;
    startDate?: string;
    endDate?: string;
    duration?: string;
    nbrJours?: number;
    typeDocument?: string;
    typePreavance?: string;
    montant?: string;
    horaireSortie?: string;
    horaireRetour?: string;
    minuteSortie?: string;
    minuteRetour?: string;
    matPers?: any;
    codeSoc?: string;
    documents?: Array<{
      id: string;
      filename: string;
      fileType: string;
      fileId: string;
    }>;
    filesReponse?: Array<{
      id: string;
      filename: string;
      fileType: string;
      fileId: string;
    }>;
    typeConge?: string;
    duree?: number;
    motif?: string;
    remplacant?: string;
    soldeConge?: number;
    commentaire?: string;
    approvalDate?: string;
    rejectionDate?: string;
    dateDemande?: string;
  };
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

// Update the DemandesListProps interface to use our Request type
export interface DemandesListProps {
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
  loading?: boolean
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

  const fetchWithValidation = async (url: string, token: string) => {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn(`API request failed: ${response.status} ${response.statusText}`);
      return null; // Return null instead of throwing to continue processing other endpoints
    }

    const text = await response.text();
    return text ? JSON.parse(text) : []; // Return empty array if response is empty
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    return null; // Return null to indicate failure
  }
};

  // Utiliser useApiPooling pour les demandes
const {
  data: requests,
  loading,
  error,
  refresh: refreshRequests,
} = useApiPooling<Request[]>({
  apiCall: async () => {
    if (!userId) {
      throw new Error("ID utilisateur non disponible");
    }

    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      throw new Error("Token d'authentification non disponible");
    }

    const endpoints = [
      `/api/demande-autorisation/personnel/${userId}`,
      `/api/demande-conge/personnel/${userId}`,
      `/api/demande-formation/personnel/${userId}`,
      `/api/demande-pre-avance/personnel/${userId}`,
      `/api/demande-document/personnel/${userId}`,
    ];

    // Fetch data from all endpoints with validation
    const responses = await Promise.all(
      endpoints.map((endpoint) =>
        fetchWithValidation(
          `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}`,
          token
        )
      )
    );

    // Filter out null responses (failed requests)
    const validResponses = responses.filter((response) => response !== null);

    // If all requests failed, throw an error
    if (validResponses.length === 0) {
      throw new Error("Toutes les requêtes API ont échoué");
    }

    // Process and combine all responses
    const [autorisations, conges, formations, preAvances, documents] = responses.map(
      (res) => res || [] // Use empty array if response was null
    );

    // Rest of your mapping logic...
    const allDemandes: Request[] = [
      ...mapDemandes(autorisations || [], "autorisation"),
      ...mapDemandes(conges || [], "congé"),
      ...mapDemandes(formations || [], "formation"),
      ...mapDemandes(preAvances || [], "pre-avance"),
      ...mapDemandes(documents || [], "document"),
    ];

    return allDemandes;
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

  // Add format functions
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting time:", error)
      return ""
    }
  }

  // Update the getRequestStatus function
  const getRequestStatus = (request: Request): "pending" | "approved" | "rejected" => {
    // Check if it's a document or pre-avance request
    if (request.type.toLowerCase().includes("document") || request.type.toLowerCase().includes("pre-avance")) {
      if (!request.responseRh) return "pending";
      
      switch (request.responseRh) {
        case "T":
          return "approved"
        case "N":
          return "rejected"
        case "I":
        default:
          return "pending"
      }
    }
    
    // For other request types, use responseChefs
    if (!request.responseChefs) return "pending";
    
    switch (request.responseChefs.responseChef1) {
      case "O":
        return "approved"
      case "N":
        return "rejected"
      case "I":
      default:
        return "pending"
    }
  }

  // Update the mapDemandes function with proper types
  const mapDemandes = (data: any[], type: string): Request[] => {
    if (!Array.isArray(data)) return []

    return data.map((item: any) => {
      // Get the submission date (prioritize dateDemande)
      const submissionDate = item.dateDemande || "N/A";
      const formattedDate = submissionDate === "N/A" ? "N/A" : formatDate(submissionDate);
      const formattedTime = submissionDate === "N/A" ? "" : formatTime(submissionDate);
      
      const status = getRequestStatus({
        id: item.id || item._id,
        type,
        description: item.texteDemande || item.description || `Demande de ${type}`,
        status: "pending", // This will be overridden by getRequestStatus
        date: formattedDate,
        time: formattedTime,
        responseChefs: item.responseChefs,
        responseRh: item.reponseRH,
        details: {
          ...item,
          dateDemande: submissionDate, // Add dateDemande to details
          startDate: formatDate(item.dateDebut),
          endDate: formatDate(item.dateFin),
          duration: item.nbrJours?.toString(),
          montant: item.montant?.toString(),
        },
      })

      return {
        id: item.id || item._id,
        type,
        description: item.texteDemande || item.description || `Demande de ${type}`,
        status,
        date: formattedDate,
        time: formattedTime,
        responseChefs: item.responseChefs,
        responseRh: item.reponseRH,
        originalData: {
          dateDebut: item.dateDebut,
          dateFin: item.dateFin,
          snjTempDep: item.snjTempDep,
          snjTempRetour: item.snjTempRetour,
        },
        details: {
          ...item,
          dateDemande: submissionDate, // Add dateDemande to details
          startDate: formatDate(item.dateDebut),
          endDate: formatDate(item.dateFin),
          duration: item.nbrJours?.toString(),
          montant: item.montant?.toString(),
          documents: Array.isArray(item.files) ? item.files : [],
          filesReponse: Array.isArray(item.filesReponse) ? item.filesReponse : [],
        },
      }
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
      await AsyncStorage.setItem("theme", newTheme)
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  // Filtrer les demandes par statut et type
  const filterRequests = (status: string, type: string = activeTypeFilter) => {
    let filtered = [...(requests || [])]

    // Filter by type first
    if (type !== "all") {
      filtered = filtered.filter((request) => request.type.toLowerCase().includes(type.toLowerCase()))
    }

    // Then filter by status
    if (status !== "all") {
      filtered = filtered.filter((request) => {
        if (!request.responseChefs) return status === "pending"
        
        switch (request.responseChefs.responseChef1) {
          case "O":
            return status === "approved"
          case "N":
            return status === "rejected"
          case "I":
          default:
            return status === "pending"
        }
      })
    }

    setActiveFilter(status)
    setActiveTypeFilter(type)
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

  // Update the prepareForEdit function to handle the new types
  const prepareForEdit = (request: Request) => {
    setEditingRequest(request)
    console.log("Editing request:", request)

    // Set up the editable data first
    setEditableData({
      description: request.description,
      titre: typeof request.details.titre === 'object' ? request.details.titre.titre : request.details.titre,
      titreId: typeof request.details.titre === 'object' ? request.details.titre.id : undefined,
      theme: typeof request.details.theme === 'object' ? request.details.theme.theme : request.details.theme,
      themeId: typeof request.details.theme === 'object' ? request.details.theme.id : undefined,
      typeFormation: typeof request.details.typeFormation === 'object' ? request.details.typeFormation.type : request.details.typeFormation,
      typeId: typeof request.details.typeFormation === 'object' ? request.details.typeFormation.id : undefined,
      duration: renderSafeText(request.details.duration || request.details.nbrJours),
      typeDocument: renderSafeText(request.details.typeDocument),
      typePreavance: renderSafeText(request.details.typePreavance),
      montant: renderSafeText(request.details.montant),
      startDate: request.originalData?.dateDebut || "",
      endDate: request.originalData?.dateFin || "",
      periodeDebut: request.originalData?.snjTempDep === "M" ? "matin" : "après-midi",
      periodeFin: request.originalData?.snjTempRetour === "M" ? "matin" : "après-midi",
      horaireSortie: renderSafeText(request.details.horaireSortie),
      horaireRetour: renderSafeText(request.details.horaireRetour),
      minuteSortie: renderSafeText(request.details.minuteSortie),
      minuteRetour: renderSafeText(request.details.minuteRetour),
    })
    
    // Close details modal and show edit modal
    setShowDetailsModal(false)
    setShowEditModal(true)
  }

  // Delete request
const handleDeleteRequest = async (requestId: string, requestType: string) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      console.error("Authentication token not found");
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Token d'authentification non trouvé",
      });
      return;
    }

    const endpointMap: Record<string, string> = {
      autorisation: "demande-autorisation",
      congé: "demande-conge",
      formation: "demande-formation",
      "pre-avance": "demande-pre-avance",
      document: "demande-document",
    };

    const typeKey = Object.keys(endpointMap).find(key => 
      requestType.toLowerCase().includes(key.toLowerCase())
    );

    if (!typeKey) {
      console.error("Unknown request type:", requestType);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Type de demande inconnu",
      });
      return;
    }

    const endpoint = `/api/${endpointMap[typeKey]}/${requestId}`;
    const fullUrl = `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}`;

    Alert.alert(
      "Confirmation", 
      "Êtes-vous sûr de vouloir supprimer cette demande ?", 
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(`Deleting request: ${fullUrl}`);

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);

              // First try DELETE method
              let response = await fetch(fullUrl, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                signal: controller.signal,
              });

              // If DELETE not allowed, try POST to delete endpoint
              if (response.status === 405) {
                response = await fetch(`${fullUrl}/delete`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  signal: controller.signal,
                });
              }

              clearTimeout(timeoutId);

              // Don't try to parse JSON if response is empty (204)
              if (response.status === 204) {
                console.log("Delete successful (204 No Content)");
              } else if (!response.ok) {
                // Try to get error message, but don't fail if parsing fails
                let errorText = "Échec de la suppression";
                try {
                  const errorData = await response.text();
                  errorText = errorData || errorText;
                } catch (e) {
                  console.log("Couldn't parse error response", e);
                }
                throw new Error(errorText);
              }

              // Success - refresh data silently
              try {
                await refreshRequests(true);
              } catch (refreshError) {
                console.log("Refresh after delete failed (non-critical)", refreshError);
              }

              setShowDetailsModal(false);

              Toast.show({
                type: "success",
                text1: "Demande supprimée",
                text2: "Votre demande a été supprimée avec succès",
                position: "bottom",
                visibilityTime: 4000,
              });
            } catch (error) {
              clearTimeout(timeoutId);
              console.error("Delete error:", error);

              // Only show user-facing error if not a JSON parse error
              if (!(error instanceof SyntaxError)) {
                const errorMessage = error instanceof Error 
                  ? error.message.includes("aborted")
                    ? "La requête a expiré"
                    : error.message
                  : "Erreur inconnue";

                Toast.show({
                  type: "error",
                  text1: "Échec de la suppression",
                  text2: errorMessage,
                  position: "bottom",
                  visibilityTime: 4000,
                });
              }
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error("Error in delete process:", error);
    // Only show non-JSON parse errors
    if (!(error instanceof SyntaxError)) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Une erreur est survenue lors de la suppression",
      });
    }
  }
};

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
        // Set the typeDemande field
        requestData.typeDemande = "Document"

        // Set the typeDocument field if it exists
        if (editableData.typeDocument) {
          requestData.typeDocument = editableData.typeDocument
        }

        // Set the texteDemande field (description)
        if (editableData.description) {
          requestData.texteDemande = editableData.description
        }

        // Ensure we preserve the matPers reference
        if (editingRequest.details && editingRequest.details.matPers) {
          requestData.matPers = editingRequest.details.matPers
        }

        // Preserve the codeSoc if it exists
        if (editingRequest.details && editingRequest.details.codeSoc) {
          requestData.codeSoc = editingRequest.details.codeSoc
        }

        console.log("Document request data:", requestData)
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
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
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

  // Logout handler
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear()
      Toast.show({
        type: "success",
        text1: "Déconnexion réussie",
        text2: "Vous avez été déconnecté avec succès.",
        visibilityTime: 2000,
      })
      navigation.navigate("Authentification")
    } catch (error) {
      console.error("Error logging out:", error)
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Échec de la déconnexion. Veuillez réessayer.",
        visibilityTime: 2000,
      })
    }
  }

  // Define theme styles with proper dark theme colors
  const darkStyles = StyleSheet.create({
    container: {
      backgroundColor: "#1A1F38", // Updated to blue background
    },
    content: {
      backgroundColor: "#1A1F38", // Match container background
      flex: 1,
    },
    header: {
      backgroundColor: "#242B42", // Slightly lighter than container
      borderBottomColor: "rgba(255,255,255,0.1)",
    },
    searchContainer: {
      backgroundColor: "#242B42",
      borderBottomColor: "rgba(255,255,255,0.1)",
    },
    searchInputContainer: {
      backgroundColor: "rgba(255,255,255,0.05)",
      borderColor: "rgba(255,255,255,0.1)",
    },
    searchInput: {
      color: "#FFFFFF",
    },
    filterButton: {
      borderColor: "rgba(255,255,255,0.1)",
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    filtersScrollView: {
      borderBottomColor: "rgba(255,255,255,0.1)",
    },
    filterChip: {
      borderColor: "rgba(255,255,255,0.1)",
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    filterChipText: {
      color: "#FFFFFF",
    },
    text: {
      color: "#FFFFFF",
    },
    subtleText: {
      color: "#AAAAAA",
    },
    card: {
      backgroundColor: "#242B42", // Slightly lighter than container
      borderColor: "rgba(255,255,255,0.1)",
    },
    activeFilterOption: {
      backgroundColor: "rgba(147,112,219,0.3)",
    },
    detailsActionButton: {
      backgroundColor: "#0A84FF",
    },
    detailsActionButtonText: {
      color: "#FFFFFF",
    },
    detailsCancelButton: {
      backgroundColor: "#242B42",
    },
    detailsCancelButtonText: {
      color: "#FF453A",
    },
  })

  const lightStyles = StyleSheet.create({
    container: {
      backgroundColor: "#F5F5F5",
    },
    content: {
      backgroundColor: "#F5F5F5", // Match container background
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
      color: "#333333",
    },
    filterButton: {
      borderColor: "#E0E0E0",
      backgroundColor: "#FFFFFF",
    },
    filtersScrollView: {
      borderBottomColor: "#E0E0E0",
    },
    filterChip: {
      borderColor: "#E0E0E0",
      backgroundColor: "#FFFFFF",
    },
    filterChipText: {
      color: "#333333",
    },
    text: {
      color: "#333333",
    },
    subtleText: {
      color: "#757575",
    },
    card: {
      backgroundColor: "#FFFFFF",
      borderColor: "#E0E0E0",
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

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <NavBar
        title="Mes demandes"
        showBackButton={true}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />

      <View style={[styles.content, themeStyles.content]}>
        {loading ? (
          <View style={[styles.loadingContainer, themeStyles.content]}>
            <ActivityIndicator size="large" color={isDarkMode ? "#9370DB" : "#9370DB"} />
            <Text style={[styles.loadingText, themeStyles.text]}>Chargement des demandes...</Text>
          </View>
        ) : error ? (
          <View style={[styles.errorContainer, themeStyles.content]}>
            <Text style={[styles.errorText, themeStyles.text]}>Une erreur est survenue lors du chargement des demandes.</Text>
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
            loading={loading}
          />
        )}
      </View>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
        statusBarTranslucent={true}
      >
        {selectedRequest && (
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
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
        statusBarTranslucent={true}
      >
        {editingRequest && (
          <DemandesEditModal
            editingRequest={editingRequest}
            editableData={editableData}
            setEditableData={setEditableData}
            isDarkMode={isDarkMode}
            themeStyles={themeStyles}
            userId={userId}
            onSave={handleUpdateRequest}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Footer */}
      <Footer />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  }
})

export default DemandesPage
