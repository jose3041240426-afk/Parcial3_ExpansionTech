import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from "./navigation/AppNavigator";
import CustomSpinner from "./components/CustomSpinner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoaderProvider, LoaderContext } from "./contexts/LoaderContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LoaderProvider>
          <LoaderContext.Consumer>
            {({ isLoading }) => (
              <View style={styles.container}>
                <AppNavigator />
                {isLoading && <CustomSpinner />}
              </View>
            )}
          </LoaderContext.Consumer>
        </LoaderProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});