import { PixelRatio } from "react-native";

// The bar is as tall as the things it stacks: the stock tab item adds 5px of
// padding per side (BottomTabItem, tabVerticalUiKit), the icon pill is 32px and
// the label line is 15px at the default text size. A hand-picked height left
// the label with less room than its line box and flexbox clipped it.
const ICON_PILL_HEIGHT = 32;
const ITEM_PADDING_Y = 5;
export const TAB_BAR_LABEL_GAP = 2;
export const TAB_BAR_LABEL_FONT_SIZE = 11;
export const TAB_BAR_PADDING_TOP = 6;
export const TAB_BAR_PADDING_BOTTOM = 8;

/** PixelRatio folds the system text size in, so larger type grows the bar. */
export const TAB_BAR_LABEL_LINE_HEIGHT = Math.ceil(
  TAB_BAR_LABEL_FONT_SIZE * 1.36 * PixelRatio.getFontScale(),
);

export const tabBarHeight = (insetBottom: number): number =>
  TAB_BAR_PADDING_TOP +
  TAB_BAR_PADDING_BOTTOM +
  ITEM_PADDING_Y * 2 +
  ICON_PILL_HEIGHT +
  TAB_BAR_LABEL_GAP +
  TAB_BAR_LABEL_LINE_HEIGHT +
  insetBottom;
