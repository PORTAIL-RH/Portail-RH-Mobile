import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Bell, Moon, Sun } from "lucide-react-native";
import Footer from "../../Components/Footer";
import { API_CONFIG } from "../../config/apiConfig";
import Toast from "react-native-toast-message";
import useApiPooling from "../../useApiPooling";
import NavBar from "../../Components/NavBar";
import DemandesList from "./DemandesList";
import DemandesDetails from "./DemandesDetails";
import DemandesEditModal from "./DemandesEditModal";

// Types and interfaces
export type RootStackParamList = {
  AccueilCollaborateur: undefined;
  Profile: undefined;
  Demandestot: undefined;
  Authentification: undefined;
  Notifications: undefined;
  Autorisation: undefined;
  AjouterDemande: undefined;
  Calendar: undefined;
  DemandesEditModal: {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    editingRequest: Request | null;
    editableData: EditableRequestData;
    setEditableData: React.Dispatch<React.SetStateAction<EditableRequestData>>;
    isDarkMode: boolean;
    themeStyles: any;
    userId: string | null;
  };
  DemandesDetails: {
    visible: boolean;
    onClose: () => void;
    onEdit: (request: Request) => void;
    onDelete: (requestId: string, requestType: string) => void;
    selectedRequest: Request | null;
    isDarkMode: boolean;
    themeStyles: any;
    renderSafeText: (value: any) => string;
  };
  DemandesList: {
    filteredRequests: Request[];
    onSelectRequest: (request: Request) => void;
    isDarkMode: boolean;
    themeStyles: any;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    activeFilter: string;
    setActiveFilter: React.Dispatch<React.SetStateAction<string>>;
    activeTypeFilter: string;
    setActiveTypeFilter: React.Dispatch<React.SetStateAction<string>>;
    filterRequests: (status: string, type?: string) => void;
    searchRequests: (text: string) => void;
    loading?: boolean;
  };
};

type DemandesNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

interface EditableRequestData {
  description?: string;
  titre?: string;
  theme?: string;
  typeFormation?: string;
  typeDocument?: string;
  typePreavance?: string;
  montant?: string;
  horaireSortie?: string;
  horaireRetour?: string;
  minuteSortie?: string;
  minuteRetour?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  periodeDebut?: string;
  periodeFin?: string;
  files?: {
    uri: string;
    name: string;
    type: string;
  }[];
  titreId?: string;
  typeId?: string;
  themeId?: string;
}

const { width, height } = Dimensions.get("window");

const DemandesPage = () => {
  const navigation = useNavigation<DemandesNavigationProp>();
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editableData, setEditableData] = useState<EditableRequestData>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Add loading states for different operations
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Utility functions
  const renderSafeText = useCallback((value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (typeof value === "object") {
      if (value.titre) return typeof value.titre === "string" ? value.titre : renderSafeText(value.titre);
      if (value.type) return typeof value.type === "string" ? value.type : renderSafeText(value.type);
      if (value.theme) return typeof value.theme === "string" ? value.theme : renderSafeText(value.theme);
      if (value.id) {
        if (value.titre) return value.titre;
        if (value.theme) return value.theme;
        if (value.type) return value.type;
      }
      if (Array.isArray(value)) return value.map(renderSafeText).join(", ");
      try {
        return JSON.stringify(value);
      } catch (e) {
        return "[Object]";
      }
    }
    return String(value);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  }, []);

  const formatTime = useCallback((dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  }, []);

  const getRequestStatus = useCallback((request: Request): "pending" | "approved" | "rejected" => {
    if (request.type.toLowerCase().includes("document") || request.type.toLowerCase().includes("pre-avance")) {
      if (!request.responseRh) return "pending";
      switch (request.responseRh) {
        case "T": return "approved";
        case "N": return "rejected";
        case "I":
        default: return "pending";
      }
    }
    
    if (!request.responseChefs) return "pending";
    switch (request.responseChefs.responseChef1) {
      case "O": return "approved";
      case "N": return "rejected";
      case "I":
      default: return "pending";
    }
  }, []);

  const mapDemandes = useCallback((data: any[], type: string): Request[] => {
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const submissionDate = item.dateDemande || "N/A";
      const formattedDate = submissionDate === "N/A" ? "N/A" : formatDate(submissionDate);
      const formattedTime = submissionDate === "N/A" ? "" : formatTime(submissionDate);
      
      const status = getRequestStatus({
        id: item.id || item._id,
        type,
        description: item.texteDemande || item.description || `Demande de ${type}`,
        status: "pending",
        date: formattedDate,
        time: formattedTime,
        responseChefs: item.responseChefs,
        responseRh: item.reponseRH,
        details: {
          ...item,
          dateDemande: submissionDate,
          startDate: formatDate(item.dateDebut),
          endDate: formatDate(item.dateFin),
          duration: item.nbrJours?.toString(),
          montant: item.montant?.toString(),
        },
      });

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
          dateDemande: submissionDate,
          startDate: formatDate(item.dateDebut),
          endDate: formatDate(item.dateFin),
          duration: item.nbrJours?.toString(),
          montant: item.montant?.toString(),
          documents: Array.isArray(item.files) ? item.files : [],
          filesReponse: Array.isArray(item.filesReponse) ? item.filesReponse : [],
        },
      };
    });
  }, [formatDate, formatTime, getRequestStatus]);

  // Data loading
  const loadThemePreference = useCallback(async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("@theme_mode");
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    }
  }, []);

  const getUserInfo = useCallback(async () => {
    try {
      const [id, token] = await Promise.all([
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("userToken"),
      ]);
      setUserId(id);
      setUserToken(token);
    } catch (error) {
      console.error("Error retrieving user info:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference();
      await getUserInfo();
    };
    loadData();
  }, [getUserInfo, loadThemePreference]);

  const toggleTheme = useCallback(async () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  }, [isDarkMode]);

  // API functions
  const fetchWithValidation = useCallback(async (url: string, token: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn(`API request failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      return null;
    }
  }, []);

  const {
    data: requests,
    loading,
    error,
    refresh: refreshRequests,
  } = useApiPooling<Request[]>({
    apiCall: useCallback(async () => {
      if (!userId || !userToken) return [];
      
      const endpoints = [
        `/api/demande-autorisation/personnel/${userId}`,
        `/api/demande-conge/personnel/${userId}`,
        `/api/demande-formation/personnel/${userId}`,
        `/api/demande-pre-avance/personnel/${userId}`,
        `/api/demande-document/personnel/${userId}`,
      ];

      try {
        const responses = await Promise.all(
          endpoints.map(endpoint =>
            fetchWithValidation(
              `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}`,
              userToken
            )
          )
        );

        const [autorisations, conges, formations, preAvances, documents] = responses.map(
          (res) => res || []
        );

        return [
          ...mapDemandes(autorisations, "autorisation"),
          ...mapDemandes(conges, "congé"),
          ...mapDemandes(formations, "formation"),
          ...mapDemandes(preAvances, "pre-avance"),
          ...mapDemandes(documents, "document"),
        ];
      } catch (error) {
        console.error("Error in API call:", error);
        throw error;
      }
    }, [userId, userToken, fetchWithValidation, mapDemandes]),
    storageKey: "user_requests_data",
    poolingInterval: 60000,
    initialData: [],
  });

  // Filtering logic
  const filteredRequests = useMemo(() => {
    if (!requests) return [];

    let filtered = [...requests];

    if (activeTypeFilter !== "all") {
      filtered = filtered.filter((request) =>
        request.type.toLowerCase().includes(activeTypeFilter.toLowerCase())
      );
    }

    if (activeFilter !== "all") {
      filtered = filtered.filter((request) => {
        if (!request.responseChefs) return activeFilter === "pending";
        
        switch (request.responseChefs.responseChef1) {
          case "O": return activeFilter === "approved";
          case "N": return activeFilter === "rejected";
          case "I":
          default: return activeFilter === "pending";
        }
      });
    }

    if (searchQuery) {
      filtered = filtered.filter((request) =>
        request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [requests, activeFilter, activeTypeFilter, searchQuery]);

  const filterRequests = useCallback((status: string, type: string = activeTypeFilter) => {
    setActiveFilter(status);
    setActiveTypeFilter(type);
  }, [activeTypeFilter]);

  const searchRequests = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Request actions
  const viewRequestDetails = useCallback((request: Request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  }, []);

  const prepareForEdit = useCallback((request: Request) => {
    setEditingRequest(request);
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
    });
    setShowDetailsModal(false);
    setShowEditModal(true);
  }, [renderSafeText]);

  const handleDeleteRequest = useCallback(async (requestId: string, requestType: string) => {
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
              setIsDeleting(true);
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                let response = await fetch(fullUrl, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  signal: controller.signal,
                });

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

                if (response.status === 204) {
                  console.log("Delete successful (204 No Content)");
                } else if (!response.ok) {
                  let errorText = "Échec de la suppression";
                  try {
                    const errorData = await response.text();
                    errorText = errorData || errorText;
                  } catch (e) {
                    console.log("Couldn't parse error response", e);
                  }
                  throw new Error(errorText);
                }

                // Force immediate refresh after successful deletion
                await refreshRequests(true);

                setShowDetailsModal(false);

                Toast.show({
                  type: "success",
                  text1: "Demande supprimée",
                  text2: "Votre demande a été supprimée avec succès",
                  position: "bottom",
                  visibilityTime: 4000,
                });
              } catch (error) {
                console.error("Delete error:", error);
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
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error in delete process:", error);
      if (!(error instanceof SyntaxError)) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Une erreur est survenue lors de la suppression",
        });
      }
    }
  }, [refreshRequests]);

  const handleUpdateRequest = useCallback(async () => {
    if (!editingRequest) {
      console.error("No request is being edited");
      return;
    }

    setIsUpdating(true);

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

      const endpointMap: { [key: string]: string } = {
        autorisation: "/api/demande-autorisation",
        congé: "/api/demande-conge",
        formation: "/api/demande-formation",
        "pre-avance": "/api/demande-pre-avance",
        document: "/api/demande-document",
      };

      let endpoint = "";
      for (const [key, value] of Object.entries(endpointMap)) {
        if (editingRequest.type.toLowerCase().includes(key.toLowerCase())) {
          endpoint = value;
          break;
        }
      }

      if (!endpoint) {
        console.error("Unknown request type:", editingRequest.type);
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Type de demande inconnu",
        });
        return;
      }

      const requestData: any = {
        id: editingRequest.id,
      };

      if (editableData.description) {
        requestData.texteDemande = editableData.description;
      }

      if (editingRequest.type.toLowerCase().includes("congé")) {
        if (editableData.startDate) requestData.dateDebut = editableData.startDate;
        if (editableData.endDate) requestData.dateFin = editableData.endDate;
        if (editableData.periodeDebut) {
          requestData.snjTempDep = editableData.periodeDebut === "matin" ? "M" : "S";
        }
        if (editableData.periodeFin) {
          requestData.snjTempRetour = editableData.periodeFin === "matin" ? "M" : "S";
        }
        if (editableData.duration) requestData.nbrJours = editableData.duration;
        if (editableData.endDate) requestData.dateReprisePrev = editableData.endDate;
      }

      if (editingRequest.type.toLowerCase().includes("pre-avance")) {
        requestData.typeDemande = "PreAvnace";
        if (!editableData.typePreavance) {
          Toast.show({
            type: "error",
            text1: "Type manquant",
            text2: "Veuillez sélectionner un type de pré-avance",
            position: "bottom",
            visibilityTime: 4000,
          });
          return;
        }
        requestData.type = editableData.typePreavance;

        if (!editableData.montant) {
          Toast.show({
            type: "error",
            text1: "Montant manquant",
            text2: "Veuillez saisir un montant",
            position: "bottom",
            visibilityTime: 4000,
          });
          return;
        }

        const montant = Number.parseFloat(editableData.montant);
        if (isNaN(montant)) {
          Toast.show({
            type: "error",
            text1: "Montant invalide",
            text2: "Veuillez saisir un nombre valide",
            position: "bottom",
            visibilityTime: 4000,
          });
          return;
        }

        const typeMaxAmounts: Record<string, number> = {
          MEDICAL: 2000.0,
          SCOLARITE: 1500.0,
          VOYAGE: 1000.0,
          INFORMATIQUE: 800.0,
          DEMENAGEMENT: 3000.0,
          MARIAGE: 5000.0,
          FUNERAILLES: 2000.0,
        };

        const maxAmount = typeMaxAmounts[requestData.type] || 0;

        if (montant > maxAmount) {
          Toast.show({
            type: "error",
            text1: "Montant trop élevé",
            text2: `Le maximum pour ${requestData.type} est ${maxAmount} €`,
            position: "bottom",
            visibilityTime: 5000,
          });
          return;
        }

        requestData.montant = montant;
      }

      if (editingRequest.type.toLowerCase().includes("autorisation")) {
        if (editableData.startDate) requestData.dateDebut = editableData.startDate;
        if (editableData.horaireSortie && editableData.minuteSortie) {
          const [hours, minutes] = editableData.horaireSortie.split(":");
          requestData.horaireSortie = hours;
          requestData.minuteSortie = minutes;
        }
        if (editableData.horaireRetour && editableData.minuteRetour) {
          const [hours, minutes] = editableData.horaireRetour.split(":");
          requestData.horaireRetour = hours;
          requestData.minuteRetour = minutes;
        }
      }

      if (editingRequest.type.toLowerCase().includes("formation")) {
        if (editableData.startDate) requestData.dateDebut = editableData.startDate;
        if (editableData.duration) requestData.nbrJours = editableData.duration;
        if (editableData.titreId && editableData.titre) {
          requestData.titre = { id: editableData.titreId, titre: editableData.titre };
        }
        if (editableData.typeId && editableData.typeFormation) {
          requestData.type = { id: editableData.typeId, type: editableData.typeFormation };
        }
        if (editableData.themeId && editableData.theme) {
          requestData.theme = { id: editableData.themeId, theme: editableData.theme };
        }
      }

      if (editingRequest.type.toLowerCase().includes("document")) {
        requestData.typeDemande = "Document";
        if (editableData.typeDocument) requestData.typeDocument = editableData.typeDocument;
        if (editableData.description) requestData.texteDemande = editableData.description;
        if (editingRequest.details?.matPers) requestData.matPers = editingRequest.details.matPers;
        if (editingRequest.details?.codeSoc) requestData.codeSoc = editingRequest.details.codeSoc;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}${endpoint}/${editingRequest.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update request: ${errorText}`);
      }

      // Force immediate refresh after successful update
      await refreshRequests(true);
      
      setShowEditModal(false);
      setShowDetailsModal(false);

      Toast.show({
        type: "success",
        text1: "Demande mise à jour",
        text2: `Votre demande de ${editingRequest.type.toLowerCase()} a été modifiée avec succès`,
        position: "bottom",
        visibilityTime: 4000,
        autoHide: true,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        Toast.show({
          type: "error",
          text1: "Erreur de connexion",
          text2: "La requête a pris trop de temps. Veuillez réessayer.",
          position: "bottom",
          visibilityTime: 4000,
          autoHide: true,
        });
      } else {
        console.error("Error updating request:", error);
        let errorMessage = "Erreur lors de la mise à jour";
        if (error instanceof Error) {
          errorMessage = error.message.includes("dépasser") ? error.message : "Erreur serveur lors de la mise à jour";
        }

        Toast.show({
          type: "error",
          text1: "Échec de la mise à jour",
          text2: errorMessage,
          position: "bottom",
          visibilityTime: 4000,
          autoHide: true,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [editingRequest, editableData, refreshRequests]);

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      Toast.show({
        type: "success",
        text1: "Déconnexion réussie",
        text2: "Vous avez été déconnecté avec succès.",
        visibilityTime: 2000,
      });
      navigation.navigate("Authentification");
    } catch (error) {
      console.error("Error logging out:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Échec de la déconnexion. Veuillez réessayer.",
        visibilityTime: 2000,
      });
    }
  }, [navigation]);

  // Theme styles with integrated spinner styles
  const darkStyles = StyleSheet.create({
    container: {
      backgroundColor: "#1A1F38",
    },
    content: {
      backgroundColor: "#1A1F38",
      flex: 1,
    },
    header: {
      backgroundColor: "#242B42",
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
      backgroundColor: "#242B42",
      borderColor: "rgba(255,255,255,0.1)",
    },
    activeFilterOption: {
      backgroundColor: "rgba(18, 5, 46, 0.1)",
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
    // Spinner styles for dark mode
    spinnerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1A1F38',
    },
    spinnerText: {
      marginTop: 12,
      fontSize: 16,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(26, 31, 56, 0.9)',
      zIndex: 1000,
    },
  });

  const lightStyles = StyleSheet.create({
    container: {
      backgroundColor: "#F5F5F5",
    },
    content: {
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
      backgroundColor: "rgba(18, 5, 46, 0.1)",
    },
    detailsActionButton: {
      backgroundColor: "#121527",
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
    // Spinner styles for light mode
    spinnerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
    },
    spinnerText: {
      marginTop: 12,
      fontSize: 16,
      color: '#333333',
      textAlign: 'center',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(245, 245, 245, 0.9)',
      zIndex: 1000,
    },
  });

  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  // Loading component
  const LoadingSpinner = ({ message = "Chargement en cours..." }) => (
    <View style={themeStyles.spinnerContainer}>
      <ActivityIndicator 
        size="large" 
        color="#121527"
      />
      <Text style={themeStyles.spinnerText}>{message}</Text>
    </View>
  );

  // Loading overlay component for modals
  const LoadingOverlay = ({ message = "Chargement..." }) => (
    <View style={themeStyles.loadingOverlay}>
      <ActivityIndicator 
        size="large" 
        color="#121527"
      />
      <Text style={themeStyles.spinnerText}>{message}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <NavBar
        title="Mes demandes"
        showBackButton={true}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />

      {loading ? (
        <LoadingSpinner message="Chargement des demandes..." />
      ) : error ? (
        <View style={[styles.errorContainer, themeStyles.content]}>
          <Text style={[styles.errorText, themeStyles.text]}>
            Une erreur est survenue lors du chargement des demandes.
          </Text>
        </View>
      ) : (
        <View style={[styles.content, themeStyles.content]}>
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
        </View>
      )}

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
        statusBarTranslucent={true}
      >
        {selectedRequest && (
          <View style={styles.modalContainer}>
            {isDeleting && (
              <LoadingOverlay message="Suppression en cours..." />
            )}
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
          </View>
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
          <View style={styles.modalContainer}>
            {isUpdating && (
              <LoadingOverlay message="Mise à jour en cours..." />
            )}
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
          </View>
        )}
      </Modal>

      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
});

export default DemandesPage;