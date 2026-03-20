export const buttonProps = {
  type: { type: String, default: 'primary' },
  size: { type: String, default: 'normal' },
  plain: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  text: { type: [String, Number], default: '' },
  customStyle: { type: [Object, String], default: '' },
  customClass: { type: String, default: '' },
};
