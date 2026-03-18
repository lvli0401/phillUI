import { defineMixin } from '../../libs/vue.js'
import defProps from '../../libs/config/props.js'

export const props = defineMixin({
	props: {
		type: {
			type: String,
			default: (): any => (defProps as any).button.type
		},
		size: {
			type: String,
			default: (): any => (defProps as any).button.size
		},
		plain: {
			type: Boolean,
			default: (): boolean => (defProps as any).button.plain
		},
		disabled: {
			type: Boolean,
			default: (): boolean => (defProps as any).button.disabled
		},
		loading: {
			type: Boolean,
			default: (): boolean => (defProps as any).button.loading
		},
		text: {
			type: [String, Number],
			default: (): any => (defProps as any).button.text
		},
		customStyle: {
			type: [Object, String],
			default: (): any => ((defProps as any).button.customStyle != null ? (defProps as any).button.customStyle : {})
		},
		customClass: {
			type: String,
			default: (): string => ((defProps as any).button.customClass != null ? (defProps as any).button.customClass : '')
		}
	}
} as any)
