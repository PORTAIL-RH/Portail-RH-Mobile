import { useState, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { API_CONFIG } from "../config/apiConfig"

export interface Notification {
  id: string
  message: string
  timestamp: string
  viewed: boolean
  role: string
  serviceId: string
}

const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unviewedCount, setUnviewedCount] = useState<number>(0)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [userRole, setUserRole] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem("userInfo")
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr)
          setUserId(userInfo.id || "")
          setUserRole(userInfo.role || "Collaborateur")
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }
    loadUserData()
  }, [])

  useEffect(() => {
    if (userId && userRole) {
      fetchNotifications()
      setupWebSocket()
    }
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
        console.log("❌ WebSocket disconnected")
      }
    }
  }, [userId, userRole])

  const fetchNotifications = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("userToken")
      const url = `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications?role=${userRole.toLowerCase()}&serviceId=${userId}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: Notification[] = await response.json()
        // Filter to ensure only notifications for this user
        const userNotifications = data.filter(n => n.serviceId === userId)
        setNotifications(userNotifications)
        setUnviewedCount(userNotifications.filter(n => !n.viewed).length)
      } else {
        setError(await response.text())
      }
    } catch (error) {
      setError("Unable to retrieve notifications.")
    } finally {
      setLoading(false)
    }
  }

/*  const markAsViewed = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      const response = await fetch(
        `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications/${notificationId}/view`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, viewed: true } : n
          )
        )
        setUnviewedCount(prev => prev - 1)
      }
    } catch (error) {
      console.error("Error marking notification as viewed:", error)
    }
  }*/

    const markAllAsRead = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");    
        if (!token) {
          console.error("No auth token found");
          return;
        }
    
        const response = await fetch(
          `${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications/mark-all-read`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              role: userRole?.toLowerCase(),
              serviceId: userId
            }),
          }
        );
    
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to mark notifications as read:", errorText);
          return;
        }
    
        const data = await response.json();
    
        console.log(data.message, data.updatedCount);
    
        // Update the local state to reflect that all are viewed
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, viewed: true }))
        );
        setUnviewedCount(0);
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
      }
    };
    

  const setupWebSocket = async () => {
    if (!userId) return
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) return
      
      const client = new Client({
        webSocketFactory: () => new SockJS(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/ws`),
        reconnectDelay: 5000,
        debug: (str) => console.log("🛜 WebSocket:", str),
        connectHeaders: { Authorization: `Bearer ${token}` },
      })

      client.onConnect = () => {
        console.log("✅ WebSocket connected")
        client.subscribe(`/topic/notifications/${userRole.toLowerCase()}`, (message) => {
          const newNotification: Notification = JSON.parse(message.body)
          if (newNotification.serviceId === userId) {
            setNotifications(prev => [newNotification, ...prev])
            if (!newNotification.viewed) {
              setUnviewedCount(prev => prev + 1)
            }
          }
        })
      }

      client.onStompError = (frame) => {
        console.error("WebSocket error:", frame.headers.message)
      }

      client.activate()
      clientRef.current = client
    } catch (error) {
      console.error("Error setting up WebSocket:", error)
    }
  }

  return { 
    notifications, 
    unviewedCount, 
    loading, 
    error, 
    fetchNotifications,
    markAllAsRead
  }
}

export default useNotifications