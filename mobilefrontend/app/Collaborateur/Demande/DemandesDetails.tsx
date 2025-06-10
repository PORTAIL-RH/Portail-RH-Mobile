import React, { useCallback, useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Linking, Modal, Alert, ActivityIndicator, StatusBar, SafeAreaView } from "react-native"
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
  File,
  ExternalLink,
  X,
  Image,
  Grid,
  Airplay,
  Archive,
  Eye,
  AlertTriangle,
} from "lucide-react-native"
import { API_CONFIG } from "../../config/apiConfig"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system"
import * as IntentLauncher from "expo-intent-launcher"
import { shareAsync } from "expo-sharing"
import Toast from "react-native-toast-message"
import WebView from "react-native-webview"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { StyleSheet as RNStyleSheet, ViewStyle, TextStyle } from "react-native"
import type { Request } from "./Demandes"
import { Image as RNImage } from 'react-native';

// Get dimensions
const { width, height } = Dimensions.get("window")

// Update FileDocument interface to match the API response
interface FileDocument {
  id: string
  filename: string
  fileType: string  // This will be MIME type like "application/pdf" or "image/png"
  fileId: string
}

interface BasicFileInfo extends FileDocument {} // Make BasicFileInfo identical to FileDocument

type DocumentInput = string | FileDocument;

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

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

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
  const [previewVisible, setPreviewVisible] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<FileDocument | null>(null)
  const [isLoadingDownload, setIsLoadingDownload] = useState(false)
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const insets = useSafeAreaInsets()
  
  useEffect(() => {
    if (selectedDocument?.fileType?.startsWith('image/')) {
      const loadImage = async () => {
        try {
          const tempDir = FileSystem.cacheDirectory;
          const fileName = selectedDocument.filename.split('/').pop();
          const localPath = `${tempDir}${fileName}`;
          
          // Download the image first
          const downloadResumable = FileSystem.createDownloadResumable(
            `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/files/download/${selectedDocument.fileId}`,
            localPath,
            {
              headers: {
                'Authorization': `Bearer ${userToken}`,
              }
            }
          );

          const { uri } = await downloadResumable.downloadAsync();
          setImageUri(uri);
        } catch (error) {
          console.error('Error loading image:', error);
        }
      };

      loadImage();
    }
  }, [selectedDocument, userToken]);
  
  // Load token on component mount
  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem("userToken")
      setUserToken(token)
    }
    loadToken()
  }, [])

  useEffect(() => {
    if (selectedRequest?.details) {
      console.log('Documents in request:', {
        documents: selectedRequest.details.documents,
        filesReponse: selectedRequest.details.filesReponse
      })
    }
  }, [selectedRequest])

  useEffect(() => {
    console.log('Component mounted, Platform:', Platform.OS);
    console.log('Current styles:', {
      containerPadding: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
      headerHeight: Platform.OS === 'android' ? 56 : 44
    });
  }, []);

  if (!selectedRequest) return null

  // Helper functions
  const getRequestTypeIcon = (type: string | undefined) => {
    const typeString = typeof type === "string" ? type : "unknown"
    const lowerCaseType = typeString.toLowerCase()

    if (lowerCaseType.includes("congé")) {
      return <Calendar size={24} color={isDarkMode ? "#B388FF" : "#9370DB"} />
    } else if (lowerCaseType.includes("formation")) {
      return <GraduationCap size={24} color={isDarkMode ? "#64B5F6" : "#2196F3"} />
    } else if (lowerCaseType.includes("document")) {
      return <FileText size={24} color={isDarkMode ? "#90A4AE" : "#607D8B"} />
    } else if (lowerCaseType.includes("pre-avance")) {
      return <DollarSign size={24} color={isDarkMode ? "#FFB74D" : "#FF9800"} />
    } else if (lowerCaseType.includes("autorisation")) {
      return <Shield size={24} color={isDarkMode ? "#9575CD" : "#673AB7"} />
    } else {
      return <FileText size={24} color={isDarkMode ? "#64B5F6" : "#2196F3"} />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={18} color={isDarkMode ? "#66BB6A" : "#4CAF50"} />
      case "rejected":
        return <XCircle size={18} color={isDarkMode ? "#EF5350" : "#F44336"} />
      case "pending":
        return <Clock size={18} color={isDarkMode ? "#FFCA28" : "#FFC107"} />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return isDarkMode ? "#66BB6A" : "#4CAF50"
      case "rejected":
        return isDarkMode ? "#EF5350" : "#F44336"
      case "pending":
        return isDarkMode ? "#FFCA28" : "#FFC107"
      default:
        return isDarkMode ? "#B388FF" : "#9370DB"
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

  // Format time from hours and minutes
  const formatTime = (hours: string, minutes: string) => {
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
  }

  // Get appropriate icon for file type
  const getFileIcon = useCallback((fileType: string | undefined) => {
    if (!fileType) return File
    const type = fileType.toLowerCase()
    if (type.includes("application/pdf")) return FileText
    if (type.startsWith("image/")) return Image
    if (type.includes("msword") || type.includes("wordprocessingml") || type.includes("document")) return FileText
    if (type.includes("spreadsheetml") || type.includes("excel") || type.includes("csv")) return Grid
    if (type.includes("presentationml") || type.includes("powerpoint")) return Airplay
    if (type.includes("zip") || type.includes("rar") || type.includes("7z") || type.includes("compressed")) return Archive
    if (type.startsWith("text/")) return FileText
    return File
  }, [])

  // Get friendly file type name
  const getFileTypeName = useCallback((fileType: string | undefined): string => {
    if (!fileType) return "Fichier"
    const type = fileType.toLowerCase()
    if (type.includes("application/pdf")) return "PDF"
    if (type.startsWith("image/")) return "Image"
    if (type.includes("msword") || type.includes("wordprocessingml") || type.includes("document")) return "Document"
    if (type.includes("spreadsheetml") || type.includes("excel") || type.includes("csv")) return "Feuille de calcul"
    if (type.includes("presentationml") || type.includes("powerpoint")) return "Présentation"
    if (type.startsWith("text/")) return "Texte"
    if (type.includes("zip") || type.includes("rar") || type.includes("7z") || type.includes("compressed")) return "Archive"
    return "Fichier"
  }, [])

  // Open file function
  const openFile = useCallback(async (fileUri: string, mimeType: string) => {
    try {
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(fileUri)
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: mimeType,
        })
      } else {
        // For iOS, ensure file is in a shared location
        const fileInfo = await FileSystem.getInfoAsync(fileUri)
        if (!fileInfo.exists) {
          throw new Error("File doesn't exist")
        }

        // Create a temporary file in the cache directory
        const tempFile = `${FileSystem.cacheDirectory}temp_${Date.now()}_${fileUri.split("/").pop()}`
        await FileSystem.copyAsync({
          from: fileUri,
          to: tempFile,
        })

        await shareAsync(tempFile, {
          mimeType,
          UTI: mimeType,
          dialogTitle: "Ouvrir le document",
        })

        // Clean up temp file
        try {
          await FileSystem.deleteAsync(tempFile, { idempotent: true })
        } catch (cleanupError) {
          console.warn("Cleanup error:", cleanupError)
        }
      }
    } catch (error) {
      console.error("Error opening file:", error)
      Alert.alert("Erreur", "Impossible d'ouvrir le fichier. Veuillez réessayer.")
    }
  }, [])

  // Add helper function for file type detection
  const getFileTypeFromFilename = (filename: string): string => {
    if (filename.toLowerCase().endsWith('.pdf')) return 'application/pdf';
    const imageMatch = filename.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
    if (imageMatch) return `image/${imageMatch[1]}`;
    return 'application/octet-stream';
  };

  // Update performActualDownload to log more details
  const performActualDownload = useCallback(
    async (document: FileDocument) => {
      if (!userToken) {
        Alert.alert("Erreur d'authentification", "Token manquant. Impossible de télécharger.");
        setIsLoadingDownload(false);
        setDownloadingItemId(null);
        return;
      }

      try {
        const tempDirectory = FileSystem.cacheDirectory;
        if (!tempDirectory) {
          throw new Error("Cannot access cache directory");
        }

        const safeFilename = document.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const downloadPath = `${tempDirectory}${safeFilename}`;

        // Use the proper API endpoint
        const downloadUrl = `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/files/download/${document.fileId}`;

        console.log('Download attempt details:', {
          document,
          url: downloadUrl,
          path: downloadPath
        });

        const downloadResumable = FileSystem.createDownloadResumable(
          downloadUrl,
          downloadPath,
          {
            headers: { 
              'Authorization': `Bearer ${userToken}`,
              'Accept': '*/*',
            },
          },
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            console.log(`Download progress: ${(progress * 100).toFixed(2)}%`);
          }
        );

        const result = await downloadResumable.downloadAsync();
        
        if (!result?.uri) {
          throw new Error("Download failed - no URI received");
        }

        // For Android, we need to use a content URI
        if (Platform.OS === 'android') {
          const contentUri = await FileSystem.getContentUriAsync(result.uri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: document.fileType,
          });
        } else {
          // iOS handling remains the same
          await shareAsync(result.uri, {
            mimeType: document.fileType,
            UTI: document.fileType,
            dialogTitle: "Ouvrir le document",
          });
        }

        Toast.show({
          type: "success",
          text1: "Succès",
          text2: "Fichier téléchargé avec succès",
          visibilityTime: 2000,
        });
      } catch (error) {
        console.error("Download error:", error);
        Alert.alert(
          "Erreur",
          "Impossible de télécharger le fichier. Veuillez réessayer."
        );
      } finally {
        setIsLoadingDownload(false);
        setDownloadingItemId(null);
      }
    },
    [userToken]
  );

  // Helper function to create a FileDocument from a string
  const createFileDocumentFromString = (input: string): FileDocument => ({
    id: input,
    filename: input,
    fileType: input.toLowerCase().endsWith('.pdf') 
      ? 'application/pdf' 
      : input.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) 
        ? `image/${input.split('.').pop()}`
        : 'application/octet-stream',
    fileId: input
  });

  // Add function to fetch file details from server
  const fetchFileDetails = async (filename: string, isResponse: boolean): Promise<FileDocument | null> => {
    try {
      const endpoint = isResponse 
        ? `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-document/personnel/${selectedRequest.id}/files-reponse`
        : `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-document/personnel/${selectedRequest.id}/files`;

      console.log('Fetching file details:', {
        endpoint,
        filename,
        isResponse,
        requestId: selectedRequest.id
      });

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file details: ${response.status}`);
      }

      const files = await response.json();
      console.log('Raw server response:', files);

      // Find the file by filename and extract its ID
      const file = files.find((f: any) => f.filename === filename);
      console.log('Found file details:', file);

      if (file) {
        // Log the exact structure we're working with
        console.log('File structure from server:', {
          id: file.id,
          _id: file._id,
          fileId: file.fileId,
          filename: file.filename,
          originalFilename: file.originalFilename
        });

        // Try to get the correct ID from various possible fields
        const fileId = file._id || file.id || file.fileId;
        
        if (!fileId) {
          console.warn('No file ID found in server response');
        }

        return {
          id: fileId || filename,
          filename: file.filename || filename,
          fileType: file.fileType || getFileTypeFromFilename(file.filename || filename),
          fileId: fileId || filename
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching file details:', error);
      return null;
    }
  };

  // Helper function to check if a filename is in the response files
  const isFileInResponse = (filename: string): boolean => {
    if (!selectedRequest.details.filesReponse) return false;
    return selectedRequest.details.filesReponse.some(file => 
      typeof file === 'string' 
        ? file === filename 
        : file.filename === filename
    );
  };

  // Update handleDownload to ensure we have the correct fileId
  const handleDownload = useCallback(async (doc: DocumentInput) => {
    try {
      setIsLoadingDownload(true);
      const isResponse = isFileInResponse(typeof doc === 'string' ? doc : doc.filename);
      
      let document: FileDocument;
      if (typeof doc === 'string') {
        // Try to get the file details from the server first
        const fileDetails = await fetchFileDetails(doc, isResponse);
        if (fileDetails) {
          document = fileDetails;
        } else {
          // If we can't get the ID from server, try to find it in the request details
          const files = isResponse ? selectedRequest.details.filesReponse : selectedRequest.details.documents;
          const matchingFile = files?.find((f: any) => 
            typeof f === 'string' ? f === doc : f.filename === doc
          );
          
          if (matchingFile && typeof matchingFile !== 'string') {
            document = {
              id: matchingFile.id || doc,
              filename: doc,
              fileType: getFileTypeFromFilename(doc),
              fileId: matchingFile.id || doc
            };
          } else {
            document = {
              id: doc,
              filename: doc,
              fileType: getFileTypeFromFilename(doc),
              fileId: doc
            };
          }
        }
      } else {
        document = doc;
      }
      
      if (!document.fileId) {
        throw new Error('No fileId available for download');
      }
      
      console.log('Downloading file with details:', document);
      
      setDownloadingItemId(document.id);
      await performActualDownload(document);
    } catch (error) {
      console.error('Error in handleDownload:', error);
      Alert.alert(
        "Erreur",
        "Impossible de télécharger le document. Veuillez réessayer plus tard."
      );
    } finally {
      setIsLoadingDownload(false);
      setDownloadingItemId(null);
    }
  }, [performActualDownload, selectedRequest.details, selectedRequest.id, userToken]);

  // Update handlePreview similarly
  const handlePreview = useCallback(async (doc: DocumentInput) => {
    try {
      const isResponse = isFileInResponse(typeof doc === 'string' ? doc : doc.filename);
      
      let document: FileDocument;
      if (typeof doc === 'string') {
        // Try to get the file details from the server first
        const fileDetails = await fetchFileDetails(doc, isResponse);
        if (fileDetails) {
          document = fileDetails;
        } else {
          // If we can't get the ID from server, try to find it in the request details
          const files = isResponse ? selectedRequest.details.filesReponse : selectedRequest.details.documents;
          const matchingFile = files?.find((f: any) => 
            typeof f === 'string' ? f === doc : f.filename === doc
          );
          
          if (matchingFile && typeof matchingFile !== 'string') {
            document = {
              id: matchingFile.id || doc,
              filename: doc,
              fileType: getFileTypeFromFilename(doc),
              fileId: matchingFile.id || doc
            };
          } else {
            document = {
              id: doc,
              filename: doc,
              fileType: getFileTypeFromFilename(doc),
              fileId: doc
            };
          }
        }
      } else {
        document = doc;
      }
      
      if (!document.fileId) {
        throw new Error('No fileId available for preview');
      }
      
      console.log('Previewing file with details:', document);
      
      setSelectedDocument(document);
      setPreviewVisible(true);
    } catch (error) {
      console.error('Error in handlePreview:', error);
      Alert.alert(
        "Erreur",
        "Impossible d'afficher l'aperçu du document. Veuillez réessayer plus tard."
      );
    }
  }, [selectedRequest.details, selectedRequest.id, userToken]);

  const closePreview = useCallback(() => {
    setPreviewVisible(false)
    setSelectedDocument(null)
    setImageUri(null)
  }, [])

  // Handle delete confirmation
  const handleDeleteRequest = useCallback(() => {
    setDeleteConfirmVisible(true);
  }, []);

  const confirmDelete = useCallback(() => {
    setDeleteConfirmVisible(false);
    onDelete(selectedRequest.id, selectedRequest.type);
  }, [selectedRequest, onDelete]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmVisible(false);
  }, []);

  const renderDeleteConfirmModal = useCallback(() => {
    return (
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[
            styles.confirmModalContainer,
            isDarkMode ? styles.confirmModalContainerDark : styles.confirmModalContainerLight
          ]}>
            <View style={styles.confirmModalIconContainer}>
              <AlertTriangle size={40} color={isDarkMode ? "#EF5350" : "#F44336"} />
            </View>
            
            <Text style={[
              styles.confirmModalTitle,
              isDarkMode ? styles.textLight : styles.textDark
            ]}>
              Supprimer la demande
            </Text>
            
            <Text style={[
              styles.confirmModalMessage,
              isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary
            ]}>
              Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.
            </Text>
            
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  styles.confirmModalCancelButton,
                  isDarkMode ? styles.confirmModalCancelButtonDark : styles.confirmModalCancelButtonLight
                ]}
                onPress={cancelDelete}
              >
                <Text style={[
                  styles.confirmModalButtonText,
                  isDarkMode ? styles.confirmModalCancelTextDark : styles.confirmModalCancelTextLight
                ]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  styles.confirmModalDeleteButton,
                  isDarkMode ? styles.confirmModalDeleteButtonDark : {}
                ]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmModalDeleteText}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }, [deleteConfirmVisible, isDarkMode, cancelDelete, confirmDelete]);

  const renderPreviewModal = useCallback(() => {
    if (!selectedDocument || !userToken) return null;

    // Decode the filename for display
    const decodedFilename = decodeURIComponent(selectedDocument.filename);
    
    // Create the source object with headers
    const source = {
      uri: `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/files/download/${selectedDocument.fileId}`,
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Accept': selectedDocument.fileType,
      }
    };

    return (
      <Modal visible={previewVisible} animationType="slide" onRequestClose={closePreview}>
        <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
          <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
            <Text style={[styles.modalTitle, isDarkMode ? styles.textLight : styles.textDark]} numberOfLines={1}>
              {decodedFilename}
            </Text>
            <TouchableOpacity 
              onPress={closePreview} 
              style={styles.modalCloseButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={28} color={isDarkMode ? "#E0E0E0" : "#555555"} />
            </TouchableOpacity>
          </View>

          {selectedDocument.fileType?.startsWith('image/') && imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <RNImage 
                source={{ uri: imageUri }} 
                style={styles.imagePreview} 
                resizeMode="contain"
              />
            </View>
          ) : (
            <WebView
              source={source}
              style={styles.webView}
              startInLoadingState={true}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mixedContentMode="always"
              renderLoading={() => (
                <View style={[styles.webViewLoading, { 
                  backgroundColor: isDarkMode ? 'rgba(26, 31, 56, 0.9)' : 'rgba(255, 255, 255, 0.9)' 
                }]}>
                  <ActivityIndicator size="large" color={isDarkMode ? "#B388FF" : "#9370DB"} />
                </View>
              )}
              onError={(syntheticEvent) => {
                console.error("WebView error:", syntheticEvent.nativeEvent);
                Alert.alert(
                  "Erreur",
                  "Impossible d'afficher le document. Essayez de le télécharger.",
                  [
                    { text: "Annuler", style: "cancel" },
                    { 
                      text: "Télécharger",
                      onPress: () => handleDownload(selectedDocument)
                    }
                  ]
                );
              }}
              onHttpError={(syntheticEvent) => {
                console.error("HTTP error:", syntheticEvent.nativeEvent);
              }}
            />
          )}
          
          <View style={[
            styles.previewActions,
            isDarkMode ? styles.previewActionsDark : styles.previewActionsLight
          ]}>
            <TouchableOpacity 
              style={[
                styles.previewActionButton, 
                { backgroundColor: isDarkMode ? "#B388FF" : "#9370DB" }
              ]}
              onPress={() => handleDownload(selectedDocument)}
            >
              <Download size={20} color="#FFFFFF" />
              <Text style={styles.previewActionButtonText}>Télécharger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }, [previewVisible, selectedDocument, isDarkMode, userToken, closePreview, handleDownload, imageUri]);

  // Fix text node error in renderDocument
  const renderDocument = useCallback((doc: DocumentInput, isResponse: boolean) => {
    const FileIcon = getFileIcon(typeof doc === 'object' ? doc.fileType : getFileTypeFromFilename(doc));
    const isDownloading = isLoadingDownload && downloadingItemId === (typeof doc === 'object' ? doc.id : doc);
    const filename = typeof doc === 'object' ? doc.filename : doc;
    const displayName = decodeURIComponent(filename).split('/').pop() || filename;

    return (
      <View style={[
        styles.documentListItem, 
        isDarkMode ? styles.documentListItemDark : styles.documentListItemLight
      ]} key={typeof doc === 'object' ? doc.id : doc}>
        <View style={styles.documentItemLeft}>
          <View style={[
            styles.documentIcon,
            isDarkMode ? styles.documentIconDark : styles.documentIconLight
          ]}>
            <FileIcon size={24} color={isDarkMode ? "#B388FF" : "#9370DB"} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={[styles.documentName, themeStyles.text]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.documentType, themeStyles.subtleText]}>
              {typeof doc === 'object' ? getFileTypeName(doc.fileType) : getFileTypeName(getFileTypeFromFilename(doc))}
            </Text>
          </View>
        </View>
        <View style={styles.documentActionsContainer}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={isDarkMode ? "#B388FF" : "#9370DB"} />
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.documentAction,
                  isDarkMode ? styles.documentActionDark : styles.documentActionLight
                ]}
                onPress={() => handleDownload(doc)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Download size={20} color={isDarkMode ? "#B388FF" : "#9370DB"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.documentAction,
                  isDarkMode ? styles.documentActionDark : styles.documentActionLight
                ]}
                onPress={() => handlePreview(doc)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Eye size={20} color={isDarkMode ? "#B388FF" : "#9370DB"} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }, [isLoadingDownload, downloadingItemId, isDarkMode, themeStyles, handleDownload, handlePreview]);

  const renderContent = () => {
    const renderMainContent = () => (
      <>
        {/* En-tête de la demande */}
        <View style={[styles.detailsHeader, themeStyles.card]}>
          <View style={styles.detailsHeaderContent}>
            <View style={styles.detailsTypeContainer}>
              {getRequestTypeIcon(selectedRequest.type)}
              <Text style={[styles.detailsType, themeStyles.text]}>{selectedRequest.type}</Text>
            </View>
            <View style={[styles.detailsStatusBadge, { backgroundColor: `${getStatusColor(getRequestStatus(selectedRequest))}20` }]}>
              {getStatusIcon(getRequestStatus(selectedRequest))}
              <Text style={[styles.detailsStatusText, { color: getStatusColor(getRequestStatus(selectedRequest)) }]}>
                {getStatusText(getRequestStatus(selectedRequest))}
              </Text>
            </View>
          </View>
          <Text style={[styles.detailsDescription, themeStyles.subtleText]}>{selectedRequest.description}</Text>
          <View style={styles.detailsDateContainer}>
            <Text style={[styles.detailsDate, themeStyles.subtleText]}>
              {"Soumise le "}
              <Text style={[styles.detailsDateValue, themeStyles.subtleText]}>
                {selectedRequest.details.dateDemande === "N/A" ? "N/A" : formatDate(selectedRequest.details.dateDemande)}
              </Text>
              {selectedRequest.details.dateDemande !== "N/A" && selectedRequest.time && (
                <>
                  {" à "}
                  <Text style={[styles.detailsDateValue, themeStyles.subtleText]}>
                    {selectedRequest.time}
                  </Text>
                </>
              )}
            </Text>
          </View>
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
              {selectedRequest.details.horaireSortie && selectedRequest.details.horaireRetour && (
                <View style={styles.detailsItem}>
                  <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Heure de sortie/retour:</Text>
                  <Text style={[styles.detailsItemValue, themeStyles.text]}>
                    {selectedRequest.details.horaireSortie}:{selectedRequest.details.minuteSortie} →{" "}
                    {selectedRequest.details.horaireRetour}:{selectedRequest.details.minuteRetour}
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
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Titre de formation:</Text>
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
              <Text style={[styles.detailsItemLabel, themeStyles.subtleText]}>Thème de formation:</Text>
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
        {((selectedRequest.details.documents && selectedRequest.details.documents.length > 0) ||
          (selectedRequest.details.filesReponse && selectedRequest.details.filesReponse.length > 0)) && (
          <View style={[styles.detailsSection, themeStyles.card]}>
            <Text style={[styles.detailsSectionTitle, themeStyles.text]}>Documents</Text>
            
            {/* Request Documents */}
            {selectedRequest.details.documents && selectedRequest.details.documents.length > 0 && (
              <View style={styles.documentsContainer}>
                <Text style={[styles.documentsSectionTitle, themeStyles.subtleText]}>Documents joints</Text>
                {selectedRequest.details.documents.map((doc, index) => (
                  <React.Fragment key={typeof doc === 'object' ? doc.id : `doc-${index}`}>
                    {renderDocument(doc, false)}
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Response Documents */}
            {selectedRequest.details.filesReponse && selectedRequest.details.filesReponse.length > 0 && (
              <View style={styles.documentsContainer}>
                <Text style={[styles.documentsSectionTitle, themeStyles.subtleText]}>Documents de réponse</Text>
                {selectedRequest.details.filesReponse.map((doc, index) => (
                  <React.Fragment key={typeof doc === 'object' ? doc.id : `response-${index}`}>
                    {renderDocument(doc, true)}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Historique */}
        <View style={[styles.detailsSection, themeStyles.card]}>
          <Text style={[styles.detailsSectionTitle, themeStyles.text]}>Historique</Text>

          <View style={styles.timelineContainer}>
            <View style={[styles.timelineItem]}>
              <View style={[styles.timelineDot, { backgroundColor: isDarkMode ? "#B388FF" : "#9370DB" }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, themeStyles.text]}>Demande soumise</Text>
                <Text style={[styles.timelineDate, themeStyles.subtleText]}>
                  {selectedRequest.details.dateDemande === "N/A" ? "Date non disponible" : `${formatDate(selectedRequest.details.dateDemande)} ${selectedRequest.time ? `à ${selectedRequest.time}` : ""}`}
                </Text>
              </View>
            </View>

            {selectedRequest.status !== "pending" && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: getStatusColor(getRequestStatus(selectedRequest)) }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, themeStyles.text]}>
                    Demande {getRequestStatus(selectedRequest) === "approved" ? "approuvée" : "rejetée"}
                  </Text>
                  <Text style={[styles.timelineDate, themeStyles.subtleText]}>
                    {getRequestStatus(selectedRequest) === "approved"
                      ? selectedRequest.details.approvalDate || "Un jour après la soumission"
                      : selectedRequest.details.rejectionDate || "Cinq jours après la soumission"}
                  </Text>
                </View>
              </View>
            )}

            {selectedRequest.status === "pending" && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: isDarkMode ? "#FFCA28" : "#FFC107" }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, themeStyles.text]}>En attente d'approbation</Text>
                  <Text style={[styles.timelineDate, themeStyles.subtleText]}>En cours de traitement</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={[
          styles.detailsActions, 
          themeStyles.card,
          isDarkMode ? styles.detailsActionsDark : {}
        ]}>
          <TouchableOpacity 
            style={[
              styles.detailsActionButton, 
              isDarkMode ? styles.detailsActionButtonDark : themeStyles.detailsActionButton
            ]} 
            onPress={onClose}
          >
            <Text style={[
              styles.detailsActionButtonText, 
              isDarkMode ? styles.detailsActionButtonTextDark : themeStyles.detailsActionButtonText
            ]}>
              Fermer
            </Text>
          </TouchableOpacity>

          {selectedRequest.status === "pending" && (
            <>
              <TouchableOpacity
                style={[
                  styles.detailsActionButton, 
                  { 
                    backgroundColor: isDarkMode ? "#B388FF" : "#9370DB",
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }
                ]}
                onPress={() => onEdit(selectedRequest)}
              >
                <Edit size={20} color="#FFFFFF" />
                <Text style={styles.detailsActionButtonText}>
                  {Platform.OS === 'android' ? 'Modifier la demande' : 'Modifier'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.detailsActionButton, 
                  { 
                    backgroundColor: isDarkMode ? "#EF5350" : "#F44336",
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }
                ]}
                onPress={handleDeleteRequest}
              >
                <Trash size={20} color="#FFFFFF" />
                <Text style={styles.detailsActionButtonText}>
                  {Platform.OS === 'android' ? 'Supprimer la demande' : 'Supprimer'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </>
    );

    // iOS layout
    if (Platform.OS === "ios") {
      return (
        <View style={[
          styles.detailsModalContainer, 
          isDarkMode ? styles.detailsModalContainerDark : styles.detailsModalContainerLight
        ]}>
          {renderPreviewModal()}
          {renderDeleteConfirmModal()}
          <View style={[
            styles.detailsModalHeader, 
            isDarkMode ? styles.detailsModalHeaderDark : themeStyles.card
          ]}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={22} color={isDarkMode ? "#E0E0E0" : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.detailsModalTitle, themeStyles.text]}>Détails de la demande</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>

          <ScrollView
            style={[
              styles.detailsScrollContainer,
              isDarkMode ? styles.detailsScrollContainerDark : {}
            ]}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderMainContent()}
          </ScrollView>
        </View>
      );
    }

    // Android layout
    return (
      <View style={[
        styles.detailsModalContainer, 
        isDarkMode ? styles.detailsModalContainerDark : styles.detailsModalContainerLight
      ]}>
        {renderPreviewModal()}
        {renderDeleteConfirmModal()}
        <View style={[
          styles.statusBarSpace,
          { backgroundColor: isDarkMode ? '#1a1f38' : '#FFFFFF', height: STATUSBAR_HEIGHT }
        ]} />

        <View style={[
          styles.androidHeader,
          { backgroundColor: isDarkMode ? '#1a1f38' : '#FFFFFF' }
        ]}>
          <TouchableOpacity 
            style={styles.androidBackButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
          </TouchableOpacity>

          <View style={styles.androidTitleContainer}>
            <Text style={[styles.androidTitle, { color: isDarkMode ? "#E0E0E0" : "#333" }]} numberOfLines={1}>
              Détails
            </Text>
            <Text style={[styles.androidSubtitle, { color: isDarkMode ? "#E0E0E0" : "#333" }]} numberOfLines={1}>
              de la demande
            </Text>
          </View>

          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView
          style={[
            styles.detailsScrollContainer,
            { backgroundColor: isDarkMode ? '#1a1f38' : '#F5F5F5' }
          ]}
          contentContainerStyle={[
            styles.detailsScrollContent,
            { paddingTop: 8 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderMainContent()}
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      <StatusBar
        backgroundColor={isDarkMode ? '#1a1f38' : '#FFFFFF'}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={Platform.OS === 'android'}
      />
      {renderContent()}
    </>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  detailsModalContainer: {
    flex: 1,
  } as ViewStyle,
  detailsModalContainerLight: {
    backgroundColor: "#F5F5F5",
  } as ViewStyle,
  detailsModalContainerDark: {
    backgroundColor: "#121212",
  } as ViewStyle,
  detailsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
  detailsModalHeaderDark: {
    backgroundColor: "#1a1f38",
    borderBottomColor: "rgba(255,255,255,0.1)",
  } as ViewStyle,
  backButton: {
    padding: 12,
    marginLeft: -12,
  } as ViewStyle,
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  } as TextStyle,
  headerRightPlaceholder: {
    width: 40,
  } as ViewStyle,
  detailsScrollContainer: {
    flex: 1,
  },
  detailsScrollContainerDark: {
    backgroundColor: "#121212",
  },
  detailsScrollContent: {
    padding: 16,
  },
  detailsHeader: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  detailsHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  } as ViewStyle,
  detailsTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  } as ViewStyle,
  detailsType: {
    fontSize: 18,
    fontWeight: "600",
  } as TextStyle,
  detailsStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  } as ViewStyle,
  detailsStatusText: {
    fontSize: 14,
    fontWeight: "500",
  } as TextStyle,
  detailsDescription: {
    fontSize: 16,
    marginBottom: 12,
  } as TextStyle,
  detailsDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  detailsDate: {
    fontSize: 14,
  } as TextStyle,
  detailsDateValue: {
    fontSize: 14,
    fontWeight: "500",
  } as TextStyle,
  detailsSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  } as ViewStyle,
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  } as TextStyle,
  detailsItem: {
    marginBottom: 12,
  } as ViewStyle,
  detailsItemLabel: {
    fontSize: 14,
    marginBottom: 4,
  } as TextStyle,
  detailsItemValue: {
    fontSize: 16,
    fontWeight: "500",
  } as TextStyle,
  timelineContainer: {
    paddingLeft: 8,
  } as ViewStyle,
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
  } as ViewStyle,
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
    marginTop: 4,
  } as ViewStyle,
  timelineContent: {
    flex: 1,
  } as ViewStyle,
  timelineTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  } as TextStyle,
  timelineDate: {
    fontSize: 14,
  } as TextStyle,
  detailsActions: {
    flexDirection: Platform.OS === 'android' ? "column" : "row",
    justifyContent: Platform.OS === 'android' ? "stretch" : "space-between",
    alignItems: Platform.OS === 'android' ? "stretch" : "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: Platform.OS === 'android' ? 12 : 8,
  } as ViewStyle,
  detailsActionsDark: {
    backgroundColor: "#1E1E1E",
  } as ViewStyle,
  detailsActionButton: {
    flex: Platform.OS === 'android' ? 0 : 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Platform.OS === 'android' ? 12 : 16,
    borderRadius: 12,
    marginHorizontal: 8,
    minWidth: Platform.OS === 'android' ? 160 : 'auto',
  } as ViewStyle,
  detailsActionButtonDark: {
    backgroundColor: "#333333",
  } as ViewStyle,
  detailsActionButtonText: {
    color: "#FFFFFF",
    fontSize: Platform.OS === 'android' ? 14 : 16,
    fontWeight: "600",
  } as TextStyle,
  detailsActionButtonTextDark: {
    color: "#E0E0E0",
  } as TextStyle,
  documentsContainer: {
    marginTop: 12,
  } as ViewStyle,
  documentsSectionTitle: {
    fontSize: 14,
    marginBottom: 8,
  } as TextStyle,
  documentListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  } as ViewStyle,
  documentListItemLight: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  } as ViewStyle,
  documentListItemDark: {
    backgroundColor: "rgba(179, 136, 255, 0.15)",
  } as ViewStyle,
  documentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  } as ViewStyle,
  documentName: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  } as TextStyle,
  documentActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  documentAction: {
    padding: 8,
    borderRadius: 20,
  },
  documentActionLight: {
    backgroundColor: "rgba(147, 112, 219, 0.1)",
  },
  documentActionDark: {
    backgroundColor: "rgba(179, 136, 255, 0.2)",
  },
  previewButton: {
    marginRight: 8,
  } as ViewStyle,
  downloadButton: {
    marginLeft: 8,
  } as ViewStyle,
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  } as ViewStyle,
  documentType: {
    fontSize: 12,
    marginTop: 2,
  } as TextStyle,
  modalContainer: {
    flex: 1,
  } as ViewStyle,
  modalContainerDark: {
    backgroundColor: "#1a1f38",
  } as ViewStyle,
  modalContainerLight: {
    backgroundColor: "#ffffff",
  } as ViewStyle,
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  } as ViewStyle,
  modalHeaderDark: {
    backgroundColor: "#1a1f38",
    borderBottomColor: "rgba(255,255,255,0.1)",
  } as ViewStyle,
  modalHeaderLight: {
    backgroundColor: "#ffffff",
    borderBottomColor: "rgba(0,0,0,0.1)",
  } as ViewStyle,
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 16,
  } as TextStyle,
  modalCloseButton: {
    padding: 8,
  } as ViewStyle,
  webView: {
    flex: 1,
  } as ViewStyle,
  webViewLoading: {
    ...RNStyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,
  loadingTextModal: {
    marginTop: 12,
    fontSize: 16,
  } as TextStyle,
  textLight: {
    color: "#E0E0E0",
  } as TextStyle,
  textDark: {
    color: "#333333",
  } as TextStyle,
  // Android specific styles
  statusBarSpace: {
    width: '100%',
  } as ViewStyle,
  androidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 4,
  } as ViewStyle,
  androidBackButton: {
    padding: 12,
    marginLeft: 0,
  } as ViewStyle,
  androidTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  androidTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
  androidSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentIconLight: {
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
  },
  documentIconDark: {
    backgroundColor: 'rgba(179, 136, 255, 0.2)',
  },
  imagePreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  previewActionsLight: {
    backgroundColor: '#FFFFFF',
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  previewActionsDark: {
    backgroundColor: '#1a1f38',
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  previewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Delete confirmation modal styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  } as ViewStyle,
  confirmModalContainer: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  } as ViewStyle,
  confirmModalContainerLight: {
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  confirmModalContainerDark: {
    backgroundColor: '#1E1E1E',
  } as ViewStyle,
  confirmModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
  } as ViewStyle,
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  } as TextStyle,
  confirmModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    paddingHorizontal: 8,
  } as TextStyle,
  confirmModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  } as ViewStyle,
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
  confirmModalCancelButton: {
    borderWidth: 2,
  } as ViewStyle,
  confirmModalCancelButtonLight: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  } as ViewStyle,
  confirmModalCancelButtonDark: {
    backgroundColor: '#333333',
    borderColor: '#555555',
  } as ViewStyle,
  confirmModalDeleteButton: {
    backgroundColor: '#F44336',
  } as ViewStyle,
  confirmModalDeleteButtonDark: {
    backgroundColor: '#EF5350',
  } as ViewStyle,
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  confirmModalCancelTextLight: {
    color: '#666666',
  } as TextStyle,
  confirmModalCancelTextDark: {
    color: '#E0E0E0',
  } as TextStyle,
  confirmModalDeleteText: {
    color: '#FFFFFF',
  } as TextStyle,
  textLightSecondary: {
    color: '#B0B0B0',
  } as TextStyle,
  textDarkSecondary: {
    color: '#666666',
  } as TextStyle,
})

export default DemandesDetails