import { View, TouchableOpacity, Text } from "react-native"
import { Trash, Edit } from "react-native-feather"

interface DetailsModalProps {
  selectedRequest: any // Replace 'any' with the actual type of selectedRequest
  setShowDetailsModal: (show: boolean) => void
  handleDeleteRequest: (id: string, type: string) => void
  prepareForEdit: (request: any) => void // Replace 'any' with the actual type of request
  isDarkMode: boolean
  themeStyles: any // Replace 'any' with the actual type of themeStyles
  styles: any // Replace 'any' with the actual type of styles
}

const DetailsModal = ({
  selectedRequest,
  setShowDetailsModal,
  handleDeleteRequest,
  prepareForEdit,
  isDarkMode,
  themeStyles,
  styles,
}: DetailsModalProps) => {
  return (
    <View>
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
              style={[styles.detailsCancelButton, themeStyles.detailsCancelButton]}
              onPress={() => handleDeleteRequest(selectedRequest.id, selectedRequest.type)}
            >
              <Trash size={18} color="#FFFFFF" />
              <Text style={[styles.detailsCancelButtonText, themeStyles.detailsCancelButtonText]}>Supprimer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.detailsActionButton, themeStyles.detailsActionButton]}
              onPress={() => prepareForEdit(selectedRequest)}
            >
              <Edit size={18} color={isDarkMode ? "#E0E0E0" : "#333"} />
              <Text style={[styles.detailsActionButtonText, themeStyles.detailsActionButtonText]}>Modifier</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

export default DetailsModal

