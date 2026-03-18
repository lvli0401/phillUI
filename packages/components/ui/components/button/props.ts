import { defineMixin } from '../../libs/vue';
import defProps from './button';
let btnProp = defProps['button'];

export const props = defineMixin({
  props: {
    type: {
      type: String,
      default: (): string => btnProp.type,
    },
    size: {
      type: String,
      default: (): string => btnProp.size,
    },
    plain: {
      type: Boolean,
      default: (): boolean => btnProp.plain,
    },
    disabled: {
      type: Boolean,
      default: (): boolean => btnProp.disabled,
    },
    loading: {
      type: Boolean,
      default: (): boolean => btnProp.loading,
    },
    text: {
      type: [String, Number],
      default: (): string | number => btnProp.text,
    },
    customStyle: {
      type: [Object, String],
      default: (): object | string => (btnProp.customStyle != null ? btnProp.customStyle : {}),
    },
    customClass: {
      type: String,
      default: (): string => (btnProp.customClass != null ? btnProp.customClass : ''),
    },
  },
} as any);
