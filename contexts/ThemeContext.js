import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { Appearance, Animated, Platform, UIManager, LayoutAnimation } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === "dark");
  const anim = useRef(new Animated.Value(Appearance.getColorScheme() === "dark" ? 1 : 0)).current;

  // Cargar el tema guardado al iniciar la app
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme_mode");
        if (savedTheme !== null) {
          const isDark = savedTheme === "dark";
          setIsDarkMode(isDark);
          anim.setValue(isDark ? 1 : 0);
        }
      } catch (e) {
        console.log("Error cargando tema:", e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextMode = !isDarkMode;
    
    // Guardar preferencia
    try {
      await AsyncStorage.setItem("theme_mode", nextMode ? "dark" : "light");
    } catch (e) {
      console.log("Error guardando tema:", e);
    }

    // LayoutAnimation personalizada para suavizar el cambio en todos los componentes
    LayoutAnimation.configureNext({
      duration: 800,
      update: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    setIsDarkMode(nextMode);
    
    Animated.timing(anim, {
      toValue: nextMode ? 1 : 0,
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  // Colores estáticos para máxima compatibilidad
  const colors = {
    background: isDarkMode ? "#121212" : "#f9fafb",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    text: isDarkMode ? "#ffffff" : "#111111",
    subtext: isDarkMode ? "#aaaaaa" : "#666666",
    border: isDarkMode ? "#333333" : "#eeeeee",
    primary: "#a10b0b",
    danger: "#dc2626",
  };

  const theme = {
    isDarkMode,
    colors,
    toggleTheme,
    anim,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
