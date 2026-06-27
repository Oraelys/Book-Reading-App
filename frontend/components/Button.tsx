import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { ButtonProps } from '@/types'
import { colors, radius } from '@/constants/theme'
import { verticalScale } from '@/styles/stylings'
import Loading from './Loading'

export default function Button({
    style,
    onPress,
    children,
    loading = false,

}: ButtonProps) {
    if(loading) {
        return (
            <View style={[styles.button, style, {backgroundColor: "transparent"}]}>
                <Loading/>
            </View>
        )
    }


  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
        {children}
    </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        borderRadius: radius.full,
        borderCurve: 'continuous',
        height: 56, //verticalScale(56),
        justifyContent: "center",
        alignItems: "center",
    }
})