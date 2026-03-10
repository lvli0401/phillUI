import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { IncomingForm } from 'formidable'
import { simpleGit } from 'simple-git'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.resolve(__dirname, '..')
const repoRoot = path.resolve(rootDir, '..')
const svgDir = path.resolve(repoRoot, 'packages/core/icons/svg')

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'icon-manager-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/icons' && req.method === 'GET') {
            const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'))
            const icons = files.map(file => {
              const name = file.replace('.svg', '')
              const content = fs.readFileSync(path.join(svgDir, file), 'utf-8')
              return { name, content }
            })
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(icons))
          } 
          else if (req.url === '/api/upload' && req.method === 'POST') {
            const form = new IncomingForm()
            form.parse(req, (err, fields, files) => {
              if (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: err.message }))
                return
              }
              const file = files.file[0]
              const name = fields.name[0]
              const targetPath = path.join(svgDir, `${name}.svg`)
              
              fs.copyFileSync(file.filepath, targetPath)
              
              // Trigger build
              try {
                execSync('pnpm run build', { cwd: path.resolve(repoRoot, 'packages/core/icons') })
                res.end(JSON.stringify({ success: true }))
              } catch (buildErr) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Build failed: ' + buildErr.message }))
              }
            })
          }
          else if (req.url === '/api/sync' && req.method === 'POST') {
            try {
              const repoRoot = path.resolve(rootDir, '..')
              const git = simpleGit(repoRoot) // Repo root
              
              // Ensure we are working on the latest master before branching
              await git.checkout('master')
              await git.pull('origin', 'master')

              // Create a unique branch name
              const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
              const branchName = `feat/update-icons-${timestamp}`
              
              await git.checkoutLocalBranch(branchName)
              
              await git.add([
                path.join(repoRoot, 'packages/core/icons/svg'),
                // path.join(repoRoot, 'packages/core/icons/dist')
              ])
              await git.commit('chore(icons): update SVG assets via manager')
              
              // Push the new branch to origin
              await git.push('origin', branchName)
              
              // Switch back to master after successful push
              await git.checkout('master')

              res.end(JSON.stringify({ 
                success: true, 
                message: `Pushed to new branch: ${branchName}. Please create a PR.` 
              }))
            } catch (gitErr) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Git sync failed: ' + gitErr.message }))
            }
          }
          else {
            next()
          }
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
