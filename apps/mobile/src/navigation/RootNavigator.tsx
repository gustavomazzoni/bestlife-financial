import { NavigationContainer } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { colors, fontFamily } from '../theme';

const Tab = createBottomTabNavigator();

/** Renders the Chat tab as a raised, accent-colored circular button. */
function ChatTabButton({ children, onPress }: BottomTabBarButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.chatButtonWrapper}>
      <View style={styles.chatButton}>{children}</View>
    </Pressable>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            title: 'Calendário',
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: 'Chat',
            tabBarIcon: ({ size }) => (
              <Feather name="message-circle" color={colors.accentForeground} size={size} />
            ),
            tabBarButton: props => <ChatTabButton {...props} />,
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            title: 'Relatórios',
            tabBarIcon: ({ color, size }) => (
              <Feather name="pie-chart" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Accounts"
          component={AccountsScreen}
          options={{
            title: 'Contas',
            tabBarIcon: ({ color, size }) => (
              <Feather name="credit-card" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 11,
  },
  chatButtonWrapper: {
    top: -22,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
