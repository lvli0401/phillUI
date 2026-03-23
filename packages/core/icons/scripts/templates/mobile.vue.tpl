<template>
  <view class="icon" @tap="onTap" :hover-class="hoverClass" :style="[wrapStyle, iconStyle]">
    <!-- #ifdef H5 -->
    __INNER_SVG__
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <image :src="imgSrc" :style="iconBoxStyle" />
    <!-- #endif -->
    <text v-if="label !== ''" class="icon__label" :style="labelStyle">{{ label }}</text>
  </view>
</template>
<script setup>
import { computed } from 'vue'
import imgSrc from '__IMG_SRC__'
const props = defineProps({
  size: { type: [String, Number], default: '1em' },
  color: { type: String, default: 'var(--tsm-color-primary)' },
  label: { type: [String, Number], default: '' },
  labelPos: { type: String, default: 'right' },
  labelSize: { type: [String, Number], default: '15px' },
  labelColor: { type: String, default: '' },
  space: { type: [String, Number], default: '3px' },
  width: { type: [String, Number], default: '' },
  height: { type: [String, Number], default: '' },
  hoverClass: { type: String, default: '' },
  index: { type: [String, Number], default: '' },
  stop: { type: Boolean, default: false }
})
const emit = defineEmits(['click'])
const toPx = (v) => typeof v === 'number' ? (v + 'px') : (String(v||''));
const iconW = computed(() => props.width ? toPx(props.width) : toPx(props.size))
const iconH = computed(() => props.height ? toPx(props.height) : toPx(props.size))
const iconBoxStyle = computed(() => ({ width: iconW.value, height: iconH.value }))
const iconStyle = computed(() => {
  return { color: props.color || 'inherit' }
})
const wrapStyle = computed(() => {
  const dirMap = { right: 'row', left: 'row-reverse', top: 'column-reverse', bottom: 'column' }
  return { display: 'flex', alignItems: 'center', flexDirection: dirMap[props.labelPos] || 'row' }
})
const labelStyle = computed(() => {
  return {
    color: props.labelColor || '',
    fontSize: toPx(props.labelSize),
    marginLeft: props.labelPos === 'right' ? toPx(props.space) : 0,
    marginTop: props.labelPos === 'bottom' ? toPx(props.space) : 0,
    marginRight: props.labelPos === 'left' ? toPx(props.space) : 0,
    marginBottom: props.labelPos === 'top' ? toPx(props.space) : 0
  }
})
function onTap(e) {
  emit('click', props.index)
  if (props.stop && e && e.stopPropagation) e.stopPropagation()
}
</script>
<style scoped>
.icon__label { line-height: 1; }
</style>
