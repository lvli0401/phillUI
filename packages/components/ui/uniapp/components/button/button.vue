<template>
  <button
    class="tsm-button"
    :class="[
      customClass,
      `tsm-button--${type}`,
      `tsm-button--${size}`,
      plain ? 'is-plain' : '',
      disabledOrLoading ? 'is-disabled' : '',
    ]"
    :style="[themeCssVars as any, addStyle(customStyle) as any]"
    :disabled="disabledOrLoading"
    @click="onClick"
  >
    <text v-if="loading" class="tsm-button__loading">...</text>
    <slot>
      <text class="tsm-button__text">{{ text }}</text>
    </slot>
  </button>
</template>

<script lang="ts">
import { useThemeCssVars } from '@/uni_modules/@phill-component/tokens/index';
import { buttonProps } from './props';

export default {
  name: 'tsm-button',
  props: buttonProps,
  emits: ['click'],
  computed: {
    themeCssVars() {
      return useThemeCssVars();
    },
    disabledOrLoading(): boolean {
      return !!(this.disabled || this.loading);
    },
  },
  methods: {
    addStyle(customStyle: any) {
      if (customStyle == null) return {};
      if (typeof customStyle === 'string') return customStyle;
      if (typeof customStyle === 'object') return customStyle;
      return {};
    },
    onClick(e: Event) {
      if (this.disabledOrLoading) return;
      this.$emit('click', e);
    },
  },
};
</script>

<style lang="scss" scoped>
.tsm-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 14px;
  line-height: 1;
  box-sizing: border-box;
}

.tsm-button__text {
  line-height: 1;
}

.tsm-button__loading {
  font-size: 12px;
  line-height: 1;
}

.tsm-button--large {
  padding: 12px 16px;
  font-size: 16px;
}

.tsm-button--small {
  padding: 8px 12px;
  font-size: 13px;
}

.tsm-button--mini {
  padding: 6px 10px;
  font-size: 12px;
}

.tsm-button--default {
  background: #ffffff;
  color: #111827;
  border-color: #e5e7eb;
}

.tsm-button--primary {
  background: var(--tsm-color-primary, #2979ff);
  color: #ffffff;
  border-color: var(--tsm-color-primary, #2979ff);
}

.tsm-button--success {
  background: var(--tsm-color-success, #00c853);
  color: #ffffff;
  border-color: var(--tsm-color-success, #00c853);
}

.tsm-button--warning {
  background: var(--tsm-color-warning, #ff9100);
  color: #ffffff;
  border-color: var(--tsm-color-warning, #ff9100);
}

.tsm-button--error {
  background: var(--tsm-color-error, #ff4d4f);
  color: #ffffff;
  border-color: var(--tsm-color-error, #ff4d4f);
}

.tsm-button--info {
  background: var(--tsm-color-info, #909399);
  color: #ffffff;
  border-color: var(--tsm-color-info, #909399);
}

.tsm-button--primary.is-plain,
.tsm-button--success.is-plain,
.tsm-button--warning.is-plain,
.tsm-button--error.is-plain,
.tsm-button--info.is-plain {
  background: transparent;
}

.tsm-button--primary.is-plain {
  color: var(--tsm-color-primary, #2979ff);
  border-color: var(--tsm-color-primary, #2979ff);
}
.tsm-button--success.is-plain {
  color: var(--tsm-color-success, #00c853);
  border-color: var(--tsm-color-success, #00c853);
}
.tsm-button--warning.is-plain {
  color: var(--tsm-color-warning, #ff9100);
  border-color: var(--tsm-color-warning, #ff9100);
}
.tsm-button--error.is-plain {
  color: var(--tsm-color-error, #ff4d4f);
  border-color: var(--tsm-color-error, #ff4d4f);
}
.tsm-button--info.is-plain {
  color: var(--tsm-color-info, #909399);
  border-color: var(--tsm-color-info, #909399);
}

.is-disabled {
  opacity: 0.5;
}
</style>
