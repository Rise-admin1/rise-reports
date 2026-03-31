import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DRAWER_WIDTH = 280;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CustomDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onMenuItemSelect: (menuItem: 'funyula' | 'rise') => void;
};

export function CustomDrawer({ isOpen, onClose, onMenuItemSelect }: CustomDrawerProps) {
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#333333' }, 'background');

  React.useEffect(() => {
    translateX.value = withTiming(isOpen ? 0 : -DRAWER_WIDTH, { duration: 300 });
  }, [isOpen]);

  const animatedDrawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: isOpen ? withTiming(0.5, { duration: 300 }) : withTiming(0, { duration: 300 }),
      pointerEvents: isOpen ? 'auto' : 'none',
    };
  });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(-DRAWER_WIDTH, event.translationX);
      }
    })
    .onEnd((event) => {
      if (event.translationX < -DRAWER_WIDTH / 2 || event.velocityX < -500) {
        translateX.value = withTiming(-DRAWER_WIDTH, { duration: 300 });
        runOnJS(onClose)();
      } else {
        translateX.value = withTiming(0, { duration: 300 });
      }
    });

  const handleMenuItemPress = (menuItem: 'funyula' | 'rise') => {
    onMenuItemSelect(menuItem);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.overlay, animatedOverlayStyle]} />
        </TouchableWithoutFeedback>
      )}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.drawer, animatedDrawerStyle]}>
          <ThemedView style={styles.drawerContent}>
            <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
              <ThemedText type="title" style={styles.headerTitle}>
                Reports Menu
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.menuContainer}>
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: borderColor }]}
                onPress={() => handleMenuItemPress('funyula')}
                activeOpacity={0.7}>
                <View style={styles.menuItemContent}>
                  <View style={styles.menuIconContainer}>
                    <Image
                      source={require('@/assets/images/funyula.png')}
                      style={styles.menuImage}
                      contentFit="contain"
                    />
                  </View>
                  <ThemedText type="subtitle" style={styles.menuItemText}>
                    Funyula
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: borderColor }]}
                onPress={() => handleMenuItemPress('rise')}
                activeOpacity={0.7}>
                <View style={styles.menuItemContent}>
                  <View style={styles.menuIconContainer}>
                    <Image
                      source={require('@/assets/images/1-7ffa7b50.png')}
                      style={styles.menuImage}
                      contentFit="contain"
                    />
                  </View>
                  <ThemedText type="subtitle" style={styles.menuItemText}>
                    RISE
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 998,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 999,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  menuContainer: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  menuImage: {
    width: 48,
    height: 48,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
