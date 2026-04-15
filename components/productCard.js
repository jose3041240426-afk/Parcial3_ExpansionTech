import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export default function ProductCard({ id, name, price, image, description, navigation, initialFavorite }) {
    const { colors, isDarkMode } = useTheme();
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDarkMode ? 1 : 0 }]}
            onPress={() =>
                navigation.navigate("ProductDetail", {
                    id: id,
                    name: name,
                    price: price,
                    image: image,
                    description: description,
                    initialFavorite: initialFavorite,
                })
            }
            activeOpacity={0.7}
        >
            <View style={[styles.imageContainer, { backgroundColor: "#fff" }]}>
                <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.infoContainer}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{name}</Text>
                <Text style={styles.productPrice}>${price} MXN</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#f1f1f1",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    imageContainer: {
        backgroundColor: "#ffffff",
        width: "100%",
        height: 200,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    image: {
        width: "100%",
        height: "100%",
    },
    infoContainer: {
        padding: 14,
    },
    productName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111",
        lineHeight: 22,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: "800",
        color: "#ff0000",
        marginTop: 8,
    }
});