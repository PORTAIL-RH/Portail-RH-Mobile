import { useEffect, useState, useRef, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

type ApiPoolingOptions<T> = {
  apiCall: () => Promise<T>
  storageKey: string
  poolingInterval?: number
  initialData?: T | null
  dependsOnAuth?: boolean
}

type ApiPoolingResult<T> = {
  data: T | null
  loading: boolean
  error: Error | null
  refresh: (force?: boolean) => Promise<void>
}

const useApiPooling = <T,>({
  apiCall,
  storageKey,
  poolingInterval = 60000,
  initialData = null,
  dependsOnAuth = true,
}: ApiPoolingOptions<T>): ApiPoolingResult<T> => {
  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false)

  // Référence pour suivre si une requête est en cours
  const isFetchingRef = useRef<boolean>(false)
  // Référence pour suivre si les données ont été chargées depuis le cache
  const cacheLoadedRef = useRef<boolean>(false)
  // Référence pour suivre si les données ont été chargées depuis l'API
  const apiLoadedRef = useRef<boolean>(false)
  // Référence pour le dernier temps de mise à jour
  const lastUpdateRef = useRef<number>(0)

  // Use refs to prevent infinite loops
  const isInitialMount = useRef(true)
  const apiCallRef = useRef(apiCall)
  const storageKeyRef = useRef(storageKey)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update refs when props change
  useEffect(() => {
    apiCallRef.current = apiCall
    storageKeyRef.current = storageKey
  }, [apiCall, storageKey])

  // Vérifier si l'utilisateur est authentifié
  const checkAuthentication = useCallback(async () => {
    try {
      const userInfo = await AsyncStorage.getItem("userInfo")
      const userToken = await AsyncStorage.getItem("userToken")
      const userId = await AsyncStorage.getItem("userId")

      const isAuthenticated = !!(userInfo && userToken && userId)
      setIsUserAuthenticated(isAuthenticated)
      return isAuthenticated
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error)
      return false
    }
  }, [])

  // Charger les données depuis le cache
  const loadFromCache = useCallback(async (): Promise<boolean> => {
    try {
      if (cacheLoadedRef.current) return true // Éviter de charger le cache plusieurs fois

      const cachedData = await AsyncStorage.getItem(storageKeyRef.current)
      if (cachedData) {
        const parsedData = JSON.parse(cachedData)
        console.log(`Loaded cached data for ${storageKeyRef.current}`)
        setData(parsedData)
        cacheLoadedRef.current = true
        return true
      }
      return false
    } catch (cacheError) {
      console.error("Error loading from cache:", cacheError)
      return false
    }
  }, [])

  // Fonction pour récupérer les données avec debounce
  const fetchData = useCallback(
    async (forceRefresh = false): Promise<void> => {
      // Éviter les appels simultanés
      if (isFetchingRef.current) {
        console.log("Une requête est déjà en cours, ignorée")
        return
      }

      // Vérifier le temps écoulé depuis la dernière mise à jour (debounce)
      const now = Date.now()
      if (!forceRefresh && now - lastUpdateRef.current < 5000) {
        // 5 secondes de debounce
        console.log("Dernière mise à jour trop récente, ignorée")
        return
      }

      try {
        // Si l'API dépend de l'authentification, vérifier d'abord si l'utilisateur est authentifié
        if (dependsOnAuth) {
          const isAuthenticated = await checkAuthentication()
          if (!isAuthenticated) {
            console.log("L'utilisateur n'est pas authentifié, impossible de faire l'appel API")
            setLoading(false)
            return
          }
        }

        // Marquer comme en cours de chargement seulement si c'est le premier chargement
        if (!apiLoadedRef.current && !forceRefresh) {
          setLoading(true)
        }

        // Essayer d'abord de charger depuis le cache si ce n'est pas un rafraîchissement forcé
        if (!forceRefresh) {
          const cacheLoaded = await loadFromCache()
          if (cacheLoaded) {
            setLoading(false)
          }
        }

        // Marquer comme en cours de récupération
        isFetchingRef.current = true

        // Faire l'appel API
        try {
          const freshData = await apiCallRef.current()
          console.log(`Received fresh data for ${storageKeyRef.current}`)

          // Mettre à jour les données seulement si elles sont différentes
          const currentDataStr = data ? JSON.stringify(data) : ""
          const newDataStr = JSON.stringify(freshData)

          if (currentDataStr !== newDataStr) {
            setData(freshData)
            await AsyncStorage.setItem(storageKeyRef.current, newDataStr)
          }

          setError(null)
          apiLoadedRef.current = true
          lastUpdateRef.current = Date.now()
        } catch (apiError) {
          console.error("API call failed:", apiError)
          // Only set error if we don't have data yet
          if (!data) {
            setError(apiError instanceof Error ? apiError : new Error(String(apiError)))
          }
        } finally {
          isFetchingRef.current = false
          setLoading(false)
        }
      } catch (err) {
        console.error("Fetch data error:", err)
        if (!data) {
          setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        }
        isFetchingRef.current = false
        setLoading(false)
      }
    },
    [checkAuthentication, data, dependsOnAuth, loadFromCache],
  )

  // Configurer l'intervalle de polling
  const setupPolling = useCallback(() => {
    // Nettoyer l'intervalle existant s'il y en a un
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Créer un nouvel intervalle avec une fréquence plus basse pour éviter les problèmes
    intervalRef.current = setInterval(
      () => {
        fetchData()
      },
      Math.max(poolingInterval, 60000),
    ) // Au moins 1 minute entre les appels

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, poolingInterval])

  // Initialiser le hook
  useEffect(() => {
    const initializeHook = async () => {
      // Charger d'abord depuis le cache
      await loadFromCache()

      // Si l'API dépend de l'authentification, vérifier d'abord si l'utilisateur est authentifié
      if (dependsOnAuth) {
        const isAuthenticated = await checkAuthentication()
        if (!isAuthenticated) {
          console.log("L'utilisateur n'est pas authentifié, en attente...")
          setLoading(false)
          return
        }
      }

      // Charger les données initiales
      await fetchData()

      // Configurer l'intervalle de polling
      return setupPolling()
    }

    const cleanup = initializeHook()
    return () => {
      if (typeof cleanup === "function") {
        cleanup()
      }
    }
  }, [dependsOnAuth, checkAuthentication, setupPolling, fetchData, loadFromCache])

  // Fonction de rafraîchissement exposée
  const refresh = useCallback(
    async (force = false) => {
      await fetchData(force)
    },
    [fetchData],
  )

  return {
    data,
    loading,
    error,
    refresh,
  }
}

export default useApiPooling
