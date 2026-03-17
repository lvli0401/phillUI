declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ['up-button']: typeof import('./comps/button')['Button']
  }
}

export {}
