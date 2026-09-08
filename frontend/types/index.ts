import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface BackButtonProps {
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  color?: string;
}

export interface ButtonProps {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  children?: ReactNode;
  loading?: boolean;
}

export interface ScreenWrapperProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  showPattern?: boolean;
  isModal?: boolean;
  bgOpacity?: number;
}
