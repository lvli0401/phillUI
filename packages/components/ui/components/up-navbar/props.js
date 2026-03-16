import { defineMixin } from '../../libs/vue.js'
import defProps from '../../libs/config/props.js'

export const props = defineMixin({
    props: {
        title: {
            type: [String, Number],
            default: () => defProps.navbar.title
        },
        bgColor: {
            type: String,
            default: () => defProps.navbar.bgColor
        },
        height: {
            type: [String, Number],
            default: () => defProps.navbar.height
        },
        fixed: {
            type: Boolean,
            default: () => defProps.navbar.fixed
        },
        placeholder: {
            type: Boolean,
            default: () => defProps.navbar.placeholder
        },
        safeAreaInsetTop: {
            type: Boolean,
            default: () => defProps.navbar.safeAreaInsetTop
        },
        autoBack: {
            type: Boolean,
            default: () => defProps.navbar.autoBack
        },
        leftText: {
            type: [String, Number],
            default: () => defProps.navbar.leftText
        },
        rightText: {
            type: [String, Number],
            default: () => defProps.navbar.rightText
        },
        zIndex: {
            type: [String, Number],
            default: () => defProps.navbar.zIndex
        },
        customStyle: {
            type: [Object, String],
            default: () => defProps.navbar.customStyle
        },
        customClass: {
            type: String,
            default: () => defProps.navbar.customClass
        },
        stop: {
            type: Boolean,
            default: () => defProps.navbar.stop
        }
    }
})
