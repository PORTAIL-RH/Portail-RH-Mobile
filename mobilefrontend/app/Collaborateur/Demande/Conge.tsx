import { useState, useEffect } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as MediaLibrary from "expo-media-library";
import axios from "axios";
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
  Conge: undefined;
};

// Define the navigation prop type
type CongeNavigationProp = NativeStackNavigationProp<RootStackParamList, "Conge">;

const CongePage = () => {
  const navigation = useNavigation<CongeNavigationProp>();
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
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [periodeDebut, setPeriodeDebut] = useState<"M" | "S">("M"); // 'M' for Matin, 'S' for Soir
  const [periodeFin, setPeriodeFin] = useState<"M" | "S">("S"); // 'M' for Matin, 'S' for Soir
  const [texteDemande, setTexteDemande] = useState("");
  const [nbrJours, setNbrJours] = useState("1");
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [codeSoc, setCodeSoc] = useState<string | null>(null);

  // Date picker visibility
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [activePickerType, setActivePickerType] = useState<"debut" | "fin">("debut");

  // Load theme preference and codeSoc on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference();
      await loadCodeSoc();
      await requestMediaLibraryPermissions();
    };
    loadData();
  }, []);

  // Request media library permissions
  const requestMediaLibraryPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        showToast("error", "Vous devez autoriser l'accès aux fichiers pour joindre des documents.");
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  // Calculate number of days between start and end dates
  useEffect(() => {
    const calculateDays = () => {
      const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      const diffTime = dateFin.getTime() - dateDebut.getTime();
      const diffDays = Math.round(diffTime / oneDay) + 1; // Include both start and end days

      // Adjust for half days
      let adjustedDays = diffDays;
      if (periodeDebut === "S") adjustedDays -= 0.5;
      if (periodeFin === "M") adjustedDays -= 0.5;

      setNbrJours(adjustedDays > 0 ? adjustedDays.toString() : "0");
    };

    calculateDays();
  }, [dateDebut, dateFin, periodeDebut, periodeFin]);

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

  // Load codeSoc from AsyncStorage
  const loadCodeSoc = async () => {
    try {
      const userCodeSoc = await AsyncStorage.getItem("userCodeSoc");
      if (userCodeSoc) {
        setCodeSoc(userCodeSoc);
      }
    } catch (error) {
      console.error("Error loading codeSoc:", error);
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

  // Handle file upload
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      });

      if (result.canceled) {
        console.log("File selection cancelled by the user.");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setFile(selectedFile);
        console.log("File selected:", selectedFile.name);
        showToast("success", `Fichier "${selectedFile.name}" sélectionné`);
      } else {
        console.log("No file selected.");
      }
    } catch (err) {
      console.error("Error picking file:", err);
      showToast("error", "Une erreur est survenue lors de la sélection du fichier.");
    }
  };

  // Date picker handlers
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      if (activePickerType === "debut") {
        setDateDebut(selectedDate);
        // If start date is after end date, update end date
        if (selectedDate > dateFin) {
          const newEndDate = new Date(selectedDate);
          newEndDate.setDate(selectedDate.getDate() + 1);
          setDateFin(newEndDate);
        }
      } else {
        setDateFin(selectedDate);
        // If end date is before start date, update start date
        if (selectedDate < dateDebut) {
          const newStartDate = new Date(selectedDate);
          newStartDate.setDate(selectedDate.getDate() - 1);
          setDateDebut(newStartDate);
        }
      }
    }

    if (Platform.OS === "android") {
      setShowPickerModal(false);
    }
  };

  // Show date picker
  const showDatePicker = (type: "debut" | "fin") => {
    setActivePickerType(type);
    setShowPickerModal(true);
  };

  // Validate form
  const validateForm = () => {
    if (!texteDemande.trim()) {
      showToast("error", "Veuillez entrer une description pour votre demande.");
      return false;
    }

    if (Number.parseFloat(nbrJours) <= 0) {
      showToast("error", "La durée du congé doit être d'au moins une demi-journée.");
      return false;
    }

    if (!codeSoc) {
      showToast("error", "Code société non trouvé. Veuillez vous reconnecter.");
      return false;
    }

    // Check if end date is before start date
    if (dateFin < dateDebut) {
      showToast("error", "La date de fin doit être après la date de début.");
      return false;
    }

    return true;
  };


  // Reset form to initial state
  const resetForm = () => {
    setTexteDemande("");
    setFile(null);
    setDateDebut(new Date());
    setDateFin(new Date(new Date().setDate(new Date().getDate() + 1)));
    setPeriodeDebut("M");
    setPeriodeFin("S");
    setNbrJours("1");
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
      const matPersId = userInfo.id;

      if (!matPersId) {
        showToast("error", "Matricule utilisateur non trouvé. Veuillez vous reconnecter.");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("dateDebut", dateDebut.toISOString().split("T")[0]);
      formData.append("dateFin", dateFin.toISOString().split("T")[0]);
      formData.append("texteDemande", texteDemande);
      formData.append("snjTempDep", periodeDebut);
      formData.append("snjTempRetour", periodeFin);
      formData.append("dateReprisePrev", dateFin.toISOString().split("T")[0]);
      formData.append("codeSoc", codeSoc as string);
      formData.append("matPersId", matPersId);
      formData.append("nbrJours", nbrJours);

      // Append the file only if it exists (optional)
      if (file) {
        const fileUri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
        formData.append("file", {
          uri: fileUri,
          type: file.mimeType || "application/octet-stream",
          name: file.name,
        } as any);
      }

      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        showToast("error", "Vous devez être connecté pour soumettre une demande.");
        setSubmitting(false);
        return;
      }

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-conge/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      showToast("success", "Demande de congé soumise avec succès!", true);

      if (response.status === 200) {
        showToast("success", "Demande de congé soumise avec succès!", true);
        resetForm(); // Reset the form after successful submission
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (axios.isAxiosError(error)) {
        console.error("Server Response:", error.response?.data);
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
    <SidebarLayout title="Demande de congé">
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Header */}
        <View style={[styles.formHeader, themeStyles.card]}>
          <View style={styles.formHeaderIcon}>
            <Calendar size={24} color={isDarkMode ? "#CCCCCC" : "#0e135f"} />
          </View>
          <View style={styles.formHeaderContent}>
            <Text style={[styles.formHeaderTitle, themeStyles.text]}>Nouvelle demande de congé</Text>
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
            <TouchableOpacity
              style={[styles.inputContainer, themeStyles.inputContainer]}
              onPress={() => showDatePicker("debut")}
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

          {/* Période de début */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Période de début <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.periodContainer}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  themeStyles.periodButton,
                  periodeDebut === "M" && styles.activePeriodButton,
                  periodeDebut === "M" && themeStyles.activePeriodButton,
                ]}
                onPress={() => setPeriodeDebut("M")}
              >
                <Clock size={18} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.periodIcon} />
                <Text
                  style={[
                    styles.periodText,
                    themeStyles.text,
                    periodeDebut === "M" && styles.activePeriodText,
                    periodeDebut === "M" && themeStyles.activePeriodText,
                  ]}
                >
                  Matin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  themeStyles.periodButton,
                  periodeDebut === "S" && styles.activePeriodButton,
                  periodeDebut === "S" && themeStyles.activePeriodButton,
                ]}
                onPress={() => setPeriodeDebut("S")}
              >
                <Clock size={18} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.periodIcon} />
                <Text
                  style={[
                    styles.periodText,
                    themeStyles.text,
                    periodeDebut === "S" && styles.activePeriodText,
                    periodeDebut === "S" && themeStyles.activePeriodText,
                  ]}
                >
                  Après-midi
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date de fin */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Date de fin <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.inputContainer, themeStyles.inputContainer]}
              onPress={() => showDatePicker("fin")}
            >
              <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.text]}>
                {dateFin.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Période de fin */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Période de fin <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.periodContainer}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  themeStyles.periodButton,
                  periodeFin === "M" && styles.activePeriodButton,
                  periodeFin === "M" && themeStyles.activePeriodButton,
                ]}
                onPress={() => setPeriodeFin("M")}
              >
                <Clock size={18} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.periodIcon} />
                <Text
                  style={[
                    styles.periodText,
                    themeStyles.text,
                    periodeFin === "M" && styles.activePeriodText,
                    periodeFin === "M" && themeStyles.activePeriodText,
                  ]}
                >
                  Matin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  themeStyles.periodButton,
                  periodeFin === "S" && styles.activePeriodButton,
                  periodeFin === "S" && themeStyles.activePeriodButton,
                ]}
                onPress={() => setPeriodeFin("S")}
              >
                <Clock size={18} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.periodIcon} />
                <Text
                  style={[
                    styles.periodText,
                    themeStyles.text,
                    periodeFin === "S" && styles.activePeriodText,
                    periodeFin === "S" && themeStyles.activePeriodText,
                  ]}
                >
                  Après-midi
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nombre de jours */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>Nombre de jours</Text>
            <View style={[styles.inputContainer, themeStyles.inputContainer]}>
              <Calendar size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
              <Text style={[styles.inputText, themeStyles.text]}>{nbrJours} jour(s)</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Motif de la demande <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.textAreaContainer, themeStyles.inputContainer]}>
              <FileText size={20} color={isDarkMode ? "#CCCCCC" : "#0e135f"} style={styles.inputIcon} />
              <TextInput
                style={[styles.textArea, themeStyles.text]}
                multiline
                numberOfLines={4}
                placeholder="Décrivez le motif de votre demande de congé..."
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                value={texteDemande}
                onChangeText={setTexteDemande}
              />
            </View>
          </View>

          {/* Pièce jointe */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, themeStyles.text]}>
              Pièce jointe <Text style={styles.required}>*</Text>
            </Text>
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
          visible={showPickerModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPickerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModalContainer, themeStyles.card]}>
              <View style={styles.pickerModalHeader}>
                <Text style={[styles.pickerModalTitle, themeStyles.text]}>
                  {activePickerType === "debut" ? "Date de début" : "Date de fin"}
                </Text>
                <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                  <XCircle size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={activePickerType === "debut" ? dateDebut : dateFin}
                mode="date"
                display="spinner"
                onChange={onChangeDate}
                themeVariant={isDarkMode ? "dark" : "light"}
                minimumDate={activePickerType === "fin" ? dateDebut : undefined}
              />
              
              <TouchableOpacity
                style={styles.pickerDoneButton}
                onPress={() => setShowPickerModal(false)}
              >
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
  );
};

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
  periodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  periodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  periodIcon: {
    marginRight: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activePeriodButton: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
    borderColor: "#0e135f",
  },
  activePeriodText: {
    color: "#0e135f",
    fontWeight: "600",
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
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
  },
  text: {
    color: "#3a4a7a",
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
  periodButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEEEE",
  },
  activePeriodButton: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
    borderColor: "#0e135f",
  },
  activePeriodText: {
    color: "#0e135f",
  },
  noteContainer: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
  },
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1f38",
  },
  header: {
    backgroundColor: "#1F2846",
    borderBottomColor: "#3a4a7a",
  },
  text: {
    color: "#E0E0E0",
  },
  subtleText: {
    color: "#AAAAAA",
  },
  card: {
    backgroundColor: "#1F2846",
    borderColor: "#3a4a7a",
    borderWidth: 1,
    shadowColor: "transparent",
  },
  inputContainer: {
    backgroundColor: "#1F2846",
    borderColor: "#3a4a7a",
  },
  periodButton: {
    backgroundColor: "#1F2846",
    borderColor: "#3a4a7a",
  },
  activePeriodButton: {
    backgroundColor: "rgba(112, 132, 219, 0.15)",
    borderColor: "rgba(0, 132, 255, 0.15)",
  },
  activePeriodText: {
    color: "#FFF",
  },
  noteContainer: {
    backgroundColor: "rgba(255, 193, 7, 0.05)",
  },
})

export default CongePage
