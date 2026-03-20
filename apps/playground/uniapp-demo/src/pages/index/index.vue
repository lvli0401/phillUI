<template>
  <view class="content">
    <image class="logo" src="/static/logo.png" />
    <view class="text-area">
      <text class="title">{{ title }}</text>
    </view>
    <tsm-button @click="toggleTheme" class="button" type="primary">
      切换到{{ mode === 'dark' ? '浅色' : '暗黑' }}模式
    </tsm-button>
    <tsm-button @click="navToIcon" class="button" type="success">进入图标测试页</tsm-button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const title = ref('Hello')
const mode = ref(((uni as any).$tsm?.getThemeMode?.() as string) || 'light')

function navToIcon() {
  uni.navigateTo({
    url: '/pages/components/icon-test'
  })
}

function toggleTheme() {
  ;(uni as any).$tsm?.toggleThemeMode?.()
  mode.value = ((uni as any).$tsm?.getThemeMode?.() as string) || mode.value
}
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}

.button {
  margin: 50rpx auto;
  width: 50% !important;
}
</style>
