import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AddressScreen({ navigation }) {
  const [address, setAddress] = useState({
    street: "",
    colony: "",
    zip: "",
    phone: "",
    instructions: "",
  });

  const handleSave = () => {
    if (!address.street || !address.colony || !address.phone) {
      Alert.alert("Error", "Por favor completa calle, colonia y teléfono.");
      return;
    }
    // Aquí iría la lógica para guardar en Supabase
    Alert.alert("Éxito", "Dirección guardada correctamente.");
    navigation.goBack();
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ENTREGA:</Text>
      </View>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.infoTitleRow}>
            <Ionicons name="information-circle" size={18} color="#a10b0b" />
            <Text style={styles.infoTitle}>Selecciona tu colonia en el mapa</Text>
        </View>

        {/* BUSCADOR DE COLONIA */}
        <View style={styles.searchContainer}>
            <Ionicons name="map" size={20} color="#a10b0b" style={styles.searchIcon} />
            <TextInput
                placeholder="Busca tu colonia..."
                style={styles.searchInput}
                value={address.colony}
                onChangeText={(text) => setAddress({...address, colony: text})}
            />
        </View>

        {/* MAPA PLACEHOLDER (Hasta instalar react-native-maps) */}
        <View style={styles.mapPlaceholder}>
            <Ionicons name="location" size={40} color="#a10b0b" opacity={0.3} />
            <Text style={styles.mapText}>Vista de Mapa (Durango)</Text>
            <View style={styles.markerContainer}>
                <View style={styles.markerDot} />
                <View style={styles.markerPulse} />
            </View>
        </View>

        {/* CAMPOS DEL FORMULARIO */}
        <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Calle y Número</Text>
                <TextInput
                    placeholder="Ej: Av. 20 de Noviembre #123"
                    style={styles.input}
                    value={address.street}
                    onChangeText={(text) => setAddress({...address, street: text})}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Código Postal</Text>
                    <TextInput
                        placeholder="C.P."
                        keyboardType="numeric"
                        style={styles.input}
                        value={address.zip}
                        onChangeText={(text) => setAddress({...address, zip: text})}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 2, marginLeft: 10 }]}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        placeholder="618 123 4567"
                        keyboardType="phone-pad"
                        style={styles.input}
                        value={address.phone}
                        onChangeText={(text) => setAddress({...address, phone: text})}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Indicaciones extra</Text>
                <TextInput
                    placeholder="Portón blanco, timbre no sirve..."
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                    value={address.instructions}
                    onChangeText={(text) => setAddress({...address, instructions: text})}
                />
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSave}>
                <Text style={styles.confirmBtnText}>Confirmar Dirección</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#a10b0b",
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 35,
    elevation: 8,
  },
  backBtn: {
    marginRight: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2.5,
  },
  container: {
    padding: 20,
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    gap: 5,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a10b0b",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#a10b0b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
  },
  mapText: {
    marginTop: 10,
    color: "#999",
    fontWeight: "600",
  },
  markerContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  markerDot: {
    width: 12,
    height: 12,
    backgroundColor: "#a10b0b",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 2,
  },
  markerPulse: {
    position: "absolute",
    width: 30,
    height: 30,
    backgroundColor: "rgba(161, 11, 11, 0.2)",
    borderRadius: 15,
  },
  form: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  confirmBtn: {
    backgroundColor: "#a10b0b",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
    shadowColor: "#a10b0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
