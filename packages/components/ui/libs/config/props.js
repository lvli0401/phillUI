/**
 * 此文件的作用为统一配置所有组件的props参数
 * 借此用户可以全局覆盖组件的props默认值
 * 无需在每个引入组件的页面中都配置一次
 */
import config from './config.js'

import Button from '../../components/up-button/button.js'
import Calendar from '../../components/up-calendar/calendar.js'
import Icon from '../../components/up-icon/icon.js'
import LoadingIcon from '../../components/up-loading-icon/loadingIcon.js'
import Overlay from '../../components/up-overlay/overlay.js'
import Popup from '../../components/up-popup/popup.js'
import Navbar from '../../components/up-navbar/navbar.js'
import StatusBar from '../../components/up-status-bar/statusBar.js'
import Transition from '../../components/up-transition/transition.js'

const {
    color
} = config

export default {
    ...Button,
    ...Calendar,
    ...Icon,
    ...LoadingIcon,
    ...Overlay,
    ...Popup,
    ...Navbar,
    ...StatusBar,
    ...Transition
}
