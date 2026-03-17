/**
 * 此文件的作用为统一配置所有组件的props参数
 * 借此用户可以全局覆盖组件的props默认值
 * 无需在每个引入组件的页面中都配置一次
 */
import config from './config.js'

import Button from '../../components/up-button/button.js'

const {
    color
} = config

export default {
    ...Button,
}
