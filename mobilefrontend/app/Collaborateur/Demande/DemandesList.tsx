import React from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native"
import {
  Search,
  Filter,
  Calendar,
  FileText,
  GraduationCap,
  DollarSign,
  Shield,
  ChevronRight,
  X,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react-native"

// Define the Request interface
interface Request {
  id: string
  type: string
  description: string
  status: "pending" | "approved" | "rejected"
  date: string
  time: string
  details: any
}

interface DemandesListProps {
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

const DemandesList: React.FC<DemandesListProps> = ({
  filteredRequests,
  onSelectRequest,
  isDarkMode,
  themeStyles,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  activeTypeFilter,
  setActiveTypeFilter,
  filterRequests,
  searchRequests,
}) => {
  const [showFilterModal, setShowFilterModal] = React.useState(false)

  // Helper functions
  const getRequestTypeIcon = (type: string | undefined) => {
    const typeString = typeof type === "string" ? type : "unknown"
    const lowerCaseType = typeString.toLowerCase()

    if (lowerCaseType.includes("congé")) {
      return <Calendar size={24} color={isDarkMode ? "#9370DB" : "#9370DB"} />
    } else if (lowerCaseType.includes("formation")) {
      return <GraduationCap size={24} color={isDarkMode ? "#2196F3" : "#2196F3"} />
    } else if (lowerCaseType.includes("document")) {
      return <FileText size={24} color={isDarkMode ? "#607D8B" : "#607D8B"} />
    } else if (lowerCaseType.includes("pre-avance")) {
      return <DollarSign size={24} color={isDarkMode ? "#FF9800" : "#FF9800"} />
    } else if (lowerCaseType.includes("autorisation")) {
      return <Shield size={24} color={isDarkMode ? "#673AB7" : "#673AB7"} />
    } else {
      return <FileText size={24} color={isDarkMode ? "#2196F3" : "#2196F3"} />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={18} color="#4CAF50" />
      case "rejected":
        return <XCircle size={18} color="#F44336" />
      case "pending":
        return <Clock size={18} color="#FFC107" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#4CAF50"
      case "rejected":
        return "#F44336"
      case "pending":
        return "#FFC107"
      default:
        return "#9370DB"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvée"
      case "rejected":
        return "Rejetée"
      case "pending":
        return "En attente"
      default:
        return ""
    }
  }

  return (
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
              onPress={() => onSelectRequest(request)}
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

              <TouchableOpacity onPress={() => setShowFilterModal(false)}  style={{ alignSelf: 'flex-end'}} >
                <Search size={24}  color={isDarkMode ? "#E0E0E0" : "#333"} />
              </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
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
    width: "80%",
    borderRadius: 16,
    padding: 20,
    maxHeight: "100%",
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
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
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
})

export default DemandesList
