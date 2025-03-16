import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  TextInput,
  Modal,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Calendar,
  FileText,
  ChevronRight,
  X,
  Download,
  Share2,
  GraduationCap,
  DollarSign,
  Shield,
  Edit,
  Trash,
} from "lucide-react-native";
import Footer from "../../Components/Footer";
import { API_CONFIG } from "../../config/apiConfig";

// Définir les types de navigation
export type RootStackParamList = {
  AccueilCollaborateur: undefined;
  Profile: undefined;
  Demandestot: undefined;
  Authentification: undefined;
  Notifications: undefined;
  Autorisation: undefined;
  AjouterDemande: undefined;
  Calendar: undefined;
};

type DemandesNavigationProp = NativeStackNavigationProp<RootStackParamList, "Demandestot">;

const { width } = Dimensions.get("window");

// Définir l'interface Request
interface Request {
  id: string;
  type: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  time: string;
  details: {
    startDate?: string;
    endDate?: string;
    duration?: string;
    reason?: string;
    comments?: string;
    approver?: string;
    documents?: string[];
    requestDate?: string;
    approvalDate?: string;
    rejectionDate?: string;
    purpose?: string;
    equipment?: string;
    provider?: string;
    location?: string;
    cost?: string;
    amount?: string;
    repaymentPlan?: string;
    titre?: string | { titre: string }; // Gérer à la fois les chaînes et les objets
    typeFormation?: string | { type: string }; // Gérer à la fois les chaînes et les objets
    theme?: string | { theme: string }; // Gérer à la fois les chaînes et les objets
    typeDocument?: string;
    filesReponse?: string[];
    typePreavance?: string;
    montant?: string;
    heureSortie?: string;
    heureRetour?: string;
  };
}

// Définir les styles de thème
interface ThemeStyles {
  container: ViewStyle;
  header: ViewStyle;
  searchContainer: ViewStyle;
  searchInputContainer: ViewStyle;
  searchInput: TextStyle;
  filterButton: ViewStyle;
  filtersScrollView: ViewStyle;
  filterChip: ViewStyle;
  filterChipText: TextStyle;
  text: TextStyle;
  subtleText: TextStyle;
  card: ViewStyle;
  activeFilterOption: ViewStyle;
  detailsActionButton: ViewStyle;
  detailsActionButtonText: TextStyle;
  detailsCancelButton: ViewStyle;
  detailsCancelButtonText: TextStyle;
  activeFilterChip?: ViewStyle;
  activeTypeFilterContainer?: ViewStyle;
  activeTypeFilterChip?: ViewStyle;
}

const DemandesPage = () => {
  const navigation = useNavigation<DemandesNavigationProp>();
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");

  // Charger les préférences de thème et récupérer les demandes
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference();
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        fetchRequests(userId);
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Récupérer les demandes depuis l'API
  const fetchRequests = async (userId: string) => {
    try {
      const types = ["formation", "conge", "document", "pre-avance", "autorisation"];
      let allDemandes: Request[] = [];

      for (const type of types) {
        const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-${type}/personnel/${userId}`);
        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération des demandes de type ${type}`);
        }
        const data: any[] = await response.json();

        const validatedData = data.map((request) => {
          // Assurer que le statut est l'une des valeurs autorisées
          let status: "pending" | "approved" | "rejected";
          if (request.reponseChef === "I") {
            status = "pending";
          } else if (request.reponseChef === "O") {
            status = "approved";
          } else {
            status = "rejected";
          }

          return {
            id: request.id_libre_demande || request.id,
            type: request.typeDemande || request.typeDemande,
            description: request.texteDemande || "Pas de description",
            status,
            date: new Date(request.dateDemande).toLocaleDateString("fr-FR"),
            time: new Date(request.dateDemande).toLocaleTimeString("fr-FR"),
            details: {
              startDate: request.dateDebut ? new Date(request.dateDebut).toLocaleDateString("fr-FR") : undefined,
              endDate: request.dateFin ? new Date(request.dateFin).toLocaleDateString("fr-FR") : undefined,
              duration: request.nbrJours?.toString(),
              reason: request.texteDemande,
              documents: request.files?.map((file: any) => file?.filename ?? "Aucun fichier fourni") ?? [],
              titre: request.titre,
              typeFormation: request.type,
              theme: request.theme,
              typeDocument: request.typeDocument,
              filesReponse: request.filesReponse?.map((file: any) => file?.filename ?? "Aucun fichier fourni") ?? [],
              typePreavance: request.type,
              montant: request.montant?.toString(),
              heureSortie: request.heureSortie,
              heureRetour: request.heureRetour,
            },
          };
        });

        allDemandes = [...allDemandes, ...validatedData];
      }

      setRequests(allDemandes);
      setFilteredRequests(allDemandes);
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir l'icône pour le type de demande
  const getRequestTypeIcon = (type: string | undefined) => {
    const typeString = typeof type === "string" ? type : "unknown";
    const lowerCaseType = typeString.toLowerCase();

    if (lowerCaseType.includes("congé")) {
      return <Calendar size={24} color={isDarkMode ? "#9370DB" : "#9370DB"} />;
    } else if (lowerCaseType.includes("formation")) {
      return <GraduationCap size={24} color={isDarkMode ? "#2196F3" : "#2196F3"} />;
    } else if (lowerCaseType.includes("document")) {
      return <FileText size={24} color={isDarkMode ? "#607D8B" : "#607D8B"} />;
    } else if (lowerCaseType.includes("pre-avance")) {
      return <DollarSign size={24} color={isDarkMode ? "#FF9800" : "#FF9800"} />;
    } else if (lowerCaseType.includes("autorisation")) {
      return <Shield size={24} color={isDarkMode ? "#673AB7" : "#673AB7"} />;
    } else {
      return <FileText size={24} color={isDarkMode ? "#2196F3" : "#2196F3"} />;
    }
  };

  // Charger les préférences de thème
  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("@theme_mode");
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des préférences de thème:", error);
    }
  };

  // Basculer entre les thèmes clair et sombre
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des préférences de thème:", error);
    }
  };

  // Filtrer les demandes par statut et type
  const filterRequests = (status: string, type: string = activeTypeFilter) => {
    setActiveFilter(status);
    if (type !== activeTypeFilter) {
      setActiveTypeFilter(type);
    }

    let filtered = requests;

    // Filtrer par statut
    if (status !== "all") {
      filtered = filtered.filter((request) => request.status === status);
    }

    // Filtrer par type
    if (type !== "all") {
      filtered = filtered.filter((request) => {
        const requestType = request.type.toLowerCase();
        switch (type) {
          case "conge":
            return requestType.includes("congé");
          case "formation":
            return requestType.includes("formation");
          case "avance":
            return requestType.includes("PreAvnace");
          case "document":
            return requestType.includes("document");
          case "autorisation":
            return requestType.includes("autorisation");
          default:
            return true;
        }
      });
    }

    // Appliquer la recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (request) =>
          request.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
    setShowFilterModal(false);
  };

  // Rechercher des demandes
  const searchRequests = (text: string) => {
    setSearchQuery(text);

    let filtered = requests;

    // Filtrer par statut
    if (activeFilter !== "all") {
      filtered = filtered.filter((request) => request.status === activeFilter);
    }

    // Filtrer par type
    if (activeTypeFilter !== "all") {
      filtered = filtered.filter((request) => {
        const requestType = request.type.toLowerCase();
        switch (activeTypeFilter) {
          case "conge":
            return requestType.includes("congé");
          case "formation":
            return requestType.includes("formation");
          case "avance":
            return requestType.includes("avance");
          case "document":
            return requestType.includes("document");
          case "autorisation":
            return requestType.includes("autorisation");
          default:
            return true;
        }
      });
    }

    // Appliquer la recherche
    if (text) {
      filtered = filtered.filter(
        (request) =>
          request.type.toLowerCase().includes(text.toLowerCase()) ||
          request.description.toLowerCase().includes(text.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  // Afficher les détails de la demande
  const viewRequestDetails = (request: Request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={18} color="#4CAF50" />;
      case "rejected":
        return <XCircle size={18} color="#F44336" />;
      case "pending":
        return <Clock size={18} color="#FFC107" />;
      default:
        return null;
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "pending":
        return "#FFC107";
      default:
        return "#9370DB";
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvée";
      case "rejected":
        return "Rejetée";
      case "pending":
        return "En attente";
      default:
        return "";
    }
  };

  // Formater la date au format ../../....
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Appliquer les styles de thème
  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* En-tête */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
            <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, themeStyles.text]}>Mes demandes</Text>
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9370DB" />
        </View>
      ) : (
        <>
          {/* Barre de recherche et filtre */}
          <View style={[styles.searchContainer, themeStyles.searchContainer]}>
            <View style={[styles.searchInputContainer, themeStyles.searchInputContainer]}>
              <Search size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, themeStyles.searchInput]}
                placeholder="Rechercher une demande..."
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                value={searchQuery}
                onChangeText={searchRequests}
              />
            </View>
            <TouchableOpacity
              style={[styles.filterButton, themeStyles.filterButton]}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter size={20} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
          </View>

          {/* Liste des demandes */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredRequests.length === 0 ? (
              <View style={[styles.emptyContainer, themeStyles.card]}>
                <FileText size={48} color={isDarkMode ? "#555" : "#ccc"} />
                <Text style={[styles.emptyText, themeStyles.text]}>Aucune demande trouvée</Text>
                <Text style={[styles.emptySubtext, themeStyles.subtleText]}>
                  Aucune demande ne correspond à vos critères de recherche
                </Text>
              </View>
            ) : (
              filteredRequests.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={[styles.requestCard, themeStyles.card]}
                  onPress={() => viewRequestDetails(request)}
                  activeOpacity={0.7}
                >
                  <View style={styles.requestCardHeader}>
                    <View style={styles.requestTypeContainer}>
                      {getRequestTypeIcon(request.type)}
                      <View style={styles.requestTypeTextContainer}>
                        <Text style={[styles.requestType, themeStyles.text]}>{request.type}</Text>
                        <View style={styles.requestStatusContainer}>
                          {getStatusIcon(request.status)}
                          <Text style={[styles.requestStatusText, { color: getStatusColor(request.status) }]}>
                            {getStatusText(request.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <ChevronRight size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                  </View>

                  <Text style={[styles.requestDescription, themeStyles.subtleText]}>{request.description}</Text>

                  <View style={styles.requestFooter}>
                    <Text style={[styles.requestDate, themeStyles.subtleText]}>
                      {request.date} • {request.time}
                    </Text>
                  </View>

                  <View style={[styles.requestStatusBar, { backgroundColor: getStatusColor(request.status) }]} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Modal de filtre */}
          <Modal
            visible={showFilterModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowFilterModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.filterModal, themeStyles.card]}>
                <View style={styles.filterModalHeader}>
                  <Text style={[styles.filterModalTitle, themeStyles.text]}>Filtrer les demandes</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <X size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
                  </TouchableOpacity>
                </View>

                {/* Filtrer par statut */}
                <Text style={[styles.filterSectionTitle, themeStyles.text]}>Par statut</Text>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeFilter === "all" && styles.activeFilterOption,
                    activeFilter === "all" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests("all")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      themeStyles.text,
                      activeFilter === "all" && styles.activeFilterOptionText,
                    ]}
                  >
                    Tous les statuts
                  </Text>
                  {activeFilter === "all" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeFilter === "pending" && styles.activeFilterOption,
                    activeFilter === "pending" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests("pending")}
                >
                  <View style={styles.filterOptionContent}>
                    <Clock size={20} color="#FFC107" />
                    <Text
                      style={[
                        styles.filterOptionText,
                        themeStyles.text,
                        activeFilter === "pending" && styles.activeFilterOptionText,
                      ]}
                    >
                      En attente
                    </Text>
                  </View>
                  {activeFilter === "pending" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeFilter === "approved" && styles.activeFilterOption,
                    activeFilter === "approved" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests("approved")}
                >
                  <View style={styles.filterOptionContent}>
                    <CheckCircle size={20} color="#4CAF50" />
                    <Text
                      style={[
                        styles.filterOptionText,
                        themeStyles.text,
                        activeFilter === "approved" && styles.activeFilterOptionText,
                      ]}
                    >
                      Approuvées
                    </Text>
                  </View>
                  {activeFilter === "approved" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeFilter === "rejected" && styles.activeFilterOption,
                    activeFilter === "rejected" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests("rejected")}
                >
                  <View style={styles.filterOptionContent}>
                    <XCircle size={20} color="#F44336" />
                    <Text
                      style={[
                        styles.filterOptionText,
                        themeStyles.text,
                        activeFilter === "rejected" && styles.activeFilterOptionText,
                      ]}
                    >
                      Rejetées
                    </Text>
                  </View>
                  {activeFilter === "rejected" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                {/* Filtrer par type */}
                <Text style={[styles.filterSectionTitle, themeStyles.text, { marginTop: 16 }]}>Par type</Text>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeTypeFilter === "all" && styles.activeFilterOption,
                    activeTypeFilter === "all" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests(activeFilter, "all")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      themeStyles.text,
                      activeTypeFilter === "all" && styles.activeFilterOptionText,
                    ]}
                  >
                    Tous les types
                  </Text>
                  {activeTypeFilter === "all" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeTypeFilter === "conge" && styles.activeFilterOption,
                    activeTypeFilter === "conge" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests(activeFilter, "conge")}
                >
                  <View style={styles.filterOptionContent}>
                    <Calendar size={20} color="#9370DB" />
                    <Text
                      style={[
                        styles.filterOptionText,
                        themeStyles.text,
                        activeTypeFilter === "conge" && styles.activeFilterOptionText,
                      ]}
                    >
                      Congés
                    </Text>
                  </View>
                  {activeTypeFilter === "conge" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeTypeFilter === "formation" && styles.activeFilterOption,
                    activeTypeFilter === "formation" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests(activeFilter, "formation")}
                >
                  <View style={styles.filterOptionContent}>
                    <GraduationCap size={20} color="#2196F3" />
                    <Text
                      style={[
                        styles.filterOptionText,
                        themeStyles.text,
                        activeTypeFilter === "formation" && styles.activeFilterOptionText,
                      ]}
                    >
                      Formations
                    </Text>
                  </View>
                  {activeTypeFilter === "formation" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeTypeFilter === "avance" && styles.activeFilterOption,
                    activeTypeFilter === "avance" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests(activeFilter, "avance")}
                >
                  <View style={styles.filterOptionContent}>
                    <DollarSign size={20} color="#FF9800" />
                    <Text
                      style={[
                        styles.filterOptionText,
                        themeStyles.text,
                        activeTypeFilter === "avance" && styles.activeFilterOptionText,
                      ]}
                    >
                      Avances
                    </Text>
                  </View>
                  {activeTypeFilter === "avance" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeTypeFilter === "document" && styles.activeFilterOption,
                    activeTypeFilter === "document" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests(activeFilter, "document")}
                >
                  <View style={styles.filterOptionContent}>
                    <FileText size={20} color="#607D8B" />
                    <Text
                      style={[
                        styles.filterOptionText,
                        themeStyles.text,
                        activeTypeFilter === "document" && styles.activeFilterOptionText,
                      ]}
                    >
                      Documents
                    </Text>
                  </View>
                  {activeTypeFilter === "document" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    activeTypeFilter === "autorisation" && styles.activeFilterOption,
                    activeTypeFilter === "autorisation" && themeStyles.activeFilterOption,
                  ]}
                  onPress={() => filterRequests(activeFilter, "autorisation")}
                >
                  <View style={styles.filterOptionContent}>
                    <Shield size={20} color="#673AB7" />
                    <Text
                      style={[
                        styles.filterOptionText,
                        themeStyles.text,
                        activeTypeFilter === "autorisation" && styles.activeFilterOptionText,
                      ]}
                    >
                      Autorisations
                    </Text>
                  </View>
                  {activeTypeFilter === "autorisation" && <CheckCircle size={20} color="#9370DB" />}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Modal de détails */}
          {selectedRequest && (
            <Modal
              visible={showDetailsModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDetailsModal(false)}
            >
              <View style={[styles.detailsModalContainer, themeStyles.container]}>
                <View style={[styles.detailsModalHeader, themeStyles.header]}>
                  <TouchableOpacity style={styles.backButton} onPress={() => setShowDetailsModal(false)}>
                    <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
                  </TouchableOpacity>
                  <Text style={[styles.detailsModalTitle, themeStyles.text]}>Détails de la demande</Text>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView
                  style={styles.detailsScrollContainer}
                  contentContainerStyle={styles.detailsScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* En-tête de la demande */}
                  <View style={[styles.detailsHeader, themeStyles.card]}>
                    <View style={styles.detailsHeaderContent}>
                      <View style={styles.detailsTypeContainer}>
                        {getRequestTypeIcon(selectedRequest.type)}
                        <Text style={[styles.detailsType, themeStyles.text]}>{selectedRequest.type}</Text>
                      </View>
                      <View
                        style={[
                          styles.detailsStatusBadge,
                          { backgroundColor: `${getStatusColor(selectedRequest.status)}20` },
                        ]}
                      >
                        {getStatusIcon(selectedRequest.status)}
                        <Text style={[styles.detailsStatusText, { color: getStatusColor(selectedRequest.status) }]}>
                          {getStatusText(selectedRequest.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.detailsDescription, themeStyles.subtleText]}>
                      {selectedRequest.description}
                    </Text>
                    <Text style={[styles.detailsDate, themeStyles.subtleText]}>
                      Soumise le {selectedRequest.date} à {selectedRequest.time}
                    </Text>
                  </View>

                  {/* Informations de la demande */}
                  <View style={[styles.detailsSection, themeStyles.card]}>
                    <Text style={[styles.detailsSectionTitle, themeStyles.text]}>Informations</Text>

                    {selectedRequest.details.startDate && selectedRequest.details.endDate && (
                      <View style={styles.detailsItem}>
                        <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Période:</Text>
                        <Text style={[styles.detailsItemValue, themeStyles.text]}>
                          {formatDate(selectedRequest.details.startDate)} → {formatDate(selectedRequest.details.endDate)}
                        </Text>
                      </View>
                    )}

                    {selectedRequest.details.titre && (
                      <View style={styles.detailsItem}>
                        <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Titre:</Text>
                        <Text style={[styles.detailsItemValue, themeStyles.text]}>
                          {typeof selectedRequest.details.titre === "object"
                            ? selectedRequest.details.titre.titre
                            : selectedRequest.details.titre}
                        </Text>
                      </View>
                    )}

                    {selectedRequest.details.typeFormation && (
                      <View style={styles.detailsItem}>
                        <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Type de formation:</Text>
                        <Text style={[styles.detailsItemValue, themeStyles.text]}>
                          {typeof selectedRequest.details.typeFormation === "object"
                            ? selectedRequest.details.typeFormation.type
                            : selectedRequest.details.typeFormation}
                        </Text>
                      </View>
                    )}

                    {selectedRequest.details.theme && (
                      <View style={styles.detailsItem}>
                        <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Thème:</Text>
                        <Text style={[styles.detailsItemValue, themeStyles.text]}>
                          {typeof selectedRequest.details.theme === "object"
                            ? selectedRequest.details.theme.theme
                            : selectedRequest.details.theme}
                        </Text>
                      </View>
                    )}

                    {selectedRequest.details.typeDocument && (
                      <View style={styles.detailsItem}>
                        <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Type de document:</Text>
                        <Text style={[styles.detailsItemValue, themeStyles.text]}>
                          {selectedRequest.details.typeDocument}
                        </Text>
                      </View>
                    )}

                    {selectedRequest.details.typePreavance && (
                      <View style={styles.detailsItem}>
                        <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Type de préavance:</Text>
                        <Text style={[styles.detailsItemValue, themeStyles.text]}>
                          {selectedRequest.details.typePreavance}
                        </Text>
                      </View>
                    )}

                    {selectedRequest.details.montant && (
                      <View style={styles.detailsItem}>
                        <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Montant:</Text>
                        <Text style={[styles.detailsItemValue, themeStyles.text]}>
                          {selectedRequest.details.montant} €
                        </Text>
                      </View>
                    )}

                    {selectedRequest.details.heureSortie && selectedRequest.details.heureRetour && (
                      <View style={styles.detailsItem}>
                        <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Heure de sortie/retour:</Text>
                        <Text style={[styles.detailsItemValue, themeStyles.text]}>
                          {selectedRequest.details.heureSortie} → {selectedRequest.details.heureRetour}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Documents */}
                  {selectedRequest.details.documents && selectedRequest.details.documents.length > 0 && (
                    <View style={[styles.detailsSection, themeStyles.card]}>
                      <Text style={[styles.detailsSectionTitle, themeStyles.text]}>Documents</Text>

                      {selectedRequest.details.documents.map((document: string, index: number) => (
                        <View key={index} style={styles.documentItem}>
                          <View style={styles.documentInfo}>
                            <FileText size={20} color={isDarkMode ? "#9370DB" : "#9370DB"} />
                            <Text style={[styles.documentName, themeStyles.text]}>{document}</Text>
                          </View>
                          <View style={styles.documentActions}>
                            <TouchableOpacity style={styles.documentAction}>
                              <Download size={18} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.documentAction}>
                              <Share2 size={18} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Documents de réponse */}
                  {selectedRequest.details.filesReponse && selectedRequest.details.filesReponse.length > 0 && (
                    <View style={[styles.detailsSection, themeStyles.card]}>
                      <Text style={[styles.detailsSectionTitle, themeStyles.text]}>Documents de réponse</Text>

                      {selectedRequest.details.filesReponse.map((document: string, index: number) => (
                        <View key={index} style={styles.documentItem}>
                          <View style={styles.documentInfo}>
                            <FileText size={20} color={isDarkMode ? "#9370DB" : "#9370DB"} />
                            <Text style={[styles.documentName, themeStyles.text]}>{document}</Text>
                          </View>
                          <View style={styles.documentActions}>
                            <TouchableOpacity style={styles.documentAction}>
                              <Download size={18} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.documentAction}>
                              <Share2 size={18} color={isDarkMode ? "#AAAAAA" : "#757575"} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Historique */}
                  <View style={[styles.detailsSection, themeStyles.card]}>
                    <Text style={[styles.detailsSectionTitle, themeStyles.text]}>Historique</Text>

                    <View style={styles.timelineContainer}>
                      <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: "#9370DB" }]} />
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineTitle, themeStyles.text]}>Demande soumise</Text>
                          <Text style={[styles.timelineDate, themeStyles.subtleText]}>
                            {selectedRequest.date} à {selectedRequest.time}
                          </Text>
                        </View>
                      </View>

                      {selectedRequest.status !== "pending" && (
                        <View style={styles.timelineItem}>
                          <View
                            style={[styles.timelineDot, { backgroundColor: getStatusColor(selectedRequest.status) }]}
                          />
                          <View style={styles.timelineContent}>
                            <Text style={[styles.timelineTitle, themeStyles.text]}>
                              Demande {selectedRequest.status === "approved" ? "approuvée" : "rejetée"}
                            </Text>
                            <Text style={[styles.timelineDate, themeStyles.subtleText]}>
                              {selectedRequest.status === "approved"
                                ? selectedRequest.details.approvalDate || "Un jour après la soumission"
                                : selectedRequest.details.rejectionDate || "Cinq jours après la soumission"}
                            </Text>
                          </View>
                        </View>
                      )}

                      {selectedRequest.status === "pending" && (
                        <View style={styles.timelineItem}>
                          <View style={[styles.timelineDot, { backgroundColor: "#FFC107" }]} />
                          <View style={styles.timelineContent}>
                            <Text style={[styles.timelineTitle, themeStyles.text]}>En attente d'approbation</Text>
                            <Text style={[styles.timelineDate, themeStyles.subtleText]}>En cours de traitement</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.detailsActions}>
                    <TouchableOpacity
                      style={[styles.detailsActionButton, themeStyles.detailsActionButton]}
                      onPress={() => setShowDetailsModal(false)}
                    >
                      <Text style={[styles.detailsActionButtonText, themeStyles.detailsActionButtonText]}>Fermer</Text>
                    </TouchableOpacity>

                    {selectedRequest.status === "pending" && (
                      <>
                        <TouchableOpacity
                          style={[styles.detailsActionButton, themeStyles.detailsActionButton]}
                          onPress={() => {
                            // Gérer l'action de modification
                          }}
                        >
                          <Edit size={18} color={isDarkMode ? "#E0E0E0" : "#333"} />
                          <Text style={[styles.detailsActionButtonText, themeStyles.detailsActionButtonText]}>
                            Modifier
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.detailsCancelButton, themeStyles.detailsCancelButton]}
                          onPress={() => {
                            // Gérer l'action de suppression
                          }}
                        >
                          <Trash size={18} color="#FFFFFF" />
                          <Text style={[styles.detailsCancelButtonText, themeStyles.detailsCancelButtonText]}>
                            Supprimer
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </ScrollView>
              </View>
            </Modal>
          )}
        </>
      )}

      {/* Pied de page */}
      <Footer />
    </SafeAreaView>
  );
};

// Styles
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  filtersScrollView: {
    maxHeight: 60,
    borderBottomWidth: 1,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: "#9370DB",
    borderColor: "#9370DB",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  requestCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  requestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  requestTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  requestTypeTextContainer: {
    flex: 1,
  },
  requestType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  requestStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  requestStatusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  requestDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestDate: {
    fontSize: 12,
  },
  requestStatusBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModal: {
    width: width * 0.8,
    borderRadius: 16,
    padding: 20,
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  activeFilterOption: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  filterOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filterOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  activeFilterOptionText: {
    fontWeight: "600",
  },
  detailsModalContainer: {
    flex: 1,
  },
  detailsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailsModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detailsScrollContainer: {
    flex: 1,
  },
  detailsScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  detailsHeader: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  detailsHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailsTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailsType: {
    fontSize: 18,
    fontWeight: "600",
  },
  detailsStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  detailsStatusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailsDescription: {
    fontSize: 16,
    marginBottom: 12,
  },
  detailsDate: {
    fontSize: 14,
  },
  detailsSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  detailsItem: {
    marginBottom: 12,
  },
  detailsItemLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailsItemValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  documentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  documentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  documentName: {
    fontSize: 16,
  },
  documentActions: {
    flexDirection: "row",
    gap: 12,
  },
  documentAction: {
    padding: 4,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
  },
  detailsActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  detailsActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  detailsActionButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  detailsCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336",
  },
  detailsCancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  activeTypeFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  activeTypeFilterLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  activeTypeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  activeTypeFilterText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  clearTypeFilterButton: {
    padding: 2,
  },
});

// Styles pour le thème clair
const lightStyles: ThemeStyles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
  },
  searchInputContainer: {
    backgroundColor: "#F5F5F5",
    borderColor: "#EEEEEE",
  },
  searchInput: {
    color: "#333333",
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEEEE",
  },
  filtersScrollView: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEEEE",
  },
  filterChipText: {
    color: "#757575",
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
  activeFilterOption: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  detailsActionButton: {
    backgroundColor: "#F5F5F5",
    borderColor: "#DDDDDD",
  },
  detailsActionButtonText: {
    color: "#333333",
  },
  detailsCancelButton: {
    backgroundColor: "#F44336",
  },
  detailsCancelButtonText: {
    color: "#FFFFFF",
  },
});

// Styles pour le thème sombre
const darkStyles: ThemeStyles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
  },
  searchContainer: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
  },
  searchInputContainer: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
  },
  searchInput: {
    color: "#E0E0E0",
  },
  filterButton: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
  },
  filtersScrollView: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
  },
  filterChip: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
  },
  filterChipText: {
    color: "#AAAAAA",
  },
  text: {
    color: "#E0E0E0",
  },
  subtleText: {
    color: "#AAAAAA",
  },
  card: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
    borderWidth: 1,
  },
  activeFilterOption: {
    backgroundColor: "rgba(147, 112, 219, 0.15)",
  },
  detailsActionButton: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
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
});

export default DemandesPage;