import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabaseClient";

import { useTheme } from "../contexts/ThemeContext";
import { Animated, Modal } from "react-native";

const RatingModal = ({ visible, onClose, initialRating, onSaveRating }) => {
  const { colors, isDarkMode } = useTheme();
  const [rating, setRating] = useState(initialRating || 0);
  const [showSuccess, setShowSuccess] = useState(false);
  const animValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animValue, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    } else {
      animValue.setValue(0);
      setShowSuccess(false);
    }
  }, [visible]);

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onSaveRating(rating);
    }, 2000);
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.ratingContainer, 
            { 
              backgroundColor: colors.card, 
              opacity: animValue, 
              transform: [{ scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] 
            }
          ]}
        >
          {!showSuccess ? (
            <>
              <View style={styles.ratingIconBox}>
                <Ionicons name="star" size={40} color="#fed500" />
              </View>
              <Text style={[styles.ratingTitle, { color: colors.text }]}>¿TE GUSTA LA APP?</Text>
              <Text style={[styles.ratingSub, { color: colors.subtext }]}>Tu opinión nos ayuda a expandir nuestra tecnología cada día.</Text>
              
              <View style={styles.starsRow}>
                {stars.map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ padding: 5 }}>
                    <Ionicons 
                      name={s <= rating ? "star" : "star-outline"} 
                      size={32} 
                      color={s <= rating ? "#fed500" : colors.subtext} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.ratingBtn, { backgroundColor: rating > 0 ? colors.primary : colors.subtext }]} 
                onPress={handleSave}
                disabled={rating === 0}
              >
                <Text style={styles.ratingBtnText}>ENVIAR RESEÑA</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.ratingCloseBtn}>
                <Text style={[styles.ratingCloseText, { color: colors.subtext }]}>Quizás más tarde</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={[styles.ratingIconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="checkmark-circle" size={50} color="#4caf50" />
              </View>
              <Text style={[styles.ratingTitle, { color: colors.text }]}>¡GRACIAS!</Text>
              <Text style={[styles.ratingSub, { color: colors.subtext }]}>Tu calificación ha sido recibida con éxito. ¡Seguimos innovando!</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const ManageOrdersModal = ({ visible, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('user_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  // Realtime para sincronizar con ProfileScreen si se borra en otro lado (o viceversa)
  React.useEffect(() => {
    let subscription;
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      subscription = supabase
        .channel('settings_orders')
        .on('postgres_changes', { 
           event: '*', 
           schema: 'public', 
           table: 'user_orders',
           filter: `user_id=eq.${user.id}`
        }, () => fetchOrders())
        .subscribe();
    };
    setup();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, []);

  React.useEffect(() => {
    if (visible) fetchOrders();
  }, [visible]);

  const deleteOrder = async (orderId) => {
    Alert.alert("¿Eliminar de la lista?", "Este registro se borrará permanentemente de tu historial.", [
      { text: "Cancelar" },
      { 
        text: "Eliminar", 
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.from('user_orders').delete().eq('id', orderId);
            setOrders(orders.filter(o => o.id !== orderId));
          } catch (err) { console.log(err); }
        }
      }
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.manageModal, { backgroundColor: colors.card }]}>
          <View style={styles.manageHeader}>
            <Text style={[styles.manageTitle, { color: colors.text }]}>GESTIONAR HISTORIAL</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : orders.length === 0 ? (
              <Text style={{ textAlign: "center", color: colors.subtext, marginTop: 40 }}>No hay pedidos para mostrar.</Text>
            ) : orders.map(o => (
              <View key={o.id} style={[styles.manageOrderCard, { borderBottomColor: colors.border }]}>
                <Image source={{ uri: o.product_image }} style={styles.manageOrderImg} resizeMode="contain" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.manageOrderName, { color: colors.text }]} numberOfLines={1}>{o.product_name}</Text>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>${o.price}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteOrder(o.id)} style={styles.manageDeleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function SettingsScreen({ navigation }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [appRating, setAppRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showManageOrders, setShowManageOrders] = useState(false);

  const showTerms = () => {
    Alert.alert("Términos y Condiciones", "Al usar Expansion Tech, aceptas que tus datos serán tratados con la máxima seguridad.\n\nÚltima actualización: Abril 2026.");
  };

  const clearOrderHistory = async () => {
    Alert.alert(
      "Eliminar Historial",
      "¿Estás seguro de que quieres eliminar todo tu historial de compras? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from("user_orders")
                .delete()
                .eq("user_id", user.id);

              if (error) throw error;

              Alert.alert("Éxito", "Historial de compras eliminado correctamente.");
            } catch (err) {
              Alert.alert("Error", "No se pudo eliminar el historial. Inténtalo de nuevo.");
              console.log(err);
            }
          }
        }
      ]
    );
  };

  const clearSavedCards = async () => {
    Alert.alert(
      "Eliminar Métodos de Pago",
      "¿Estás seguro de que quieres eliminar todas tus tarjetas guardadas?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from("user_cards")
                .delete()
                .eq("user_id", user.id);

              if (error) throw error;

              Alert.alert("Éxito", "Tarjetas eliminadas correctamente.");
            } catch (err) {
              Alert.alert("Error", "No se pudieron eliminar las tarjetas.");
              console.log(err);
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AJUSTES</Text>
      </View>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>PREFERENCIAS GENERALES</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.menuItems}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#fef2f2" }]}><Ionicons name="moon-outline" size={20} color={colors.primary} /></View>
              <Text style={[styles.menuText, { color: colors.text }]}>Modo Oscuro</Text>
              <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: "#ccc", true: colors.primary }} />
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 10, color: colors.subtext }]}>ACERCA DE</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.menuItem} onPress={showTerms}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#f3f4f6" }]}><Ionicons name="document-text-outline" size={20} color={colors.subtext} /></View>
              <Text style={[styles.menuText, { color: colors.text }]}>Términos y Condiciones</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.subtext} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setShowRatingModal(true)}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#f3f4f6" }]}><Ionicons name="star-outline" size={20} color={colors.subtext} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuText, { color: colors.text, marginBottom: 4 }]}>Calificar App</Text>
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= appRating ? "star" : "star-outline"}
                      size={16}
                      color={star <= appRating ? "#fed500" : colors.subtext}
                      style={{ marginRight: 3 }}
                    />
                  ))}
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.menuItem}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#f3f4f6" }]}><Ionicons name="information-circle-outline" size={20} color={colors.subtext} /></View>
              <Text style={[styles.menuText, { color: colors.text }]}>Versión de la App</Text>
              <Text style={{ fontSize: 13, color: colors.subtext }}>2.0.4</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 10, color: colors.danger }]}>ZONA DE PELIGRO</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.danger : "#fee2e2" }]}>
          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowManageOrders(true)}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#f1f1f1" }]}><Ionicons name="list-outline" size={20} color={colors.text} /></View>
              <Text style={[styles.menuText, { color: colors.text }]}>Gestionar compras individuales</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.subtext} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={async () => { await supabase.auth.signOut(); }}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#421" : "#fee2e2" }]}><Ionicons name="log-out-outline" size={20} color={colors.danger} /></View>
              <Text style={[styles.menuText, { color: colors.danger }]}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={clearOrderHistory}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#421" : "#fee2e2" }]}><Ionicons name="receipt-outline" size={20} color={colors.danger} /></View>
              <Text style={[styles.menuText, { color: colors.danger }]}>Eliminar historial de compras</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={clearSavedCards}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#421" : "#fee2e2" }]}><Ionicons name="card-outline" size={20} color={colors.danger} /></View>
              <Text style={[styles.menuText, { color: colors.danger }]}>Eliminar tarjetas guardadas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Eliminar Cuenta", "Esta acción es irreversible.", [{ text: "Cancelar" }, { text: "Eliminar", style: "destructive" }])}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#421" : "#fee2e2" }]}><Ionicons name="trash-outline" size={20} color={colors.danger} /></View>
              <Text style={[styles.menuText, { color: colors.danger }]}>Eliminar Cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <RatingModal 
        visible={showRatingModal} 
        onClose={() => setShowRatingModal(false)}
        initialRating={appRating}
        onSaveRating={(r) => {
          setAppRating(r);
          setShowRatingModal(false);
          // Quitamos el Alert genérico
        }}
      />

      <ManageOrdersModal 
        visible={showManageOrders} 
        onClose={() => setShowManageOrders(false)} 
      />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    backgroundColor: "#a10b0b",
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 35,
    elevation: 8,
  },
  backBtn: { marginRight: 15 },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    marginLeft: 15,
  },
  container: { padding: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "900", color: "#999", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  menuCard: { backgroundColor: "#fff", borderRadius: 20, padding: 10, elevation: 5, marginBottom: 20, borderWidth: 1, borderColor: "#eee" },
  menuItems: { paddingVertical: 5 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10 },
  menuIconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#333" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  ratingContainer: { width: "85%", borderRadius: 30, padding: 30, alignItems: "center", elevation: 20, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10 },
  ratingIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(254, 213, 0, 0.1)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  ratingTitle: { fontSize: 18, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  ratingSub: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 25 },
  starsRow: { flexDirection: "row", gap: 10, marginBottom: 30 },
  ratingBtn: { width: "100%", height: 55, borderRadius: 15, justifyContent: "center", alignItems: "center", elevation: 5 },
  ratingBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 1 },
  ratingCloseBtn: { marginTop: 20 },
  ratingCloseText: { fontSize: 13, fontWeight: "600" },
  manageModal: { width: "94%", height: "80%", borderRadius: 30, overflow: 'hidden', elevation: 20 },
  manageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#eee' },
  manageTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  manageOrderCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  manageOrderImg: { width: 50, height: 50 },
  manageOrderName: { fontSize: 14, fontWeight: '700' },
  manageDeleteBtn: { padding: 8, backgroundColor: 'rgba(255,0,0,0.05)', borderRadius: 10 },
});
