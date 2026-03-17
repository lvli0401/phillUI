<template>
  <view class="container">
    <up-navbar title="Icon Test" safeAreaInsetTop fixed placeholder></up-navbar>
    <view class="section">
      <text class="title">1. 使用 Icon 组件</text>
      <view class="row">
        <IconCalendar size="24px" />
        <text>IconCalendar</text>
      </view>
      <view class="row">
        <IconFileFold size="28px" />
        <text>IconFileFold</text>
      </view>
      <view class="row">
        <IconSetting size="28px" />
        <text>IconSetting</text>
      </view>
    </view>
  </view>
  </template>

<script setup>
import { IconCalendar, IconFileFold, IconSetting } from '@/uni_modules/@phill-component/icons/dist/mobile/vue/index.js'
</script>

<style lang="scss" scoped>
.container {
	padding: 20px;
}
.section {
	margin-bottom: 30px;
}
.title {
	font-size: 18px;
	font-weight: bold;
	margin-bottom: 10px;
	display: block;
}
.row {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 10px;
}
</style>
