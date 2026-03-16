import { AllowedComponentProps, VNodeProps } from './_common'

declare interface NavbarProps {
  title?: string | number
  bgColor?: string
  height?: string | number
  fixed?: boolean
  placeholder?: boolean
  safeAreaInsetTop?: boolean
  autoBack?: boolean
  leftText?: string | number
  rightText?: string | number
  zIndex?: string | number
  customStyle?: Record<string, any> | string
  customClass?: string
  stop?: boolean
  onLeftClick?: () => any
  onRightClick?: () => any
  onClick?: () => any
}

declare interface _Navbar {
  new (): {
    $props: AllowedComponentProps &
      VNodeProps &
      NavbarProps
  }
}

export declare const Navbar: _Navbar
