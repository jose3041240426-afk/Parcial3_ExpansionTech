import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabaseClient";

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Obtener IDs de favoritos
      const { data: favs, error: favError } = await supabase
        .from("product_favorites")
        .select("product_id")
        .eq("user_id", user.id);

      if (favError) throw favError;

      if (favs && favs.length > 0) {
        const productIds = favs.map(f => f.product_id);
        
        // 2. Obtener detalles de esos productos
        // Nota: Asumimos que los IDs coinciden con la tabla 'products'
        const { data: products, error: prodError } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (prodError) throw prodError;
        setFavorites(products || []);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.log("Error fetching favorites:", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(productId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("product_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;
      
      // Actualizar estado local
      setFavorites(favorites.filter(p => p.id !== productId));
    } catch (error) {
      console.log("Error removing favorite:", error.message);
    }
  }

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate("ProductDetail", { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        image: item.image,
        description: item.description,
        initialFavorite: true 
      })}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
        <TouchableOpacity 
          style={styles.heartBtn} 
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons name="heart" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>${Number(item.price).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>FAVORITOS</Text>
        <View style={{ width: 44 }} />
      </View>
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#a10b0b" />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-dislike-outline" size={80} color="#ddd" />
          <Text style={styles.emptyTitle}>Sin favoritos aún</Text>
          <Text style={styles.emptySub}>Explora nuestros productos y guarda los que más te gusten.</Text>
          <TouchableOpacity 
            style={styles.exploreBtn} 
            onPress={() => navigation.navigate("Productos")}
          >
            <Text style={styles.exploreText}>Explorar Productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    height: 100,
    backgroundColor: "#a10b0b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 35,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 15,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  imageWrapper: {
    height: 150,
    backgroundColor: "#fefefe",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 6,
    height: 36,
  },
  price: {
    fontSize: 15,
    fontWeight: "900",
    color: "#a10b0b",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  exploreBtn: {
    backgroundColor: "#a10b0b",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 30,
  },
  exploreText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});
