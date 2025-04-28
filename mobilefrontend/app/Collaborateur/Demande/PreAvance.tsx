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
  Keyboard,
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
  DollarSign,
  ChevronDown,
  Search,
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
  PretAvance: undefined;
};

type PretAvanceNavigationProp = NativeStackNavigationProp<RootStackParamList, "PretAvance">;

type DocumentPickerAsset = {
  uri: string;
  name: string;
  mimeType?: string;
};

const PretAvancePage = () => {
  const navigation = useNavigation<PretAvanceNavigationProp>();
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [typeAvance, setTypeAvance] = useState("");
  const [montant, setMontant] = useState("");
  const [montantMax, setMontantMax] = useState("");
  const [matPersId, setMatPersId] = useState("");
  const [typesAvance, setTypesAvance] = useState<[string, unknown][]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTypes, setFilteredTypes] = useState<[string, unknown][]>([]);
  const [file, setFile] = useState<DocumentPickerAsset | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);


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

  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference();
      await fetchUserInfo();
      await fetchTypesAvance();
    };
    loadData();
  }, []);

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

  const fetchUserInfo = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem("userInfo");
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        setMatPersId(userInfo.id || "");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchTypesAvance = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        showToast("error", "Vous devez être connecté pour accéder à cette fonctionnalité.");
        return;
      }

      const response = await axios.get(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-pre-avance/types`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const types = Object.entries(response.data);
      setTypesAvance(types);
      setFilteredTypes(types);
    } catch (error) {
      console.error("Error fetching types of advances:", error);
      showToast("error", "Erreur lors de la récupération des types d'avance. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    try {
      await AsyncStorage.setItem("theme", newTheme);
      await AsyncStorage.setItem("@theme_mode", newTheme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  const openModal = () => {
    setSearchQuery("");
    setFilteredTypes(typesAvance);
    setModalVisible(true);
  };

  const filterTypes = (query: string) => {
    setSearchQuery(query);
    setFilteredTypes(
      query.trim() === "" 
        ? typesAvance 
        : typesAvance.filter(([type]) => type.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const handleSelectType = (type: string, max: unknown) => {
    setTypeAvance(type);
    setMontantMax(String(max));
    setModalVisible(false);
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setFile(selectedFile);
        showToast("success", `Fichier "${selectedFile.name}" sélectionné`);
      }
    } catch (err) {
      console.error("Error picking file:", err);
      showToast("error", "Une erreur est survenue lors de la sélection du fichier.");
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const validateForm = () => {
    if (!typeAvance.trim()) {
      showToast("error", "Veuillez sélectionner un type d'avance.");
      return false;
    }

    if (!montant.trim() || isNaN(Number(montant))) {
      showToast("error", "Veuillez entrer un montant valide.");
      return false;
    }

    if (Number(montant) <= 0) {
      showToast("error", "Le montant doit être supérieur à 0.");
      return false;
    }

    if (Number(montant) > Number(montantMax)) {
      showToast("error", `Le montant ne doit pas dépasser ${montantMax} € pour ce type d'avance.`);
      return false;
    }

    if (!matPersId) {
      showToast("error", "Informations utilisateur non trouvées. Veuillez vous reconnecter.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    Keyboard.dismiss();

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        showToast("error", "Vous devez être connecté pour soumettre une demande.");
        setSubmitting(false);
        return;
      }

      const userInfoString = await AsyncStorage.getItem("userInfo");
      if (!userInfoString) {
        showToast("error", "Informations utilisateur non trouvées. Veuillez vous reconnecter.");
        setSubmitting(false);
        return;
      }
      
      const userInfo = JSON.parse(userInfoString);
      const codeSoc = userInfo.code_soc;

      const formData = new FormData();
      formData.append("type", typeAvance);
      formData.append("montant", montant);
      formData.append("texteDemande", "Demande de prêt/avance");
      formData.append("matPersId", matPersId);
      formData.append("codeSoc", codeSoc);

      if (file) {
        const fileUri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
        formData.append("file", {
          uri: fileUri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        } as any);
      }

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-pre-avance/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showToast('success', 'Demande soumise avec succès !', true);

      if (response.status === 200) {
        showToast('success', 'Demande soumise avec succès !', true);

        // Réinitialisation du formulaire
        setTypeAvance('');
        setMontant('');
        setMontantMax('');
        setFile(null);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      showToast('error', 
        axios.isAxiosError(error) 
          ? error.response?.data?.message || 'Erreur lors de la soumission'
          : 'Une erreur est survenue'
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SidebarLayout title="Demande de prêt/avance">
      <View style={{ flex: 1 }}>
        
      <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Form Header */}
        <View style={[styles.formHeader, themeStyles.card]}>
          <View style={styles.formHeaderIcon}>
            <DollarSign size={24} color={isDarkMode ? "#CCCCCC" : "#0e135f"} />
          </View>
          <View style={styles.formHeaderContent}>
            <Text style={[styles.formHeaderTitle, themeStyles.text]}>Nouvelle demande de prêt/avance</Text>
            <Text style={[styles.formHeaderSubtitle, themeStyles.subtleText]}>
              Remplissez le formulaire ci-dessous pour soumettre votre demande
            </Text>
            <Text style={styles.required}>
              "Pour un autre montant, veuillez contacter l'administrateur."
            </Text>

          </View>
        </View>

        {/* Form */}
        <View style={[styles.formContainer, themeStyles.card]}>
          {/* Type d'avance */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Type d'avance <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.inputContainer, themeStyles.inputContainer]}
              onPress={openModal}
              disabled={loading}
            >
              <FileText size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.text]}>
                {typeAvance ? typeAvance : "Sélectionner un type d'avance"}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#0e135f" style={styles.dropdownIcon} />
              ) : (
                <ChevronDown size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} style={styles.dropdownIcon} />
              )}
            </TouchableOpacity>
          </View>

          {/* Montant */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Montant <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, themeStyles.inputContainer]}>
              <DollarSign size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputText, themeStyles.text]}
                placeholder="Entrez le montant"
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                value={montant}
                onChangeText={setMontant}
                keyboardType="numeric"
              />
            </View>
            {montantMax && (
              <Text style={[styles.montantMaxText, themeStyles.subtleText]}>Montant maximum: {montantMax} €</Text>
            )}
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
      </ScrollView>

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
              <Text style={[styles.modalTitle, themeStyles.text]}>Sélectionner un type d'avance</Text>
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
                onChangeText={filterTypes}
              />
            </View>

            {loading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#0e135f" />
              </View>
            ) : filteredTypes.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Text style={[styles.modalEmptyText, themeStyles.subtleText]}>Aucun résultat trouvé</Text>
              </View>
            ) : (
              <FlatList
                data={filteredTypes}
                keyExtractor={(item) => item[0]}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, themeStyles.modalItem]}
                    onPress={() => handleSelectType(item[0], item[1])}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={[styles.modalItemText, themeStyles.text]}>{item[0]}</Text>
                      <Text style={[styles.modalItemSubtext, themeStyles.subtleText]}>Max: {String(item[1])} €</Text>
                    </View>
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

      {/* Footer */}
      <Footer />

      {/* Custom Toast Component */}
      <Toast />

      </View>
    </SidebarLayout>
  );
};
// Styles
const styles = StyleSheet.create({
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
  montantMaxText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  removeFile: {
    marginLeft: 8,
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
  testButton: {
    backgroundColor: "#0e135f",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  testButtonText: {
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalItemContent: {
    flexDirection: "column",
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 14,
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
 
});

// Theme-specific styles
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
});

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
  disabledText: {
    color: "#666666",
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
});

export default PretAvancePage;