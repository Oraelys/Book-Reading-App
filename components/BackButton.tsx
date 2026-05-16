import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { colors } from '@/constants/theme'
import { BackButtonProps } from '@/types'
import { useRouter } from 'expo-router'

export default function BackButton({
    style, 
    iconSize = 26,
    color = colors.white,
}: BackButtonProps) {

    const router = useRouter()
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={() => router.back()}>
      <Text>BackButton</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    }
})