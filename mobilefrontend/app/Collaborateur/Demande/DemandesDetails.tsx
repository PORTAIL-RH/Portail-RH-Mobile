import type React from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import {
  ArrowLeft,
  FileText,
  Download,
  Share2,
  Edit,
  Trash,
  Calendar,
  GraduationCap,
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react-native"

// Get dimensions
const { width, height } = Dimensions.get("window")

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

interface DemandesDetailsProps {
  visible: boolean
  onClose: () => void
  onEdit: (request: Request) => void
  onDelete: (requestId: string, requestType: string) => void
  selectedRequest: Request | null
  isDarkMode: boolean
  themeStyles: any
  renderSafeText: (value: any) => string
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return ""

  // Check if the date is already in DD/MM/YYYY format
  if (dateString.includes("/")) {
    return dateString
  }

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

const DemandesDetails: React.FC<DemandesDetailsProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  selectedRequest,
  isDarkMode,
  themeStyles,
  renderSafeText,
}) => {
  if (!selectedRequest) return null

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

  // Format time from hours and minutes
  const formatTime = (hours: string, minutes: string) => {
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
  }

  return (
    <View style={[styles.detailsModalContainer, themeStyles.container]}>
      <View style={[styles.detailsModalHeader, themeStyles.header]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
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
              style={[styles.detailsStatusBadge, { backgroundColor: `${getStatusColor(selectedRequest.status)}20` }]}
            >
              {getStatusIcon(selectedRequest.status)}
              <Text style={[styles.detailsStatusText, { color: getStatusColor(selectedRequest.status) }]}>
                {getStatusText(selectedRequest.status)}
              </Text>
            </View>
          </View>
          <Text style={[styles.detailsDescription, themeStyles.subtleText]}>{selectedRequest.description}</Text>
          <Text style={[styles.detailsDate, themeStyles.subtleText]}>
            Soumise le {selectedRequest.date} à {selectedRequest.time}
          </Text>
        </View>

        {/* Informations de la demande */}
        <View style={[styles.detailsSection, themeStyles.card]}>
          <Text style={[styles.detailsSectionTitle, themeStyles.text]}>Informations</Text>

          {selectedRequest.details.startDate && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Date de début:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>
                {formatDate(selectedRequest.details.startDate)}
              </Text>
            </View>
          )}

          {selectedRequest.details.startDate && selectedRequest.details.endDate && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Période:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>
                {selectedRequest.details.startDate} → {selectedRequest.details.endDate}
              </Text>
            </View>
          )}

          {selectedRequest.details.duration && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Nombre du jour:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>{selectedRequest.details.duration}</Text>
            </View>
          )}

          {/* Champs spécifiques aux autorisations */}
          {selectedRequest.type && selectedRequest.type.toLowerCase().includes("autorisation") && (
            <>
              {selectedRequest.details.heureSortie && selectedRequest.details.heureRetour  && (
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Heure de sortie/retour:</Text>
                  <Text style={[styles.detailsItemValue, themeStyles.text]}>
                    {selectedRequest.details.heureSortie}:{selectedRequest.details.minuteSortie} →{" "}
                    {selectedRequest.details.heureRetour}:{selectedRequest.details.minuteRetour}
                  </Text>
                </View>
              )}
            </>
          )}

          

          {/* Champs spécifiques aux congés */}
          {selectedRequest.type && selectedRequest.type.toLowerCase().includes("congé") && (
            <>
              {selectedRequest.details.typeConge && (
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Type de congé:</Text>
                  <Text style={[styles.detailsItemValue, themeStyles.text]}>
                    {renderSafeText(selectedRequest.details.typeConge)}
                  </Text>
                </View>
              )}

              {selectedRequest.details.duree && (
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Durée:</Text>
                  <Text style={[styles.detailsItemValue, themeStyles.text]}>
                    {renderSafeText(selectedRequest.details.duree)}{" "}
                    {selectedRequest.details.duree > 1 ? "jours" : "jour"}
                  </Text>
                </View>
              )}

              {selectedRequest.details.motif && (
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Motif:</Text>
                  <Text style={[styles.detailsItemValue, themeStyles.text]}>
                    {renderSafeText(selectedRequest.details.motif)}
                  </Text>
                </View>
              )}

              {selectedRequest.details.remplacant && (
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Remplaçant:</Text>
                  <Text style={[styles.detailsItemValue, themeStyles.text]}>
                    {renderSafeText(selectedRequest.details.remplacant)}
                  </Text>
                </View>
              )}

              {selectedRequest.details.soldeConge !== undefined && (
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Solde de congés:</Text>
                  <Text style={[styles.detailsItemValue, themeStyles.text]}>
                    {renderSafeText(selectedRequest.details.soldeConge)} jours
                  </Text>
                </View>
              )}

              {selectedRequest.details.commentaire && (
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Commentaire:</Text>
                  <Text style={[styles.detailsItemValue, themeStyles.text]}>
                    {renderSafeText(selectedRequest.details.commentaire)}
                  </Text>
                </View>
              )}
            </>
          )}

          {selectedRequest.details.titre && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Titre:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>
                {renderSafeText(selectedRequest.details.titre)}
              </Text>
            </View>
          )}

          {selectedRequest.details.typeFormation && selectedRequest.type !== "pre-avance" && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Type de formation:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>
                {renderSafeText(selectedRequest.details.typeFormation)}
              </Text>
            </View>
          )}

          {selectedRequest.details.theme && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Thème:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>
                {renderSafeText(selectedRequest.details.theme)}
              </Text>
            </View>
          )}

          {selectedRequest.details.typeDocument && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Type de document:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>{selectedRequest.details.typeDocument}</Text>
            </View>
          )}

          {selectedRequest.details.typePreavance && !selectedRequest.details.typeFormation && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Type de préavance:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>{selectedRequest.details.typePreavance}</Text>
            </View>
          )}

          {selectedRequest.details.montant && (
            <View style={styles.detailsItem}>
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Montant:</Text>
              <Text style={[styles.detailsItemValue, themeStyles.text]}>{selectedRequest.details.montant} €</Text>
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
                <View style={[styles.timelineDot, { backgroundColor: getStatusColor(selectedRequest.status) }]} />
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
          <TouchableOpacity style={[styles.detailsActionButton, themeStyles.detailsActionButton]} onPress={onClose}>
            <Text style={[styles.detailsActionButtonText, themeStyles.detailsActionButtonText]}>Fermer</Text>
          </TouchableOpacity>

          {selectedRequest.status === "pending" && (
            <>
              <TouchableOpacity
                style={[styles.detailsCancelButton, themeStyles.detailsCancelButton]}
                onPress={() => onDelete(selectedRequest.id, selectedRequest.type)}
              >
                <Trash size={18} color="#FFFFFF" />
                <Text style={[styles.detailsCancelButtonText, themeStyles.detailsCancelButtonText]}>Supprimer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.detailsActionButton, themeStyles.detailsActionButton]}
                onPress={() => onEdit(selectedRequest)}
              >
                <Edit size={18} color={isDarkMode ? "#E0E0E0" : "#333"} />
                <Text style={[styles.detailsActionButtonText, themeStyles.detailsActionButtonText]}>Modifier</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
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
  backButton: {
    padding: 8,
    marginRight: 8,
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
    flexDirection: "row",
    gap: 8,
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
    flexDirection: "row",
    gap: 8,
  },
  detailsCancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
})

export default DemandesDetails
