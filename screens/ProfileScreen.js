import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "../services/CloudinaryService";
import { supabase } from "../services/supabaseClient";
import { useTheme } from "../contexts/ThemeContext";

const AnimatedSection = ({ children, index, delay = 100, style }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      delay: index * delay,
      useNativeDriver: true,
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

export default function ProfileScreen({ navigation, route }) {
  const { isDarkMode, colors, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [changingPhoto, setChangingPhoto] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await getProfile();
    setRefreshKey(prev => prev + 1);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      getProfile();
      // Si venimos de una compra exitosa, abrimos pedidos automáticamente
      console.log("ProfileScreen route.params:", route?.params);
      if (route?.params?.openOrders === true) {
        console.log("Opening orders modal from checkout");
        setShowOrdersModal(true);
        // Limpiamos los parámetros para que no se abra cada vez que entramos
        navigation.setParams({ openOrders: undefined });
      }
    }, [navigation, route])
  );

  async function getProfile() {
    if (user) {
      // Silently refresh data in background
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const authUser = session.user;
          setUser(authUser);
          setNewName(authUser.user_metadata?.full_name || "");
          fetchOrders(authUser.id);
        }
      } catch (e) {}
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const authUser = session.user;
        setUser(authUser);
        setNewName(authUser.user_metadata?.full_name || "");
        fetchOrders(authUser.id);
      }
    } catch (error) {
      console.log("Error cargando perfil:", error.message);
    } finally {
      // Drop loading spinner instantly due to fast local session cache read
      setLoading(false);
    }
  }

  async function fetchOrders(userId) {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('user_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.log("Fetch Orders Error:", err.message);
    } finally {
      setLoadingOrders(false);
    }
  }

  // Sincronización en tiempo real para el historial
  useEffect(() => {
    let subscription;
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      subscription = supabase
        .channel('any')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'user_orders',
          filter: `user_id=eq.${session.user.id}`
        }, (payload) => {
          // Si algo cambia, refrescamos la lista completa para asegurar orden y consistencia
          fetchOrders(session.user.id);
        })
        .subscribe();
    };

    setupSubscription();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permisos", "Necesitamos acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setChangingPhoto(true);
        const imageUri = result.assets[0].uri;
        const imageUrl = await uploadToCloudinary(imageUri);

        const { error } = await supabase
          .from("profiles")
          .upsert({ id: user.id, avatar_url: imageUrl, updated_at: new Date().toISOString() });

        if (error) throw error;

        await supabase.auth.updateUser({ data: { avatar_url: imageUrl } });

        setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: imageUrl } });
        Alert.alert("Éxito", "Foto de perfil actualizada.");
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setChangingPhoto(false);
      }
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setChangingPhoto(true);
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: null, updated_at: new Date().toISOString() });

      if (error) throw error;

      await supabase.auth.updateUser({ data: { avatar_url: null } });
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: null } });
      Alert.alert("Éxito", "Foto de perfil eliminada.");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setChangingPhoto(false);
    }
  };

  const handleAvatarPress = () => {
    if (!user) {
      Alert.alert("Inicia Sesión", "Debes estar conectado para cambiar tu foto.");
      return;
    }
    
    if (user?.user_metadata?.avatar_url && user?.user_metadata?.avatar_url !== "https://cdn-icons-png.flaticon.com/512/3135/3135715.png") {
      Alert.alert(
        "Foto de Perfil",
        "¿Qué deseas hacer?",
        [
          { text: "Cambiar foto", onPress: handleChangeAvatar },
          { text: "Eliminar foto", onPress: handleDeleteAvatar, style: "destructive" },
          { text: "Cancelar", style: "cancel" }
        ]
      );
    } else {
      handleChangeAvatar();
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío.");
      return;
    }
    try {
      setUpdating(true);
      await supabase.auth.updateUser({ data: { full_name: newName } });
      await supabase.from("profiles").upsert({ 
        id: user.id, full_name: newName, updated_at: new Date() 
      });
      setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: newName } });
      setModalVisible(false);
      Alert.alert("Éxito", "Nombre actualizado.");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#a10b0b" />
      </View>
    );
  }

  const avatarColors = ["#dbeafe", "#dcfce7", "#fef9c3", "#fee2e2", "#f3e8ff", "#ffedd5"];
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const renderAvatar = () => {
    const avatarUrl = user?.user_metadata?.avatar_url;
    const name = user?.user_metadata?.full_name || "U";
    if (avatarUrl && avatarUrl !== "https://cdn-icons-png.flaticon.com/512/3135/3135715.png") {
      return <Image source={{ uri: avatarUrl }} style={styles.avatar} />;
    }
    const colorId = name.length % avatarColors.length;
    const color = avatarColors[colorId];
    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{getInitial(name)}</Text>
      </View>
    );
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MI PERFIL</Text>
        <TouchableOpacity onPress={toggleTheme} style={{ padding: 5 }}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? "#fff" : "#a10b0b"} />
        }
      >
        <AnimatedSection index={0} key={`P0-${refreshKey}`}>
          <View style={styles.profileCard}>
            <TouchableOpacity onPress={handleAvatarPress} disabled={changingPhoto}>
              {changingPhoto ? (
                <View style={styles.avatarLoader}><ActivityIndicator color="#fff" size="large" /></View>
              ) : renderAvatar()}
              <View style={styles.editBadge}><Ionicons name="camera" size={12} color="#fff" /></View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.user_metadata?.full_name || "Usuario Tech"}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <TouchableOpacity style={styles.editProfileBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.editProfileText}>Editar Nombre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={1} key={`P1-${refreshKey}`}>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowOrdersModal(true)}>
                <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#dbeafe" }]}><Ionicons name="bag-handle-outline" size={20} color="#2563eb" /></View>
                <Text style={[styles.menuText, { color: colors.text }]}>Mis Pedidos</Text>
                <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Favorites")}>
                <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#dbeafe" }]}><Ionicons name="heart-outline" size={20} color="#2563eb" /></View>
                <Text style={[styles.menuText, { color: colors.text }]}>Favoritos</Text>
                <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Settings")}>
                <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#dbeafe" }]}><Ionicons name="settings-outline" size={20} color="#2563eb" /></View>
                <Text style={[styles.menuText, { color: colors.text }]}>Configuración</Text>
                <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setShowHelpModal(true)}>
                <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#333" : "#dbeafe" }]}><Ionicons name="help-circle-outline" size={20} color="#2563eb" /></View>
                <Text style={[styles.menuText, { color: colors.text }]}>Ayuda y Soporte</Text>
                <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }]} onPress={handleSignOut}>
                <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#421" : "#fee2e2" }]}><Ionicons name="log-out-outline" size={20} color="#dc2626" /></View>
                <Text style={[styles.menuText, { color: "#dc2626" }]}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedSection>
      </ScrollView>

      {/* MODALES */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>EDITAR NOMBRE</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5", color: colors.text }]} value={newName} onChangeText={setNewName} placeholder="Tu nombre completo" placeholderTextColor={colors.subtext} />
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={[styles.cancelBtnText, { color: colors.subtext }]}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateName} disabled={updating}>
                {updating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showHelpModal} transparent animationType="slide">
        <View style={styles.helpOverlay}>
          <View style={[styles.helpContent, { backgroundColor: colors.card }]}>
            <View style={[styles.helpHeader, { borderBottomColor: colors.border }]}><Text style={[styles.helpTitle, { color: colors.text }]}>AYUDA Y SOPORTE</Text><TouchableOpacity onPress={() => setShowHelpModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity></View>
            <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
               <View style={styles.helpSection}><Ionicons name="mail-outline" size={24} color="#a10b0b" /><View style={{ flex: 1 }}><Text style={styles.helpLabel}>Email</Text><Text style={[styles.helpVal, { color: colors.text }]}>soporte@expansiontech.com</Text></View></View>
               <View style={styles.helpSection}><Ionicons name="logo-whatsapp" size={24} color="#25d366" /><View style={{ flex: 1 }}><Text style={styles.helpLabel}>WhatsApp</Text><Text style={[styles.helpVal, { color: colors.text }]}>+52 55 1234 5678</Text></View></View>
               <View style={styles.helpSection}><Ionicons name="location-outline" size={24} color="#a10b0b" /><View style={{ flex: 1 }}><Text style={styles.helpLabel}>Oficina</Text><Text style={[styles.helpVal, { color: colors.text }]}>Av. Tecnología 404, CDMX.</Text></View></View>
               <View style={{ alignItems: "center", marginTop: 20 }}><Text style={{ color: colors.subtext, fontSize: 12 }}>v2.0.4</Text></View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showOrdersModal} transparent={false} animationType="slide">
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { flexDirection: "row", alignItems: "center" }]}>
            <TouchableOpacity onPress={() => setShowOrdersModal(false)}><Ionicons name="arrow-back" size={26} color="#fff" /></TouchableOpacity>
            <Text style={[styles.headerTitle, { marginLeft: 15 }]}>MIS PEDIDOS</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {orders.length === 0 ? <Text style={{ textAlign: "center", marginTop: 40, color: colors.subtext }}>Sin pedidos.</Text> : orders.map(o => (
              <View key={o.id} style={[styles.orderCard, { backgroundColor: colors.card }]}>
                <Image source={{ uri: o.product_image }} style={styles.orderImage} resizeMode="contain" />
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderName, { color: colors.text }]}>{o.product_name}</Text>
                  <Text style={styles.orderPrice}>${Number(o.price).toLocaleString()}</Text>
                  <View style={[styles.orderStatus, { backgroundColor: isDarkMode ? "#131" : "#dcfce7" }]}>
                    <Text style={[styles.orderStatusText, { color: isDarkMode ? "#4c4" : "#166534" }]}>{o.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 2 },
  container: { padding: 20 },
  profileCard: { backgroundColor: "#a10b0b", borderRadius: 20, padding: 25, flexDirection: "row", alignItems: "center", marginBottom: 25, elevation: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#fff" },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  avatarLoader: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)" },
  editBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#000", width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  profileInfo: { marginLeft: 20, flex: 1 },
  userName: { fontSize: 18, fontWeight: "900", color: "#fff", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 12 },
  editProfileBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, alignSelf: "flex-start" },
  editProfileText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  menuCard: { backgroundColor: "#fff", borderRadius: 20, padding: 10, elevation: 5 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 10 },
  menuIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#333" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 20, width: "100%", padding: 24 },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#000", marginBottom: 20 },
  modalInput: { backgroundColor: "#f5f5f5", borderRadius: 10, height: 50, paddingHorizontal: 15, marginBottom: 20 },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelBtn: { padding: 12 },
  cancelBtnText: { fontWeight: "bold", color: "#666" },
  saveBtn: { backgroundColor: "#a10b0b", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontWeight: "bold" },
  helpOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  helpContent: { backgroundColor: "#fff", borderRadius: 25, width: "100%", maxHeight: "80%", overflow: "hidden" },
  helpHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#eee" },
  helpTitle: { fontSize: 15, fontWeight: "900", color: "#000" },
  helpSection: { flexDirection: "row", gap: 15, marginBottom: 20 },
  helpLabel: { fontSize: 10, fontWeight: "900", color: "#999", textTransform: "uppercase" },
  helpVal: { fontSize: 14, fontWeight: "700", color: "#333" },
  orderCard: { flexDirection: "row", padding: 15, backgroundColor: "#fff", borderRadius: 15, marginBottom: 15, elevation: 2 },
  orderImage: { width: 70, height: 70 },
  orderInfo: { flex: 1, marginLeft: 15 },
  orderName: { fontSize: 15, fontWeight: "700", color: "#333" },
  orderPrice: { fontSize: 14, color: "#a10b0b", fontWeight: "800", marginVertical: 4 },
  orderStatus: { backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, alignSelf: "flex-start" },
  orderStatusText: { fontSize: 10, color: "#166534", fontWeight: "bold" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" }
});