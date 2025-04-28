import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ChevronDown,
  Paperclip,
} from "lucide-react-native";
import Footer from "../../Components/Footer";
import { API_CONFIG } from "../../config/apiConfig";
import SidebarLayout from "./SidebarLayout";
import Toast from 'react-native-toast-message';

// Define the navigation stack types
export type RootStackParamList = {
  AccueilCollaborateur: undefined;
  Profile: undefined;
  Demandestot: undefined;
  Authentification: undefined;
  Notifications: undefined;
  Autorisation: undefined;
  AjouterDemande: undefined;
  Document: undefined;
};

// Define the navigation prop type
type DocumentNavigationProp = NativeStackNavigationProp<RootStackParamList, "Document">;

// Define the type for the file state
type DocumentPickerAsset = {
  uri: string;
  name: string;
  mimeType?: string;
};

const DocumentPage = () => {
  const navigation = useNavigation<DocumentNavigationProp>();
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // Form state
  const [objet, setObjet] = useState("");
  const [codeSoc, setCodeSoc] = useState("");
  const [matPersId, setMatPersId] = useState("");
  const [documentTypes, setDocumentTypes] = useState([
    { id: 1, name: "Attestation de travail", selected: true },
    { id: 2, name: "Attestation de salaire", selected: false },
    { id: 3, name: "Attestation de congé", selected: false },
    { id: 4, name: "Autre document", selected: false },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDocumentTypes, setFilteredDocumentTypes] = useState(documentTypes);
  const [file, setFile] = useState<DocumentPickerAsset | null>(null);

  // Modal state
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Load user info on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference();
      await fetchUserInfo();
    };
    loadData();
  }, []);

  // Load theme preference from AsyncStorage
  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("@theme_mode");
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    }
  };

  // Fetch user info from AsyncStorage
  const fetchUserInfo = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem("userInfo");
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        setCodeSoc(userInfo.codeSoc || "");
        setMatPersId(userInfo.id || "");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // Toggle theme between light and dark mode
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    try {
      // Update both keys for backward compatibility
      await AsyncStorage.setItem("theme", newTheme)
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  // Apply theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  // Open document type selection modal
  const openDocumentTypeModal = () => {
    setSearchQuery("");
    setFilteredDocumentTypes(documentTypes);
    setShowTypeModal(true);
  };

  // Filter document types in modal
  const filterDocumentTypes = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredDocumentTypes(documentTypes);
    } else {
      const filtered = documentTypes.filter((type) => type.name.toLowerCase().includes(query.toLowerCase()));
      setFilteredDocumentTypes(filtered);
    }
  };

  // Select document type
  const selectDocumentType = (id: number) => {
    setDocumentTypes(
      documentTypes.map((type) => ({
        ...type,
        selected: type.id === id,
      })),
    );
    setShowTypeModal(false);
  };

  // Get selected document type
  const getSelectedDocumentType = () => {
    const selected = documentTypes.find((type) => type.selected);
    return selected ? selected.name : "";
  };

  // Handle file upload
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setFile(selectedFile);
        showToast("success", `Fichier "${selectedFile.name}" sélectionné`);
      } else {
        console.log("File selection cancelled by the user.");
      }
    } catch (err) {
      console.error("Error picking file:", err);
      showToast("error", "Une erreur est survenue lors de la sélection du fichier.");
    }
  };

  // Remove file
  const removeFile = () => {
    setFile(null);
  };

  // Validate form
  const validateForm = () => {
    if (!objet.trim()) {
      showToast("error", "Veuillez préciser l'objet de votre demande.");
      return false;
    }

    if (!matPersId.trim()) {
      showToast("error", "Informations utilisateur non trouvées. Veuillez vous reconnecter.");
      return false;
    }

    return true;
  };


  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
  
    setSubmitting(true);
  
    try {
      const userInfoString = await AsyncStorage.getItem("userInfo");
      if (!userInfoString) {
        showToast("error", "Informations utilisateur non trouvées. Veuillez vous reconnecter.");
        setSubmitting(false);
        return;
      }
  
      const userInfo = JSON.parse(userInfoString);
      const formData = new FormData();
      formData.append("typeDemande", "Document");
      formData.append("codeSoc", userInfo.codeSoc);
      formData.append("texteDemande", objet);
      formData.append("matPersId", userInfo.id);
      formData.append("typeDocument", getSelectedDocumentType());
  
      if (file) {
        const fileUri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
        formData.append("file", {
          uri: fileUri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        } as any);
      }
  
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        showToast("error", "Vous devez être connecté pour soumettre une demande.");
        setSubmitting(false);
        return;
      }
  
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-document/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      
      showToast("success", "Demande de document soumise avec succès!", true);

      if (response.status === 200) {
        showToast("success", "Demande de document soumise avec succès!", true);
  
        // Reset form
        setObjet("");
        setFile(null);
        setDocumentTypes(
          documentTypes.map((type, index) => ({
            ...type,
            selected: index === 0,
          })),
        );
  
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.navigate("AccueilCollaborateur");
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (axios.isAxiosError(error)) {
        showToast("error", error.response?.data?.message || "Une erreur est survenue lors de l'envoi de la demande.");
      } else if (error instanceof Error) {
        showToast("error", error.message);
      } else {
        showToast("error", "Une erreur inconnue est survenue.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  

  return (
    <SidebarLayout title="Demande de document">
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Header */}
        <View style={[styles.formHeader, themeStyles.card]}>
          <View style={styles.formHeaderIcon}>
            <FileText size={24} color={isDarkMode ? "#CCCCCC" : "#0e135f"} />
          </View>
          <View style={styles.formHeaderContent}>
            <Text style={[styles.formHeaderTitle, themeStyles.text]}>Nouvelle demande de document</Text>
            <Text style={[styles.formHeaderSubtitle, themeStyles.subtleText]}>
              Remplissez le formulaire ci-dessous pour demander un document
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={[styles.formContainer, themeStyles.card]}>
          {/* Document Type */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Type de document <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.inputContainer, themeStyles.inputContainer]}
              onPress={openDocumentTypeModal}
            >
              <FileText size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.text]}>
                {getSelectedDocumentType()}
              </Text>
              <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} style={styles.dropdownIcon} />
            </TouchableOpacity>
          </View>

          {/* Objet */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Objet de la demande <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.textAreaContainer, themeStyles.inputContainer]}>
              <FileText size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
              <TextInput
                style={[styles.textArea, themeStyles.text]}
                multiline
                numberOfLines={4}
                placeholder="Précisez l'objet de votre demande de document..."
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                value={objet}
                onChangeText={setObjet}
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
                <FileText size={16} color={isDarkMode ? "#0e135f" : "#0e135f"} />
                <Text style={[styles.fileName, themeStyles.subtleText]} numberOfLines={1} ellipsizeMode="middle">
                  {file.name}
                </Text>
                <TouchableOpacity style={styles.removeFile} onPress={removeFile}>
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

        {/* Document Type Selection Modal */}
        <Modal
          visible={showTypeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, themeStyles.card]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, themeStyles.text]}>
                  Sélectionner un type de document
                </Text>
                <TouchableOpacity onPress={() => setShowTypeModal(false)}>
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
                  onChangeText={filterDocumentTypes}
                />
              </View>

              {filteredDocumentTypes.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Text style={[styles.modalEmptyText, themeStyles.subtleText]}>Aucun résultat trouvé</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredDocumentTypes}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, themeStyles.modalItem]}
                      onPress={() => selectDocumentType(item.id)}
                    >
                      <View style={styles.modalItemContent}>
                        <Text style={[styles.modalItemText, themeStyles.text]}>{item.name}</Text>
                      </View>
                      {item.selected && (
                        <CheckCircle size={20} color="#0e135f" />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.modalList}
                />
              )}

              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTypeModal(false)}>
                <Text style={styles.modalCloseButtonText}>Fermer</Text>
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
 
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgb(18, 16, 36)",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
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
    backgroundColor: "#1a1f38",
  },
  header: {
    backgroundColor: "#8989A733",
    borderBottomColor: "#2D2F3DFA",
  },
  text: {
    color: "#E0E0E0",
  },
  subtleText: {
    color: "#AAAAAA",
  },
  card: {
    backgroundColor: "#8989A733",
    borderColor: "#2D2F3DFA",
    borderWidth: 1,
    shadowColor: "transparent",
  },
  inputContainer: {
    backgroundColor: "#8989A733",
    borderColor: "#2D2F3DFA",
  },
  noteContainer: {
    backgroundColor: "rgba(255, 193, 7, 0.05)",
  },
  modalItem: {
    borderBottomColor: "#2D2F3DFA",
  },
})

export default DocumentPage
