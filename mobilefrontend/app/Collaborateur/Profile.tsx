import { useEffect, useState } from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { useNavigation, type NavigationProp } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Edit,
  ChevronRight,
  User,
  FileText,
  Clock,
  ArrowLeft,
  Moon,
  Sun,
  Shield,
  Building,
  GraduationCap,
  Bookmark,
} from "lucide-react-native"
import Navbar from "../Components/NavBar"
import Footer from "../Components/Footer"
import { API_CONFIG } from "../config/apiConfig"

type RootStackParamList = {
  AccueilCollaborateur: undefined
  Profile: undefined
  Calendar: undefined
  Notifications: undefined
  EditProfile: undefined
  Demandestot: undefined
}

const { width } = Dimensions.get("window")

// Définir les types pour les props
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

const ProfilePage = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const [userInfo, setUserInfo] = useState<any>({
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
    nom: "Nom Utilisateur",
    role: "Collaborateur",
    email: "email@example.com",
    phone: null,
    address: "Casablanca, Maroc",
    department: "Ressources Humaines",
    joinDate: null,
    position: "Spécialiste RH",
    education: "Master en Gestion des Ressources Humaines",
    skills: ["Recrutement", "Formation", "Gestion des talents", "SIRH"],
    matricule: "EMP12345",
    chefHierarchique: "N/A",
    sexe: null,
    code_soc: null,
  })
  const [loading, setLoading] = useState(true)
  const colorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark")
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    const loadData = async () => {
      await loadThemePreference()
      await getUserInfo()
    }
    loadData()
  }, [])

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("@theme_mode")
      if (storedTheme !== null) {
        setIsDarkMode(storedTheme === "dark")
      }
    } catch (error) {
      console.error("Error loading theme preference:", error)
    }
  }

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    try {
      await AsyncStorage.setItem("@theme_mode", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  const getUserInfo = async () => {
    setLoading(true)
    try {
      const userInfo = await AsyncStorage.getItem("userInfo")
      const token = await AsyncStorage.getItem("userToken")

      if (userInfo && token) {
        const parsedUser = JSON.parse(userInfo)
        const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/Personnel/byId/${parsedUser.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données")
        }

        const data = await response.json()

        const enhancedData = {
          ...data,
          profileImage: data.profileImage || "https://randomuser.me/api/portraits/men/32.jpg",
          nom: data.nom || "Nom Utilisateur",
          role: data.role || "Collaborateur",
          email: data.email || "email@example.com",
          phone: data.telephone || null,
          address: data.address || "Casablanca, Maroc",
          department: data.service?.serviceName || "Ressources Humaines",
          joinDate: data.date_embauche || null,
          position: data.position || "Spécialiste RH",
          education: data.education || "Master en Gestion des Ressources Humaines",
          skills: data.skills || ["Recrutement", "Formation", "Gestion des talents", "SIRH"],
          matricule: data.matricule || "EMP12345",
          chefHierarchique: data.chefHierarchique ? `${data.chefHierarchique.nom} ${data.chefHierarchique.prenom}` : "N/A",
          sexe: data.sexe || null,
          code_soc: data.code_soc || null,
        }

        setUserInfo(enhancedData)
      }
    } catch (error) {
      console.log("Erreur lors de la récupération des infos utilisateur", error)
    } finally {
      setLoading(false)
    }
  }

  const themeStyles = isDarkMode ? darkStyles : lightStyles

  const InfoItem = ({ icon, label, value }: InfoItemProps) => (
    <View style={[styles.infoItem, themeStyles.infoItem]}>
      <View style={[styles.infoIconContainer, themeStyles.infoIconContainer]}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, themeStyles.subtleText]}>{label}</Text>
        <Text style={[styles.infoValue, themeStyles.text]}>{value !== null && value !== undefined ? value : "null"}</Text>
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

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} handleLogout={() => {}} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileHeader, themeStyles.card]}>
         
          <Text style={[styles.profileName, themeStyles.text]}>{userInfo.nom} {userInfo.prenom} </Text>
          <Text style={[styles.profileRole, themeStyles.subtleText]}>{userInfo.role}</Text>

          <View style={styles.badgeContainer}>
            <View style={[styles.badge, themeStyles.badge]}>
              <Text style={[styles.badgeText, themeStyles.badgeText]}>Actif</Text>
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
                icon={<Mail size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} />}
                label="Email"
                value={userInfo.email}
              />

              <InfoItem
                icon={<Phone size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} />}
                label="Téléphone"
                value={userInfo.phone}
              />


              <InfoItem
                icon={<Shield size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} />}
                label="Statut"
                value={userInfo.active ? "Actif" : "Inactif"}
              />

              <InfoItem
                icon={<User size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} />}
                label="Sexe"
                value={userInfo.sexe}
              />

              <InfoItem
                icon={<Building size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} />}
                label="Date de naissance"
                value={userInfo.date_naiss}
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
                  value={userInfo.matricule}
                />

                <InfoItem
                  icon={<Building size={20} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />}
                  label="Département"
                  value={userInfo.department}
                />

<InfoItem
                icon={<Building size={20} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />}
                label="Code Société"
                value={userInfo.code_soc}
              />

                <InfoItem
                  icon={<Calendar size={20} color={isDarkMode ? "#4CAF50" : "#4CAF50"} />}
                  label="Date d'embauche"
                  value={userInfo.joinDate}
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
                icon={<FileText size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} />}
                title="Mes documents"
                onPress={() => {}}
              />

              <ActionButton
                icon={<Clock size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} />}
                title="Historique des demandes"
                onPress={() => navigation.navigate("Demandestot")}
              />

              <ActionButton
                icon={<Calendar size={20} color={isDarkMode ? "#0e135f" : "#0e135f"} />}
                title="Mon calendrier"
                onPress={() => navigation.navigate("Calendar")}
              />

            </View>
          </View>
        )}
      </ScrollView>

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
})

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333333",
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
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
    borderWidth: 1,
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
    borderWidth: 1,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
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
    backgroundColor: "#333333",
    borderColor: "#444444",
  },
  actionButton: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
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
})

export default ProfilePage