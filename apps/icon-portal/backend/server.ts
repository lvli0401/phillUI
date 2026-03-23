import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import serve from 'koa-static';
import path from 'path';
import fs from 'fs';
import { IncomingForm, Fields, Files } from 'formidable';
import { fileURLToPath } from 'url';
import { optimize } from 'svgo';
import Database from 'better-sqlite3';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const router = new Router();

// DB Initialization
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../icons.db');
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS icons (
    name TEXT PRIMARY KEY,
    content TEXT,
    status TEXT DEFAULT 'pending',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Octokit Initialization
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.REPO_OWNER || '';
const repo = process.env.REPO_NAME || '';
const branch = process.env.GITHUB_BRANCH || 'master';
const svgPath = 'packages/core/icons/svg';

const distDir = path.resolve(__dirname, '../dist');

// Interfaces
interface Icon {
  name: string;
  content: string;
  status: 'pending' | 'synced';
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
router.get('/api/version', async (ctx) => {
  try {
    const res = await fetch('https://registry.npmjs.org/@phill-component/icons/latest');
    if (!res.ok) throw new Error('NPM Registry unreachable');
    const data = await res.json();
    ctx.body = { version: data.version };
  } catch (err: any) {
    ctx.body = { version: 'unknown', error: err.message };
  }
});

router.get('/api/icons', async (ctx) => {
  try {
    // 1. Get remote icons from GitHub (Wait, this might be slow, let's cache or optional)
    // For now, let's assume we read from the Local DB which acts as a cache + staging.
    const localIcons = db.prepare('SELECT * FROM icons').all() as Icon[];
    ctx.body = localIcons;
  } catch (err: any) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.post('/api/export', async (ctx) => {
  try {
    console.log(`Triggering workflow 'publish-icons.yml' on ${owner}/${repo} (ref: ${branch})...`);
    // Trigger GitHub Action Pipeline
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: 'publish-icons.yml',
      ref: branch
    });
    ctx.body = { success: true, message: 'Publishing workflow triggered on GitHub' };
  } catch (err: any) {
    console.error('Export API Error:', err.message);
    if (err.response) {
      console.error('GitHub API Response:', JSON.stringify(err.response.data));
    }
    ctx.status = 500;
    ctx.body = { error: 'Failed to trigger workflow: ' + err.message + '. Please ensure the workflow file is pushed to the remote repository and your token has "workflow" scope.' };
  }
});

// Sync from GitHub to Local DB (Optional manual refresh)
router.post('/api/refresh', async (ctx) => {
  try {
    console.log('Starting refresh from GitHub...');
    console.log(`Config: owner=${owner}, repo=${repo}, path=${svgPath}, branch=${branch}`);

    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: svgPath,
      ref: branch
    });

    if (Array.isArray(data)) {
      console.log(`Found ${data.length} items in remote path.`);
      const stmt = db.prepare('INSERT OR REPLACE INTO icons (name, content, status) VALUES (?, ?, ?)');
      const syncList = data.filter(f => f.name.endsWith('.svg'));
      
      console.log(`Syncing ${syncList.length} SVG files via API (v2)...`);
      for (const file of syncList) {
        try {
          // Fetch individual file content to get base64 data
          const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: file.path,
            ref: branch
          });

          if (!Array.isArray(fileData) && fileData.type === 'file' && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const name = file.name.replace('.svg', '');
            stmt.run(name, content, 'synced');
            console.log(`Synced: ${name}`);
          }
        } catch (fetchErr: any) {
          console.error(`Error syncing ${file.name}:`, fetchErr.message);
        }
      }
    } else {
      console.warn('Remote path is not a directory or empty.');
    }
    ctx.body = { success: true };
  } catch (err: any) {
    console.error('Refresh API Error:', err.message);
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
    const name = (nameArray && nameArray.length > 0) ? nameArray[0] : file.originalFilename?.replace('.svg', '') || 'unknown';

    const rawContent = fs.readFileSync(file.filepath, 'utf-8');
    
    // SVGO Optimization
    const optimizationResult = optimize(rawContent, {
      plugins: ['preset-default', 'removeDimensions']
    });
    const optimized = optimizationResult.data;

    // Save to Staging (DB)
    db.prepare('INSERT OR REPLACE INTO icons (name, content, status) VALUES (?, ?, ?)')
      .run(name, optimized, 'pending');

    ctx.body = { success: true, name };
  } catch (err: any) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.post('/api/sync', async (ctx) => {
  try {
    const pendingChanges = db.prepare("SELECT * FROM icons WHERE status = 'pending'").all() as Icon[];
    if (pendingChanges.length === 0) {
      ctx.body = { success: true, message: 'No changes to sync' };
      return;
    }

    console.log(`Starting sync for ${pendingChanges.length} icons...`);

    // 1. Get latest commit SHA of branch
    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const baseTreeSha = refData.object.sha;
    console.log(`Base commit: ${baseTreeSha}`);

    // 2. Create tree with new/updated files
    const tree = pendingChanges.map(icon => ({
      path: `${svgPath}/${icon.name}.svg`,
      mode: '100644' as const,
      type: 'blob' as const,
      content: icon.content
    }));

    const { data: treeData } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree
    });
    console.log(`New tree created: ${treeData.sha}`);

    // 3. Create commit
    const { data: commitData } = await octokit.git.createCommit({
      owner,
      repo,
      message: `chore(icons): batch upload ${pendingChanges.length} icons via portal`,
      tree: treeData.sha,
      parents: [baseTreeSha]
    });
    console.log(`New commit created: ${commitData.sha}`);

    // 4. Create new branch and PR
    const timestamp = Date.now();
    const newBranch = `feat/update-icons-${timestamp}`;
    
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: commitData.sha
    });
    console.log(`New branch created: ${newBranch}`);

    const { data: prData } = await octokit.pulls.create({
      owner,
      repo,
      title: `chore(icons): update ${pendingChanges.length} icons`,
      head: newBranch,
      base: branch,
      body: `Batch update from Icons Portal\n- Updated icons: ${pendingChanges.map(i => i.name).join(', ')}`
    });
    console.log(`Pull request created: ${prData.html_url}`);

    // 5. Update Local DB status
    const updateStmt = db.prepare("UPDATE icons SET status = 'synced' WHERE name = ?");
    pendingChanges.forEach(icon => updateStmt.run(icon.name));

    ctx.body = { 
      success: true, 
      message: `Sync successful! PR created: ${prData.html_url}` 
    };
  } catch (err: any) {
    console.error('Sync API Error:', err.message);
    if (err.response) console.error('GitHub API Response:', err.response.data);
    ctx.status = 500;
    ctx.body = { error: 'Git sync failed: ' + err.message };
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
