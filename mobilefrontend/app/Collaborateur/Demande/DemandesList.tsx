import React from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Platform } from "react-native"
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
import type { Request, DemandesListProps } from "./Demandes"

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
  loading = false,
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

  const getRequestStatus = (request: Request): "approved" | "rejected" | "pending" => {
    // Check if it's a document or pre-avance request
    if (request.type.toLowerCase().includes("document") || request.type.toLowerCase().includes("pre-avance")) {
      // If responseRh is undefined or null, set dateDemande to "N/A"
      if (request.responseRh === undefined || request.responseRh === null) {
        if (request.details) {
          request.details.dateDemande = "N/A";
        }
        return "pending";
      }
      
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

  const getStatusIcon = (request: Request) => {
    const status = getRequestStatus(request);
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

  const getStatusColor = (request: Request) => {
    const status = getRequestStatus(request);
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

  const getStatusText = (request: Request) => {
    const status = getRequestStatus(request);
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === "N/A") return ""
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

  const formatTime = (dateString: string | undefined) => {
    if (!dateString || dateString === "N/A") return ""
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

  const renderRequestItem = ({ item }: { item: Request }) => {
    const getRequestTypeIcon = (type: string) => {
      const lowerCaseType = type.toLowerCase()
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
      <TouchableOpacity style={[styles.requestItem, themeStyles.card]} onPress={() => onSelectRequest(item)}>
        <View style={styles.requestItemLeft}>
          {getRequestTypeIcon(item.type)}
          <View style={styles.requestInfo}>
            <Text style={[styles.requestType, themeStyles.text]} numberOfLines={1}>
              {item.type}
            </Text>
            <Text style={[styles.requestDescription, themeStyles.subtleText]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={[styles.requestDate, themeStyles.subtleText]}>
              {item.details.dateDemande === "N/A" ? "Date non disponible" : `Soumise le ${formatDate(item.details.dateDemande)}${formatTime(item.details.dateDemande) ? ` à ${formatTime(item.details.dateDemande)}` : ""}`}
            </Text>
          </View>
        </View>
        <View style={styles.requestItemRight}>
          <View
            style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}
          >
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Add sorting function
  const sortByDateDemande = (requests: Request[]) => {
    return [...requests].sort((a, b) => {
      const dateA = a.details.dateDemande ? new Date(a.details.dateDemande).getTime() : 0;
      const dateB = b.details.dateDemande ? new Date(b.details.dateDemande).getTime() : 0;
      return dateB - dateA; // Sort in descending order (newest first)
    });
  };

  return (
    <View style={styles.container}>
      {/* Search and filter section */}
      <View style={[styles.searchContainer, themeStyles.searchContainer]}>
        <View style={[styles.searchInputContainer, themeStyles.searchInputContainer]}>
          <Search size={20} color={isDarkMode ? "#E0E0E0" : "#333"} />
          <TextInput
            style={[styles.searchInput, themeStyles.searchInput]}
            placeholder="Rechercher une demande..."
            placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text)
              searchRequests(text)
            }}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("")
                searchRequests("")
              }}
            >
              <X size={20} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, themeStyles.filterButton]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={isDarkMode ? "#E0E0E0" : "#333"} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersScrollView, themeStyles.filtersScrollView]}
        contentContainerStyle={styles.filtersContent}
      >
        {/* ... existing filter chips ... */}
      </ScrollView>

      {/* Requests list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? "#9370DB" : "#9370DB"} />
          <Text style={[styles.loadingText, themeStyles.text]}>Chargement...</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, themeStyles.text]}>Aucune demande trouvée</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.requestsList}
          contentContainerStyle={styles.requestsListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={[styles.requestCard, themeStyles.card]}
              onPress={() => onSelectRequest(request)}
            >
              <View style={styles.requestCardContent}>
                <View style={styles.requestTypeContainer}>
                  {getRequestTypeIcon(request.type)}
                  <View style={styles.requestInfo}>
                    <Text style={[styles.requestType, themeStyles.text]} numberOfLines={1}>
                      {request.type}
                    </Text>
                    <Text style={[styles.requestDescription, themeStyles.subtleText]} numberOfLines={2}>
                      {request.description}
                    </Text>
                    <Text style={[styles.requestDate, themeStyles.subtleText]}>
                      {request.details.dateDemande === "N/A" 
                        ? "Date non disponible" 
                        : `Soumise le ${formatDate(request.details.dateDemande)}${
                            request.time ? ` à ${request.time}` : ""
                          }`}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(request)}20` },
                    ]}
                  >
                    {getStatusIcon(request)}
                    <Text style={[styles.statusText, { color: getStatusColor(request) }]}>
                      {getStatusText(request)}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={isDarkMode ? "#9370DB" : "#9370DB"} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Filter modal */}
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 17,
    marginLeft: 8,
  },
  filterButton: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  requestsList: {
    flex: 1,
  },
  requestsListContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  requestCard: {
    borderRadius: 10,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  requestCardContent: {
    padding: 16,
  },
  requestTypeContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestType: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 20,
  },
  requestDate: {
    fontSize: 13,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModal: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 14,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
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
    fontSize: 15,
  },
  activeFilterOptionText: {
    fontWeight: "600",
  },
  filtersScrollView: {
    maxHeight: 44,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeChip: {
    backgroundColor: '#9370DB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  requestItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  requestItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
  },
})

export default DemandesList
