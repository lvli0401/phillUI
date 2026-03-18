export type ButtonType = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'
export type ButtonSize = 'large' | 'normal' | 'small' | 'mini'

export type ButtonDefaults = {
	type: ButtonType
	size: ButtonSize
	plain: boolean
	disabled: boolean
	loading: boolean
	text: string
	customStyle: Record<string, any> | string
	customClass: string
}

const defaults: { button: ButtonDefaults } = {
	button: {
		type: 'primary',
		size: 'normal',
		plain: false,
		disabled: false,
		loading: false,
		text: '',
		customStyle: {},
		customClass: ''
	}
}

export default defaults

