import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Animated,
  ScrollView,
} from "react-native";
// import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabaseClient";
import { useTheme } from "../contexts/ThemeContext";

// ── Datos de ejemplo ─────────────────────────────────────────────────────────
const CATEGORIES = ["TODO", "AUDIO", "MONITORES", "TABLETAS", "LAPTOPS", "REDES", "ELECTRÓNICA"];

const AnimatedItem = ({ children, index, delay = 80 }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      delay: index * delay,
      useNativeDriver: false,
    }).start();
  }, [index]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View style={{ opacity: animatedValue, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ── Componente mini tarjeta ───────────────────────────────────────────────────
function MiniCard({ item, navigation, index }) {
  const { colors, isDarkMode } = useTheme();
  return (
    <AnimatedItem index={index}>
      <TouchableOpacity
        style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() =>
          navigation.navigate("ProductDetail", {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            description: item.description,
          })
        }
        activeOpacity={0.8}
      >
        <View style={[styles.miniImageBox, { backgroundColor: "#fff" }]}>
          <Image
            source={{ uri: item.image }}
            style={styles.miniImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.miniInfo}>
          <Text style={[styles.miniName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.miniPrice}>${item.price} MXN</Text>
        </View>
      </TouchableOpacity>
    </AnimatedItem>
  );
}

const AnimatedSection = ({ children, index, delay = 100, style }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      delay: index * delay,
      useNativeDriver: false,
    }).start();
  }, [index]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <Animated.View style={[{ opacity: animatedValue, transform: [{ translateY }], width: "100%" }, style]}>
      {children}
    </Animated.View>
  );
};

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const [monitors, setMonitors] = useState([]);
  const [tablets, setTablets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshKey(prev => prev + 1);
    setRefreshing(false);
  };

  const fetchHomeData = async () => {
      try {
        const { data, error } = await supabase.from("products").select("*");

        if (error) throw error;

        if (data && data.length > 0) {
          setAllProducts(data);
          setMonitors(data.filter((p) => p.category === "MONITORES"));
          setTablets(data.filter((p) => p.category === "TABLETAS"));
        }
      } catch (err) {
        console.log("Error trayendo info de Supabase: ", err.message);
      }
    };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item) => {
    setSearchQuery("");
    setSuggestions([]);
    navigation.navigate("ProductDetail", {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      description: item.description,
    });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const bestMatch = allProducts.find(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (bestMatch) {
         setSuggestions([]);
         setSearchQuery("");
         navigation.navigate("ProductDetail", {
           id: bestMatch.id,
           name: bestMatch.name,
           price: bestMatch.price,
           image: bestMatch.image,
           description: bestMatch.description,
         });
      } else {
         // Si no hay match directo, ir a la lista general con el query
         setSuggestions([]);
         navigation.navigate("Productos", { searchQuery });
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? "#fff" : "#a10b0b"} />
        }
      >
        {/* ── Barra de búsqueda ── */}
        <AnimatedSection index={0} key={`S0-${refreshKey}`} style={{ zIndex: 1000, elevation: 10 }}>
          <View style={[styles.searchRow, { zIndex: 1000 }]}>
            {/* Contenedor relativo para que las sugerencias no se corten */}
            <View style={{ flex: 1, zIndex: 1000, position: "relative" }}>
              <View style={[styles.searchBox, { backgroundColor: isDarkMode ? colors.card : "#fff", paddingRight: 0 }]}>
                <TextInput
                  placeholder="Quiero comprar..."
                  placeholderTextColor="#aaa"
                  style={[styles.searchInput, { color: colors.text, paddingLeft: 12 }]}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  onSubmitEditing={handleSearchSubmit}
                />
                <TouchableOpacity 
                  onPress={handleSearchSubmit}
                  style={[styles.searchBtnInner, { backgroundColor: "#a10b0b" }]}
                >
                  <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {suggestions.length > 0 && (
                <View style={[styles.suggestionsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {suggestions.map((item) => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <Ionicons name="search-outline" size={14} color={colors.subtext} />
                      <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </AnimatedSection>

        {/* ── Barra de info (México / MXN / Favoritos) ── */}
        <AnimatedSection index={1} key={`S1-${refreshKey}`}>
          <View style={[styles.infoBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.infoItem}>
              <Text style={styles.flagEmoji}>🇲🇽</Text>
              <Text style={[styles.infoText, { color: colors.subtext }]}>México</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="card-outline" size={16} color={colors.subtext} />
              <Text style={[styles.infoText, { color: colors.subtext }]}>MXN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate("Favorites")}
            >
              <Ionicons name="heart-outline" size={16} color="#e62222" />
              <Text style={[styles.infoText, { color: "#e62222" }]}>Favoritos</Text>
            </TouchableOpacity>
          </View>
        </AnimatedSection>

        {/* ── Banner promocional ── */}
        <AnimatedSection index={2} key={`S2-${refreshKey}`}>
          <View style={[styles.banner, { backgroundColor: isDarkMode ? colors.card : "#fff" }]}>
            <View style={styles.bannerImageBox}>
              <Image
                source={require("./assets/tablet_huawei-removebg-preview.png")}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.bannerTextBox}>
              <Text style={[styles.bannerTitle, { color: isDarkMode ? colors.text : "#000" }]}>Potencia que te{"\n"}acompaña.</Text>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => navigation.navigate("Productos")}
              >
                <Text style={styles.bannerBtnText}>VISITAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedSection>

        {/* ── Chips de categorías ── */}
        <AnimatedSection index={3} key={`S3-${refreshKey}`}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.chipsRow}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, { backgroundColor: isDarkMode ? colors.card : "#f3f4f6", borderColor: colors.border }]}
                onPress={() => navigation.navigate("Productos", { searchQuery: cat === "TODO" ? "" : cat })}
              >
                <Text style={[styles.chipText, { color: colors.text }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </AnimatedSection>

        {/* ── Sección: Monitores ── */}
        <AnimatedSection index={4} key={`S4-${refreshKey}`}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Monitores:</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Productos", { searchQuery: "MONITORES" })}>
              <Text style={styles.seeAll}>Ver más</Text>
            </TouchableOpacity>
          </View>
          {monitors.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselRow}
            >
              {monitors.map((item, index) => (
                <MiniCard key={`${item.id}-${refreshKey}`} item={item} navigation={navigation} index={index} />
              ))}
            </ScrollView>
          ) : (
            <Text style={{ textAlign: "center", margin: 20, color: colors.subtext }}>Cargando desde nube...</Text>
          )}
        </AnimatedSection>

        {/* ── Sección: Tabletas ── */}
        <AnimatedSection index={5} key={`S5-${refreshKey}`}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tabletas:</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Productos", { searchQuery: "TABLETAS" })}>
              <Text style={styles.seeAll}>Ver más</Text>
            </TouchableOpacity>
          </View>
          {tablets.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselRow}
            >
              {tablets.map((item, index) => (
                <MiniCard key={`${item.id}-${refreshKey}`} item={item} navigation={navigation} index={index} />
              ))}
            </ScrollView>
          ) : (
            <Text style={{ textAlign: "center", margin: 20 }}>Cargando desde nube...</Text>
          )}
        </AnimatedSection>

        <View style={{ height: 30 }} />

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  // Búsqueda
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: 0,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    overflow: "hidden", // Importante para el botón rojo al final
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    height: 48,
  },
  searchBtnInner: {
    backgroundColor: "#a10b0b",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBtn: {
    backgroundColor: "#e62222",
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Info bar
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 18,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flagEmoji: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },

  // Banner
  banner: {
    marginHorizontal: 60,
    marginTop: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 12,
    height: 120,
  },
  bannerImageBox: {
    width: 120,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerImage: {
    width: 90,
    height: 90,
  },
  bannerTextBox: {
    flex: 1,
    paddingLeft: 8,
    alignItems: "flex-end",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 10,
    marginRight: 10,
    textAlign: "right",
  },
  bannerBtn: {
    backgroundColor: "#e62222",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    alignSelf: "flex-end",
    marginRight: 10,
  },
  bannerBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Chips categorías
  chipsRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },

  // Sección
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  seeAll: {
    fontSize: 13,
    color: "#e62222",
    fontWeight: "600",
  },

  // Carrusel horizontal
  carouselRow: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 10,
  },
  miniCard: {
    width: 150,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  miniImageBox: {
    width: "100%",
    height: 130,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  miniImage: {
    width: "100%",
    height: "100%",
  },
  miniInfo: {
    padding: 8,
  },
  miniName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222",
    lineHeight: 16,
  },
  miniPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#e62222",
    marginTop: 4,
  },
  // Autocomplete
  suggestionsBox: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    maxHeight: 300,
    zIndex: 999,
  },
  suggestionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});