import { colors } from "@/constants/theme (1)";
import React from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated"

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle={"light-content"} backgroundColor={colors.neutral900}/>
            <Animated.Image
            source={require("../assets/images/favicon.png")}/>
            <Text>Hey</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.neutral900
    }
});