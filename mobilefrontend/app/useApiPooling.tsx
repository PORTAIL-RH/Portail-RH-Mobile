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
  
  // Refs for tracking state
  const isFetchingRef = useRef<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef<boolean>(true)

  // Enhanced fetch function with error handling
  const fetchData = useCallback(async (forceRefresh = false): Promise<void> => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      // Check authentication if needed
      if (dependsOnAuth) {
        const token = await AsyncStorage.getItem("userToken")
        if (!token) {
          if (isMountedRef.current) {
            setError(new Error("Authentication required"))
            setLoading(false)
          }
          return
        }
      }

      // Show loading only if it's initial load or forced refresh
      if (!data || forceRefresh) {
        if (isMountedRef.current) setLoading(true)
      }

      // Try to get fresh data
      try {
        const freshData = await apiCall()
        
        // Only update if component is still mounted
        if (isMountedRef.current) {
          setData(freshData)
          setError(null)
          
          // Cache the data
          try {
            await AsyncStorage.setItem(storageKey, JSON.stringify(freshData))
          } catch (cacheError) {
            console.error("Failed to cache data:", cacheError)
          }
        }
      } catch (apiError) {
        console.error("API call failed:", apiError)
        
        // Try to use cached data if available
        try {
          const cachedData = await AsyncStorage.getItem(storageKey)
          if (cachedData) {
            const parsedData = JSON.parse(cachedData)
            if (isMountedRef.current) {
              setData(parsedData)
              setError(null)
            }
          } else {
            throw apiError // No cached data available
          }
        } catch (parseError) {
          console.error("Failed to parse cached data:", parseError)
          if (isMountedRef.current) {
            setError(apiError instanceof Error ? apiError : new Error(String(apiError)))
          }
        }
      }
    } catch (err) {
      console.error("Fetch error:", err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
      isFetchingRef.current = false
    }
  }, [apiCall, storageKey, dependsOnAuth, data])

  // Initialize hook
  useEffect(() => {
    isMountedRef.current = true

    // Load initial data
    const initialize = async () => {
      // First try to load from cache
      try {
        const cachedData = await AsyncStorage.getItem(storageKey)
        if (cachedData) {
          const parsedData = JSON.parse(cachedData)
          if (isMountedRef.current) {
            setData(parsedData)
          }
        }
      } catch (cacheError) {
        console.error("Failed to load from cache:", cacheError)
      }

      // Then fetch fresh data
      await fetchData()

      // Setup polling interval
      intervalRef.current = setInterval(() => {
        fetchData()
      }, Math.max(poolingInterval, 30000)) // Minimum 30 seconds between calls
    }

    initialize()

    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, poolingInterval, storageKey])

  // Refresh function
  const refresh = useCallback(async (force = false) => {
    await fetchData(force)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh,
  }
}

export default useApiPooling