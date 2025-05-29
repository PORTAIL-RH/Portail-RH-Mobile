import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  Platform,
  ListRenderItem,
  Linking,
  Share,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NavBar from "../Components/NavBar"; // Ensure this path is correct
import Footer from "../Components/Footer"; // Ensure this path is correct
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { shareAsync } from "expo-sharing";
import { WebView } from "react-native-webview";
import { API_CONFIG } from "../config/apiConfig"; // Ensure this path is correct
import Pdf from 'react-native-pdf';
const { width } = Dimensions.get("window");

interface Document {
  id: string;
  title: string;
  size: string;
  date: string;
  url: string;
  mimeType: string;
  filename: string;
  fileId?: string; // Kept for compatibility, id is used as primary
}

interface CachedData {
  documents: Document[];
  timestamp: number;
  userId: string;
}

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_KEY = 'documents_cache';

const DocumentsScreen: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string>(""); // Explicitly string
  const insets = useSafeAreaInsets();

  // Load theme, user ID and token from storage
  const loadData = useCallback(async () => {
    try {
      const [storedTheme, storedUserId, storedToken] = await Promise.all([
        AsyncStorage.getItem("theme"),
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("userToken"),
      ]);
      setIsDarkMode(storedTheme === "dark");
      if (storedUserId) setUserId(storedUserId);
      setToken(storedToken || ""); // Default to empty string if null
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Erreur critique", "Impossible de charger les données initiales. Veuillez redémarrer l'application.");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format file size to human readable format
  const formatFileSize = useCallback((bytes: number): string => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  // Add theme toggle handler
  const toggleTheme = useCallback(async () => {
    try {
      const newTheme = !isDarkMode;
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
      setIsDarkMode(newTheme);
    } catch (error) {
      console.error("Error toggling theme:", error);
    }
  }, [isDarkMode]);

  // Add logout handler (required by NavBar props)
  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["userToken", "userId", "theme"]);
      // You might want to navigate to login screen or trigger auth state change here
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  // Load cached data
  const loadCachedDocuments = useCallback(async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { documents: cachedDocs, timestamp, userId: cachedUserId }: CachedData = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
        const isSameUser = cachedUserId === userId;

        if (!isExpired && isSameUser && cachedDocs.length > 0) {
          console.log('[CACHE] Using cached documents');
          setDocuments(cachedDocs);
          setFilteredDocuments(cachedDocs);
          setIsLoading(false);
          return true; // Cache was valid and used
        }
      }
      return false; // Cache was invalid or not found
    } catch (error) {
      console.error('[CACHE] Error loading cached documents:', error);
      return false;
    }
  }, [userId]);

  // Cache the documents
  const cacheDocuments = useCallback(async (docs: Document[]) => {
    try {
      const cacheData: CachedData = {
        documents: docs,
        timestamp: Date.now(),
        userId: userId || '',
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('[CACHE] Documents cached successfully');
    } catch (error) {
      console.error('[CACHE] Error caching documents:', error);
    }
  }, [userId]);

  // Modified fetchDocuments to work with cache
  const fetchDocuments = useCallback(async (forceFetch: boolean = false) => {
    console.log('[DEBUG] Starting fetchDocuments...');
    
    if (!userId || !token) {
      console.error('[ERROR] Missing required data for fetching documents:', { userIdExists: !!userId, tokenExistsAndNotEmpty: !!token });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Try to use cache first if not forcing fetch
      if (!forceFetch) {
        const usedCache = await loadCachedDocuments();
        if (usedCache) {
          return; // Exit if we successfully used the cache
        }
      }

      const apiUrl = `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-document/personnel/${userId}/files-reponse`;
      console.log('[DEBUG] Fetching fresh documents from:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[ERROR] API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorBody,
        });
        
        if (response.status === 401) {
          // Handle unauthorized - clear cache
          await AsyncStorage.removeItem(CACHE_KEY);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorBody || 'Failed to fetch documents'}`);
      }

      const data = await response.json();
      const formattedDocuments: Document[] = (data || [])
        .map((doc: any) => {
          if (!doc || !doc.fileId) return null;
          return {
            id: doc.fileId,
            title: doc.filename || `Document ${doc.fileId}`,
            size: doc.size ? formatFileSize(doc.size) : 'N/A',
            date: doc.uploadDate || new Date().toISOString(),
            url: `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/files/download/${doc.fileId}`,
            mimeType: doc.fileType || 'application/octet-stream',
            filename: doc.filename || `document-${doc.fileId}.${doc.fileType?.split('/')[1] || 'bin'}`,
          };
        })
        .filter((doc: Document | null): doc is Document => doc !== null);

      setDocuments(formattedDocuments);
      setFilteredDocuments(formattedDocuments);
      
      // Cache the new documents
      await cacheDocuments(formattedDocuments);
      
    } catch (error) {
      console.error('[ERROR] Fetch documents failed:', error);
      // Try to load from cache as fallback if fetch fails
      const usedCache = await loadCachedDocuments();
      if (!usedCache) {
        Alert.alert(
          'Erreur de connexion',
          'Impossible de charger les documents. Veuillez vérifier votre connexion internet ou réessayer plus tard.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, token, formatFileSize, loadCachedDocuments, cacheDocuments]);

  // Add pull-to-refresh functionality
  const onRefresh = useCallback(() => {
    fetchDocuments(true); // Force fetch from server
  }, [fetchDocuments]);

  useEffect(() => {
    if (userId && token) {
      fetchDocuments(false); // Try to use cache first
    }
  }, [userId, token, fetchDocuments]);

  // Filter documents based on search query
  useEffect(() => {
    if (searchQuery) {
      const results = documents.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocuments(results);
    } else {
      setFilteredDocuments(documents);
    }
  }, [searchQuery, documents]);

  // Get appropriate icon for file type
  const getFileIcon = useCallback((mimeType: string): keyof typeof Feather.glyphMap => {
    if (!mimeType) return "file";
    const lowerMimeType = mimeType.toLowerCase();
    if (lowerMimeType.includes("pdf")) return "file-text";
    if (lowerMimeType.includes("image")) return "image";
    if (lowerMimeType.includes("word")) return "file-text"; 
    if (lowerMimeType.includes("excel") || lowerMimeType.includes("spreadsheet")) return "grid"; 
    if (lowerMimeType.includes("powerpoint") || lowerMimeType.includes("presentation")) return "airplay"; 
    if (lowerMimeType.includes("zip") || lowerMimeType.includes("archive")) return "archive";
    if (lowerMimeType.includes("text")) return "file-text";
    return "file";
  }, []);

  // Add helper function to get friendly file type name
  const getFileTypeName = useCallback((mimeType: string): string => {
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('image')) return 'Image';
    if (type.includes('word') || type.includes('document')) return 'Document';
    if (type.includes('excel') || type.includes('sheet')) return 'Feuille de calcul';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'Présentation';
    if (type.includes('text')) return 'Texte';
    if (type.includes('zip') || type.includes('archive')) return 'Archive';
    return 'Fichier';
  }, []);

  // Modify the openFile function to properly handle file access
  const openFile = useCallback(async (fileUri: string, mimeType: string) => {
    try {
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: mimeType,
        });
      } else {
        // For iOS, we need to ensure the file is in a shared location
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error("File doesn't exist");
        }
        
        // Create a temporary file in the cache directory which is accessible
        const tempFile = `${FileSystem.cacheDirectory}temp_${Date.now()}_${fileUri.split('/').pop()}`;
        await FileSystem.copyAsync({
          from: fileUri,
          to: tempFile
        });
        
        await shareAsync(tempFile, { 
          mimeType, 
          UTI: mimeType,
          dialogTitle: 'Ouvrir le document'
        });
        
        // Clean up the temp file after sharing
        try {
          await FileSystem.deleteAsync(tempFile, { idempotent: true });
        } catch (cleanupError) {
          console.warn("Cleanup error:", cleanupError);
        }
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Erreur", "Impossible d'ouvrir le fichier. Veuillez réessayer.");
    }
  }, []);

  // Modify the download function to use proper directories and handle permissions
  const performActualDownload = useCallback(async (document: Document, filename: string) => {
    if (!token) {
      Alert.alert("Erreur d'authentification", "Token manquant. Impossible de télécharger.");
      setIsLoadingDownload(false);
      setDownloadingItemId(null);
      return;
    }

    try {
      // Use cache directory for temporary storage
      const tempDirectory = FileSystem.cacheDirectory;
      if (!tempDirectory) {
        throw new Error("Cannot access cache directory");
      }

      // Create a safe filename
      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const downloadPath = `${tempDirectory}${safeFilename}`;

      // Download the file
      const downloadResumable = FileSystem.createDownloadResumable(
        document.url,
        downloadPath,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${progress * 100}%`);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        throw new Error("Download failed - no URI received");
      }

      // Open the downloaded file
      await openFile(result.uri, document.mimeType);

    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(
        "Erreur de téléchargement",
        "Impossible de télécharger le document. Veuillez réessayer."
      );
    } finally {
      setIsLoadingDownload(false);
      setDownloadingItemId(null);
    }
  }, [token, openFile]);

  // Modify handleDownload to use the new performActualDownload
  const handleDownload = useCallback(async (document: Document) => {
    if (!document?.filename || !document?.url) {
      Alert.alert("Erreur", "Informations de document invalides pour le téléchargement.");
      return;
    }

    setDownloadingItemId(document.id);
    setIsLoadingDownload(true);

    try {
      await performActualDownload(document, document.filename);
    } catch (error) {
      console.error("Error in handleDownload:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors du téléchargement. Veuillez réessayer."
      );
      setIsLoadingDownload(false);
      setDownloadingItemId(null);
    }
  }, [performActualDownload]);

  // Handle document preview
  const handlePreview = useCallback((document: Document) => {
    console.log('[PREVIEW] Attempting to preview:', document.filename, document.mimeType);
    
    if (!token) {
      Alert.alert("Erreur d'authentification", "Token manquant. Impossible de prévisualiser.");
      return;
    }
    if (!document.url || !document.mimeType) {
      Alert.alert("Erreur", "Informations invalides pour la prévisualisation du document.");
      return;
    }

    const canDirectlyPreview = ["application/pdf", "image/", "text/"].some((type) =>
      document.mimeType.toLowerCase().includes(type)
    );

    if (!canDirectlyPreview) {
      Alert.alert(
        "Aperçu non supporté",
        `Ce type de fichier (${document.mimeType}) n'est pas directement prévisualisable. Essayez de le télécharger.`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Télécharger", onPress: () => handleDownload(document) }
        ]
      );
      return;
    }

    setSelectedDocument(document);
    setPreviewVisible(true);
  }, [token, handleDownload]);

  const closePreview = useCallback(() => {
    setPreviewVisible(false);
    setSelectedDocument(null);
  }, []);

  const renderPreviewModal = useCallback(() => {
    if (!selectedDocument) return null;

    const webViewLoadingBackgroundColor = isDarkMode ? 'rgba(26, 31, 56, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    
    const webViewSource = {
      uri: selectedDocument.url,
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    };

    return (
      <Modal
        visible={previewVisible}
        animationType="slide"
        onRequestClose={closePreview}
        transparent={false}
      >
        <View style={[
          styles.modalContainer,
          isDarkMode ? styles.modalContainerDark : styles.modalContainerLight,
          { paddingTop: insets.top }
        ]}>
          <View style={[styles.modalHeader, isDarkMode ? styles.modalHeaderDark : styles.modalHeaderLight]}>
            <Text
              style={[styles.modalTitle, isDarkMode ? styles.textLight : styles.textDark]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {selectedDocument.filename}
            </Text>
            <TouchableOpacity 
              onPress={closePreview}
              style={styles.modalCloseButton}
            >
              <Feather 
                name="x" 
                size={28} 
                color={isDarkMode ? "#E0E0E0" : "#555555"}
              />
            </TouchableOpacity>
          </View>

          <WebView
            key={`${selectedDocument.id}-${token}-${selectedDocument.url}`}
            source={webViewSource}
            style={[styles.webView, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}
            containerStyle={{ flex: 1, backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={[styles.webViewLoading, { backgroundColor: webViewLoadingBackgroundColor }]}>
                <ActivityIndicator size="large" color={isDarkMode ? "#B388FF" : "#0e135f"} />
                <Text style={[styles.loadingTextModal, isDarkMode ? styles.textLight : styles.textDark]}>
                  Chargement de l'aperçu...
                </Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView error:", nativeEvent);
              Alert.alert(
                "Erreur d'aperçu",
                "Impossible d'afficher le document. Veuillez réessayer.",
                [{ text: "OK", onPress: closePreview }]
              );
            }}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            cacheEnabled={false}
            androidLayerType="hardware"
            overScrollMode="never"
            scrollEnabled={true}
            bounces={false}
            injectedJavaScript={`
              (function() {
                document.body.style.backgroundColor = '${isDarkMode ? '#121212' : '#FFFFFF'}';
                document.documentElement.style.backgroundColor = '${isDarkMode ? '#121212' : '#FFFFFF'}';
                
                // Force PDF to fit width
                if (document.querySelector('embed[type="application/pdf"]')) {
                  document.querySelector('embed[type="application/pdf"]').style.width = '100%';
                  document.querySelector('embed[type="application/pdf"]').style.height = '100%';
                }
                
                // Force images to fit width
                const imgs = document.getElementsByTagName('img');
                for(let i = 0; i < imgs.length; i++) {
                  imgs[i].style.maxWidth = '100%';
                  imgs[i].style.height = 'auto';
                }
                
                true;
              })();
            `}
            onMessage={() => {}}
          />
        </View>
      </Modal>
    );
  }, [previewVisible, selectedDocument, isDarkMode, token, insets, closePreview]);

  // Modify renderDocumentItem
  const renderDocumentItem: ListRenderItem<Document> = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={[
          styles.documentCard,
          isDarkMode ? styles.documentCardDark : styles.documentCardLight,
        ]}
        onPress={() => handlePreview(item)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.documentIconContainer,
            isDarkMode
              ? styles.documentIconContainerDark
              : styles.documentIconContainerLight,
          ]}
        >
          <Feather
            name={getFileIcon(item.mimeType)}
            size={24}
            color={isDarkMode ? "#B388FF" : "#0e135f"}
          />
        </View>
        <View style={styles.documentInfo}>
          <Text
            style={[
              styles.documentTitle,
              isDarkMode ? styles.textLight : styles.textDark,
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          <View style={styles.documentMetaContainer}>

            <Text
              style={[
                styles.documentMeta,
                isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary,
              ]}
            >
              {getFileTypeName(item.mimeType)}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.previewButton]}
            onPress={() => handlePreview(item)}
            activeOpacity={0.7}
          >
            <Feather 
              name="eye" 
              size={20} 
              color={isDarkMode ? "#B388FF" : "#0e135f"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDownload(item);
            }}
            activeOpacity={0.7}
            disabled={isLoadingDownload && downloadingItemId === item.id}
          >
            {isLoadingDownload && downloadingItemId === item.id ? (
              <ActivityIndicator size="small" color={isDarkMode ? "#B388FF" : "#0e135f"} />
            ) : (
              <Feather 
                name="download-cloud" 
                size={20} 
                color={isDarkMode ? "#B388FF" : "#0e135f"} 
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [isDarkMode, isLoadingDownload, downloadingItemId, getFileIcon, handlePreview, handleDownload, getFileTypeName]
  );

  // Main return
  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
        // For Android, paddingTop for status bar is often handled by themes or if status bar is translucent.
        // For iOS, SafeAreaView usually handles top inset, but if NavBar is not in SafeAreaProvider, manual insets.top is needed.
        // Assuming NavBar handles its own safe area or is part of a screen with SafeAreaView.
        { paddingTop: Platform.OS === 'android' ? insets.top : 0 }, 
      ]}
    >
      <NavBar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />

      <View style={[styles.content, {paddingTop: 10}] /* Added small paddingTop for content below NavBar */}>
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchInputContainer,
              isDarkMode ? styles.searchInputContainerDark : styles.searchInputContainerLight,
            ]}
          >
            <Feather
              name="search"
              size={20}
              color={isDarkMode ? "#BDBDBD" : "#757575"}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, isDarkMode ? styles.textLight : styles.textDark]}
              placeholder="Rechercher un document..."
              placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing" // iOS specific, good UX
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDarkMode ? "#B388FF" : "#0e135f"}/>
            <Text style={[styles.statusText, isDarkMode ? styles.textLight : styles.textDark]}>
              Chargement des documents...
            </Text>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={50} color={isDarkMode ? "#7986CB" : "#A0A0A0"}/>
            <Text style={[styles.emptyStateTitle, isDarkMode ? styles.textLight : styles.textDark]}>
              {searchQuery ? "Aucun résultat trouvé" : "Aucun document"}
            </Text>
            <Text style={[styles.emptyStateSubtitle, isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary]}>
              {searchQuery ? "Essayez une autre recherche ou effacez les filtres." : "Vos documents apparaîtront ici dès qu'ils seront disponibles."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredDocuments}
            renderItem={renderDocumentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.documentsList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="file-text" size={50} color={isDarkMode ? "#7986CB" : "#A0A0A0"}/>
                <Text style={[styles.emptyStateTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                  {searchQuery ? "Aucun résultat trouvé" : "Aucun document"}
                </Text>
                <Text style={[styles.emptyStateSubtitle, isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary]}>
                  {searchQuery ? "Essayez une autre recherche ou effacez les filtres." : "Vos documents apparaîtront ici dès qu'ils seront disponibles."}
                </Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: insets.bottom + 80 }} />} // Ensure space for footer and some breathing room
          />
        )}
      </View>

      {renderPreviewModal()}
      <Footer 
        // Pass necessary props if Footer is interactive or theme-dependent
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: "#F4F6F8" },
  containerDark: { backgroundColor: "#1a1f38" },
  content: { flex: 1, paddingHorizontal: 16 },
  textLight: { color: "#E0E0E0" },
  textDark: { color: "#1a1f38" },
  textLightSecondary: { color: "#BDBDBD" },
  textDarkSecondary: { color: "#757575" },

  searchContainer: { paddingBottom: 12 }, // Use paddingBottom instead of Vertical for one-sided spacing
  searchInputContainer: { flexDirection: "row", alignItems: "center", borderRadius: 25, paddingHorizontal: 15, paddingVertical: Platform.OS === "ios" ? 12 : 10, borderWidth: 1 },
  searchInputContainerLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  searchInputContainerDark: { backgroundColor: "#1a1f38", borderColor: "#333333" },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusText: { marginTop: 16, fontSize: 16, fontWeight: "500" },
  loadingTextModal: { marginTop: 12, fontSize: 15, fontWeight: "500" },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingBottom: 50 },
  emptyStateTitle: { fontSize: 18, fontWeight: "600", textAlign: "center", marginTop: 20, marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  documentsList: { paddingBottom: 20 },
  documentCard: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12, borderRadius: 10, borderWidth: 1 },
  documentCardLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0", shadowColor: "#000000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  documentCardDark: { backgroundColor: "#1a1f38", borderColor: "#333333" },
  documentIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 12 },
  documentIconContainerLight: { backgroundColor: "rgba(14, 19, 95, 0.08)" },
  documentIconContainerDark: { backgroundColor: "rgba(179, 136, 255, 0.15)" },
  documentInfo: { flex: 1, marginRight: 16 },
  documentTitle: { fontSize: 15, fontWeight: "600", marginBottom: 5 },
  documentMetaContainer: { flexDirection: "row", alignItems: "center", flexWrap: 'wrap' },
  documentMeta: { fontSize: 12, opacity: 0.9 },
  metaDivider: { width: 1, height: 10, marginHorizontal: 6, opacity: 0.5 },
  metaDividerLight: { backgroundColor: "#BDBDBD" },
  metaDividerDark: { backgroundColor: "#555555" },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  previewButton: {
    marginRight: 4,
  },
  
  modalContainer: { flex: 1, backgroundColor: 'transparent' },
  modalContainerLight: { backgroundColor: "#FFFFFF" },
  modalContainerDark: { backgroundColor: "#1a1f38" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  modalHeaderLight: { borderBottomColor: "#E0E0E0" },
  modalHeaderDark: { borderBottomColor: "#1a1f38" },
  modalTitle: { fontSize: 17, fontWeight: "600", flex: 1, marginRight: 16 },
  modalCloseButton: { padding: 8 },
  webView: { 
    flex: 1,
    backgroundColor: 'transparent',
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'transparent',
  },
  
  unsupportedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  unsupportedText: { fontSize: 16, marginVertical: 20, textAlign: 'center', lineHeight: 22 },
  actionButtonModal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, marginTop: 20, borderWidth: 1 },
  actionButtonModalLight: { backgroundColor: 'rgba(14, 19, 95, 0.1)', borderColor: 'rgba(14, 19, 95, 0.2)' },
  actionButtonModalDark: { backgroundColor: 'rgba(179, 136, 255, 0.15)', borderColor: 'rgba(179, 136, 255, 0.3)' },
  actionButtonTextModal: { fontSize: 16, fontWeight: '500' },
});

export default DocumentsScreen;