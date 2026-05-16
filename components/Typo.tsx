import { StyleSheet, Text, TextStyle, View } from 'react-native'
import React from 'react'
import { colors } from '@/constants/theme'
import { TypoProps } from '@/types'
import { verticalScale } from '@/styles/stylings'

const Typo = ({
  size = 16,
  color = colors.text,
  fontWeight = 400,
  children,
  style,
  textProps = {}
}: TypoProps) => {
  const textStyle: TextStyle = {
    fontSize: 49, //verticalScale(size) as number, // Temporary fix
    color,
    fontWeight: fontWeight.toString() as any // fontWeight should be string in RN
  }

  return (
    <Text style={[textStyle, style]} {...textProps}>
      {children}
    </Text>
  )
}

export default Typo