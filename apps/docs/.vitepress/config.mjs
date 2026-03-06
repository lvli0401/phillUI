import { defineConfig } from 'vitepress'

export default defineConfig({
  vite: {
    server: {
      port: 5176
    },
    define: {
      __DEMO_URL__: JSON.stringify(process.env.NODE_ENV === 'production' ? 'https://lvli0401.github.io/phillUI/h5/' : 'http://localhost:5175/')
    }
  },
  title: "phillUI",
  description: "A uView-like component library for UniApp & UniApp X",
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/install' },
      { text: '组件', link: '/components/calendar' },
      { text: 'GitHub', link: 'https://github.com/lvli0401/phillUI' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '基础指南',
          items: [
            { text: '安装', link: '/guide/install' },
            { text: '快速上手', link: '/guide/quickstart' }
          ]
        }
      ],
      '/components/': [
        {
          text: '表单组件',
          items: [
            { text: 'Calendar 日历', link: '/components/calendar' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/lvli0401/phillUI' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present lvli0401'
    }
  }
})
