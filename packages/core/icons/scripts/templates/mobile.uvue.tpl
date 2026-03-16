<template>
  <view class="icon" @tap="onTap" :hover-class="hoverClass" :style="wrapStyle">
    <!-- #ifdef H5 -->
    <svg viewBox="0 0 24 24" :width="iconW" :height="iconH" xmlns="http://www.w3.org/2000/svg">
      __INNER_SVG__
    </svg>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <image :src="imgSrc" :style="iconBoxStyle" />
    <!-- #endif -->
    <text v-if="label != ''" class="icon__label" :style="labelStyle">{{ label }}</text>
  </view>
</template>
<script setup lang="uts">
import { computed } from 'vue'
import imgSrc from '__IMG_SRC__'
const props = defineProps({
  size: { type: [String, Number], default: '1em' },
  color: { type: String, default: '' },
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
function toPx(v: any): string {
  if (typeof v === 'number') return (v as number).toString() + 'px'
  const s = (v as string)
  return s != '' ? s : ''
}
const iconW = computed((): string => (props.width != '' ? toPx(props.width) : toPx(props.size)))
const iconH = computed((): string => (props.height != '' ? toPx(props.height) : toPx(props.size)))
const iconBoxStyle = computed((): UTSJSONObject => ({ width: iconW.value, height: iconH.value } as UTSJSONObject))
const wrapStyle = computed((): UTSJSONObject => {
  const map = { right: 'row', left: 'row-reverse', top: 'column-reverse', bottom: 'column' } as UTSJSONObject
  let dir: string = 'row'
  const cand = map[props.labelPos] as string | null
  if (cand != null && cand.length > 0) {
    dir = cand
  }
  return { display: 'flex', alignItems: 'center', flexDirection: dir } as UTSJSONObject
})
const labelStyle = computed((): UTSJSONObject => {
  const out = {} as UTSJSONObject
  if (props.labelColor != '') out['color'] = props.labelColor
  out['fontSize'] = toPx(props.labelSize)
  out['marginLeft'] = props.labelPos == 'right' ? toPx(props.space) : 0
  out['marginTop'] = props.labelPos == 'bottom' ? toPx(props.space) : 0
  out['marginRight'] = props.labelPos == 'left' ? toPx(props.space) : 0
  out['marginBottom'] = props.labelPos == 'top' ? toPx(props.space) : 0
  return out
})
function onTap(e: UniPointerEvent) {
  emit('click', props.index)
  if (props.stop) e.stopPropagation()
}
</script>
<style scoped>
.icon__label { line-height: 1; }
</style>
