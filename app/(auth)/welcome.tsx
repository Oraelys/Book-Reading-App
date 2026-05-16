import { StyleSheet, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, spacingX, spacingY } from '@/constants/theme'
import Typo from '@/components/Typo'
import Animated, { FadeIn } from 'react-native-reanimated'
import { verticalScale } from '@/styles/stylings'
import Button from '@/components/Button'
import { useRouter } from 'expo-router'

const welcome = () => {
    const router = useRouter()
  return (
 <ScreenWrapper showPattern={true} bgOpacity={0.5}>
    <View style={styles.container}>
        <View style={{alignItems: "center"}}>
            <Typo color={colors.white} size={24} fontWeight={"900"}>
                Inkverse
            </Typo>
        </View>

        <Animated.Image
            entering={FadeIn.duration(700).springify()}
            // source={require("../../assets/images/welcome-illustration.png")}
            style={styles.welcomeImage}
            resizeMode={"contain"}/>

            <View> 
                <Typo color={colors.white} size={33} fontWeight={"600"}>
                    Chat with friends 
                </Typo>
                <Typo color={colors.white} size={33} fontWeight={"600"}>
                   about your favorite 
                </Typo>
                <Typo color={colors.white} size={33} fontWeight={"600"}>
              books
                </Typo>
            </View>

            <Button style={{backgroundColor: colors.white}} loading={true} onPress={() => router.push("/(auth)/Register")}>
                <Typo size={23}>
                    Get Started
                </Typo>
            </Button>

           
    </View>
 </ScreenWrapper>
  )
}

export default welcome

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-around',
        paddingHorizontal: 20, //spacingX._20,
        marginVertical: 14  //spacingY._20
    },
    background: {
        flex: 1,
        backgroundColor: colors.neutral900,
    },
    welcomeImage: {
        height: 200, //verticalScale(300),
        aspectRatio:1,
        alignSelf: "center"
    }
})