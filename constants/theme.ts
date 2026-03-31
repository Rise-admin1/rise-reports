/**
 * RISE brand color scheme: red accent, white text on dark, black background (dark mode).
 * Light mode: white background, red accent, dark text. Dark mode: black background, red accent, white text.
 */

import { Platform } from 'react-native';

/** RISE brand red (primary accent from logo) */
const riseRed = '#C41E3A';
/** Dark gray from logo (brain, base, lines, subtext) */
const riseDarkGray = '#2D2D2D';
const white = '#FFFFFF';
const black = '#000000';

export const Colors = {
  light: {
    text: '#11181C',
    background: white,
    tint: riseRed,
    /** Text on red/dark (primary buttons) */
    tintText: white,
    icon: riseDarkGray,
    tabIconDefault: '#687076',
    tabIconSelected: riseRed,
    /** Card/surface background */
    card: white,
    border: '#E5E5E5',
    /** Hover/pressed state */
    buttonHover: '#FDE8EC',
    buttonHoverText: '#11181C',
    /** Inactive/outline button */
    buttonSecondary: white,
    buttonSecondaryText: '#11181C',
    /** Status/semantic */
    success: '#4CAF50',
    successMuted: '#E8F5E9',
    successText: '#2E7D32',
    error: '#C41E3A',
    errorMuted: '#FFEBEE',
    errorText: '#B91C1C',
  },
  dark: {
    text: white,
    background: black,
    tint: riseRed,
    /** Text on red (primary buttons) */
    tintText: white,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: riseRed,
    /** Card/surface (dark gray from logo) */
    card: riseDarkGray,
    border: '#404040',
    /** Hover/pressed state */
    buttonHover: '#3D3D3D',
    buttonHoverText: white,
    /** Inactive/outline button */
    buttonSecondary: riseDarkGray,
    buttonSecondaryText: white,
    /** Status/semantic */
    success: '#4CAF50',
    successMuted: '#2E3D2E',
    successText: '#81C784',
    error: riseRed,
    errorMuted: '#3D2A2A',
    errorText: '#EF9A9A',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
