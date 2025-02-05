import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Image, TouchableOpacity } from 'react-native';
import { Appbar, Card, Title, Paragraph, Badge } from 'react-native-paper'; 
import { DrawerNavigationProp } from '@react-navigation/drawer';
import AdminSideBar from './AdminSideBar';

// Define the RootStackParamList with all routes
export type RootStackParamList = {
  AdminDashboard: undefined;
  AdminSideBar: undefined;
  Personnel: undefined;
  Notifications: undefined;
  Settings: undefined;
  Logout: undefined;
};

type AdminDashboardProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0); 
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:9070/api/notifications/unreadnbr');
      const count = await response.json();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.navbar}>
        <Appbar.Action
          icon="menu"
          onPress={toggleSidebar}
          color="white"
        />
        <Appbar.Content title="Bienvenue, Admin" titleStyle={styles.navbarTitle} />
      </Appbar.Header>

      {sidebarVisible && (
        <AdminSideBar navigation={navigation} onClose={() => setSidebarVisible(false)} />
      )}

      <ScrollView style={styles.contentContainer}>
        <AnimatedCard style={styles.welcomeCard} delay={0}>
          <Card.Content>
            <Title style={styles.cardTitle}>Bonjour, bienvenue sur le tableau de bord</Title>
            <Paragraph style={styles.cardSubtitle}>
              Gérez vos données et surveillez les principaux indicateurs.
            </Paragraph>
          </Card.Content>
        </AnimatedCard>

        <View style={styles.sectionContainer}>
          <Image source={require('../../assets/images/group.png')} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Personnels</Text>
          <View style={styles.statsRow}>
            <AnimatedCard style={styles.primaryCard} delay={100}>
              <Card.Content>
                <Title style={styles.cardTitle}>Total Personnels</Title>
                <Text style={styles.cardValue}>23</Text>
              </Card.Content>
            </AnimatedCard>
            <AnimatedCard style={styles.successCard} delay={200}>
              <Card.Content>
                <Title style={styles.cardTitle}>Personnels Actifs</Title>
                <Text style={styles.cardValue}>21</Text>
              </Card.Content>
            </AnimatedCard>
            <AnimatedCard style={styles.warningCard} delay={300}>
              <Card.Content>
                <Title style={styles.cardTitle}>Personnels Inactifs</Title>
                <Text style={styles.cardValue}>2</Text>
              </Card.Content>
            </AnimatedCard>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Image source={require('../../assets/images/notifications.png')} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.statsRow}>
            <AnimatedCard style={styles.primaryCard} delay={400}>
              <Card.Content>
                <Title style={styles.cardTitle}>Notifications Totales</Title>
                <Text style={styles.cardValue}>7</Text>
              </Card.Content>
            </AnimatedCard>
            <AnimatedCard style={styles.secondaryCard} delay={500}>
              <Card.Content>
                <Title style={styles.cardTitle}>Notifications Non Lues</Title>
                <Text style={styles.cardValue}>3</Text>
              </Card.Content>
            </AnimatedCard>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={styles.navItem}>
          <Image source={require('../../assets/images/home.png')} style={styles.navIcon} />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={styles.navItem}>
          <Image source={require('../../assets/images/calendar.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.navItem}>
          <View style={styles.notificationIconWrapper}>
            <Image source={require('../../assets/images/notifications.png')} style={styles.navIcon} />
            {unreadCount > 0 && (
              <Badge
                style={styles.badge}
              >
                {unreadCount}
              </Badge>
            )}
          </View>
          <Text style={styles.navText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('')} style={styles.navItem}>
          <Image source={require('../../assets/images/profile.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface AnimatedCardProps {
  style: object;
  delay: number;
  children: React.ReactNode;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ style, delay, children }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(200));

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <Card style={[styles.card, style]}>{children}</Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  navbar: { backgroundColor: '#1E3D58', elevation: 6 },
  navbarTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  contentContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sectionContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 3 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#2D3A47', marginBottom: 16 },
  sectionIcon: { width: 40, height: 40, marginBottom: 10, alignSelf: 'center' },
  cardContainer: { flex: 1, marginHorizontal: 8, borderRadius: 12, elevation: 4 },
  card: { marginBottom: 16, borderRadius: 12 },
  welcomeCard: { backgroundColor: '#4A90E2', borderRadius: 12 },
  primaryCard: { backgroundColor: '#5B97C8' },
  secondaryCard: { backgroundColor: '#2D3A47' },
  successCard: { backgroundColor: '#55B87C' },
  warningCard: { backgroundColor: '#2D3A47' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#fff', fontSize: 14, opacity: 0.9 },
  cardValue: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 10 },
  bottomNavigation: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#1E3D58' },
  navItem: { alignItems: 'center' },
  navIcon: { width: 30, height: 30 },
  navTextActive: { color: '#fff', fontSize: 12, fontWeight: '600' },
  navText: { color: '#B0C0D0', fontSize: 12 },
  notificationIconWrapper: { position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red' },
});

export default AdminDashboard;
