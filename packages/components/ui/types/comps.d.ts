declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ['up-button']: typeof import('./comps/button')['Button']
    ['up-calendar']: typeof import('./comps/calendar')['Calendar']
    ['up-icon']: typeof import('./comps/icon')['Icon']

    ['up-loading-icon']: typeof import('./comps/loadingIcon')['LoadingIcon']
    ['up-navbar']: typeof import('./comps/navbar')['Navbar']
    ['up-overlay']: typeof import('./comps/overlay')['Overlay']
    ['up-popup']: typeof import('./comps/popup')['Popup']
    ['up-safe-bottom']: typeof import('./comps/safeBottom')['SafeBottom']
    ['up-status-bar']: typeof import('./comps/statusBar')['StatusBar']
    ['up-transition']: typeof import('./comps/transition')['Transition']
  }
}

export {}
