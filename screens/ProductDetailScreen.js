import 'react-native-get-random-values';
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../services/supabaseClient";
import CryptoJS from "crypto-js";
import { saveFavoriteLocal, removeFavoriteLocal } from "../services/favoritesStorage";

const TABS = ["Detalles", "Reseñas", "Preguntas"];

const CustomAlert = ({ visible, title, message, onConfirm, onCancel, confirmText, cancelText, icon = "notifications", isDestructive = false }) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const animValue = useState(new Animated.Value(0))[0];
  const [internalVisible, setInternalVisible] = useState(visible);
  const [alertColors, setAlertColors] = useState({ primary: "#3b82f6", iconBg: "#60a5fa", iconColor: "#fff" });

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      setAlertColors({
        primary: isDestructive ? "#ef4444" : "#a10b0b",
        iconBg: isDestructive ? (isDarkMode ? "#411" : "#fee2e2") : (isDarkMode ? "#2d0000" : "#fce8e8"),
        iconColor: isDestructive ? "#ef4444" : "#a10b0b"
      });
      Animated.spring(animValue, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }).start();
    } else {
      Animated.timing(animValue, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setInternalVisible(false));
    }
  }, [visible, isDestructive, isDarkMode]);

  if (!internalVisible && !visible) return null;

  return (
    <Modal visible={internalVisible} transparent animationType="none">
      <View style={styles.alertOverlay}>
        <Animated.View style={[styles.uiverseCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, opacity: animValue, transform: [{ scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertIconBox, { backgroundColor: alertColors.iconBg }]}><Ionicons name={icon} size={14} color={alertColors.iconColor} /></View>
            <Text style={[styles.alertTitle, { color: themeColors.text }]}>{title}</Text>
          </View>
          <Text style={[styles.alertMsg, { color: themeColors.subtext }]}>{message}</Text>
          <View style={styles.alertActions}>
            <TouchableOpacity style={[styles.alertReadBtn, { backgroundColor: alertColors.primary }]} onPress={onConfirm}><Text style={styles.alertReadText}>{confirmText || "Aceptar"}</Text></TouchableOpacity>
            {onCancel && (<TouchableOpacity style={styles.alertMarkBtn} onPress={onCancel}><Text style={[styles.alertMarkText, { color: themeColors.subtext }]}>{cancelText || "Cancelar"}</Text></TouchableOpacity>)}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const SuccessModal = ({ visible, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

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

const AddToCartModal = ({ visible, onClose, onViewCart }) => {
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

      const timer = setTimeout(() => {
        if (onCloseRef.current) onCloseRef.current();
      }, 2500);

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
            <Ionicons name="cart" size={50} color="#a10b0b" />
            <View style={{ position: 'absolute', bottom: 15, right: 15, backgroundColor: isDarkMode ? '#2d0000' : '#fce8e8', borderRadius: 10 }}>
              <Ionicons name="checkmark-circle" size={28} color="#a10b0b" />
            </View>
          </View>
          <Text style={[successStyles.newText, { color: colors.text, fontSize: 18 }]}>¡AÑADIDO AL CARRITO!</Text>
          <Text style={[successStyles.subText, { color: colors.subtext, marginBottom: 20 }]}>
            El producto se ha guardado exitosamente.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <TouchableOpacity
              style={[successStyles.finishBtn, { flex: 1, backgroundColor: isDarkMode ? "#333" : "#f0f0f0", elevation: 0 }]}
              onPress={onClose}
            >
              <Text style={[successStyles.finishBtnText, { color: colors.text, fontSize: 12 }]}>SEGUIR AQUÍ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[successStyles.finishBtn, { flex: 1, backgroundColor: "#a10b0b" }]}
              onPress={onViewCart}
            >
              <Text style={[successStyles.finishBtnText, { fontSize: 12 }]}>IR AL CARRITO</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const FlipCard = ({ number, name, date }) => {
  const { colors, isDarkMode } = useTheme();
  const animatedValue = useState(new Animated.Value(0))[0];
  const [isFlipped, setIsFlipped] = useState(false);
  const flipCard = () => { Animated.spring(animatedValue, { toValue: isFlipped ? 0 : 180, friction: 8, tension: 10, useNativeDriver: true }).start(); setIsFlipped(!isFlipped); };
  const frontInterpolate = animatedValue.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] });
  const backInterpolate = animatedValue.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] });
  const frontOpacity = animatedValue.interpolate({ inputRange: [89, 90], outputRange: [1, 0] });
  const backOpacity = animatedValue.interpolate({ inputRange: [89, 90], outputRange: [0, 1] });
  return (
    <TouchableOpacity onPress={flipCard} activeOpacity={1} style={styles.flipWrapper}>
      <View style={styles.flipCardContainer}>
        <Animated.View style={[styles.flipCardSide, styles.flipCardFront, { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity }]}>
          <Text style={styles.cardBrand}>MASTERCARD</Text>
          <View style={styles.cardLogos}><View style={styles.mcCircles}><View style={[styles.mcCircle, { backgroundColor: "#ff9800", left: 15 }]} /><View style={[styles.mcCircle, { backgroundColor: "#d50000" }]} /></View></View>
          <View style={styles.cardChip} /><Ionicons name="wifi" size={20} color="#fff" style={styles.contactlessIcon} /><Text style={styles.cardNumber}>{number || "9759 2484 5269 6576"}</Text>
          <View style={styles.cardFooter}><View><Text style={styles.cardFooterLabel}>VENCE</Text><Text style={styles.cardFooterValue}>{date || "12/28"}</Text></View><Text style={styles.cardOwner}>{name || "EXPANSION USER"}</Text></View>
        </Animated.View>
        <Animated.View style={[styles.flipCardSide, styles.flipCardBack, { transform: [{ rotateY: backInterpolate }], opacity: backOpacity }]}>
          <View style={styles.cardStrip} /><View style={styles.signatureStrip}><View style={styles.cvvBox}><Text style={styles.cvvText}>***</Text></View></View>
          <Text style={styles.backInfo}>Esta tarjeta es propiedad de Expansion Tech. Si la encuentra, por favor devuélvala.</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const AddCardModal = ({ visible, onClose, onSaveCard }) => {
  const { colors: themeColors, isDarkMode } = useTheme();
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
    } else { setExp(clean); }
  };

  const handleCvvChange = (text) => {
    let clean = text.replace(/\D/g, "");
    if (clean.length > 3) clean = clean.slice(0, 3);
    setCvv(clean);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.addCardOverlay}>
        <View style={[styles.addCardContent, { backgroundColor: themeColors.card }]}>
          <View style={[styles.addCardHeader, { borderBottomColor: themeColors.border }]}><Text style={[styles.addCardTitle, { color: themeColors.text }]}>AÑADIR TARJETA</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={themeColors.text} /></TouchableOpacity></View>
          <View style={styles.addCardForm}>
            <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Número de Tarjeta</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5" }]}><Ionicons name="card-outline" size={20} color="#666" /><TextInput placeholder="0000 0000 0000 0000" style={[styles.formInput, { color: themeColors.text }]} placeholderTextColor={themeColors.subtext} keyboardType="numeric" value={num} onChangeText={handleNumChange} /></View>
            <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Nombre del Titular</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5" }]}><Ionicons name="person-outline" size={20} color="#666" /><TextInput placeholder="Ej. Juan Pérez" style={[styles.formInput, { color: themeColors.text }]} placeholderTextColor={themeColors.subtext} value={name} onChangeText={setName} /></View>
            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}><Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Vencimiento</Text><TextInput placeholder="MM/AA" style={[styles.formInputSmall, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5", color: themeColors.text }]} placeholderTextColor={themeColors.subtext} keyboardType="numeric" value={exp} onChangeText={handleExpChange} maxLength={5} /></View>
              <View style={{ flex: 1, marginLeft: 15 }}><Text style={[styles.inputLabel, { color: themeColors.subtext }]}>CVV</Text><TextInput placeholder="123" style={[styles.formInputSmall, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5", color: themeColors.text }]} placeholderTextColor={themeColors.subtext} keyboardType="numeric" secureTextEntry value={cvv} onChangeText={handleCvvChange} maxLength={3} /></View>
            </View>
            <TouchableOpacity style={styles.saveCardBtn} onPress={() => onSaveCard(num, exp, cvv, name)}><Text style={styles.saveCardText}>GUARDAR Y USAR</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AddressModal = ({ visible, onClose, onSaveAddress }) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const [street, setStreet] = useState("");
  const [colonia, setColonia] = useState("");
  const [zip, setZip] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [country, setCountry] = useState("");
  const [extra, setExtra] = useState("");

  const handleSave = () => {
    onSaveAddress({ street, colonia, zip, state: stateValue, country, extra });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.addCardOverlay}>
        <View style={[styles.addCardContent, { backgroundColor: themeColors.card }]}>
          <View style={[styles.addCardHeader, { borderBottomColor: themeColors.border }]}><Text style={[styles.addCardTitle, { color: themeColors.text }]}>DIRECCIÓN DE ENVÍO</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={themeColors.text} /></TouchableOpacity></View>
          <ScrollView style={styles.addCardForm} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Calle y Número</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5" }]}><Ionicons name="home-outline" size={20} color="#666" /><TextInput placeholder="Ej. Calle 1 #123" style={[styles.formInput, { color: themeColors.text }]} placeholderTextColor={themeColors.subtext} value={street} onChangeText={setStreet} /></View>
            <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Colonia</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5" }]}><Ionicons name="business-outline" size={20} color="#666" /><TextInput placeholder="Ej. Centro" style={[styles.formInput, { color: themeColors.text }]} placeholderTextColor={themeColors.subtext} value={colonia} onChangeText={setColonia} /></View>
            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}><Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Código Postal</Text><TextInput placeholder="00000" style={[styles.formInputSmall, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5", color: themeColors.text }]} placeholderTextColor={themeColors.subtext} keyboardType="numeric" value={zip} onChangeText={setZip} /></View>
              <View style={{ flex: 1, marginLeft: 15 }}><Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Estado</Text><TextInput placeholder="Ej. CDMX" style={[styles.formInputSmall, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5", color: themeColors.text }]} placeholderTextColor={themeColors.subtext} value={stateValue} onChangeText={setStateValue} /></View>
            </View>
            <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>País</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5" }]}><Ionicons name="earth-outline" size={20} color="#666" /><TextInput placeholder="Ej. México" style={[styles.formInput, { color: themeColors.text }]} placeholderTextColor={themeColors.subtext} value={country} onChangeText={setCountry} /></View>
            <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>Indicaciones Extra (Opcional)</Text>
            <View style={[styles.inputWrapper, { height: 80, backgroundColor: isDarkMode ? "#333" : "#f5f5f5" }]}><Ionicons name="information-circle-outline" size={20} color="#666" /><TextInput placeholder="Ej. Casa color azul..." style={[styles.formInput, { color: themeColors.text, textAlignVertical: 'top', paddingTop: 10 }]} multiline placeholderTextColor={themeColors.subtext} value={extra} onChangeText={setExtra} /></View>

            <TouchableOpacity style={styles.saveCardBtn} onPress={handleSave}><Text style={styles.saveCardText}>GUARDAR DIRECCIÓN</Text></TouchableOpacity>
          </ScrollView>
        </View>
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

const CheckoutModal = ({ visible, onClose, price, onManageCard, onManageAddress, address, card }) => {
  const { colors: themeColors, isDarkMode } = useTheme();

  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");

  const subtotal = price;
  const shipping = 99;
  const tax = price * 0.16;
  const total = subtotal - discountAmount + shipping + tax;

  const validCoupons = ["UTD", "TECH", "MISSANA", "EXTECH", "MANUELG"];

  const handleApplyPromo = () => {
    if (validCoupons.includes(promoCode.trim().toUpperCase())) {
      const disc = subtotal * 0.10;
      setDiscountAmount(disc);
      setAppliedCode(promoCode.toUpperCase());
    } else {
      setDiscountAmount(0);
      setAppliedCode("");
    }
  };

  const [showSwipe, setShowSwipe] = useState(false);
  const swipePan = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const sliderWidth = screenWidth - 40;
  const thumbSize = 55;

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
          Animated.timing(swipePan, { toValue: sliderWidth - thumbSize - 10, duration: 150, useNativeDriver: true }).start(() => {
            setTimeout(() => {
              onClose(true);
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
      setPromoCode("");
      setDiscountAmount(0);
      setAppliedCode("");
    }
  }, [visible, swipePan]);

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.fullCheckoutContainer, { backgroundColor: themeColors.background }]}>
        <View style={[styles.checkoutHeader, { borderBottomColor: themeColors.border, backgroundColor: themeColors.background }]}>
          <TouchableOpacity onPress={onClose}><Ionicons name="chevron-back" size={28} color={themeColors.text} /></TouchableOpacity>
          <Text style={[styles.checkoutHeaderTitle, { color: themeColors.text }]}>FINALIZAR COMPRA</Text><View style={{ width: 28 }} />
        </View>
        <ScrollView style={styles.checkoutBody} showsVerticalScrollIndicator={false}>
          <View style={styles.checkoutSection}>
            <View style={styles.sectionHeader}><Text style={[styles.sectionLabel, { color: themeColors.text }]}>DIRECCIÓN DE ENVÍO</Text><TouchableOpacity onPress={onManageAddress}><Text style={styles.changeLink}>CAMBIAR</Text></TouchableOpacity></View>
            <View style={[styles.infoBox, { backgroundColor: isDarkMode ? themeColors.card : "#f9f9f9", borderColor: themeColors.border }]}><Ionicons name="location-outline" size={20} color={themeColors.subtext} />
              <View style={styles.infoText}>
                <Text style={[styles.infoMain, { color: themeColors.text }]}>{address && address.street ? address.street : "Calle Expansion Tech #123"}</Text>
                <Text style={[styles.infoSub, { color: themeColors.subtext }]}>{address && address.street ? `${address.colonia}, CP ${address.zip}, ${address.state}, ${address.country}` : "CDMX, CP 01000, México"}</Text>
                {address && address.extra ? <Text style={{ fontSize: 11, color: "#a10b0b", marginTop: 4, fontWeight: "600" }}>Nota: {address.extra}</Text> : null}
              </View>
            </View>
          </View>
          <View style={styles.checkoutSection}>
            <View style={styles.sectionHeader}><Text style={[styles.sectionLabel, { color: themeColors.text }]}>MÉTODO DE PAGO</Text><TouchableOpacity onPress={onManageCard}><Text style={styles.changeLink}>AÑADIR TARJETA</Text></TouchableOpacity></View>
            <FlipCard
              number={card ? `**** **** **** ${card.last_4}` : "9759 2484 5269 6576"}
              name={card ? card.card_name : "EXPANSION USER"}
              date={card ? decrypt(card.expiry) : "12/28"}
            />
            <Text style={[styles.cardHint, { color: themeColors.subtext }]}>Toca la tarjeta para ver el reverso</Text>
          </View>
          <View style={styles.checkoutSection}>
            <Text style={[styles.sectionLabel, { color: themeColors.text }]}>CÓDIGO PROMOCIONAL</Text>
            <View style={styles.promoInputRow}>
              <TextInput
                placeholder="Introduce tu código"
                style={[styles.promoInput, { backgroundColor: isDarkMode ? "#333" : "#f5f5f5", color: themeColors.text }]}
                placeholderTextColor={themeColors.subtext}
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.promoBtn, appliedCode ? { backgroundColor: "#10b981" } : null]}
                onPress={handleApplyPromo}
              >
                <Text style={styles.promoBtnText}>{appliedCode ? "APLICADO" : "APLICAR"}</Text>
              </TouchableOpacity>
            </View>
            {appliedCode ? <Text style={{ fontSize: 11, color: "#10b981", marginTop: 5, fontWeight: "600" }}>¡Cupón {appliedCode} aplicado con éxito!</Text> : null}
          </View>
          <View style={[styles.summarySection, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.sectionLabel, { color: themeColors.text }]}>RESUMEN DEL PEDIDO</Text>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>Subtotal</Text><Text style={[styles.summaryValue, { color: themeColors.text }]}>${subtotal.toLocaleString()}</Text></View>

            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: "#10b981" }]}>Descuento (10%)</Text>
                <Text style={[styles.summaryValue, { color: "#10b981" }]}>-${discountAmount.toLocaleString()}</Text>
              </View>
            )}

            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>Envío</Text><Text style={[styles.summaryValue, { color: themeColors.text }]}>${shipping.toLocaleString()}</Text></View>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>IVA (16%)</Text><Text style={[styles.summaryValue, { color: themeColors.text }]}>${tax.toLocaleString()}</Text></View>
            <View style={[styles.uiverseHr, { backgroundColor: themeColors.border }]} />
            <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: themeColors.text }]}>TOTAL</Text><Text style={styles.totalPrice}>${total.toLocaleString()}</Text></View>
          </View>
        </ScrollView>
        <View style={[styles.checkoutFooterFixed, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
          {!showSwipe ? (
            <TouchableOpacity style={styles.confirmPayBtn} onPress={() => setShowSwipe(true)}>
              <Text style={styles.confirmPayText}>CONFIRMAR Y PAGAR</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.swipeContainer, { backgroundColor: isDarkMode ? "#121212" : "#f0f0f0" }]}>
              <View style={styles.swipeTrack}>
                <Text style={styles.swipeText}>DESLIZA PARA PAGAR</Text>
              </View>
              <Animated.View {...panResponder.panHandlers} style={[styles.swipeThumb, { backgroundColor: isDarkMode ? "#333" : "#fff", transform: [{ translateX: swipePan }] }]}>
                <Ionicons name="arrow-forward" size={24} color="#a10b0b" />
              </Animated.View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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

const UiverseButton = ({ onPress, title, loading }) => {
  const { isDarkMode } = useTheme();

  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const runAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => { if (onPress) onPress(); });
  };

  const slideScale = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const primaryBg = isDarkMode ? "#ffffff" : "#000000";
  const primaryText = isDarkMode ? "#000000" : "#ffffff";
  const sweepBg = isDarkMode ? "#121212" : "#ffffff";
  const borderColor = isDarkMode ? "#ffffff" : "#000000";

  return (
    <TouchableOpacity activeOpacity={1} onPress={runAnimation} disabled={loading} style={{ flex: 1 }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
        <View style={[
          styles.uiverseBtn,
          {
            backgroundColor: primaryBg,
            borderColor: borderColor,
            shadowOpacity: isDarkMode ? 0 : 0.2
          }
        ]}>
          <Animated.View style={[
            styles.uiverseBtnAfter,
            {
              backgroundColor: sweepBg,
              transform: [{ skewX: "-45deg" }, { scaleX: slideScale }]
            }
          ]} />

          {loading ? (
            <ActivityIndicator size="small" color={primaryText} />
          ) : (
            <Text style={[styles.uiverseBtnText, { color: primaryText, position: 'relative', zIndex: 2 }]}>
              {title}
            </Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const ErrorReviewModal = ({ visible, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(animValue, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(starScale, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(starScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible && animValue._value === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[
          styles.uiverseModal,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            opacity: animValue,
            transform: [
              { scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
              { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }
            ]
          }
        ]}>
          <View style={{ marginBottom: 20, alignItems: 'center' }}>
            <Animated.View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: isDarkMode ? "#2d0000" : "#fce8e8",
              justifyContent: 'center', alignItems: 'center', marginBottom: 15,
              transform: [{ scale: starScale }]
            }}>
              <Ionicons name="star" size={40} color="#a10b0b" />
            </Animated.View>
            <Text style={[styles.uiverseModalTitle, { color: colors.text, textAlign: 'center' }]}>¡Selecciona las estrellas!</Text>
            <Text style={[styles.uiverseModalDesc, { color: colors.subtext, textAlign: 'center' }]}>
              Tu opinión es muy importante para nosotros. Por favor, califica el producto seleccionando las estrellas antes de enviar tu reseña.
            </Text>
          </View>
          <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: "#a10b0b", alignSelf: 'center', width: '100%' }]} onPress={onClose}>
            <Text style={[styles.modalCloseText, { textAlign: 'center' }]}>ENTENDIDO</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};




export default function ProductDetailScreen({ route, navigation, cart, setCart }) {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { id, name, price, image, description, initialFavorite } = route.params;
  const [activeTab, setActiveTab] = useState("Detalles");
  const tabAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    tabAnim.setValue(0);
    Animated.timing(tabAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const [userRating, setUserRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [savedAddress, setSavedAddress] = useState(null);
  const [savedCard, setSavedCard] = useState(null);
  const [isFavorite, setIsFavorite] = useState(!!initialFavorite);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", onConfirm: null, onCancel: null, confirmText: "", cancelText: "", icon: "notifications", isDestructive: false });

  useEffect(() => { fetchReviews(); fetchQuestions(); initializeScreen(); }, [id]);



  async function initializeScreen() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user);
      if (!isFavorite) checkIfFavorite(session.user.id);
      fetchAddress(session.user.id);
      fetchCard(session.user.id);
    }
  }

  async function fetchAddress(userId) {
    try {
      const { data } = await supabase.from("user_addresses").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setSavedAddress(data);
    } catch (err) { }
  }

  async function fetchCard(userId) {
    try {
      const { data } = await supabase.from("user_cards").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setSavedCard(data);
    } catch (err) { }
  }

  async function checkIfFavorite(userId) {
    try {
      const { data } = await supabase.from("product_favorites").select("*").eq("user_id", userId).eq("product_id", id.toString()).maybeSingle();
      if (data) setIsFavorite(true);
    } catch (err) { if (!initialFavorite) setIsFavorite(false); }
  }

  async function deleteReview(reviewId) {
    showAlert("Eliminar Reseña", "¿Borrar este comentario?", async () => {
      try { await supabase.from("product_reviews").delete().eq("id", reviewId); fetchReviews(); } catch (err) { console.log(err); }
    }, () => { }, "Sí, Eliminar", "No, Cancelar", "trash", true);
  }

  async function submitReview() {
    if (userRating === 0) {
      setShowErrorModal(true);
      return;
    }
    try {
      if (!currentUser) { showAlert("Inicia Sesión", "Debes estar identificado.", null, null, "Aceptar", null, "person"); return; }
      const reviewData = { product_id: id.toString(), user_id: currentUser.id, user_name: currentUser.user_metadata?.full_name || "Usuario Tech", rating: userRating, comment: reviewComment };
      if (editingReviewId) { await supabase.from("product_reviews").update(reviewData).eq("id", editingReviewId); setEditingReviewId(null); }
      else { await supabase.from("product_reviews").insert(reviewData); }
      setUserRating(0); setReviewComment("");
      showAlert("¡Gracias!", editingReviewId ? "Reseña actualizada." : "Tu reseña ha sido enviada.", null, null, "Genial", null, "checkmark-circle"); fetchReviews();
    } catch (err) { showAlert("Error", err.message, null, null, "Aceptar", null, "alert-circle"); }
  }

  function startEditReview(rev) {
    setEditingReviewId(rev.id);
    setUserRating(rev.rating);
    setReviewComment(rev.comment || "");
    setActiveTab("Reseñas");
  }

  function cancelEditReview() {
    setEditingReviewId(null);
    setUserRating(0);
    setReviewComment("");
  }

  const addToCart = async () => {
    setShowAddToCartModal(true);

    setTimeout(() => {
      setCart(prev => {
        // Verificar si ya existe el producto en el carrito local (opcional, para agrupar)
        return [...prev, { id, name, price, image }];
      });
    }, 100);

    if (currentUser) {
      try {
        const { data: existing } = await supabase.from("cart_items").select("*").eq("user_id", currentUser.id).eq("product_id", id.toString()).maybeSingle();
        if (existing) {
          await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        } else {
          await supabase.from("cart_items").insert({ 
            user_id: currentUser.id, 
            product_id: id.toString(), 
            name: name,
            price: price,
            image: image,
            quantity: 1 
          });
        }
      } catch (err) { console.log("Silent DB cart error:", err); }
    }
  };

  async function toggleFavorite() {
    if (!currentUser) { showAlert("Pausa", "Inicia sesión para guardar favoritos.", null, null, "Ok", null, "person"); return; }

    const newIsFav = !isFavorite;
    setIsFavorite(newIsFav);

    if (newIsFav) {
      showAlert("¡Guardado!", "Añadido a tus favoritos.", null, null, "Genial", null, "heart");
      saveFavoriteLocal(id).catch(() => { });
    } else {
      showAlert("Eliminado", "Quitado de favoritos.", null, null, "Ok", null, "heart-dislike", true);
      removeFavoriteLocal(id).catch(() => { });
    }

    try {
      if (newIsFav) {
        await supabase.from("product_favorites").insert({ user_id: currentUser.id, product_id: id.toString() });
      } else {
        await supabase.from("product_favorites").delete().eq("user_id", currentUser.id).eq("product_id", id.toString());
      }
    } catch (err) {
      console.log(err);
      setIsFavorite(!newIsFav);
    }
  }

  async function submitQuestion() {
    if (!question.trim()) return;
    if (!currentUser) { showAlert("Inicia Sesión", "Debes estar identificado para preguntar.", null, null, "Aceptar", null, "person"); return; }
    try {
      if (editingQuestionId) {
        await supabase.from("product_questions").update({ question: question }).eq("id", editingQuestionId);
        setEditingQuestionId(null);
        setQuestion(""); fetchQuestions(); showAlert("Actualizado", "Pregunta editada.", null, null, "Ok", null, "checkmark-circle");
      }
      else {
        await supabase.from("product_questions").insert({ product_id: id.toString(), user_id: currentUser.id, user_name: currentUser.user_metadata?.full_name || "Usuario Tech", question: question });
        setQuestion(""); fetchQuestions(); showAlert("Enviado", "Pregunta recibida.", null, null, "Ok", null, "paper-plane");
      }
    } catch (err) { showAlert("Error", err.message, null, null, "Aceptar", null, "alert-circle"); }
  }

  function startEditQuestion(q) {
    setEditingQuestionId(q.id);
    setQuestion(q.question);
    setActiveTab("Preguntas");
  }

  function cancelEditQuestion() {
    setEditingQuestionId(null);
    setQuestion("");
  }

  async function deleteQuestion(questionId) {
    showAlert("Eliminar Pregunta", "¿Borrar esta pregunta?", async () => {
      try { await supabase.from("product_questions").delete().eq("id", questionId); fetchQuestions(); } catch (err) { console.log(err); }
    }, () => { }, "Sí, Eliminar", "No, Cancelar", "trash", true);
  }

  const showAlert = (title, message, onConfirm, onCancel, confirmText, cancelText, icon, isDestructive = false) => { setAlertConfig({ visible: true, title, message, onConfirm: () => { onConfirm?.(); hideAlert(); }, onCancel: onCancel ? () => { onCancel?.(); hideAlert(); } : null, confirmText, cancelText, icon: icon || "notifications", isDestructive }); };
  const hideAlert = () => setAlertConfig({ ...alertConfig, visible: false });

  async function fetchReviews() { try { const { data } = await supabase.from("product_reviews").select("*").eq("product_id", id.toString()).order("created_at", { ascending: false }); if (data) setReviews(data); } catch (err) { console.log(err); } }
  async function fetchQuestions() { try { const { data } = await supabase.from("product_questions").select("*").eq("product_id", id.toString()).order("created_at", { ascending: false }); if (data) setQuestions(data); } catch (err) { console.log(err); } }

  async function placeOrder() {
    let activeUser = currentUser;
    if (!activeUser) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUser = user;
    }

    if (!activeUser) {
      showAlert("Inicia Sesión", "Debes estar identificado para comprar.", null, null, "Ok", null, "person");
      return;
    }
    try {
      console.log("Creando pedido directo para:", name, "Usuario:", activeUser.email);
      const { data, error } = await supabase.from("user_orders").insert({
        user_id: activeUser.id,
        product_id: id.toString(),
        product_name: name,
        product_image: image,
        price: price,
        status: "Procesando"
      }).select();

      if (error) {
        console.error("DB Error:", error.message);
        showAlert("Error de BD", error.message, null, null, "Ok", null, "alert-circle");
        return;
      }

      if (!data || data.length === 0) {
        showAlert("Error de RLS", "El pedido se envió pero no se confirmó en la BD. Revisa las políticas RLS.", null, null, "Ok", null, "warning");
      } else {
        console.log("Pedido guardado con éxito:", data);
      }
    } catch (err) {
      console.log("App Exception:", err);
      showAlert("Error Crítico", err.message, null, null, "Ok", null, "close-circle");
    }
  }

  async function handleSaveCard(num, exp, cvv, name) {
    if (!currentUser) {
      showAlert("Inicia Sesión", "Debes iniciar sesión para guardar una tarjeta.", null, null, "Ok", null, "person");
      return;
    }
    if (!num || !exp || !cvv || !name) {
      showAlert("Error", "Todos los campos son obligatorios.", null, null, "Ok", null, "alert-circle");
      return;
    }
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
      if (error) throw error;

      const newCard = { last_4: last4, card_name: name, expiry: encrypt(exp) };
      setSavedCard(newCard);

      showAlert("Éxito", "Tarjeta guardada de forma segura.", null, null, "Genial", null, "checkmark-circle");
      setShowAddCard(false);
    } catch (err) {
      showAlert("Error", "No se pudo guardar la tarjeta.", null, null, "Ok", null, "close-circle");
      console.log(err);
    }
  }

  async function handleSaveAddress(addr) {
    if (!currentUser) {
      showAlert("Inicia Sesión", "Debes iniciar sesión para guardar una dirección.", null, null, "Ok", null, "person");
      return;
    }
    if (!addr.street || !addr.colonia || !addr.zip || !addr.state || !addr.country) {
      showAlert("Error", "Todos los campos principales son obligatorios.", null, null, "Ok", null, "alert-circle");
      return;
    }
    try {
      const { error } = await supabase.from("user_addresses").insert({
        user_id: currentUser.id,
        street: addr.street,
        colonia: addr.colonia,
        zip: addr.zip,
        state: addr.state,
        country: addr.country,
        extra: addr.extra
      });
      if (error) throw error;
      setSavedAddress(addr);
      setShowAddressModal(false);
      showAlert("Éxito", "Dirección de envío guardada.", null, null, "Genial", null, "checkmark-circle");
    } catch (err) {
      showAlert("Error", "No se pudo guardar la dirección.", null, null, "Ok", null, "close-circle");
      console.log(err);
    }
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DETALLES</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("MainTabs", { screen: "Carrito" })}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.imageContainer, { backgroundColor: "#fff" }]}><Image source={{ uri: image }} style={styles.image} resizeMode="contain" /></View>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
          <Text style={[styles.name, { color: themeColors.text }]}>{name}</Text>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#a10b0b", marginBottom: 20 }}>${price.toLocaleString()}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={toggleFavorite}>
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#ef4444" : themeColors.subtext} />
              <Text style={[styles.actionLabel, { color: isFavorite ? "#ef4444" : themeColors.subtext }]}>{isFavorite ? "Favorito" : "Guardar"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#a10b0b" }]} onPress={addToCart}>
              <Ionicons name="cart-outline" size={22} color="#fff" />
              <Text style={[styles.actionLabel, { color: "#fff" }]}>Añadir al carrito</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tabRow}>{TABS.map((tab) => (<TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab ? [styles.tabActive, { borderBottomColor: "#a10b0b" }] : null]}><Text style={[styles.tabText, { color: activeTab === tab ? "#a10b0b" : themeColors.subtext }]}>{tab}</Text></TouchableOpacity>))}</View>

          <Animated.View style={{
            opacity: tabAnim,
            transform: [{ translateY: tabAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }]
          }}>
            {activeTab === "Detalles" && (<View style={styles.tabContent}><Text style={[styles.descLabel, { color: themeColors.text }]}>Descripción:</Text><Text style={[styles.description, { color: themeColors.subtext }]}>{description}</Text></View>)}
            {activeTab === "Reseñas" && (
              <View style={styles.tabContent}>
                <View style={[styles.ratingSection, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f9f9f9", borderColor: themeColors.border, borderWidth: 1, borderRadius: 12, padding: 15 }]}>
                  <Text style={[styles.ratingTitle, { color: themeColors.text }]}>{editingReviewId ? "Editando reseña:" : "Tu reseña:"}</Text>
                  <View style={styles.starsRow}>{[1, 2, 3, 4, 5].map((s) => (<TouchableOpacity key={s} onPress={() => setUserRating(s)}><Ionicons name={s <= userRating ? "star" : "star-outline"} size={32} color={s <= userRating ? "#ef4444" : "#ccc"} /></TouchableOpacity>))}</View>
                  <TextInput style={[styles.uiverseInput, { minHeight: 60, marginTop: 8, textAlignVertical: "top", paddingTop: 12, backgroundColor: isDarkMode ? "#333" : "#fff", color: themeColors.text, borderColor: themeColors.border }]} placeholder="Escribe un comentario (opcional)..." value={reviewComment} onChangeText={setReviewComment} placeholderTextColor={themeColors.subtext} multiline />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <UiverseButton title={editingReviewId ? "Actualizar" : "Enviar"} onPress={submitReview} />
                    {editingReviewId && <TouchableOpacity style={styles.cancelEditBtn} onPress={cancelEditReview}><Text style={[styles.cancelEditText, { color: themeColors.subtext }]}>Cancelar</Text></TouchableOpacity>}
                  </View>
                </View>
                <View style={[styles.reviewsList, { paddingBottom: 300 }]}>{reviews.map((rev, index) => (
                  <View key={index} style={[styles.reviewCard, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f1f1f1", borderColor: themeColors.border, borderWidth: isDarkMode ? 1 : 0 }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewerName, { color: themeColors.text }]}>{rev.user_name}</Text>
                      <View style={styles.reviewStars}>{[1, 2, 3, 4, 5].map((s) => (<Ionicons key={s} name={s <= rev.rating ? "star" : "star-outline"} size={10} color={s <= rev.rating ? "#ef4444" : "#ccc"} />))}</View>
                    </View>
                    {rev.comment ? <Text style={[styles.reviewComment, { color: themeColors.subtext }]}>{rev.comment}</Text> : null}
                    {currentUser && rev.user_id === currentUser.id && (
                      <View style={styles.itemActions}>
                        <TouchableOpacity style={styles.itemActionBtn} onPress={() => startEditReview(rev)}><Ionicons name="pencil-outline" size={14} color="#a10b0b" /><Text style={styles.itemActionText}>Editar</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.itemActionBtn} onPress={() => deleteReview(rev.id)}><Ionicons name="trash-outline" size={14} color="#ef4444" /><Text style={[styles.itemActionText, { color: "#ef4444" }]}>Eliminar</Text></TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}</View>
              </View>
            )}
            {activeTab === "Preguntas" && (
              <View style={styles.tabContent}>
                <View style={[styles.questionSection, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f9f9f9", borderColor: themeColors.border, borderWidth: 1, borderRadius: 12, padding: 15 }]}>
                  <TextInput style={[styles.uiverseInput, styles.multilineInput, { backgroundColor: isDarkMode ? "#333" : "#fff", color: themeColors.text, borderColor: themeColors.border }]} placeholder={editingQuestionId ? "Editando pregunta..." : "Pregunta..."} value={question} onChangeText={setQuestion} placeholderTextColor={themeColors.subtext} multiline />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <UiverseButton title={editingQuestionId ? "Actualizar" : "Preguntar"} onPress={submitQuestion} />
                    {editingQuestionId && <TouchableOpacity style={styles.cancelEditBtn} onPress={cancelEditQuestion}><Text style={[styles.cancelEditText, { color: themeColors.subtext }]}>Cancelar</Text></TouchableOpacity>}
                  </View>
                </View>
                <View style={[styles.reviewsList, { paddingBottom: 300 }]}>{questions.map((q, index) => (
                  <View key={index} style={[styles.reviewCard, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f1f1f1", borderColor: themeColors.border, borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.reviewerName, { color: themeColors.text }]}>{q.user_name}</Text>
                    <Text style={[styles.reviewComment, { color: themeColors.subtext }]}>{q.question}</Text>
                    {q.answer && <View style={[styles.answerBox, { backgroundColor: isDarkMode ? "#222" : "#eee", borderLeftColor: "#a10b0b" }]}><Text style={[styles.answerText, { color: themeColors.text }]}>{q.answer}</Text></View>}
                    {currentUser && q.user_id === currentUser.id && (
                      <View style={styles.itemActions}>
                        <TouchableOpacity style={styles.itemActionBtn} onPress={() => startEditQuestion(q)}><Ionicons name="pencil-outline" size={14} color="#a10b0b" /><Text style={styles.itemActionText}>Editar</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.itemActionBtn} onPress={() => deleteQuestion(q.id)}><Ionicons name="trash-outline" size={14} color="#ef4444" /><Text style={[styles.itemActionText, { color: "#ef4444" }]}>Eliminar</Text></TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}</View>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* ── Barra de Compra Inferior ────────────────────────────────────────── */}
      <View style={[styles.buyBar, { backgroundColor: themeColors.card, borderTopColor: themeColors.border, borderTopWidth: isDarkMode ? 1 : 0 }]}>
        <View style={styles.priceBlock}>
          <Text style={styles.originalPrice}>${(price * 1.15).toLocaleString()}</Text>
          <Text style={[styles.finalPrice, { color: themeColors.text }]}>${price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={() => setShowCheckout(true)}>
          <Text style={styles.buyButtonText}>COMPRAR AHORA</Text>
        </TouchableOpacity>
      </View>

      <CustomAlert {...alertConfig} />
      <CheckoutModal visible={showCheckout} onClose={(success) => { setShowCheckout(false); if (success === true) { setShowSuccessModal(true); placeOrder(); } }} price={price} onManageCard={() => setShowAddCard(true)} onManageAddress={() => setShowAddressModal(true)} address={savedAddress} card={savedCard} />
      <AddCardModal visible={showAddCard} onClose={() => setShowAddCard(false)} onSaveCard={handleSaveCard} />
      <AddressModal visible={showAddressModal} onClose={() => setShowAddressModal(false)} onSaveAddress={handleSaveAddress} />
      <SuccessModal visible={showSuccessModal} onClose={() => { console.log("ProductDetailScreen: SuccessModal onClose -> closing only (no navigation)"); setShowSuccessModal(false); }} />
      <AddToCartModal visible={showAddToCartModal} onClose={() => setShowAddToCartModal(false)} onViewCart={() => { setShowAddToCartModal(false); navigation.navigate("MainTabs", { screen: "Carrito" }); }} />
      <ErrorReviewModal visible={showErrorModal} onClose={() => setShowErrorModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
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
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  container: { flex: 1 },
  imageContainer: { backgroundColor: "#fff", height: 280, alignItems: "center", justifyContent: "center" },
  image: { width: "80%", height: "100%" },
  card: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, marginTop: -20, paddingHorizontal: 18, paddingTop: 22 },
  name: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 18 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5", borderRadius: 10, paddingVertical: 10 },
  actionLabel: { fontSize: 12, color: "#444", fontWeight: "600" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#a10b0b" },
  tabText: { color: "#999", fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: "#111" },
  tabContent: { paddingTop: 4 },
  descLabel: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 6 },
  description: { fontSize: 14, color: "#555", lineHeight: 22 },
  buyBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#eee", elevation: 12 },
  priceBlock: { flexDirection: "column" },
  originalPrice: { fontSize: 13, color: "#aaa", textDecorationLine: "line-through" },
  finalPrice: { fontSize: 26, fontWeight: "800", color: "#111" },
  buyButton: { backgroundColor: "#a10b0b", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30 },
  buyButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  uiverseInput: { width: "100%", backgroundColor: "#f5f5f5", color: "#242424", paddingHorizontal: 15, minHeight: 45, borderRadius: 6, fontSize: 14, marginBottom: 10 },
  multilineInput: { minHeight: 120, paddingTop: 12, textAlignVertical: "top" },
  uiverseBtn: { width: 140, height: 45, borderRadius: 10, textAlign: "center", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative", marginVertical: 10 },
  uiverseBtnAfter: { position: "absolute", top: 0, bottom: 0, left: "-30%", right: "-30%", backgroundColor: "#fff", zIndex: -1 },
  uiverseBtnText: { fontSize: 16, fontWeight: "bold", zIndex: 1 },
  ratingSection: { backgroundColor: "#fff", padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#eee" },
  ratingTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 12 },
  starsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  reviewsList: { marginTop: 10 },
  reviewCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewerName: { fontSize: 14, fontWeight: "700", color: "#333" },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewComment: { fontSize: 14, color: "#444", marginTop: 4 },
  itemActions: { flexDirection: "row", gap: 16, marginTop: 8, paddingTop: 6 },
  itemActionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  itemActionText: { fontSize: 12, fontWeight: "600", color: "#a10b0b" },
  cancelEditBtn: { height: 45, borderRadius: 10, borderWidth: 1.5, borderColor: "#ccc", justifyContent: "center", alignItems: "center", paddingHorizontal: 18, marginVertical: 10 },
  cancelEditText: { fontSize: 14, fontWeight: "700", color: "#666" },
  questionSection: { backgroundColor: "#fff", padding: 16, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: "#eee" },
  answerBox: { marginTop: 10, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: "#a10b0b", backgroundColor: "#f9f6ff", paddingVertical: 8, borderRadius: 4 },
  answerText: { fontSize: 13, color: "#333" },
  alertOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  uiverseCard: { width: 320, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#dbeafe", padding: 16, elevation: 12 },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  alertIconBox: { padding: 8, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  alertTitle: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  alertMsg: { fontSize: 14, color: "#6b7280", lineHeight: 20, marginBottom: 24 },
  alertActions: { gap: 8 },
  alertReadBtn: { borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  alertReadText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  alertMarkBtn: { backgroundColor: "#f9fafb", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  alertMarkText: { color: "#6b7280", fontWeight: "600", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  uiverseModal: { width: 280, backgroundColor: "#fff", padding: 25, borderRadius: 12 },
  uiverseModalTitle: { fontSize: 18, fontWeight: "bold", color: "#111", marginBottom: 10 },
  uiverseModalDesc: { fontSize: 13, color: "#71717a", lineHeight: 20, marginBottom: 20 },
  modalCloseBtn: { alignSelf: "flex-end", paddingVertical: 10, paddingHorizontal: 18, backgroundColor: "#000", borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  // Full Checkout
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
  promoInputRow: { flexDirection: "row", gap: 10 },
  promoInput: { flex: 1, height: 45, backgroundColor: "#f5f5f5", borderRadius: 8, paddingHorizontal: 15, fontSize: 14, color: "#000" },
  promoBtn: { backgroundColor: "#000", paddingHorizontal: 20, borderRadius: 8, justifyContent: "center" },
  promoBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  uiverseHr: { height: 1, backgroundColor: "#eee", marginVertical: 15 },
  summarySection: { paddingBottom: 120 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: "#666" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#000" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 18, fontWeight: "900", color: "#000" },
  totalPrice: { fontSize: 24, fontWeight: "900", color: "#a10b0b" },
  checkoutFooterFixed: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopColor: "#eee" },
  confirmPayBtn: { backgroundColor: "#a10b0b", height: 55, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  confirmPayText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  swipeContainer: { height: 55, justifyContent: "center", backgroundColor: "#f0f0f0", borderRadius: 12, overflow: "hidden" },
  swipeTrack: { position: "absolute", width: "100%", alignItems: "center" },
  swipeText: { color: "#a10b0b", fontSize: 14, fontWeight: "900", letterSpacing: 2, opacity: 0.5 },
  swipeThumb: { width: 55, height: 45, backgroundColor: "#fff", borderRadius: 10, justifyContent: "center", alignItems: "center", marginLeft: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  // Flip Card
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
  // Add Card Modal
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