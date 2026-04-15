import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@expansion_favorites';

export const getFavoritesLocal = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Error loading favorites locally', e);
        return [];
    }
};

export const saveFavoriteLocal = async (productId) => {
    try {
        const favorites = await getFavoritesLocal();
        const idStr = productId.toString();
        if (!favorites.includes(idStr)) {
            const newFavorites = [...favorites, idStr];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
        }
    } catch (e) {
        console.error('Error saving favorite locally', e);
    }
};

export const removeFavoriteLocal = async (productId) => {
    try {
        const favorites = await getFavoritesLocal();
        const idStr = productId.toString();
        const newFavorites = favorites.filter(id => id !== idStr);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (e) {
        console.error('Error removing favorite locally', e);
    }
};

export const syncFavoritesLocal = async (favoriteIds) => {
    try {
        const idStrings = favoriteIds.map(id => id.toString());
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(idStrings));
    } catch (e) {
        console.error('Error syncing favorites locally', e);
    }
};
