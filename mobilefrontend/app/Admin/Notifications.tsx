import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { API_CONFIG } from '../config';


type Notification = {
  id: string;
  message: string;
  timestamp: string;
  viewed: boolean; 
};

type FooterVariant2Props = {
  unreadCount: number;
};

type NotificationCardProps = {
  date: string;
  description: string;
  viewed: boolean;
  onPress: () => void;
};

type RootStackParamList = {
  AdminDashboard: undefined;
  Notifications: undefined;
};

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Notifications'>;

const Notifications = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications/unreadnbr`);
      const count = await response.json();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsViewed = async (id: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}:${API_CONFIG.PORT}/api/notifications/${id}/view`, {
        method: 'POST',
      });
      // Update the local state to mark the notification as viewed
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, viewed: true } : notification
        )
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
    }
  };

  return (
    
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('AdminDashboard')}
      >
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
      <SearchVariant2 />
      <ScrollView>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            date={new Date(notification.timestamp).toLocaleDateString()}
            description={notification.message}
            viewed={notification.viewed} // Pass the "viewed" status
            onPress={() => markAsViewed(notification.id)}
          />
        ))}
      </ScrollView>
      <FooterVariant2 unreadCount={unreadCount} />
    </View>
  );
};

const SearchVariant2 = () => {
  return (
    <View style={styles.searchContainer}>
      <Text style={styles.searchText}>Nouvelles Notifications</Text>
      <Image source={require('../../assets/images/notifications.png')} style={styles.icon} />
    </View>
  );
};

const NotificationCard: React.FC<NotificationCardProps> = ({ date, description, viewed, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.propertyContainer}>
        <Text style={styles.dateText}>{date}</Text>
        <Text
          style={[
            styles.descriptionText,
            !viewed && styles.unreadText, // Apply bold style if the notification is unread
          ]}
        >
          {description}
        </Text>
        <Image source={require('../../assets/images/notifications.png')} style={styles.icon} />
      </View>
    </TouchableOpacity>
  );
};

const FooterVariant2: React.FC<FooterVariant2Props> = ({ unreadCount }) => {
  return (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>{unreadCount} over n notifications</Text>
      <View style={styles.footerButtons}>
        <TouchableOpacity>
          <Text>Voir tout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F0F4F8',
  },
  backButton: {
    padding: 10,
    backgroundColor: '#1E3D58',
    borderRadius: 5,
    marginTop: 80,
    marginHorizontal: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  searchText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#363740',
  },
  icon: {
    width: 22,
    height: 22,
  },
  propertyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#DBDADE',
    textAlign: 'center',
    marginRight: 12,
  },
  descriptionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#363740',
    lineHeight: 18,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#979797',
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});

export default Notifications;