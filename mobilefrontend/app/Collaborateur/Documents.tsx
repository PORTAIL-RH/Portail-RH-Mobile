import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Image as RNImage,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NavBar from "../Components/NavBar";
import Footer from "../Components/Footer";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { shareAsync } from "expo-sharing";
import { WebView } from "react-native-webview";
import { API_CONFIG } from "../config/apiConfig";
import Toast from "react-native-toast-message";
import { X, Download } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface Document {
  id: string;
  title: string;
  size: string;
  date: string;
  url: string;
  mimeType: string;
  filename: string;
  fileId?: string;
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
  const [token, setToken] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);
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
      setToken(storedToken || "");
    } catch (error) {
      console.error("Error loading data:", error);
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

  // Add logout handler
  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["userToken", "userId", "theme"]);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  // Optimized cache loading with error handling
  const loadCachedDocuments = useCallback(async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { documents: cachedDocs, timestamp, userId: cachedUserId }: CachedData = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
        const isSameUser = cachedUserId === userId;

        if (!isExpired && isSameUser && cachedDocs.length > 0) {
          setDocuments(cachedDocs);
          setFilteredDocuments(cachedDocs);
          setIsLoading(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached documents:', error);
      return false;
    }
  }, [userId]);

  // Optimized document caching
  const cacheDocuments = useCallback(async (docs: Document[]) => {
    try {
      const cacheData: CachedData = {
        documents: docs,
        timestamp: Date.now(),
        userId: userId || '',
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching documents:', error);
    }
  }, [userId]);

  // Optimized fetchDocuments with timeout and retry
  const fetchDocuments = useCallback(async (forceFetch: boolean = false) => {
    if (!userId || !token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Try to use cache first if not forcing fetch
      if (!forceFetch) {
        const usedCache = await loadCachedDocuments();
        if (usedCache) {
          return;
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000); // Increase to 15 seconds

      const apiUrl = `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/demande-document/personnel/${userId}/files-reponse`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const formattedDocuments = (data || [])
        .map((doc: any) => {
          if (!doc?.fileId) return null;
          return {
            id: doc.fileId,
            title: doc.filename || `Document ${doc.fileId}`,
            size: doc.size ? formatFileSize(doc.size) : 'N/A',
            date: doc.uploadDate || new Date().toISOString(),
            url: `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/files/download/${doc.fileId}`,
            mimeType: doc.fileType || 'application/octet-stream',
            filename: doc.filename || `document-${doc.fileId}.${doc.fileType?.split('/')[1] || 'bin'}`,
            fileId: doc.fileId,
          };
        })
        .filter(Boolean);

      setDocuments(formattedDocuments);
      setFilteredDocuments(formattedDocuments);
      await cacheDocuments(formattedDocuments);
      
    } catch (error) {
      console.error('Fetch documents failed:', error);
      const usedCache = await loadCachedDocuments();
      if (!usedCache) {
        Alert.alert(
          'Connection Error',
          'Could not load documents. Please check your internet connection.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, token, formatFileSize, loadCachedDocuments, cacheDocuments]);

  // Add pull-to-refresh functionality
  const onRefresh = useCallback(() => {
    fetchDocuments(true);
  }, [fetchDocuments]);

  useEffect(() => {
    if (userId && token) {
      fetchDocuments();
    }
  }, [userId, token, fetchDocuments]);

  // Optimized document filtering with memoization
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

  // Memoized file icon getter
  const getFileIcon = useMemo(() => (mimeType: string): keyof typeof Feather.glyphMap => {
    if (!mimeType) return "file";
    const type = mimeType.toLowerCase();
    if (type.includes("pdf")) return "file-text";
    if (type.includes("image")) return "image";
    if (type.includes("word")) return "file-text"; 
    if (type.includes("excel") || type.includes("spreadsheet")) return "grid"; 
    if (type.includes("powerpoint") || type.includes("presentation")) return "airplay"; 
    if (type.includes("zip") || type.includes("archive")) return "archive";
    if (type.includes("text")) return "file-text";
    return "file";
  }, []);

  // Memoized file type name getter
  const getFileTypeName = useMemo(() => (mimeType: string): string => {
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('image')) return 'Image';
    if (type.includes('word') || type.includes('document')) return 'Document';
    if (type.includes('excel') || type.includes('sheet')) return 'Spreadsheet';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'Presentation';
    if (type.includes('text')) return 'Text';
    if (type.includes('zip') || type.includes('archive')) return 'Archive';
    return 'File';
  }, []);

  // Optimized file opening with error handling
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
        const tempFile = `${FileSystem.cacheDirectory}temp_${Date.now()}_${fileUri.split('/').pop()}`;
        await FileSystem.copyAsync({ from: fileUri, to: tempFile });
        await shareAsync(tempFile, { mimeType, UTI: mimeType });
        await FileSystem.deleteAsync(tempFile, { idempotent: true });
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "Could not open file. Please try again.");
    }
  }, []);

  // Optimized download function with progress tracking
  const handleDownload = useCallback(async (document: Document) => {
    if (!document?.filename || !document?.url || !token) {
      Alert.alert("Error", "Invalid document information for download.");
      return;
    }

    setDownloadingItemId(document.id);
    setIsLoadingDownload(true);

    try {
      const tempDirectory = FileSystem.cacheDirectory;
      if (!tempDirectory) throw new Error("Cannot access cache directory");

      const safeFilename = document.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const downloadPath = `${tempDirectory}${safeFilename}`;
      const downloadUrl = `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/files/download/${document.fileId || document.id}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        downloadPath,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
          },
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (!result?.uri) throw new Error("Download failed - no URI received");

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(result.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: document.mimeType,
        });
      } else {
        await shareAsync(result.uri, {
          mimeType: document.mimeType,
          UTI: document.mimeType,
          dialogTitle: "Open Document",
        });
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "File downloaded successfully",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download file. Please try again.");
    } finally {
      setIsLoadingDownload(false);
      setDownloadingItemId(null);
    }
  }, [token]);

  // Optimized preview handler
  const handlePreview = useCallback((document: Document) => {
    if (!token || !document.url || !document.mimeType) {
      Alert.alert("Error", "Invalid document information for preview.");
      return;
    }

    const canDirectlyPreview = ["application/pdf", "image/", "text/"].some((type) =>
      document.mimeType.toLowerCase().includes(type)
    );

    if (!canDirectlyPreview) {
      Alert.alert(
        "Preview Not Supported",
        `This file type (${document.mimeType}) cannot be previewed directly. Try downloading it.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Download", onPress: () => handleDownload(document) }
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
    setImageUri(null);
  }, []);

  // Optimized image loading for preview
  useEffect(() => {
    if (selectedDocument?.mimeType?.startsWith('image/') && token) {
      const loadImage = async () => {
        try {
          const tempDir = FileSystem.cacheDirectory;
          const fileName = selectedDocument.filename.split('/').pop();
          const localPath = `${tempDir}${fileName}`;
          
          const downloadResumable = FileSystem.createDownloadResumable(
            `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/files/download/${selectedDocument.fileId || selectedDocument.id}`,
            localPath,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          const result = await downloadResumable.downloadAsync();
          if (result?.uri) {
            setImageUri(result.uri);
          }
        } catch (error) {
          console.error('Error loading image:', error);
        }
      };

      loadImage();
    }
  }, [selectedDocument, token]);

  // Optimized preview modal rendering
  const renderPreviewModal = useMemo(() => {
    if (!selectedDocument || !token) return null;

    const decodedFilename = decodeURIComponent(selectedDocument.filename);
    const source = {
      uri: `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/files/download/${selectedDocument.fileId || selectedDocument.id}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': selectedDocument.mimeType,
      }
    };

    return (
      <Modal visible={previewVisible} animationType="slide" onRequestClose={closePreview}>
        <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
          <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
            <Text style={[styles.modalTitle, isDarkMode ? styles.textLight : styles.textDark]} numberOfLines={1}>
              {decodedFilename}
            </Text>
            <TouchableOpacity onPress={closePreview} style={styles.modalCloseButton}>
              <X size={28} color={isDarkMode ? "#E0E0E0" : "#555555"} />
            </TouchableOpacity>
          </View>

          {selectedDocument.mimeType?.startsWith('image/') && imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <RNImage source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
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
                  <ActivityIndicator size="large" color={isDarkMode ? "#B388FF" : "#0e135f"} />
                </View>
              )}
            />
          )}
          
          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={[styles.previewActionButton, { backgroundColor: "#9370DB" }]}
              onPress={() => handleDownload(selectedDocument)}
            >
              <Download size={20} color="#FFFFFF" />
              <Text style={styles.previewActionButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }, [previewVisible, selectedDocument, isDarkMode, token, closePreview, handleDownload, imageUri]);

  // Optimized document item rendering
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
        <View style={[
          styles.documentIconContainer,
          isDarkMode ? styles.documentIconContainerDark : styles.documentIconContainerLight,
        ]}>
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
            <Feather name="eye" size={20} color={isDarkMode ? "#B388FF" : "#0e135f"} />
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
              <Feather name="download-cloud" size={20} color={isDarkMode ? "#B388FF" : "#0e135f"} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [isDarkMode, isLoadingDownload, downloadingItemId, getFileIcon, handlePreview, handleDownload, getFileTypeName]
  );

  return (
    <View style={[
      styles.container,
      isDarkMode ? styles.containerDark : styles.containerLight,
      { paddingTop: Platform.OS === 'android' ? insets.top : 0 }, 
    ]}>
      <NavBar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />

      <View style={[styles.content, {paddingTop: 10}]}>
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer,
            isDarkMode ? styles.searchInputContainerDark : styles.searchInputContainerLight,
          ]}>
            <Feather
              name="search"
              size={20}
              color={isDarkMode ? "#BDBDBD" : "#757575"}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, isDarkMode ? styles.textLight : styles.textDark]}
              placeholder="Search documents..."
              placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDarkMode ? "#B388FF" : "#0e135f"}/>
            <Text style={[styles.statusText, isDarkMode ? styles.textLight : styles.textDark]}>
              Loading documents...
            </Text>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={50} color={isDarkMode ? "#7986CB" : "#A0A0A0"}/>
            <Text style={[styles.emptyStateTitle, isDarkMode ? styles.textLight : styles.textDark]}>
              {searchQuery ? "No results found" : "No documents"}
            </Text>
            <Text style={[styles.emptyStateSubtitle, isDarkMode ? styles.textLightSecondary : styles.textDarkSecondary]}>
              {searchQuery ? "Try another search or clear filters." : "Your documents will appear here when available."}
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
            ListFooterComponent={<View style={{ height: insets.bottom + 80 }} />}
          />
        )}
      </View>

      {renderPreviewModal}
      <Footer />
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

  searchContainer: { paddingBottom: 12 },
  searchInputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: Platform.OS === "ios" ? 12 : 10, 
    borderWidth: 1 
  },
  searchInputContainerLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  searchInputContainerDark: { backgroundColor: "#2a2f48", borderColor: "#333333" },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusText: { marginTop: 16, fontSize: 16, fontWeight: "500" },

  emptyContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: 32, 
    paddingBottom: 50 
  },
  emptyStateTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    textAlign: "center", 
    marginTop: 20, 
    marginBottom: 8 
  },
  emptyStateSubtitle: { 
    fontSize: 14, 
    textAlign: "center", 
    lineHeight: 20 
  },

  documentsList: { paddingBottom: 20 },
  documentCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    marginBottom: 12, 
    borderRadius: 10, 
    borderWidth: 1 
  },
  documentCardLight: { 
    backgroundColor: "#FFFFFF", 
    borderColor: "#E0E0E0", 
    shadowColor: "#000000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2 
  },
  documentCardDark: { 
    backgroundColor: "#2a2f48", 
    borderColor: "#333333" 
  },
  documentIconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: 12 
  },
  documentIconContainerLight: { backgroundColor: "rgba(14, 19, 95, 0.08)" },
  documentIconContainerDark: { backgroundColor: "rgba(179, 136, 255, 0.15)" },
  documentInfo: { flex: 1, marginRight: 16 },
  documentTitle: { fontSize: 15, fontWeight: "600", marginBottom: 5 },
  documentMetaContainer: { flexDirection: "row", alignItems: "center", flexWrap: 'wrap' },
  documentMeta: { fontSize: 12, opacity: 0.9 },
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
  modalContainerDark: { backgroundColor: "#1a1f38" },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: StyleSheet.hairlineWidth 
  },
  modalHeaderDark: { 
    backgroundColor: "#1a1f38",
    borderBottomColor: "#333333" 
  },
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
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  previewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  previewActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocumentsScreen;