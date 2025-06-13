"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { API_CONFIG } from "../config/apiConfig"

interface Notification {
  id: string
  title: string
  message: string
  createdAt: string
  viewed: boolean
  personnelId?: string
  codeSoc?: string
  serviceId?: string
}

const useNotifications = (role?: string, personnelId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unviewedCount, setUnviewedCount] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const isMountedRef = useRef(true)

  // Get user data from AsyncStorage
  const getUserData = useCallback(async () => {
    try {
      const [userInfoStr, token] = await Promise.all([
        AsyncStorage.getItem("userInfo"),
        AsyncStorage.getItem("userToken")
      ])
      
      if (!userInfoStr || !token) {
        throw new Error("User data not found")
      }

      const userInfo = JSON.parse(userInfoStr)
      return {
        userId: personnelId || userInfo.id,
        userRole: role || userInfo.role,
        codeSoc: userInfo.codeSoc,
        token
      }
    } catch (error) {
      console.error("Error getting user data:", error)
      throw error
    }
  }, [role, personnelId])

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const { userId, userRole, codeSoc, token } = await getUserData()

      let url = `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications?role=${userRole}`
      
      if (userRole === "RH") {
        url += `&codeSoc=${codeSoc}`
      } else if (userRole !== "Admin") {
        url += `&personnelId=${userId}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch notifications")

      const data: Notification[] = await response.json()
      if (isMountedRef.current) {
        setNotifications(data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
        setUnviewedCount(data.filter(n => !n.viewed).length)
      }
    } catch (error) {
      console.error("Fetch notifications error:", error)
      if (isMountedRef.current) {
        setError(error.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [getUserData])

  // Fetch unread count
  const fetchUnviewedCount = useCallback(async () => {
    try {
      const { userId, userRole, token } = await getUserData()

      const response = await fetch(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications/unreadnbr?role=${userRole}&personnelId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error("Failed to fetch unread count")

      const count = await response.json()
      if (isMountedRef.current) {
        setUnviewedCount(count)
      }
    } catch (error) {
      console.error("Fetch unread count error:", error)
    }
  }, [getUserData])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { token } = await getUserData()

      const response = await fetch(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications/${notificationId}/view`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error("Failed to mark as read")

      if (isMountedRef.current) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, viewed: true } : n)
        )
        setUnviewedCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Mark as read error:", error)
      throw error
    }
  }, [getUserData])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { userId, userRole, token } = await getUserData()

      const response = await fetch(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: userRole,
            personnelId: userId,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to mark all as read")

      if (isMountedRef.current) {
        setNotifications(prev => prev.map(n => ({ ...n, viewed: true })))
        setUnviewedCount(0)
      }
    } catch (error) {
      console.error("Mark all as read error:", error)
      throw error
    }
  }, [getUserData])

  // WebSocket connection
  const setupWebSocket = useCallback(async () => {
    try {
      const { userId, userRole, token } = await getUserData()

      const client = new Client({
        webSocketFactory: () => new SockJS(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/ws`),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => console.log("STOMP:", str),
        connectHeaders: { Authorization: `Bearer ${token}` },
      })

      client.onConnect = () => {
        console.log("✅ WebSocket connected")
        setIsConnected(true)
        
        // Subscribe to user-specific topic
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          try {
            const newNotification: Notification = JSON.parse(message.body)
            if (isMountedRef.current) {
              setNotifications(prev => {
                if (!prev.some(n => n.id === newNotification.id)) {
                  return [newNotification, ...prev]
                }
                return prev
              })
              if (!newNotification.viewed) {
                setUnviewedCount(prev => prev + 1)
              }
            }
          } catch (error) {
            console.error("Error processing notification:", error)
          }
        })
      }

      client.onStompError = (frame) => {
        console.error("WebSocket error:", frame.headers.message)
        if (isMountedRef.current) {
          setError(frame.headers.message)
          setIsConnected(false)
        }
      }

      client.onDisconnect = () => {
        if (isMountedRef.current) {
          setIsConnected(false)
        }
      }

      client.activate()
      clientRef.current = client

      return client
    } catch (error) {
      console.error("WebSocket setup error:", error)
      if (isMountedRef.current) {
        setError("Failed to connect to real-time notifications")
      }
      return null
    }
  }, [getUserData])

  // Initial setup
  useEffect(() => {
    isMountedRef.current = true

    const initialize = async () => {
      try {
        await fetchNotifications()
        await setupWebSocket()
      } catch (error) {
        console.error("Initialization error:", error)
      }
    }

    initialize()

    return () => {
      isMountedRef.current = false
      if (clientRef.current) {
        clientRef.current.deactivate()
        console.log("WebSocket disconnected")
      }
    }
  }, [fetchNotifications, setupWebSocket])

  return {
    notifications,
    unviewedCount,
    loading,
    error,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refetchNotifications: fetchNotifications,
  }
}

export default useNotifications