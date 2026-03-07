# 安装

`phillUI` 是一款基于 UniApp 的优秀 UI 框架，支持 UniApp X 和普通 UniApp。

## NPM 安装

推荐使用 npm 安装，方便后期直接升级版本。

```bash
# 如果是在 npm 环境下
npm install phillui-ui
```

## 引入方式

### 1. 配置 easycom

在 `pages.json` 中配置 `easycom`：

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^up-(.*)": "phillui-ui/components/up-$1/up-$1.vue"
    }
  },
  "pages": [
    // ...
  ]
}
```

> [!NOTE]
> 这只是一个基础示例，具体的引入路径取决于你的项目结构。
