import type React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ViewStyle,
  TextStyle,
} from "react-native"
import { useNavigation, type NavigationProp } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  User,
  FileText,
  Clock,
  ArrowLeft,
  Moon,
  Sun,
  Shield,
  Building,
  IdCard,
  Heart,
  Users,
  Lock,
  X,
} from "lucide-react-native"
import Navbar from "../Components/NavBar"
import Footer from "../Components/Footer"
import { API_CONFIG } from "../config/apiConfig"
import Toast from "react-native-toast-message"

type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Calendar: undefined
  Notifications: undefined
  EditProfile: undefined
  Demandestot: undefined
  Documents: undefined
}

const { width } = Dimensions.get("window")

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
}

interface ActionButtonProps {
  icon: React.ReactNode
  title: string
  onPress: () => void
}

interface UserProfileData {
  profileImage: string | null
  nom: string | null
  prenom: string | null
  role: string | null
  email: string | null
  phone: string | null
  address: string | null
  serviceName: string | null
  joinDate: string | null
  position: string | null
  education: string | null
  skills: string | null
  matricule: string | null
  chefHierarchique: string
  sexe: string | null
  code_soc: string | null
  cin: string | null
  nbr_enfants: string | null
  situation: string | null
  date_naiss: string | null
  active: boolean
}

interface ChangePasswordModalProps {
  visible: boolean
  onClose: () => void
  isDarkMode: boolean
  themeStyles: any
}

type StylesType = {
  container: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  backButton: ViewStyle;
  headerTitle: TextStyle;
  headerRight: ViewStyle;
  iconButton: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  profileHeader: ViewStyle;
  profileImageContainer: ViewStyle;
  profileImage: ViewStyle;
  editButton: ViewStyle;
  profileName: TextStyle;
  profileRole: TextStyle;
  badgeContainer: ViewStyle;
  badge: ViewStyle;
  badgeText: TextStyle;
  tabsContainer: ViewStyle;
  tab: ViewStyle;
  activeTab: ViewStyle;
  tabText: TextStyle;
  activeTabText: TextStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  infoGrid: ViewStyle;
  infoItem: ViewStyle;
  infoIconContainer: ViewStyle;
  infoContent: ViewStyle;
  infoLabel: TextStyle;
  infoValue: TextStyle;
  skillsTitle: TextStyle;
  skillsContainer: ViewStyle;
  skillBadge: ViewStyle;
  skillText: TextStyle;
  actionsList: ViewStyle;
  actionButton: ViewStyle;
  actionButtonContent: ViewStyle;
  actionButtonText: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  modalBody: ViewStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  input: ViewStyle & TextStyle;
  changePasswordButton: ViewStyle;
  changePasswordButtonText: TextStyle;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ visible, onClose, isDarkMode, themeStyles }) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

const handleChangePassword = async () => {
  try {
    setLoading(true)

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Tous les champs sont requis",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Les nouveaux mots de passe ne correspondent pas",
      })
      return
    }

    // Get user ID and token
    const userInfo = await AsyncStorage.getItem("userInfo")
    const token = await AsyncStorage.getItem("userToken")
    
    if (!userInfo || !token) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Session expirée, veuillez vous reconnecter",
      })
      return
    }

    const { id: userId } = JSON.parse(userInfo)

    const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/change-password/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      }),
    })

    // Handle both JSON and text responses
    let responseData
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json()
    } else {
      responseData = { message: await response.text() }
    }

    if (!response.ok) {
      // Extract error message from different response formats
      const errorMessage = responseData.error || 
                         responseData.message || 
                         (typeof responseData === 'string' ? responseData : "Échec de la modification du mot de passe")
      throw new Error(errorMessage)
    }

    Toast.show({
      type: "success",
      text1: "Succès",
      text2: responseData.message || "Mot de passe modifié avec succès",
    })

    // Reset form and close modal
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    onClose()

  } catch (error) {
    console.error("Password change error:", error)
    Toast.show({
      type: "error",
      text1: "Erreur",
      text2: error instanceof Error ? error.message : "Une erreur inconnue est survenue",
    })
  } finally {
    setLoading(false)
  }
}

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, themeStyles.card]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Changer le mot de passe</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, themeStyles.subtleText]}>Mot de passe actuel</Text>
              <TextInput
                style={[styles.input, themeStyles.input]}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Entrez votre mot de passe actuel"
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, themeStyles.subtleText]}>Nouveau mot de passe</Text>
              <TextInput
                style={[styles.input, themeStyles.input]}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Entrez votre nouveau mot de passe"
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, themeStyles.subtleText]}>Confirmer le nouveau mot de passe</Text>
              <TextInput
                style={[styles.input, themeStyles.input]}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmez votre nouveau mot de passe"
                placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
              />
            </View>

            <TouchableOpacity
              style={[styles.changePasswordButton, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.changePasswordButtonText}>Changer le mot de passe</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const ProfilePage = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const colorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark")
  const [activeTab, setActiveTab] = useState("personal")
  const [refreshing, setRefreshing] = useState(false)
  const [userInfo, setUserInfo] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem("userInfo")
        if (userInfoStr) {
          const parsedInfo = JSON.parse(userInfoStr)
          
          const userData: UserProfileData = {
            profileImage: null,
            nom: parsedInfo.nom || null,
            prenom: parsedInfo.prenom || null,
            role: parsedInfo.role || "Collaborateur",
            email: parsedInfo.email || null,
            phone: parsedInfo.telephone || null,
            address: null,
            serviceName: parsedInfo.serviceName || null,
            joinDate: parsedInfo.date_embauche || null,
            position: null,
            education: null,
            skills: null,
            matricule: parsedInfo.matricule || null,
            chefHierarchique: "N/A",
            sexe: parsedInfo.sexe || null,
            code_soc: parsedInfo.code_soc || null,
            cin: parsedInfo.cin || null,
            nbr_enfants: parsedInfo.nbr_enfants?.toString() || null,
            situation: parsedInfo.situation || null,
            date_naiss: parsedInfo.date_naiss || null,
            active: parsedInfo.active || true,
          }
          
          setUserInfo(userData)
        }
      } catch (err) {
        setError("Failed to load user data")
        console.error("Error loading user data:", err)
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const userInfoStr = await AsyncStorage.getItem("userInfo")
      if (userInfoStr) {
        const parsedInfo = JSON.parse(userInfoStr)
        
        const userData: UserProfileData = {
          profileImage: null,
          nom: parsedInfo.nom || null,
          prenom: parsedInfo.prenom || null,
          role: parsedInfo.role || "Collaborateur",
          email: parsedInfo.email || null,
          phone: parsedInfo.telephone || null,
          address: null,
          serviceName: parsedInfo.serviceName || null,
          joinDate: parsedInfo.date_embauche || null,
          position: null,
          education: null,
          skills: null,
          matricule: parsedInfo.matricule || null,
          chefHierarchique: "N/A",
          sexe: parsedInfo.sexe || null,
          code_soc: parsedInfo.code_soc || null,
          cin: parsedInfo.cin || null,
          nbr_enfants: parsedInfo.nbr_enfants?.toString() || null,
          situation: parsedInfo.situation || null,
          date_naiss: parsedInfo.date_naiss || null,
          active: parsedInfo.active || true,
        }
        
        setUserInfo(userData)
      }
    } catch (err) {
      setError("Failed to refresh user data")
      console.error("Error refreshing user data:", err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Load theme preference from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("theme")
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === "dark")
        }
        setLoading(false)
      } catch (error) {
        console.error("Error loading theme preference:", error)
        setLoading(false)
      }
    }

    loadThemePreference()
  }, [])

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme)
      await AsyncStorage.setItem("theme", newTheme)
      
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  const themeStyles = isDarkMode ? darkStyles : lightStyles
  

  const InfoItem = ({ icon, label, value }: InfoItemProps) => (
    <View style={[styles.infoItem, themeStyles.infoItem]}>
      <View style={[styles.infoIconContainer, themeStyles.infoIconContainer]}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, themeStyles.subtleText]}>{label}</Text>
        <Text style={[styles.infoValue, themeStyles.text]}>
          {value !== null && value !== undefined ? value : "Non renseigné"}
        </Text>
      </View>
    </View>
  )

  const ActionButton = ({ icon, title, onPress }: ActionButtonProps) => (
    <TouchableOpacity style={[styles.actionButton, themeStyles.actionButton]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionButtonContent}>
        {icon}
        <Text style={[styles.actionButtonText, themeStyles.text]}>{title}</Text>
      </View>
      <ChevronRight size={20} color={isDarkMode ? "#AAAAAA" : "#757575"} />
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.container]}>
        <View style={[styles.header, themeStyles.header]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
              <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, themeStyles.text]}>Profil</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
              {isDarkMode ? <Sun size={22} color="#E0E0E0" /> : <Moon size={22} color="#333" />}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0e135f" />
          <Text style={[styles.loadingText, themeStyles.text]}>Chargement du profil...</Text>
        </View>
        <Footer />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, themeStyles.container]}>
        <View style={[styles.header, themeStyles.header]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("AccueilCollaborateur")}>
              <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, themeStyles.text]}>Profil</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
              {isDarkMode ? <Sun size={22} color="#E0E0E0" /> : <Moon size={22} color="#333" />}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, themeStyles.text, { color: 'red' }]}>{error}</Text>
        </View>
        <Footer />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} handleLogout={() => {}} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.profileHeader, themeStyles.card]}>
          <Text style={[styles.profileName, themeStyles.text]}>
            {userInfo?.nom} {userInfo?.prenom}
          </Text>
          <Text style={[styles.profileRole, themeStyles.subtleText]}>{userInfo?.role}</Text>

          <View style={styles.badgeContainer}>
            <View style={[styles.badge, themeStyles.badge]}>
              <Text style={[styles.badgeText, themeStyles.badgeText]}>{userInfo?.active ? "Actif" : "Inactif"}</Text>
            </View>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "personal" && styles.activeTab,
                activeTab === "personal" && themeStyles.activeTab,
              ]}
              onPress={() => setActiveTab("personal")}
            >
              <Text
                style={[
                  styles.tabText,
                  themeStyles.subtleText,
                  activeTab === "personal" && styles.activeTabText,
                  activeTab === "personal" && themeStyles.activeTabText,
                ]}
              >
                Personnel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "professional" && styles.activeTab,
                activeTab === "professional" && themeStyles.activeTab,
              ]}
              onPress={() => setActiveTab("professional")}
            >
              <Text
                style={[
                  styles.tabText,
                  themeStyles.subtleText,
                  activeTab === "professional" && styles.activeTabText,
                  activeTab === "professional" && themeStyles.activeTabText,
                ]}
              >
                Professionnel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "actions" && styles.activeTab,
                activeTab === "actions" && themeStyles.activeTab,
              ]}
              onPress={() => setActiveTab("actions")}
            >
              <Text
                style={[
                  styles.tabText,
                  themeStyles.subtleText,
                  activeTab === "actions" && styles.activeTabText,
                  activeTab === "actions" && themeStyles.activeTabText,
                ]}
              >
                Actions
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === "personal" && (
          <View style={[styles.section, themeStyles.card]}>
            <Text style={[styles.sectionTitle, themeStyles.text]}>Informations personnelles</Text>

            <View style={styles.infoGrid}>
              <InfoItem
                icon={<Mail size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                label="Email"
                value={userInfo?.email}
              />

              <InfoItem
                icon={<Phone size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                label="Téléphone"
                value={userInfo?.phone}
              />

              <InfoItem
                icon={<Shield size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                label="Statut"
                value={userInfo?.active ? "Actif" : "Inactif"}
              />

              <InfoItem
                icon={<User size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                label="Sexe"
                value={userInfo?.sexe}
              />

              <InfoItem
                icon={<Building size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                label="Date de naissance"
                value={userInfo?.date_naiss}
              />

              <InfoItem
                icon={<IdCard size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                label="CIN"
                value={userInfo?.cin}
              />

              <InfoItem
                icon={<Heart size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                label="Situation"
                value={userInfo?.situation}
              />

              <InfoItem
                icon={<Users size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                label="Nombre d'enfants"
                value={userInfo?.nbr_enfants}
              />
            </View>
          </View>
        )}

        {activeTab === "professional" && (
          <>
            <View style={[styles.section, themeStyles.card]}>
              <Text style={[styles.sectionTitle, themeStyles.text]}>Informations professionnelles</Text>

              <View style={styles.infoGrid}>
                <InfoItem
                  icon={<User size={20} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />}
                  label="Matricule"
                  value={userInfo?.matricule}
                />

                <InfoItem
                  icon={<Building size={20} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />}
                  label="Département"
                  value={userInfo?.serviceName}
                />

                <InfoItem
                  icon={<Building size={20} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />}
                  label="Code Société"
                  value={userInfo?.code_soc}
                />

                <InfoItem
                  icon={<Calendar size={20} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />}
                  label="Date d'embauche"
                  value={userInfo?.joinDate}
                />
              </View>
            </View>
          </>
        )}

        {activeTab === "actions" && (
          <View style={[styles.section, themeStyles.card]}>
            <Text style={[styles.sectionTitle, themeStyles.text]}>Actions rapides</Text>

            <View style={styles.actionsList}>
              <ActionButton
                icon={<FileText size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                title="Mes documents"
                onPress={() => navigation.navigate('Documents')}
              />
              
              <ActionButton
                icon={<Lock size={20} color={isDarkMode ? "#B8B8BF" : "#0e135f"} />}
                title="Changer le mot de passe"
                onPress={() => setShowChangePasswordModal(true)}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <Footer />

      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        isDarkMode={isDarkMode}
        themeStyles={themeStyles}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create<StylesType>({
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  profileHeader: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#0e135f",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4CAF50",
  },
  tabsContainer: {
    flexDirection: "row",
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#0e135f",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#0e135f",
    fontWeight: "600",
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  skillText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0e135f",
  },
  actionsList: {
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalBody: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  changePasswordButton: {
    backgroundColor: "#0e135f",
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  changePasswordButtonText: {
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
    color: "#1a1f38",
  },
  subtleText: {
    color: "#757575",
  },
  activeTabText: {
    color: "#0e135f",
  },
  profileHeader: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoIconContainer: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  badge: {
    backgroundColor: "#E8F5E9",
  },
  badgeText: {
    color: "#4CAF50",
  },
  editButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEEEE",
  },
  actionButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEEEE",
  },
  activeTab: {
    borderBottomColor: "#0e135f",
  },
  skillBadge: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  skillText: {
    color: "#0e135f",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    color: "#1a1f38",
  },
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1f38",
  },
  header: {
    backgroundColor: "#1F2846",
    borderBottomColor: "#1a1f38",
  },
  text: {
    color: "#E0E0E0",
  },
  subtleText: {
    color: "#AAAAAA",
  },
  activeTabText: {
    color: "#B388FF",
  },
  profileHeader: {
    backgroundColor: "#1F2846",
    borderColor: "#1a1f38",
    borderWidth: 1,
  },
  card: {
    backgroundColor: "#1F2846",
    borderColor: "#1a1f38",
    borderWidth: 1,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f38",
  },
  infoIconContainer: {
    backgroundColor: "rgba(147, 112, 219, 0.15)",
  },
  badge: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
  },
  badgeText: {
    color: "#81C784",
  },
  editButton: {
    backgroundColor: "#1a1f38",
    borderColor: "#444444",
  },
  actionButton: {
    backgroundColor: "#1F2846",
    borderColor: "#1a1f38",
  },
  activeTab: {
    borderBottomColor: "#B388FF",
  },
  skillBadge: {
    backgroundColor: "rgba(147, 112, 219, 0.15)",
  },
  skillText: {
    color: "#B388FF",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "#1a1f38",
    color: "#FFFFFF",
  },
})

export default ProfilePage
