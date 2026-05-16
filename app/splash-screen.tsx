import {
    
    StatusBar,
    StyleSheet, Text, View
} from "react-native"
import { colors } from "@/constants/theme"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useRouter } from "expo-router"
import { useEffect } from "react"
export default function SplashScreen() {
    const router = useRouter()
    useEffect(() => {
        setTimeout(() => {
            router.replace("/(auth)/welcome")
        })
    })
    return (
        <View style={styles.container}> 
            <StatusBar barStyle={"light-content"} 
            backgroundColor={colors.neutral900}/>
            <Animated.Image
                source={require("../assets/images/book-placeholder.png")}
                entering={FadeInDown.duration(700).springify()}
                style={styles.logo}
                /> 
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.neutral900
    },
    logo: {
        height: '23%',
        aspectRatio: 1,
    }
})