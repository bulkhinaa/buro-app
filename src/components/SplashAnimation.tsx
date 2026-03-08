import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface SplashAnimationProps {
  onFinished: () => void;
}

function GradientText({ style, children }: { style: any; children: string }) {
  if (isWeb) {
    // Load rounded font
    const linkId = 'splash-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@700&display=swap';
      document.head.appendChild(link);
    }

    return React.createElement('span', {
      style: {
        background: 'linear-gradient(90deg, #E8607C, #D4A054)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontFamily: "'Quicksand', sans-serif",
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: 4,
        textTransform: 'lowercase',
      },
    }, children);
  }
  return <Animated.Text style={style}>{children}</Animated.Text>;
}

export function SplashAnimation({ onFinished }: SplashAnimationProps) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const topGlowOpacity = useRef(new Animated.Value(0)).current;
  const fromOpacity = useRef(new Animated.Value(0)).current;
  const fromTranslateY = useRef(new Animated.Value(12)).current;
  const unicornOpacity = useRef(new Animated.Value(0)).current;
  const unicornTranslateY = useRef(new Animated.Value(12)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Top glow + Logo appears with spring bounce
    Animated.parallel([
      Animated.timing(topGlowOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        useNativeDriver: false,
      }),
    ]).start();

    // 2. Glow behind logo appears and pulses
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowOpacity, {
              toValue: 0.4,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(glowScale, {
              toValue: 1.15,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(glowOpacity, {
              toValue: 0.7,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(glowScale, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
        ]),
        { iterations: 3 },
      ),
    ]).start();

    // 3. "from" fades in
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(fromOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(fromTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // 4. "unicorn" fades in
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(unicornOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(unicornTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // 5. Everything fades out
    Animated.sequence([
      Animated.delay(2200),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) onFinished();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Top spotlight glow */}
      <Animated.View style={[styles.topGlow, { opacity: topGlowOpacity }]}>
        {isWeb
          ? React.createElement('div', {
              style: {
                width: '100%',
                height: '100%',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(220,40,100,0.45) 0%, rgba(220,40,100,0.15) 40%, transparent 70%)',
              },
            })
          : <LinearGradient
              colors={['rgba(220,40,100,0.4)', 'rgba(220,40,100,0.1)', 'transparent']}
              locations={[0, 0.4, 0.8]}
              style={StyleSheet.absoluteFill}
            />
        }
      </Animated.View>

      {/* Center content with B logo */}
      <View style={styles.centerArea}>
        {/* Soft circular glow behind logo */}
        <Animated.View
          style={[
            styles.glow,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />

        {/* B logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <LinearGradient
            colors={['#C75070', '#9B3D55', '#7B2D3E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Animated.Text style={styles.logoText}>B</Animated.Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Bottom text block — left-aligned "from" + "unicorn" */}
      <View style={styles.bottomArea}>
        <View style={styles.textBlock}>
          {isWeb
            ? React.createElement(Animated.View, {
                style: { opacity: fromOpacity, transform: [{ translateY: fromTranslateY }] },
              },
                React.createElement('span', {
                  style: {
                    fontFamily: "'Quicksand', sans-serif",
                    fontSize: 15,
                    fontWeight: '500',
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: 1,
                    textTransform: 'lowercase' as const,
                  },
                }, 'from'),
              )
            : <Animated.Text
                style={[
                  styles.fromText,
                  { opacity: fromOpacity, transform: [{ translateY: fromTranslateY }] },
                ]}
              >
                from
              </Animated.Text>
          }
          <Animated.View
            style={{
              opacity: unicornOpacity,
              transform: [{ translateY: unicornTranslateY }],
            }}
          >
            <GradientText style={styles.unicornFallback}>unicorn</GradientText>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0A0510',
    zIndex: 999,
    ...(isWeb ? { minHeight: '100dvh' as any } : {}),
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.45,
    overflow: 'hidden',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(155, 61, 85, 0.3)',
    ...(isWeb
      ? { boxShadow: '0 0 80px 40px rgba(155, 61, 85, 0.4)' }
      : {
          shadowColor: '#9B3D55',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 60,
          elevation: 20,
        }),
  } as any,
  logoWrapper: {
    borderRadius: 30,
    overflow: 'hidden' as const,
    ...(isWeb
      ? { boxShadow: '0 8px 40px rgba(199, 80, 112, 0.5)' }
      : {
          shadowColor: '#C75070',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 15,
        }),
  } as any,
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    textShadowColor: 'rgba(255,255,255,0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bottomArea: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  textBlock: {
    alignItems: 'flex-start',
  },
  fromText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    textTransform: 'lowercase',
    marginBottom: 4,
  },
  unicornFallback: {
    fontSize: 28,
    fontWeight: '700',
    color: '#a855f7',
    letterSpacing: 3,
    textTransform: 'lowercase',
  },
});
