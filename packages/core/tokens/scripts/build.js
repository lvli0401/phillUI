const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

function cleanDist() {
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return
  fs.copyFileSync(src, dest)
}

function build() {
  cleanDist()
  copyIfExists(path.join(rootDir, 'index.js'), path.join(distDir, 'index.js'))
  copyIfExists(path.join(rootDir, 'index.uts'), path.join(distDir, 'index.uts'))
  copyIfExists(path.join(rootDir, 'tokens.scss'), path.join(distDir, 'tokens.scss'))
}

build()

