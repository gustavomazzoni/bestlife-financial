import {
  NavigationContainer,
  getFocusedRouteNameFromRoute,
  RouteProp,
} from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { HomeStack } from './HomeStack';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { AccountsStack } from './AccountsStack';
import { TAB_BAR_HEIGHT } from './tabBarMetrics';
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

/**
 * Hides the tab bar when a nested stack's focused screen is
 * `hiddenOnRouteName` (e.g. Settings inside HomeStack, Categories inside
 * AccountsStack) — those screens already have their own back button, so
 * the bar underneath is redundant. `getFocusedRouteNameFromRoute` is the
 * standard React Navigation pattern for reading a nested stack's current
 * screen from the parent Tab.Screen's own `options`.
 */
function tabBarStyleFor(
  route: RouteProp<Record<string, object | undefined>, string>,
  hiddenOnRouteName: string,
  defaultRouteName: string
) {
  const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? defaultRouteName;
  return focusedRouteName === hiddenOnRouteName
    ? { display: 'none' as const }
    : styles.tabBar;
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.foreground,
          tabBarInactiveTintColor: colors.mutedForeground2,
          tabBarStyle: [styles.tabBar],
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={({ route }) => ({
            title: 'Início',
            tabBarStyle: tabBarStyleFor(route, 'Settings', 'HomeMain'),
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" color={color} size={size - 2} strokeWidth={1.8} />
            ),
          })}
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
            tabBarStyle: { display: 'none' },
            tabBarLabelStyle: styles.chatTabBarLabel,
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
          options={({ route }) => ({
            title: 'Contas',
            tabBarStyle: tabBarStyleFor(route, 'Categories', 'AccountsHome'),
            tabBarIcon: ({ color, size }) => (
              <Feather name="credit-card" color={color} size={size - 2} strokeWidth={1.8} />
            ),
          })}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 8,
    ...shadow.card,
  },
  tabBarLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 10,
  },
  chatTabBarLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 10,
    // tabBarActiveTintColor/tabBarInactiveTintColor are read from whichever
    // tab is currently focused (shared across every tab item, not each
    // tab's own options — confirmed in @react-navigation/bottom-tabs'
    // BottomTabBar source), so they can't reliably color just this one
    // label. A color set directly here wins over that shared tint
    // regardless (see @react-navigation/elements' Label component).
    color: colors.accentForeground,
  },
  chatButtonWrapper: {
    top: -18,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.accent,
  },
});
