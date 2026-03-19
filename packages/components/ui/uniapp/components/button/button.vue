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
    :style="addStyle(customStyle) as any"
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
import { addStyle } from '../../libs/function/index.js';
import { props } from './props';

export default {
  name: 'tsm-button',
  mixins: [props],
  emits: ['click'],
  computed: {
    disabledOrLoading(): boolean {
      return !!(this.disabled || this.loading);
    },
  },
  methods: {
    addStyle,
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
  background: #3c9cff;
  color: #ffffff;
  border-color: #3c9cff;
}

.tsm-button--success {
  background: #5ac725;
  color: #ffffff;
  border-color: #5ac725;
}

.tsm-button--warning {
  background: #f9ae3d;
  color: #ffffff;
  border-color: #f9ae3d;
}

.tsm-button--error {
  background: #f56c6c;
  color: #ffffff;
  border-color: #f56c6c;
}

.tsm-button--info {
  background: #909399;
  color: #ffffff;
  border-color: #909399;
}

.tsm-button--primary.is-plain,
.tsm-button--success.is-plain,
.tsm-button--warning.is-plain,
.tsm-button--error.is-plain,
.tsm-button--info.is-plain {
  background: transparent;
}

.tsm-button--primary.is-plain {
  color: #3c9cff;
  border-color: #3c9cff;
}
.tsm-button--success.is-plain {
  color: #5ac725;
  border-color: #5ac725;
}
.tsm-button--warning.is-plain {
  color: #f9ae3d;
  border-color: #f9ae3d;
}
.tsm-button--error.is-plain {
  color: #f56c6c;
  border-color: #f56c6c;
}
.tsm-button--info.is-plain {
  color: #909399;
  border-color: #909399;
}

.is-disabled {
  opacity: 0.5;
}
</style>
