<template>
  <view class="container">
    <view class="section">
      <text class="title">1. 使用 Icon 组件</text>
      <view class="row">
        <icon-calendar size="24px" />
        <text>IconCalendar</text>
      </view>
      <view class="row">
        <icon-file-fold size="28px" />
        <text>IconFileFold</text>
      </view>
      <view class="row">
        <icon-setting color="red" size="28px" />
        <text>IconSetting</text>
      </view>
    </view>
  </view>
</template>

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
