import { AllowedComponentProps, VNodeProps } from './_common'

declare interface ButtonProps {
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'
  size?: 'large' | 'normal' | 'small' | 'mini'
  plain?: boolean
  disabled?: boolean
  loading?: boolean
  text?: string | number
  customStyle?: Record<string, any> | string
  customClass?: string
  onClick?: (e: any) => any
}

declare interface _Button {
  new (): {
    $props: AllowedComponentProps &
      VNodeProps &
      ButtonProps
  }
}

export declare const Button: _Button
