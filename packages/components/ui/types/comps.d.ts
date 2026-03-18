declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ['tsm-button']: typeof import('./comps/button')['Button']
  }
}

export {}
