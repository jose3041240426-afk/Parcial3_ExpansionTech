import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  RefreshControl,
  Animated,
  ScrollView,
  FlatList,
  Image,
} from "react-native";
// import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../components/productCard";
import { useLoader } from "../contexts/LoaderContext";
import { supabase } from "../services/supabaseClient"; // Módulo maestro de nube
import { getFavoritesLocal, syncFavoritesLocal } from "../services/favoritesStorage";
import { useTheme } from "../contexts/ThemeContext";

const { width } = Dimensions.get("window");
const CAT_CARD_WIDTH = 160;   // Más ancho
const CAT_CARD_HEIGHT = 180;   // Más alto para acomodar imagen y texto

const CATEGORIES = [
  { id: "c0", name: "TODO", image: "https://m.media-amazon.com/images/I/61rbzNSfrrL._AC_SX522_.jpg", bannerBg: "#1e1e1e", secondaryBg: "#333333" },
  { id: "c1", name: "AUDIO", image: "https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp", bannerBg: "#2d1b4d", secondaryBg: "#4b0082" },
  { id: "c2", name: "MONITORES", image: "https://storage-asset.msi.com/global/picture/product/product_3_20201021135442_5f8fcd223adfa.webp", bannerBg: "#1a2a3a", secondaryBg: "#2e4a62" },
  { id: "c3", name: "TABLETAS", image: "https://ghost-armor.com/media/catalog/product/cache/b364ca7b96ca47e9732299f5b78474d1/i/p/ipad_pro_11.png", bannerBg: "#2c2c2e", secondaryBg: "#444444" },
  { id: "c4", name: "LAPTOPS", image: "https://dlcdnwebimgs.asus.com/gain/23ACC68D-27C6-4F0F-A4AB-6DF6654BB491", bannerBg: "#6b0000", secondaryBg: "#a10b0b" },
  { id: "c5", name: "REDES", image: "https://dlcdnwebimgs.asus.com/gain/CBB222D7-C677-42B8-8FAA-91B36ECB9801", bannerBg: "#004d4d", secondaryBg: "#008080" },
  { id: "c6", name: "ELECTRÓNICA", image: "https://lookaside.fbsbx.com/elementpath/media/?media_id=501577935807376&version=1748439923&transcode_extension=webp", bannerBg: "#4a148c", secondaryBg: "#7b1fa2" },
];

const Particle = ({ delay = 0, startX = 0, startY = 0 }) => {
  const moveAnimY = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(moveAnimY, { toValue: -60, duration: 3000, useNativeDriver: true }),
            Animated.timing(moveAnimY, { toValue: 0, duration: 0, useNativeDriver: true }) // Reset instantáneo
          ])
        )
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{
      position: "absolute",
      left: (CAT_CARD_WIDTH / 2) + startX,
      bottom: (CAT_CARD_HEIGHT / 4) + startY,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#fff",
      opacity: opacityAnim,
      transform: [{ translateY: moveAnimY }],
    }} />
  );
};


function CategoryCard({ item, onPress }) {
  const { colors, isDarkMode } = useTheme();
  // Animación de flotar (loop infinito)
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(Math.random() * 500),
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <TouchableOpacity
      style={styles.categoryCardWrapper}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[
        styles.categoryCard, 
        { 
          backgroundColor: item.bannerBg, 
          borderColor: "rgba(255,255,255,0.1)",
          overflow: "hidden" 
        }
      ]}>
        {/* Simulación de Degradado con Color Secundario */}
        <View style={{
          position: "absolute",
          bottom: -40,
          left: -40,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: item.secondaryBg,
          opacity: 0.6,
        }} />

        {/* Simulación de Brillo / Contraste */}
        <View style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(255,255,255,0.12)",
        }} />
        
        {/* Partículas de ambiente (100% Nativas) */}
        <Particle delay={0} startX={-30} startY={-20} />
        <Particle delay={700} startX={20} startY={10} />
        <Particle delay={1400} startX={-15} startY={-40} />

        <Animated.View style={{ transform: [{ translateY }], width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
          <Image source={{ uri: item.image }} style={styles.categoryImage} resizeMode="contain" />
        </Animated.View>
      </View>
      <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );
}

const AnimatedItem = ({ children, index, delay = 80, refreshKey = 0 }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      delay: Math.min(index * delay, 1000), // Cap delay at 1s to avoid long wait
      useNativeDriver: true,
    }).start();
  }, [index, refreshKey]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <Animated.View style={{ opacity: animatedValue, transform: [{ translateY }], flex: 1 }}>
      {children}
    </Animated.View>
  );
};

export default function ProductListScreen({ navigation, route }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { setIsLoading } = useLoader(); 
  const [products, setProducts] = useState([]); 
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState(route.params?.searchQuery || "");
  const [suggestions, setSuggestions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadLocalFavorites();
    fetchProductsFromCloud();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProductsFromCloud();
    setRefreshKey(prev => prev + 1);
    setRefreshing(false);
  };

  useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }
  }, [route.params?.searchQuery]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const loadLocalFavorites = async () => {
    const localFavs = await getFavoritesLocal();
    if (localFavs.length > 0) setFavoriteIds(localFavs);
  };

  const fetchProductsFromCloud = async () => {
    setIsLoading(true);

    try {
      const { data: productsData, error: pError } = await supabase.from("products").select("*");
      if (pError) throw pError;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: favData } = await supabase
          .from("product_favorites")
          .select("product_id")
          .eq("user_id", session.user.id);

        if (favData) {
          const cloudFavs = favData.map(f => f.product_id.toString());
          setFavoriteIds(cloudFavs);
          await syncFavoritesLocal(cloudFavs);
        }
      }

      if (productsData) {
        setProducts(productsData);
      }
    } catch (error) {
      console.log("Error conectando a Supabase:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={{ marginBottom: 15 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            item={cat}
            onPress={() => {
              setSearchQuery(cat.name === "TODO" ? "" : cat.name);
              setRefreshKey(prev => prev + 1);
            }}
          />
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {searchQuery ? `Resultados para "${searchQuery}"` : "Recomendaciones para ti"}
      </Text>
    </View>
  );

  const renderProduct = ({ item, index }) => {
    const isFav = favoriteIds.map(fid => fid.toString()).includes(item.id.toString());
    return (
      <View style={styles.gridColumn}>
        <AnimatedItem index={index} refreshKey={refreshKey}>
          <ProductCard 
            id={item.id}
            name={item.name}
            price={item.price}
            image={item.image}
            description={item.description}
            initialFavorite={isFav}
            navigation={navigation}
          />
        </AnimatedItem>
      </View>
    );
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PRODUCTOS</Text>
        <TouchableOpacity onPress={toggleTheme} style={{ padding: 5 }}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => `${item.id}-${refreshKey}`}
        renderItem={renderProduct}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          filteredProducts.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={60} color={isDarkMode ? "#333" : "#ddd"} />
              <Text style={[styles.noResultsText, { color: colors.subtext }]}>No se encontraron productos</Text>
            </View>
          )
        )}
        contentContainerStyle={styles.scroll}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={isDarkMode ? "#fff" : "#a10b0b"} 
          />
        }
      />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#a10b0b",
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 35,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2.5,
  },
  scroll: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingTop: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  carousel: {
    paddingBottom: 12,
  },
  categoryCardWrapper: {
    width: CAT_CARD_WIDTH,
    marginRight: 15,
    alignItems: "center",
  },
  categoryCard: {
    width: CAT_CARD_WIDTH,
    height: CAT_CARD_HEIGHT - 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginBottom: 8,
  },
  categoryImage: {
    width: "75%",
    height: "75%",
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
    marginTop: 6,
  },
  gridColumn: {
    width: (width - 40) / 2,
    marginBottom: 16,
  },
  noResults: {
    marginTop: 100,
    alignItems: "center",
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
});