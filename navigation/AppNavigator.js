import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, Image, Text, Animated, Dimensions, TouchableOpacity } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import ProductListScreen from "../screens/ProductListScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import CartScreen from "../screens/CartScreen";
import AuthScreen from "../screens/AuthScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AddressScreen from "../screens/AddressScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import SplashScreen from "../screens/SplashScreen";
import { supabase } from "../services/supabaseClient";
import { useTheme } from "../contexts/ThemeContext";

const Stack = createStackNavigator();
const RootStack = createStackNavigator();
const TopTab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

const Logo = () => {
  return (
    <View style={{ width: 200, height: 60, justifyContent: "center", alignItems: "center" }}>
      <Image
        source={require("../assets/logotr.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </View>
  );
};

const ThemeToggleButton = () => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isDarkMode ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [isDarkMode]);

  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  return (
    <TouchableOpacity 
      onPress={toggleTheme} 
      style={{ 
        marginRight: 15, 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(161, 11, 11, 0.1)",
        justifyContent: "center", 
        alignItems: "center" 
      }}
    >
      <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
        <Ionicons 
          name={isDarkMode ? "sunny" : "moon"} 
          size={22} 
          color={isDarkMode ? "#fff" : "#a10b0b"} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

function CustomTabBar({ state, descriptors, navigation, position, cart }) {
  const tabWidth = (width - 40) / state.routes.length;
  const inputRange = state.routes.map((_, i) => i);
  const translateX = position.interpolate({
    inputRange,
    outputRange: inputRange.map(i => i * tabWidth),
  });

  const icons = {
    Inicio: "home",
    Productos: "cube",
    Carrito: "cart",
    Perfil: "person",
  };

  return (
    <View style={{
      position: "absolute",
      bottom: 25,
      left: 20,
      right: 20,
      backgroundColor: "rgba(161, 11, 11, 0.97)",
      borderRadius: 40,
      height: 70,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
      overflow: "hidden",
    }}>
      <View style={{ flexDirection: 'row', position: 'relative', flex: 1 }}>
        <Animated.View style={{
          position: 'absolute',
          width: tabWidth - 16,
          height: 54,
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          borderRadius: 30,
          transform: [{ translateX: translateX }],
          top: 8,
          left: 8,
          zIndex: 1,
        }} />
        
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const badgeCount = (route.name === "Carrito" || route.name === "Carro") ? cart.length : null;

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons
                  name={isFocused ? icons[route.name] : `${icons[route.name]}-outline`}
                  size={24}
                  color={isFocused ? "#ffffff" : "rgba(255, 255, 255, 0.7)"}
                />
                <Text style={{ color: isFocused ? "#ffffff" : "rgba(255, 255, 255, 0.7)", fontWeight: isFocused ? '700' : '500', fontSize: 11, marginTop: 4 }}>
                  {route.name}
                </Text>
                {badgeCount > 0 && (
                  <View style={{ position: 'absolute', top: -8, right: -12, backgroundColor: '#ff4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{badgeCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ANIMATION_CONFIG = {
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

function HomeStack() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ ...ANIMATION_CONFIG }}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          headerTitle: () => <Logo />,
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.background, height: 80 },
          headerShadowVisible: false,
          headerRight: () => <ThemeToggleButton />,
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs({ cart, setCart }) {
  return (
    <TopTab.Navigator
      tabBarPosition="bottom"
      tabBar={props => <CustomTabBar {...props} cart={cart} />}
      screenOptions={{ swipeEnabled: true }}
    >
      <TopTab.Screen name="Inicio" component={HomeStack} />
      <TopTab.Screen name="Productos" component={ProductListScreen} />
      <TopTab.Screen name="Carrito">
        {(props) => <CartScreen {...props} cart={cart} setCart={setCart} />}
      </TopTab.Screen>
      <TopTab.Screen name="Perfil" component={ProfileScreen} />
    </TopTab.Navigator>
  );
}

export default function AppNavigator() {
  const [cart, setCart] = useState([]);
  const [session, setSession] = useState(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    const timer = setTimeout(() => {
      setAppReady(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (session?.user) fetchUserCart();
    else setCart([]);
  }, [session]);

  const fetchUserCart = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from("cart_items").select("*").eq("user_id", session.user.id);
      if (error) throw error;
      if (data) {
        const mappedCart = [];
        data.forEach(item => {
          const validPrice = parseFloat(item.price) || 0;
          for (let i = 0; i < item.quantity; i++) {
            mappedCart.push({ 
              id: item.product_id, 
              name: item.name || "Producto", 
              price: validPrice, 
              image: item.image 
            });
          }
        });
        setCart(mappedCart);
      }
    } catch (err) { console.log(err); }
  };

  if (!appReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {session && session.user ? (
        <RootStack.Navigator screenOptions={{ headerShown: false, ...ANIMATION_CONFIG }}>
          <RootStack.Screen name="MainTabs">
            {(props) => <MainTabs {...props} cart={cart} setCart={setCart} />}
          </RootStack.Screen>

          <RootStack.Screen name="ProductDetail">
            {(props) => <ProductDetailScreen {...props} cart={cart} setCart={setCart} />}
          </RootStack.Screen>

          <RootStack.Screen name="ProductList" component={ProductListScreen} />
          <RootStack.Screen name="Favorites" component={FavoritesScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
          <RootStack.Screen name="Address" component={AddressScreen} />
        </RootStack.Navigator>
      ) : (
        <AuthScreen />
      )}
    </NavigationContainer>
  );
}