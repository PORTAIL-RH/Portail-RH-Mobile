import type React from "react"
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native"
import { X, Save } from "react-native-feather"

// Assuming these are defined elsewhere and passed as props or imported
// For demonstration purposes, let's define them here with placeholder values
const styles = {
  modalOverlay: {},
  editModal: {},
  editModalHeader: {},
  editModalTitle: {},
  editScrollContainer: {},
  editField: {},
  editFieldLabel: {},
  editInput: {},
  editModalActions: {},
  detailsCancelButton: {},
  detailsCancelButtonText: {},
  editActionButton: {},
  detailsActionButtonText: {},
}

const themeStyles = {
  card: {},
  text: {},
  searchInputContainer: {},
  detailsCancelButton: {},
  detailsCancelButtonText: {},
  detailsActionButton: {},
  detailsActionButtonText: {},
}

const isDarkMode = false // Or however this is determined

interface EditModalProps {
  showEditModal: boolean
  setShowEditModal: (visible: boolean) => void
  editingRequest: any // Replace 'any' with the actual type of editingRequest
  editableData: any // Replace 'any' with the actual type of editableData
  setEditableData: (data: any) => void // Replace 'any' with the actual type of editableData
  handleUpdateRequest: () => void
}

const EditModal: React.FC<EditModalProps> = ({
  showEditModal,
  setShowEditModal,
  editingRequest,
  editableData,
  setEditableData,
  handleUpdateRequest,
}) => {
  return (
    /* Modal d'édition */
    <Modal
      visible={showEditModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.editModal, themeStyles.card]}>
          <View style={styles.editModalHeader}>
            <Text style={[styles.editModalTitle, themeStyles.text]}>Modifier la demande</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editScrollContainer}>
            {/* Champ de description commun à tous les types */}
            <View style={styles.editField}>
              <Text style={[styles.editFieldLabel, themeStyles.text]}>Description</Text>
              <View style={themeStyles.searchInputContainer}>
                <TextInput
                  style={[styles.editInput, themeStyles.text]}
                  value={editableData.description}
                  onChangeText={(text) => setEditableData({ ...editableData, description: text })}
                  multiline
                  placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                />
              </View>
            </View>

            {/* Champs spécifiques pour les formations */}
            {editingRequest && editingRequest.type.toLowerCase().includes("formation") && (
              <>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Titre</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.titre}
                      onChangeText={(text) => setEditableData({ ...editableData, titre: text })}
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Thème</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.theme}
                      onChangeText={(text) => setEditableData({ ...editableData, theme: text })}
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Type de formation</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.typeFormation}
                      onChangeText={(text) => setEditableData({ ...editableData, typeFormation: text })}
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Champs spécifiques pour les documents */}
            {editingRequest && editingRequest.type.toLowerCase().includes("document") && (
              <View style={styles.editField}>
                <Text style={[styles.editFieldLabel, themeStyles.text]}>Type de document</Text>
                <View style={themeStyles.searchInputContainer}>
                  <TextInput
                    style={[styles.editInput, themeStyles.text]}
                    value={editableData.typeDocument}
                    onChangeText={(text) => setEditableData({ ...editableData, typeDocument: text })}
                    placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                  />
                </View>
              </View>
            )}

            {/* Champs spécifiques pour les pré-avances */}
            {editingRequest && editingRequest.type.toLowerCase().includes("pre-avance") && (
              <>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Type de préavance</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.typePreavance}
                      onChangeText={(text) => setEditableData({ ...editableData, typePreavance: text })}
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Montant</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.montant}
                      onChangeText={(text) => setEditableData({ ...editableData, montant: text })}
                      keyboardType="numeric"
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Champs spécifiques pour les autorisations */}
            {editingRequest && editingRequest.type.toLowerCase().includes("autorisation") && (
              <>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Heure de sortie</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.heureSortie}
                      onChangeText={(text) => setEditableData({ ...editableData, heureSortie: text })}
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Heure de retour</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.heureRetour}
                      onChangeText={(text) => setEditableData({ ...editableData, heureRetour: text })}
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Champs spécifiques pour les congés */}
            {editingRequest && editingRequest.type.toLowerCase().includes("congé") && (
              <>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Date de début</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.startDate}
                      onChangeText={(text) => setEditableData({ ...editableData, startDate: text })}
                      placeholder="JJ/MM/AAAA"
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Date de fin</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.endDate}
                      onChangeText={(text) => setEditableData({ ...editableData, endDate: text })}
                      placeholder="JJ/MM/AAAA"
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
                <View style={styles.editField}>
                  <Text style={[styles.editFieldLabel, themeStyles.text]}>Nombre de jours</Text>
                  <View style={themeStyles.searchInputContainer}>
                    <TextInput
                      style={[styles.editInput, themeStyles.text]}
                      value={editableData.duration}
                      onChangeText={(text) => setEditableData({ ...editableData, duration: text })}
                      keyboardType="numeric"
                      placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
                    />
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.editModalActions}>
            <TouchableOpacity
              style={[styles.detailsCancelButton, themeStyles.detailsCancelButton]}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={[styles.detailsCancelButtonText, themeStyles.detailsCancelButtonText]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editActionButton, themeStyles.detailsActionButton]}
              onPress={handleUpdateRequest}
            >
              <Save size={18} color={isDarkMode ? "#E0E0E0" : "#333"} />
              <Text style={[styles.detailsActionButtonText, themeStyles.detailsActionButtonText]}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default EditModal

