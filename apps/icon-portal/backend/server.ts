import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import serve from 'koa-static';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { IncomingForm, Fields, Files } from 'formidable';
import { simpleGit } from 'simple-git';
import { fileURLToPath } from 'url';
import { optimize } from 'svgo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const router = new Router();

const rootDir = __dirname;
const repoRoot = path.resolve(rootDir, '../../..');
const svgDir = path.resolve(repoRoot, 'packages/core/icons/svg');
const distDir = path.resolve(__dirname, '../dist'); // Updated for new structure

// Interfaces
interface Icon {
  name: string;
  content: string;
}

interface FormResult {
  fields: Fields;
  files: Files;
}

// Middleware
app.use(cors());

// Helper to handle Multipart Form Data
const parseForm = (req: any): Promise<FormResult> => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

// API Routes
router.get('/api/icons', async (ctx) => {
  try {
    if (!fs.existsSync(svgDir)) {
      ctx.body = [];
      return;
    }
    const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));
    const icons: Icon[] = files.map(file => {
      const name = file.replace('.svg', '');
      const content = fs.readFileSync(path.join(svgDir, file), 'utf-8');
      return { name, content };
    });
    ctx.body = icons;
  } catch (err: any) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.post('/api/upload', async (ctx) => {
  try {
    const { fields, files } = await parseForm(ctx.req);
    
    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'No file uploaded' };
      return;
    }
    const file = fileArray[0];

    const nameArray = fields.name;
    if (!nameArray || nameArray.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'No name provided' };
      return;
    }
    const name = nameArray[0];
    
    const targetPath = path.join(svgDir, `${name}.svg`);
    const rawContent = fs.readFileSync(file.filepath, 'utf-8');
    
    // SVGO Optimization
    const optimizationResult = optimize(rawContent, {
      path: targetPath,
      plugins: [
        'preset-default',
        'removeDimensions',
      ]
    });

    const optimized = optimizationResult.data;

    if (!fs.existsSync(svgDir)) fs.mkdirSync(svgDir, { recursive: true });
    fs.writeFileSync(targetPath, optimized);

    // Trigger icon build system
    try {
      console.log('Triggering pnpm build in core/icons...');
      execSync('pnpm run build', { cwd: path.resolve(repoRoot, 'packages/core/icons') });
      ctx.body = { success: true };
    } catch (buildErr: any) {
      console.error('Build Error:', buildErr.message);
      ctx.status = 500;
      ctx.body = { error: 'Icon build failed: ' + buildErr.message };
    }
  } catch (err: any) {
    console.error('Upload Error:', err.message);
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.post('/api/sync', async (ctx) => {
  try {
    const git = simpleGit(repoRoot);
    
    // Ensure we are working on the latest master before branching
    await git.checkout('master');
    await git.pull('origin', 'master');

    // Create a unique branch name
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const branchName = `feat/update-icons-${timestamp}`;
    
    await git.checkoutLocalBranch(branchName);
    
    await git.add([
      path.join(repoRoot, 'packages/core/icons/svg'),
    ]);
    await git.commit('chore(icons): update SVG assets via manager');
    
    await git.push('origin', branchName);
    
    // Switch back to master after successful push
    await git.checkout('master');

    ctx.body = { 
      success: true, 
      message: `Pushed to new branch: ${branchName}. Please create a PR.` 
    };
  } catch (gitErr: any) {
    ctx.status = 500;
    ctx.body = { error: 'Git sync failed: ' + gitErr.message };
  }
});

app.use(router.routes()).use(router.allowedMethods());

// Serve static files in production
if (fs.existsSync(distDir)) {
  app.use(serve(distDir));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Icon Manager Server running at http://localhost:${PORT}`);
});
