import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Platform, RefreshControl } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from "lucide-react-native";
import type { Request, DemandesListProps } from "./Demandes";

// Cache constants
const CACHE_KEY = 'requests-cache';
const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes cache expiry

// Enhanced cache interface
interface CacheData {
  requests: Request[];
  timestamp: number;
  userId: string;
  version: string;
}

// Cache manager class for better organization
class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, any>();
  private computedCache = new Map<string, any>();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async loadFromStorage(): Promise<Request[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (!cachedData) return null;

      const { requests, timestamp, userId, version }: CacheData = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
        await this.clearCache();
        return null;
      }

      console.log('[CACHE] Loading from storage, age:', Math.round((Date.now() - timestamp) / 1000), 'seconds');
      return requests;
    } catch (error) {
      console.error('[CACHE] Error loading from storage:', error);
      return null;
    }
  }

  async saveToStorage(requests: Request[], userId: string): Promise<void> {
    try {
      const cacheData: CacheData = {
        requests,
        timestamp: Date.now(),
        userId,
        version: '1.0'
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('[CACHE] Saved to storage, count:', requests.length);
    } catch (error) {
      console.error('[CACHE] Error saving to storage:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      this.memoryCache.clear();
      this.computedCache.clear();
      console.log('[CACHE] Cache cleared');
    } catch (error) {
      console.error('[CACHE] Error clearing cache:', error);
    }
  }

  getComputed(key: string): any {
    return this.computedCache.get(key);
  }

  setComputed(key: string, value: any): void {
    this.computedCache.set(key, value);
  }

  hasComputed(key: string): boolean {
    return this.computedCache.has(key);
  }

  clearComputed(): void {
    this.computedCache.clear();
  }
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
  loading = false,
  onRefresh,
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cacheManager = CacheManager.getInstance();

  // Enhanced request type detection
  const getRequestCategory = useCallback((request: Request): string => {
    const type = request.type.toLowerCase();
    if (type.includes("conge")) return "conge";
    if (type.includes("formation")) return "formation";
    if (type.includes("pre-avance") || type.includes("avance")) return "avance";
    if (type.includes("document")) return "document";
    if (type.includes("autorisation")) return "autorisation";
    return "other";
  }, []);

  // Get request status with caching
  const getRequestStatus = useCallback((request: Request): "approved" | "rejected" | "pending" => {
    const cacheKey = `status-${request.id}-${request.responseRh}-${request.responseChefs?.responseChef1}`;
    
    if (cacheManager.hasComputed(cacheKey)) {
      return cacheManager.getComputed(cacheKey);
    }

    let status: "approved" | "rejected" | "pending";
    
    if (request.type.toLowerCase().includes("document") || request.type.toLowerCase().includes("pre-avance")) {
      if (request.responseRh === undefined || request.responseRh === null) {
        status = "pending";
      } else {
        switch (request.responseRh) {
          case "T":
            status = "approved";
            break;
          case "N":
            status = "rejected";
            break;
          case "I":
          default:
            status = "pending";
        }
      }
    } else {
      if (!request.responseChefs) {
        status = "pending";
      } else {
        switch (request.responseChefs.responseChef1) {
          case "O":
            status = "approved";
            break;
          case "N":
            status = "rejected";
            break;
          case "I":
          default:
            status = "pending";
        }
      }
    }

    cacheManager.setComputed(cacheKey, status);
    return status;
  }, []);

  // Main filtering function
  const getFilteredAndSearchedRequests = useMemo(() => {
    const cacheKey = `filtered-${activeFilter}-${activeTypeFilter}-${searchQuery}-${filteredRequests.length}`;
    
    if (cacheManager.hasComputed(cacheKey)) {
      return cacheManager.getComputed(cacheKey);
    }

    let filtered = [...filteredRequests];

    // Apply status filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(request => {
        const status = getRequestStatus(request);
        return status === activeFilter;
      });
    }

    // Apply type filter
    if (activeTypeFilter !== "all") {
      filtered = filtered.filter(request => {
        const category = getRequestCategory(request);
        return category === activeTypeFilter;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(request => 
        request.type.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query) ||
        (request.details?.typeConge && request.details.typeConge.toLowerCase().includes(query)) ||
        (request.details?.titre && request.details.titre.toLowerCase().includes(query)) ||
        (request.details?.typeDocument && request.details.typeDocument.toLowerCase().includes(query))
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.details?.dateDemande ? new Date(a.details.dateDemande).getTime() : 0;
      const dateB = b.details?.dateDemande ? new Date(b.details.dateDemande).getTime() : 0;
      return dateB - dateA;
    });

    cacheManager.setComputed(cacheKey, filtered);
    return filtered;
  }, [filteredRequests, activeFilter, activeTypeFilter, searchQuery, getRequestStatus, getRequestCategory]);

  // Helper functions with caching
  const getRequestTypeIcon = useCallback((type: string | undefined) => {
    const typeString = typeof type === "string" ? type : "unknown";
    const lowerCaseType = typeString.toLowerCase();
    const cacheKey = `typeIcon-${lowerCaseType}-${isDarkMode}`;

    if (cacheManager.hasComputed(cacheKey)) {
      return cacheManager.getComputed(cacheKey);
    }

    let icon;
    if (lowerCaseType.includes("congé")) {
      icon = <Calendar size={24} color={isDarkMode ? "#2a325b" : "#2a325b"} />;
    } else if (lowerCaseType.includes("formation")) {
      icon = <GraduationCap size={24} color={isDarkMode ? "#2196F3" : "#2196F3"} />;
    } else if (lowerCaseType.includes("document")) {
      icon = <FileText size={24} color={isDarkMode ? "#607D8B" : "#607D8B"} />;
    } else if (lowerCaseType.includes("pre-avance") || lowerCaseType.includes("avance")) {
      icon = <DollarSign size={24} color={isDarkMode ? "#FF9800" : "#FF9800"} />;
    } else if (lowerCaseType.includes("autorisation")) {
      icon = <Shield size={24} color={isDarkMode ? "#673AB7" : "#673AB7"} />;
    } else {
      icon = <FileText size={24} color={isDarkMode ? "#2196F3" : "#2196F3"} />;
    }

    cacheManager.setComputed(cacheKey, icon);
    return icon;
  }, [isDarkMode]);

  const getStatusIcon = useCallback((request: Request) => {
    const status = getRequestStatus(request);
    const cacheKey = `statusIcon-${request.id}-${status}`;
    
    if (cacheManager.hasComputed(cacheKey)) {
      return cacheManager.getComputed(cacheKey);
    }

    let icon;
    switch (status) {
      case "approved":
        icon = <CheckCircle size={18} color="#4CAF50" />;
        break;
      case "rejected":
        icon = <XCircle size={18} color="#F44336" />;
        break;
      case "pending":
      default:
        icon = <Clock size={18} color="#FFC107" />;
    }

    cacheManager.setComputed(cacheKey, icon);
    return icon;
  }, [getRequestStatus]);

  const getStatusColor = useCallback((request: Request) => {
    const status = getRequestStatus(request);
    const cacheKey = `statusColor-${request.id}-${status}`;
    
    if (cacheManager.hasComputed(cacheKey)) {
      return cacheManager.getComputed(cacheKey);
    }

    let color;
    switch (status) {
      case "approved":
        color = "#4CAF50";
        break;
      case "rejected":
        color = "#F44336";
        break;
      case "pending":
        color = "#FFC107";
        break;
      default:
        color = "#2a325b";
    }

    cacheManager.setComputed(cacheKey, color);
    return color;
  }, [getRequestStatus]);

  const getStatusText = useCallback((request: Request) => {
    const status = getRequestStatus(request);
    const cacheKey = `statusText-${request.id}-${status}`;
    
    if (cacheManager.hasComputed(cacheKey)) {
      return cacheManager.getComputed(cacheKey);
    }

    let text;
    switch (status) {
      case "approved":
        text = "Approuvée";
        break;
      case "rejected":
        text = "Rejetée";
        break;
      case "pending":
        text = "En attente";
        break;
      default:
        text = "";
    }

    cacheManager.setComputed(cacheKey, text);
    return text;
  }, [getRequestStatus]);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString || dateString === "N/A") return "";
    const cacheKey = `date-${dateString}`;
    
    if (cacheManager.hasComputed(cacheKey)) {
      return cacheManager.getComputed(cacheKey);
    }

    try {
      if (dateString.includes("/")) {
        cacheManager.setComputed(cacheKey, dateString);
        return dateString;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        cacheManager.setComputed(cacheKey, dateString);
        return dateString;
      }
      const formattedDate = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      cacheManager.setComputed(cacheKey, formattedDate);
      return formattedDate;
    } catch (error) {
      console.error("Error formatting date:", error);
      cacheManager.setComputed(cacheKey, dateString);
      return dateString;
    }
  }, []);

  const formatTime = useCallback((dateString: string | undefined) => {
    if (!dateString || dateString === "N/A") return "";
    const cacheKey = `time-${dateString}`;
    
    if (cacheManager.hasComputed(cacheKey)) {
      return cacheManager.getComputed(cacheKey);
    }

    try {
      if (dateString.includes(":")) {
        cacheManager.setComputed(cacheKey, dateString);
        return dateString;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        cacheManager.setComputed(cacheKey, "");
        return "";
      }
      const formattedTime = date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      cacheManager.setComputed(cacheKey, formattedTime);
      return formattedTime;
    } catch (error) {
      console.error("Error formatting time:", error);
      cacheManager.setComputed(cacheKey, "");
      return "";
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    searchRequests("");
    cacheManager.clearComputed();
  }, [setSearchQuery, searchRequests]);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        cacheManager.clearComputed();
        await onRefresh();
      } catch (error) {
        console.error('Error during refresh:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh]);

  const resetStatusFilter = useCallback(() => {
    filterRequests("all", activeTypeFilter);
    cacheManager.clearComputed();
  }, [filterRequests, activeTypeFilter]);

  const resetTypeFilter = useCallback(() => {
    filterRequests(activeFilter, "all");
    cacheManager.clearComputed();
  }, [filterRequests, activeFilter]);

  const applyFilter = useCallback((status: string, type?: string) => {
    filterRequests(status, type || activeTypeFilter);
    setShowFilterModal(false);
    cacheManager.clearComputed();
  }, [filterRequests, activeTypeFilter]);

  const applyTypeFilter = useCallback((type: string) => {
    filterRequests(activeFilter, type);
    setShowFilterModal(false);
    cacheManager.clearComputed();
  }, [filterRequests, activeFilter]);

  const finalFilteredRequests = getFilteredAndSearchedRequests;

  // Enhanced Loading Component with theme support
  const LoadingSpinner = ({ message = "Chargement..." }) => (
    <View style={[styles.loadingContainer, themeStyles?.spinnerContainer]}>
      <ActivityIndicator 
        size="large" 
        color="#2a325b"
      />
      <Text style={[styles.loadingText, themeStyles?.spinnerText || themeStyles?.text]}>
        {message}
      </Text>
    </View>
  );

  // Enhanced Empty State Component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <FileText size={48} color={isDarkMode ? "#666" : "#CCC"} />
      <Text style={[styles.emptyText, themeStyles.text]}>
        {searchQuery ? "Aucune demande trouvée pour cette recherche" : "Aucune demande trouvée"}
      </Text>
      {searchQuery && (
        <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
          <Text style={[styles.clearSearchText, { color: "#2a325b" }]}>
            Effacer la recherche
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and filter section */}
      <View style={[styles.searchContainer, themeStyles.searchContainer]}>
        <View style={[styles.searchInputContainer, themeStyles.searchInputContainer]}>
          <Search size={20} color={isDarkMode ? "#E0E0E0" : "#666"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, themeStyles.searchInput]}
            placeholder="Rechercher une demande..."
            placeholderTextColor={isDarkMode ? "#AAAAAA" : "#757575"}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchRequests(text);
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery !== "" && Platform.OS === 'android' && (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={isDarkMode ? "#E0E0E0" : "#666"} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, themeStyles.filterButton]}
          onPress={() => setShowFilterModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Filter size={20} color={isDarkMode ? "#E0E0E0" : "#666"} />
        </TouchableOpacity>
      </View>

      {/* Active filters display */}
      {(activeFilter !== "all" || activeTypeFilter !== "all") && (
        <View style={[styles.activeFiltersContainer, themeStyles.activeFiltersContainer]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {activeFilter !== "all" && (
              <View style={[styles.activeFilterChip, themeStyles.activeFilterChip]}>
                <Text style={[styles.activeFilterText, themeStyles.activeFilterText]}>
                  {activeFilter === "pending" ? "En attente" : 
                   activeFilter === "approved" ? "Approuvées" : 
                   activeFilter === "rejected" ? "Rejetées" : activeFilter}
                </Text>
                <TouchableOpacity onPress={resetStatusFilter}>
                  <X size={14} color={isDarkMode ? "#FFFFFF" : "#FFFFFF"} />
                </TouchableOpacity>
              </View>
            )}
            {activeTypeFilter !== "all" && (
              <View style={[styles.activeFilterChip, themeStyles.activeFilterChip]}>
                <Text style={[styles.activeFilterText, themeStyles.activeFilterText]}>
                  {activeTypeFilter === "conge" ? "Congés" :
                   activeTypeFilter === "formation" ? "Formations" :
                   activeTypeFilter === "avance" ? "Avances" :
                   activeTypeFilter === "document" ? "Documents" :
                   activeTypeFilter === "autorisation" ? "Autorisations" : activeTypeFilter}
                </Text>
                <TouchableOpacity onPress={resetTypeFilter}>
                  <X size={14} color={isDarkMode ? "#FFFFFF" : "#FFFFFF"} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner message="Chargement des demandes..." />
      ) : finalFilteredRequests.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView 
          style={styles.requestsList}
          contentContainerStyle={styles.requestsListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={["#2a325b"]}
                tintColor="#2a325b"
                title="Actualisation..."
                titleColor={isDarkMode ? "#FFFFFF" : "#333333"}
              />
            ) : undefined
          }
        >
          {finalFilteredRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={[styles.requestCard, themeStyles.card]}
              onPress={() => onSelectRequest(request)}
              activeOpacity={0.7}
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
                      {request.details?.dateDemande === "N/A" 
                        ? "Date non disponible" 
                        : `Soumise le ${formatDate(request.details?.dateDemande)}${
                            request.time ? ` à ${request.time}` : ""
                          }`}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusContainer, { borderTopColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#E0E0E0" }]}>
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
                  <ChevronRight size={20} color={isDarkMode ? "#2a325b" : "#2a325b"} />
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
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowFilterModal(false)}
          />
          <View style={[styles.filterModal, themeStyles.card]}>
            <View style={[styles.filterModalHeader, { borderBottomColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#E0E0E0" }]}>
              <Text style={[styles.filterModalTitle, themeStyles.text]}>Filtrer les demandes</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={isDarkMode ? "#E0E0E0" : "#333"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Filter by status */}
              <Text style={[styles.filterSectionTitle, themeStyles.text]}>Par statut</Text>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === "all" && styles.activeFilterOption,
                  activeFilter === "all" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyFilter("all")}
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
                {activeFilter === "all" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === "pending" && styles.activeFilterOption,
                  activeFilter === "pending" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyFilter("pending")}
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
                {activeFilter === "pending" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === "approved" && styles.activeFilterOption,
                  activeFilter === "approved" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyFilter("approved")}
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
                {activeFilter === "approved" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === "rejected" && styles.activeFilterOption,
                  activeFilter === "rejected" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyFilter("rejected")}
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
                {activeFilter === "rejected" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              {/* Filter by type */}
              <Text style={[styles.filterSectionTitle, themeStyles.text, { marginTop: 16 }]}>Par type</Text>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeTypeFilter === "all" && styles.activeFilterOption,
                  activeTypeFilter === "all" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyTypeFilter("all")}
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
                {activeTypeFilter === "all" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeTypeFilter === "conge" && styles.activeFilterOption,
                  activeTypeFilter === "conge" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyTypeFilter("conge")}
              >
                <View style={styles.filterOptionContent}>
                  <Calendar size={20} color="#2a325b" />
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
                {activeTypeFilter === "conge" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeTypeFilter === "formation" && styles.activeFilterOption,
                  activeTypeFilter === "formation" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyTypeFilter("formation")}
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
                {activeTypeFilter === "formation" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeTypeFilter === "avance" && styles.activeFilterOption,
                  activeTypeFilter === "avance" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyTypeFilter("avance")}
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
                {activeTypeFilter === "avance" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeTypeFilter === "document" && styles.activeFilterOption,
                  activeTypeFilter === "document" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyTypeFilter("document")}
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
                {activeTypeFilter === "document" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeTypeFilter === "autorisation" && styles.activeFilterOption,
                  activeTypeFilter === "autorisation" && themeStyles.activeFilterOption,
                ]}
                onPress={() => applyTypeFilter("autorisation")}
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
                {activeTypeFilter === "autorisation" && <CheckCircle size={20} color="#2a325b" />}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    ...Platform.select({
      android: {
        paddingVertical: 0,
      },
    }),
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  activeFiltersContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a325b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  requestsList: {
    flex: 1,
  },
  requestsListContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  requestCard: {
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  clearSearchButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearSearchText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 50,
  },
  activeFilterOption: {
    backgroundColor: "rgba(147, 112, 219, 0.15)",
  },
  filterOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  filterOptionText: {
    fontSize: 16,
  },
  activeFilterOptionText: {
    fontWeight: "600",
    color: "#2a325b",
  },
});

export default DemandesList;