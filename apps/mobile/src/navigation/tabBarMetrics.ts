/**
 * The docked bottom tab bar's height (RootNavigator builds the bar with
 * this same number). React Navigation automatically reserves this much
 * space in every tab screen's layout, so screens don't need to add their
 * own compensation for it — this constant exists purely so the bar's
 * actual geometry and anything that needs to know its height (e.g. Chat's
 * input bar, styled to match the bar's footprint while it's hidden) can't
 * drift apart.
 */
export const TAB_BAR_HEIGHT = 94;
