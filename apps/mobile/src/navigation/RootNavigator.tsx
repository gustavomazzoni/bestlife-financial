import { NavigationContainer } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { AccountsStack } from './AccountsStack';
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_GAP } from './tabBarMetrics';
import { colors, fontFamily, shadow } from '../theme';

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
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.foreground,
          tabBarInactiveTintColor: colors.mutedForeground2,
          tabBarStyle: [styles.tabBar, { bottom: insets.bottom + TAB_BAR_BOTTOM_GAP }],
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" color={color} size={size - 2} strokeWidth={1.8} />
            ),
          }}
        />
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            title: 'Calendário',
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" color={color} size={size - 2} strokeWidth={1.8} />
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
              <Feather name="pie-chart" color={color} size={size - 2} strokeWidth={1.8} />
            ),
          }}
        />
        <Tab.Screen
          name="Accounts"
          component={AccountsStack}
          options={{
            title: 'Contas',
            tabBarIcon: ({ color, size }) => (
              <Feather name="credit-card" color={color} size={size - 2} strokeWidth={1.8} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: TAB_BAR_HEIGHT,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    paddingTop: 8,
    ...shadow.card,
  },
  tabBarLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 10,
  },
  chatButtonWrapper: {
    top: -18,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.accent,
  },
});
