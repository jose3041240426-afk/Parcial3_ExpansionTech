import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabaseClient";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(false);
  
  // Estados para capturar el texto
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Funciones fuertes de Supabase
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert("Error ingresando", error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) Alert.alert("Error registrando", error.message);
    else Alert.alert("¡Exito!", "Por favor revisa tu bandeja de entrada para verificar tu cuenta.");
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardContainer}
      >
        <View style={styles.formBox}>
          <View style={styles.form}>
            <Image 
              source={require("./assets/logo.png")} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={styles.title}>
              {isLogin ? "Inicio" : "Registro"}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? "Bienvenido de nuevo a tu cuenta." 
                : "Crea una cuenta gratuita con tu correo."}
            </Text>

            <View style={styles.formContainer}>
              {!isLogin && (
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { marginBottom: 0, flex: 1, borderWidth: 0 }]}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeBtn} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              activeOpacity={0.8}
              disabled={loading}
              onPress={isLogin ? signInWithEmail : signUpWithEmail}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? "ENTRAR" : "REGISTRARME"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionText}>
              {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <Text 
                style={styles.linkText}
                onPress={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Regístrate" : "Inicia sesión"}
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff", // Volvemos al blanco para el fondo general
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  formBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#111", // Gris muy oscuro
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333", // Borde sutil
    elevation: 20,
    shadowColor: "#a10b0b", // Sombra roja sutil
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  form: {
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 30,
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontWeight: "900",
    fontSize: 32,
    color: "#a10b0b", // Rojo marca
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
  },
  input: {
    height: 55,
    width: "100%",
    backgroundColor: "#fff", // Blanco puro como pediste
    borderRadius: 12,
    fontSize: 15,
    paddingHorizontal: 18,
    color: "#000",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 55,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    overflow: "hidden",
  },
  eyeBtn: {
    paddingHorizontal: 15,
    height: "100%",
    justifyContent: "center",
  },
  inputNoBottomBorder: {
    // No longer used as inputs are separate rounded boxes
  },
  button: {
    backgroundColor: "#a10b0b", // Rojo intenso
    width: "100%",
    borderRadius: 12,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  formSection: {
    padding: 20,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  formSectionText: {
    fontSize: 14,
    color: "#666",
  },
  linkText: {
    fontWeight: "bold",
    color: "#a10b0b", // Rojo para el link
  },
});
