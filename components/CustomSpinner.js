import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

export default function CustomSpinner() {
  const block1AnimX = useRef(new Animated.Value(0)).current;
  const block1AnimY = useRef(new Animated.Value(0)).current;

  const block2AnimX = useRef(new Animated.Value(0)).current;
  const block2AnimY = useRef(new Animated.Value(0)).current;

  const EASING = Easing.bezier(0, 0, 0.24, 1.21);
  const DURATION = 600;

  useEffect(() => {
    const runAnimations = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(block1AnimX, { toValue: -30, duration: DURATION, easing: EASING, useNativeDriver: true }),
            Animated.timing(block1AnimY, { toValue: -30, duration: DURATION, easing: EASING, useNativeDriver: true }),
            Animated.timing(block1AnimX, { toValue: 0, duration: DURATION, easing: EASING, useNativeDriver: true }),
            Animated.timing(block1AnimY, { toValue: 0, duration: DURATION, easing: EASING, useNativeDriver: true })
          ]),
          Animated.sequence([
            Animated.timing(block2AnimX, { toValue: 30, duration: DURATION, easing: EASING, useNativeDriver: true }),
            Animated.timing(block2AnimY, { toValue: 30, duration: DURATION, easing: EASING, useNativeDriver: true }),
            Animated.timing(block2AnimX, { toValue: 0, duration: DURATION, easing: EASING, useNativeDriver: true }),
            Animated.timing(block2AnimY, { toValue: 0, duration: DURATION, easing: EASING, useNativeDriver: true })
          ])
        ])
      ).start();
    };

    runAnimations();
  }, [block1AnimX, block1AnimY, block2AnimX, block2AnimY]);

  return (
    <View style={styles.container}>
      <View style={styles.spinnerWrapper}>
        <Animated.View style={[
          styles.block,
          styles.redBlock,
          { transform: [{ translateX: block2AnimX }, { translateY: block2AnimY }] }
        ]} />
        <Animated.View style={[
          styles.block,
          styles.blackBlock,
          { transform: [{ translateX: block1AnimX }, { translateY: block1AnimY }] }
        ]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
  },
  spinnerWrapper: {
    width: 100,
    height: 100,
    position: 'relative'
  },
  block: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  redBlock: {
    backgroundColor: '#a10b0b',
    top: 20,
    left: 20,
  },
  blackBlock: {
    backgroundColor: '#000000',
    top: 50,
    left: 50,
  }
});
