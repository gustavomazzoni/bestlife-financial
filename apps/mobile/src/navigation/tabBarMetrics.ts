import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Single source of truth for the floating tab bar's geometry (RootNavigator
 * builds the bar with these same two numbers). `useBottomTabBarHeight()`
 * from @react-navigation/bottom-tabs only reports the bar's own laid-out
 * height — it has no idea about the extra floating gap we position it with
 * (`bottom: insets.bottom + TAB_BAR_BOTTOM_GAP`), so screens that rely on
 * it to reserve bottom space fall short by roughly `insets.bottom` and end
 * up with content/inputs rendered underneath the bar.
 */
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_BOTTOM_GAP = 10;

/** Total space every screen must reserve at the bottom to clear the floating tab bar. */
export function useFloatingTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP + insets.bottom;
}
