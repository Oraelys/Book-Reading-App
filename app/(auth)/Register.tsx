import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import BackButton from '@/components/BackButton'

export default function Register() {
  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenWrapper showPattern={true}>
        <View style={styles.container}>

            <View style={styles.header}>
                <BackButton/>
            </View>
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
    container : {
        flex: 1, 
        gap: 30,
        marginHorizontal: 20,
        justifyContent: 'space-between'
    },
    header:{
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 25,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems:'center'
    },
    content: {
        flex: 1, 
        backgroundColor: colors.white,
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        borderCurve: "continuous",
        paddingHorizontal: 20,
        paddingTop: 20
    },
    form : {
        gap: 15,
        marginTop: 20,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: 'center',
        gap: 5
    }
})