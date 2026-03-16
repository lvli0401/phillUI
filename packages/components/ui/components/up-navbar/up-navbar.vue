<template>
	<view
	    v-if="fixed && placeholder"
	    class="up-navbar__placeholder"
	    :style="{ height: placeholderHeight }"
	/>
	<view
	    class="up-navbar"
	    :class="[customClass, fixed ? 'up-navbar--fixed' : '']"
	    :style="[barStyle, addStyle(customStyle)]"
	>
		<up-status-bar
		    v-if="safeAreaInsetTop"
		    :bgColor="bgColor"
		/>
		<view class="up-navbar__content" :style="{ height: heightPx }">
			<view class="up-navbar__left" @tap="onLeftClick">
				<slot name="left">
					<text v-if="autoBack" class="up-navbar__back">←</text>
					<text v-if="leftText !== ''" class="up-navbar__left-text">{{ leftText }}</text>
				</slot>
			</view>
			<view class="up-navbar__center" @tap="onClick">
				<slot>
					<text class="up-navbar__title">{{ title }}</text>
				</slot>
			</view>
			<view class="up-navbar__right" @tap="onRightClick">
				<slot name="right">
					<text v-if="rightText !== ''" class="up-navbar__right-text">{{ rightText }}</text>
				</slot>
			</view>
		</view>
	</view>
</template>

<script>
	import { props } from './props.js'
	import { mpMixin } from '../../libs/mixin/mpMixin.js'
	import { mixin } from '../../libs/mixin/mixin.js'
	import { addStyle, getPx, addUnit, sys, deepMerge } from '../../libs/function/index.js'

	export default {
		name: 'up-navbar',
		mixins: [mpMixin, mixin, props],
		emits: ['leftClick', 'rightClick', 'click'],
		computed: {
			statusBarHeight() {
				return this.safeAreaInsetTop ? Number(sys().statusBarHeight || 0) : 0
			},
			heightPx() {
				return addUnit(this.height)
			},
			placeholderHeight() {
				const h = this.statusBarHeight + Number(getPx(this.height))
				return `${h}px`
			},
			barStyle() {
				const style = {
					backgroundColor: this.bgColor,
					zIndex: this.zIndex
				}
				if (this.fixed) {
					style.position = 'fixed'
					style.left = 0
					style.right = 0
					style.top = 0
				}
				return deepMerge(style, addStyle(this.customStyle))
			}
		},
		methods: {
			addStyle,
			onLeftClick(e) {
				this.$emit('leftClick')
				if (this.autoBack) {
					try {
						uni.navigateBack()
					} catch (err) {}
				}
				if (this.stop && e && e.stopPropagation) e.stopPropagation()
			},
			onRightClick(e) {
				this.$emit('rightClick')
				if (this.stop && e && e.stopPropagation) e.stopPropagation()
			},
			onClick() {
				this.$emit('click')
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import "../../libs/css/components.scss";

	.up-navbar {
		width: 100%;

		&__content {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 12px;
		}

		&__left,
		&__right {
			min-width: 60px;
			display: flex;
			align-items: center;
		}

		&__right {
			justify-content: flex-end;
		}

		&__center {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 0 8px;
			overflow: hidden;
		}

		&__title {
			font-size: 16px;
			font-weight: 500;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__back {
			margin-right: 6px;
			font-size: 18px;
			line-height: 1;
		}
	}
</style>
