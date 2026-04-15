import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

// Removidos los componentes animados para evitar errores de renderizado y mejorar la fluidez

import { supabase } from "../services/supabaseClient";
import CryptoJS from "crypto-js";
import { useTheme } from "../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- COMPONENTES DE APOYO (REUTILIZADOS/ADAPTADOS POR CONSISTENCIA) ---

const FlipCard = ({ number, name, date }) => {
  const animatedValue = useState(new Animated.Value(0))[0];
  const [isFlipped, setIsFlipped] = useState(false);
  const flipCard = () => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };
  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });
  const frontOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });
  const backOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });
  return (
    <TouchableOpacity onPress={flipCard} activeOpacity={1} style={styles.flipWrapper}>
      <View style={styles.flipCardContainer}>
        <Animated.View
          style={[
            styles.flipCardSide,
            styles.flipCardFront,
            { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
          ]}
        >
          <Text style={styles.cardBrand}>MASTERCARD</Text>
          <View style={styles.cardLogos}>
            <View style={styles.mcCircles}>
              <View style={[styles.mcCircle, { backgroundColor: "#ff9800", left: 15 }]} />
              <View style={[styles.mcCircle, { backgroundColor: "#d50000" }]} />
            </View>
          </View>
          <View style={styles.cardChip} />
          <Ionicons name="wifi" size={20} color="#fff" style={styles.contactlessIcon} />
          <Text style={styles.cardNumber}>{number || "9759 2484 5269 6576"}</Text>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardFooterLabel}>VENCE</Text>
              <Text style={styles.cardFooterValue}>{date || "12/28"}</Text>
            </View>
            <Text style={styles.cardOwner}>{name || "EXPANSION USER"}</Text>
          </View>
        </Animated.View>
        <Animated.View
          style={[
            styles.flipCardSide,
            styles.flipCardBack,
            { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
          ]}
        >
          <View style={styles.cardStrip} />
          <View style={styles.signatureStrip}>
            <View style={styles.cvvBox}>
              <Text style={styles.cvvText}>***</Text>
            </View>
          </View>
          <Text style={styles.backInfo}>
            Esta tarjeta es propiedad de Expansion Tech. Si la encuentra, por favor devuélvala.
          </Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const AddCardModal = ({ visible, onClose, onSaveCard }) => {
  const { colors, isDarkMode } = useTheme();
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  const handleNumChange = (text) => {
    let clean = text.replace(/\D/g, "");
    if (clean.length > 16) clean = clean.slice(0, 16);
    let formatted = clean.match(/.{1,4}/g)?.join(" ") || "";
    setNum(formatted);
  };

  const handleExpChange = (text) => {
    let clean = text.replace(/\D/g, "");
    if (clean.length > 4) clean = clean.slice(0, 4);
    if (clean.length >= 2) {
      let month = parseInt(clean.slice(0, 2));
      if (month > 12) month = 12;
      if (month === 0 && clean.length === 2) month = 1;
      let monthStr = month.toString().padStart(2, "0");
      let yearStr = clean.slice(2);
      setExp(monthStr + (yearStr ? "/" + yearStr : ""));
    } else {
      setExp(clean);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.addCardOverlay}>
        <View style={[styles.addCardContent, { backgroundColor: colors.card }]}>
          <View style={[styles.addCardHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.addCardTitle, { color: colors.text }]}>AÑADIR TARJETA</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.addCardForm}>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>NÚMERO DE TARJETA</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5" }]}>
              <Ionicons name="card-outline" size={20} color="#666" />
              <TextInput
                style={[styles.formInput, { color: colors.text }]}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                value={num}
                onChangeText={handleNumChange}
                maxLength={19}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.subtext }]}>NOMBRE EN LA TARJETA</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5" }]}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <TextInput
                style={[styles.formInput, { color: colors.text }]}
                placeholder="NOMBRE COMO APARECE"
                placeholderTextColor={colors.subtext}
                autoCapitalize="characters"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.subtext }]}>FECHA EXP.</Text>
                <TextInput
                  style={[styles.formInputSmall, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5", color: colors.text }]}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                  value={exp}
                  onChangeText={handleExpChange}
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.subtext }]}>CVV</Text>
                <TextInput
                  style={[styles.formInputSmall, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5", color: colors.text }]}
                  placeholder="123"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                  secureTextEntry
                  value={cvv}
                  onChangeText={setCvv}
                  maxLength={3}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.saveCardBtn}
              onPress={() => onSaveCard(num, exp, cvv, name)}
            >
              <Text style={styles.saveCardText}>GUARDAR Y USAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SuccessModal = ({ visible, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-close modal after 3.5 seconds
      const timer = setTimeout(() => {
        console.log("Auto-closing success modal after 3.5 seconds and navigating to Perfil");
        if (onCloseRef.current) onCloseRef.current();
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      scaleValue.setValue(0);
      opacityValue.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={successStyles.overlay}>
        <Animated.View
          style={[
            successStyles.animContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              transform: [{ scale: scaleValue }],
              opacity: opacityValue,
            },
          ]}
        >
          <View style={[successStyles.iconCircle, { backgroundColor: isDarkMode ? "#2d0000" : "#fce8e8" }]}>
            <Ionicons name="checkmark-done-circle" size={80} color="#a10b0b" />
          </View>
          <Text style={[successStyles.newText, { color: colors.text }]}>¡COMPRA EXITOSA!</Text>
          <Text style={[successStyles.subText, { color: colors.subtext }]}>
            Tu pedido ha sido procesado con éxito. Puedes ver los detalles en tu perfil.
          </Text>
          <TouchableOpacity
            style={[successStyles.finishBtn, { backgroundColor: "#a10b0b" }]}
            onPress={onClose}
          >
            <Text style={successStyles.finishBtnText}>CONTINUAR</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const SECRET_KEY = "ExpansionTechSecretKey2026!";
const decrypt = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || ciphertext;
  } catch {
    return ciphertext;
  }
};

const CheckoutModal = ({ visible, onClose, price, onManageCard, address, card }) => {
  const { colors, isDarkMode } = useTheme();
  const safePrice = typeof price === "number" && !isNaN(price) ? price : 0;
  const subtotal = safePrice;
  const shipping = 99;
  const tax = safePrice * 0.16;
  const total = subtotal + shipping + tax;

  const [showSwipe, setShowSwipe] = useState(false);
  const swipePan = useRef(new Animated.Value(0)).current;
  const sliderWidth = SCREEN_WIDTH - 40;
  const thumbSize = 55;
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < sliderWidth - thumbSize - 10) {
          swipePan.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx >= sliderWidth - thumbSize - 40) {
          Animated.timing(swipePan, {
            toValue: sliderWidth - thumbSize - 10,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            setTimeout(() => {
              if (onCloseRef.current) onCloseRef.current(true);
            }, 500);
          });
        } else {
          Animated.spring(swipePan, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      setShowSwipe(false);
      swipePan.setValue(0);
    }
  }, [visible, swipePan]);

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={() => onClose(false)}>
      <SafeAreaView style={[styles.fullCheckoutContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.checkoutHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => onClose(false)}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.checkoutHeaderTitle, { color: colors.text }]}>FINALIZAR COMPRA</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView style={styles.checkoutBody} showsVerticalScrollIndicator={false}>
          <View style={styles.checkoutSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>DIRECCIÓN DE ENVÍO</Text>
            </View>
            <View style={[styles.infoBox, { backgroundColor: isDarkMode ? colors.card : "#f9f9f9", borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={20} color={colors.subtext} />
              <View style={styles.infoText}>
                <Text style={[styles.infoMain, { color: colors.text }]}>
                  {address?.street || "No se especificó calle"}
                </Text>
                <Text style={[styles.infoSub, { color: colors.subtext }]}>
                  {address ? `${address.colonia}, CP ${address.zip}, ${address.state}` : "Ve a perfil para añadir dirección"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.checkoutSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>MÉTODO DE PAGO</Text>
              <TouchableOpacity onPress={onManageCard}>
                <Text style={styles.changeLink}>AÑADIR O CAMBIAR</Text>
              </TouchableOpacity>
            </View>
            <FlipCard 
              number={card ? `**** **** **** ${card.last_4}` : "9759 2484 5269 6576"}
              name={card ? card.card_name : "EXPANSION USER"}
              date={card ? decrypt(card.expiry) : "12/28"}
            />
            <Text style={styles.cardHint}>Toca la tarjeta para ver el reverso</Text>
          </View>
          <View style={[styles.summarySection, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>RESUMEN DEL PEDIDO</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>${subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.subtext }]}>Envío</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>${shipping.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.subtext }]}>IVA (16%)</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>${tax.toLocaleString()}</Text>
            </View>
            <View style={[styles.uiverseHr, { backgroundColor: colors.border }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>TOTAL</Text>
              <Text style={styles.totalPrice}>${total.toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>
        <View style={[styles.checkoutFooterFixed, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {!showSwipe ? (
            <TouchableOpacity style={styles.confirmPayBtn} onPress={() => setShowSwipe(true)}>
              <Text style={styles.confirmPayText}>CONFIRMAR Y PAGAR</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.swipeContainer, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f0f0f0" }]}>
              <View style={styles.swipeTrack}>
                <Text style={[styles.swipeText, { color: colors.primary }]}>DESLIZA PARA PAGAR</Text>
              </View>
              <Animated.View
                {...panResponder.panHandlers}
                style={[styles.swipeThumb, { backgroundColor: isDarkMode ? colors.card : "#fff", transform: [{ translateX: swipePan }] }]}
              >
                <Ionicons name="arrow-forward" size={24} color={colors.primary} />
              </Animated.View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function CartScreen({ cart, setCart, navigation }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [isPaymentAnimVisible, setIsPaymentAnimVisible] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [savedCard, setSavedCard] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);


  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initializeCart();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeCart();
    setRefreshKey(prev => prev + 1);
    setRefreshing(false);
  };

  async function initializeCart() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      fetchAddress(user.id);
      fetchCard(user.id);
    }
  }

  async function fetchCard(userId) {
    try {
      const { data } = await supabase
        .from("user_cards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setSavedCard(data);
    } catch (err) {}
  }

  async function fetchAddress(userId) {
    const { data } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setUserAddress(data);
  }

  const groupedCart = cart.reduce((acc, item) => {
    const existing = acc.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
      existing.totalPrice += item.price;
    } else {
      acc.push({ ...item, quantity: 1, totalPrice: item.price });
    }
    return acc;
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discount = 0;
  const shipping = cart.length > 0 ? 99 : 0;
  const total = subtotal - discount + shipping;

  const addItem = async (item) => {
    console.log("addItem called for:", item.id, item.name);
    setCart([...cart, { id: item.id, name: item.name, price: item.price, image: item.image }]);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("product_id", item.id)
          .maybeSingle();
        if (existing && existing.id) {
          console.log("Item exists in cart, updating quantity");
          await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        } else if (!existing) {
          // Insert new cart item if it doesn't exist
          console.log("Item is new, inserting into cart_items");
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: item.id,
            quantity: 1
          });
        }
      }
    } catch (err) { console.log(err); }
  };

  const removeItem = async (productId) => {
    // Evitar que la cantidad baje de 1 usando el botón de menos.
    // Obligamos al usuario a usar el botón dedicado de "Eliminar producto".
    const currentItem = groupedCart.find((i) => i.id === productId);
    if (currentItem && currentItem.quantity <= 1) {
      return;
    }

    const index = cart.findLastIndex((i) => i.id === productId);
    if (index !== -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: existing } = await supabase
            .from("cart_items")
            .select("*")
            .eq("user_id", user.id)
            .eq("product_id", productId)
            .maybeSingle();
          if (existing && existing.id) {
            if (existing.quantity > 1) {
              await supabase.from("cart_items").update({ quantity: existing.quantity - 1 }).eq("id", existing.id);
            } else {
              await supabase.from("cart_items").delete().eq("id", existing.id);
            }
          }
        }
      } catch (err) { console.log(err); }
    }
  };

  const deleteEntireProduct = async (productId) => {
    Alert.alert("Eliminar Producto", "¿Estás seguro de quitar este producto de tu carrito?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, eliminar", style: "destructive", onPress: async () => {
          const newCart = cart.filter(i => i.id !== productId);
          setCart(newCart);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
            }
          } catch (err) { console.log(err); }
        }
      }
    ]);
  };

  const emptyCartAction = async () => {
    Alert.alert("Vaciar Carrito", "¿Deseas eliminar todos los productos de tu carrito?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Vaciar todo", style: "destructive", onPress: async () => {
          setCart([]);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("cart_items").delete().eq("user_id", user.id);
            }
          } catch (err) { console.log(err); }
        }
      }
    ]);
  };

  // We save a snapshot of the cart at checkout time so that the order
  // persists even after we clear the local cart for the success modal.
  const checkoutCartRef = useRef([]);

  const handleCheckoutSuccess = async (success) => {
    console.log("handleCheckoutSuccess triggered with success:", success);
    setShowCheckout(false);
    if (success === true) {
      console.log("Success is TRUE - Saving cart snapshot and showing success modal");
      // Snapshot the current grouped cart BEFORE clearing
      checkoutCartRef.current = groupedCart.map(item => ({ ...item }));
      setIsPaymentAnimVisible(true);
      // NOTE: we do NOT clear the cart here.
      // The cart will be cleared when the SuccessModal closes (see onClose handler).
    }
  };

  const persistOrderAndClearCart = async () => {
    let activeUser = currentUser;

    if (!activeUser) {
      console.log("currentUser is null, fetching from getUser()...");
      const { data: { user } } = await supabase.auth.getUser();
      activeUser = user;
    }

    if (!activeUser) {
      console.error("Critical: Could not determine activeUser");
      Alert.alert("Error", "No se detectó una sesión activa. Por favor, inicia sesión de nuevo.");
      return;
    }

    console.log("Active user verified:", activeUser.email, "id:", activeUser.id);

    const snapshotCart = checkoutCartRef.current;

    try {
      if (!snapshotCart || snapshotCart.length === 0) {
        console.log("Cart snapshot is empty, nothing to insert.");
        return;
      }

      const ordersToInsert = snapshotCart
        .filter(item => item && item.id && item.name && item.quantity !== undefined && item.totalPrice !== undefined)
        .map(item => ({
          user_id: activeUser.id,
          product_id: item.id.toString(),
          product_name: `${item.name} (x${item.quantity})`,
          product_image: item.image || null,
          price: parseFloat(item.totalPrice) || 0,
          status: "Procesando"
        }));

      if (ordersToInsert.length === 0) {
        console.error("No valid orders to insert after filtering.");
        Alert.alert("Error", "No se encontraron productos válidos para procesar.");
        return;
      }

      console.log("Inserting orders into Supabase...");
      const { data, error } = await supabase.from("user_orders").insert(ordersToInsert).select();

      if (error) {
        console.error("Supabase Insertion Error:", error);
        throw new Error(error.message);
      }

      console.log("Insertion successful, data stored:", data?.length, "records");

      console.log("Attempting to clear cart in Supabase for user:", activeUser.id);
      const { error: deleteError } = await supabase.from("cart_items").delete().eq("user_id", activeUser.id);
      if (deleteError) {
        console.error("Error clearing cart items:", deleteError);
      }

      console.log("Clearing local cart state...");
      setCart([]);
    } catch (err) {
      console.error("Checkout Logic Crash Details:", err);
      Alert.alert("Error de Persistencia", err?.message || "Error desconocido al guardar en BD");
    }
  };

  const handleSaveCard = async (num, exp, cvv, name) => {
    if (!currentUser) return;
    try {
      const SECRET_KEY = "ExpansionTechSecretKey2026!";
      const encrypt = (text) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
      const last4 = num.replace(/\s/g, "").slice(-4) || "****";

      const { error } = await supabase.from("user_cards").insert({
        user_id: currentUser.id,
        card_number: encrypt(num),
        last_4: last4,
        card_name: name,
        expiry: encrypt(exp),
        cvv: encrypt(cvv)
      });
      const newCard = { last_4: last4, card_name: name, expiry: encrypt(exp) };
      setSavedCard(newCard);

      setShowAddCard(false);
      Alert.alert("Éxito", "Tarjeta guardada correctamente.");
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar la tarjeta.");
    }
  };

  if (cart.length === 0 && !isPaymentAnimVisible) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TU CARRITO:</Text>
          <TouchableOpacity onPress={toggleTheme} style={{ padding: 5 }}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom', 'left', 'right']}>
          <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
            <Ionicons name="cart-outline" size={80} color={isDarkMode ? "#333" : "#ccc"} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>Tu carrito está vacío</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <>
      {/* Ajuste: sacamos el header del SafeAreaView para que empiece desde arriba y lo bajamos con padding */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TU CARRITO:</Text>
        <TouchableOpacity onPress={toggleTheme} style={{ padding: 5 }}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom', 'left', 'right']}>

        <ScrollView
          contentContainerStyle={styles.masterContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? "#fff" : "#a10b0b"} />
          }
        >
          <View style={{ width: "100%" }}>
            <View style={[styles.card, styles.cartCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 10, marginBottom: 15 }}>
                <Text style={[styles.cardTitle, { color: colors.subtext, borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>MI CARRITO</Text>
                <TouchableOpacity onPress={emptyCartAction} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
                  <Ionicons name="trash-outline" size={16} color="#a10b0b" />
                  <Text style={{ color: "#a10b0b", fontSize: 12, fontWeight: '700', marginLeft: 4 }}>VACIAR TODO</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.productsList}>
                {groupedCart.map((item, index) => (
                  <View key={`${item.id}-${index}`}>
                    <View style={styles.productRow}>
                      <View style={[styles.imageBox, { backgroundColor: "#fff" }]}>
                        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
                      </View>
                      <View style={styles.productDetails}>
                        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.productSubtext, { color: colors.subtext }]}>Garantía de Calidad</Text>
                        <TouchableOpacity onPress={() => deleteEntireProduct(item.id)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <Ionicons name="trash-bin-outline" size={14} color="#a10b0b" />
                          <Text style={{ color: '#a10b0b', fontSize: 11, marginLeft: 4, fontWeight: '600' }}>Eliminar producto</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.quantityContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.id)}>
                          <Ionicons name="remove" size={16} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyLabel, { color: colors.text }]}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem(item)}>
                          <Ionicons name="add" size={16} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.productPrice, { color: colors.text }]}>${item.price}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={{ width: "100%" }}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <Text style={[styles.cardTitle, { color: colors.subtext, borderBottomColor: colors.border }]}>APLICAR CUPONES</Text>
              <View style={styles.couponForm}>
                <TextInput
                  placeholder="Escribe tu código de cupón"
                  placeholderTextColor={colors.subtext}
                  style={[styles.couponInput, { backgroundColor: isDarkMode ? "#333" : "#fff", borderColor: colors.border, color: colors.text }]}
                />
                <TouchableOpacity style={styles.applyBtn}>
                  <Text style={styles.applyBtnText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={{ height: 180 }} />
        </ScrollView>

        <View style={{ width: "100%" }}>
          <View style={[styles.card, styles.checkoutCardFixed, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDarkMode ? 1 : 0, shadowColor: isDarkMode ? "#000" : "#ccc" }]}>
            <Text style={[styles.cardTitle, { color: colors.subtext, borderBottomColor: colors.border }]}>RESUMEN DE COMPRA</Text>
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.subtext }]}>Subtotal:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.subtext }]}>Costo de Envío:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>${shipping.toFixed(2)}</Text>
              </View>
            </View>

            <View style={[styles.checkoutFooter, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f4f4f7" }]}>
              <View style={styles.finalPriceRow}>
                <Text style={[styles.priceSymbol, { color: colors.text }]}>$</Text>
                <Text style={[styles.finalPriceText, { color: colors.text }]}>{total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowCheckout(true)}>
                <Text style={styles.checkoutBtnText}>Pagar Ahora</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </SafeAreaView>

      <CheckoutModal
        visible={showCheckout}
        onClose={handleCheckoutSuccess}
        price={subtotal}
        address={userAddress}
        card={savedCard}
        onManageCard={() => setShowAddCard(true)}
      />

      <AddCardModal
        visible={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSaveCard={handleSaveCard}
      />

      <SuccessModal
        visible={isPaymentAnimVisible}
        onClose={async () => {
          console.log("SuccessModal onClose called - persisting order and navigating");
          setIsPaymentAnimVisible(false);
          await persistOrderAndClearCart();
          navigation.navigate("Perfil", { openOrders: true });
        }}
      />
    </>
  );
}

const successStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  animContainer: {
    width: "85%",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  newText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
    opacity: 0.8,
  },
  finishBtn: {
    width: "100%",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#a10b0b",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finishBtnText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 14,
  },
});

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#a10b0b",
    height: 100,
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
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2.5,
  },
  masterContainer: {
    padding: 15,
    paddingTop: 15,
    paddingBottom: 20,
    gap: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden",
  },
  checkoutCardFixed: {
    position: "absolute",
    bottom: 100,
    left: 15,
    right: 15,
    borderRadius: 12,
    elevation: 20,
    shadowOpacity: 0.2,
    backgroundColor: "#fff",
  },
  cardTitle: {
    paddingLeft: 20,
    height: 40,
    textAlignVertical: "center",
    lineHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#efeff3",
    fontWeight: "700",
    fontSize: 11,
    color: "#63656b",
    textTransform: "uppercase",
  },
  productsList: {
    padding: 10,
    gap: 15,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  imageBox: {
    width: 60,
    height: 60,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: 50,
    height: 50,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#47484b",
    marginBottom: 2,
  },
  productSubtext: {
    fontSize: 11,
    color: "#7a7c81",
    fontWeight: "600",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 7,
    backgroundColor: "#fff",
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyLabel: {
    width: 20,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#47484b",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#47484b",
    width: 70,
    textAlign: "right",
  },
  couponForm: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 5,
    paddingHorizontal: 12,
    fontSize: 12,
    backgroundColor: "#fff",
  },
  applyBtn: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 5,
    backgroundColor: "#115DFC",
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  detailsBox: {
    padding: 15,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#707175",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#47484b",
  },
  checkoutFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4f4f7",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  finalPriceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  priceSymbol: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2B2B2F",
    marginTop: 2,
  },
  finalPriceText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2B2B2F",
  },
  checkoutBtn: {
    width: 140,
    height: 38,
    backgroundColor: "#115DFC",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    color: "#999",
    fontWeight: "500",
  },
  fullCheckoutContainer: { flex: 1, backgroundColor: "#fff" },
  checkoutHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: "#eee" },
  checkoutHeaderTitle: { fontSize: 16, fontWeight: "900", color: "#000", letterSpacing: 1 },
  checkoutBody: { flex: 1, padding: 20 },
  checkoutSection: { marginBottom: 30 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: "800", color: "#000", letterSpacing: 1 },
  changeLink: { fontSize: 11, fontWeight: "700", color: "#a10b0b" },
  infoBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f9f9f9", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#eee" },
  infoText: { flex: 1 },
  infoMain: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  infoSub: { fontSize: 12, color: "#666" },
  uiverseHr: { height: 1, backgroundColor: "#eee", marginVertical: 15 },
  summarySection: { backgroundColor: "#fff", paddingBottom: 120 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: "#666" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#000" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 18, fontWeight: "900", color: "#000" },
  totalPrice: { fontSize: 24, fontWeight: "900", color: "#a10b0b" },
  checkoutFooterFixed: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 20, borderTopWidth: 1, borderTopColor: "#eee" },
  confirmPayBtn: { backgroundColor: "#a10b0b", height: 55, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  confirmPayText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  swipeContainer: { height: 55, justifyContent: "center", backgroundColor: "#f0f0f0", borderRadius: 12, overflow: "hidden" },
  swipeTrack: { position: "absolute", width: "100%", alignItems: "center" },
  swipeText: { color: "#a10b0b", fontSize: 14, fontWeight: "900", letterSpacing: 2, opacity: 0.5 },
  swipeThumb: { width: 55, height: 45, backgroundColor: "#fff", borderRadius: 10, justifyContent: "center", alignItems: "center", marginLeft: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  flipWrapper: { alignItems: "center", marginVertical: 10 },
  flipCardContainer: { width: 300, height: 180 },
  flipCardSide: { width: "100%", height: "100%", borderRadius: 16, padding: 20, position: "absolute", backfaceVisibility: "hidden" },
  flipCardFront: { backgroundColor: "#171717", justifyContent: "space-between" },
  flipCardBack: { backgroundColor: "#171717", justifyContent: "flex-start" },
  cardBrand: { color: "#fff", fontSize: 10, fontWeight: "bold", letterSpacing: 2, position: "absolute", top: 20, right: 20 },
  cardLogos: { position: "absolute", top: 60, right: 20 },
  mcCircles: { flexDirection: "row" },
  mcCircle: { width: 30, height: 30, borderRadius: 15 },
  cardChip: { width: 40, height: 30, backgroundColor: "#d4af37", borderRadius: 4, marginTop: 10 },
  contactlessIcon: { position: "absolute", top: 20, left: 20 },
  cardNumber: { color: "#fff", fontSize: 18, fontWeight: "bold", letterSpacing: 2, marginTop: 20 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardFooterLabel: { color: "#aaa", fontSize: 7, fontWeight: "bold" },
  cardFooterValue: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  cardOwner: { color: "#fff", fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  cardStrip: { backgroundColor: "#000", height: 40, width: "120%", marginLeft: -20, marginTop: 10 },
  signatureStrip: { backgroundColor: "#fff", height: 30, width: "80%", marginTop: 20, alignSelf: "center", borderRadius: 4, justifyContent: "center", alignItems: "flex-end", paddingRight: 10 },
  cvvBox: { backgroundColor: "#eee", width: 40, height: 20, justifyContent: "center", alignItems: "center", borderRadius: 2 },
  cvvText: { fontSize: 10, fontWeight: "bold", color: "#000" },
  backInfo: { color: "#aaa", fontSize: 8, textAlign: "center", marginTop: 15, paddingHorizontal: 10 },
  cardHint: { textAlign: "center", fontSize: 10, color: "#999", marginTop: 5 },
  addCardOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  addCardContent: { backgroundColor: "#fff", borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingBottom: 40 },
  addCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#eee" },
  addCardTitle: { fontSize: 16, fontWeight: "900", color: "#000", letterSpacing: 1 },
  addCardForm: { padding: 20 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: "#666", marginBottom: 8, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f5f5f5", borderRadius: 10, paddingHorizontal: 15, height: 60, marginBottom: 20 },
  formInput: { flex: 1, fontSize: 14, color: "#000", fontWeight: "600" },
  inputRow: { flexDirection: "row", gap: 15, marginBottom: 25 },
  formInputSmall: { backgroundColor: "#f5f5f5", borderRadius: 10, height: 60, paddingHorizontal: 15, fontSize: 14, color: "#000", fontWeight: "600" },
  saveCardBtn: { backgroundColor: "#a10b0b", height: 55, borderRadius: 12, alignItems: "center", justifyContent: "center", shadowColor: "#a10b0b", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  saveCardText: { color: "#fff", fontSize: 14, fontWeight: "900", letterSpacing: 1 },
});