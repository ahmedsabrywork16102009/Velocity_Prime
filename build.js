import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

const isDev = process.argv.includes('--watch');

// ── esbuild entry points ─────────────────────────────────────
const entries = [
    { entryPoints: ['src/background/background.js'], outfile: 'dist/background/background.js', format: 'iife' },
    { entryPoints: ['src/content/isolated/index.js'], outfile: 'dist/content/isolated.js',     format: 'iife' },
    { entryPoints: ['src/content/main/index.js'],     outfile: 'dist/content/main.js',         format: 'iife' },
    { entryPoints: ['src/popup/js/main.js'],          outfile: 'dist/popup/main.js',            format: 'esm'  },
];

const common = {
    bundle:    true,
    platform:  'browser',
    target:    ['chrome108'],
    minify:    !isDev,
    sourcemap: isDev ? 'inline' : false,
    logLevel:  'info',
};

// ── Static file helpers ──────────────────────────────────────
function copyDir(src, dest) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
        const s = join(src, entry), d = join(dest, entry);
        statSync(s).isDirectory() ? copyDir(s, d) : copyFileSync(s, d);
    }
}

function buildStaticFiles() {
    // Icons
    copyDir('assets', 'dist/assets');

    // CSS
    copyDir('src/popup/css', 'dist/popup/css');

    // popup.html — update script src to sibling main.js
    let html = readFileSync('src/popup/popup.html', 'utf-8');
    html = html.replace('src="js/main.js"', 'src="main.js"');
    mkdirSync('dist/popup', { recursive: true });
    writeFileSync('dist/popup/popup.html', html);

    // dist/manifest.json — clean paths, no "dist/" prefix
    writeFileSync('dist/manifest.json', JSON.stringify({
        manifest_version: 3,
        name: 'Velocity Prime',
        version: '2.0.0',
        description: 'Professional 60FPS Video Speed Controller with Anti-Cheat Bypass',
        permissions: ['storage', 'scripting', 'activeTab', 'nativeMessaging', 'notifications'],
        background: { service_worker: 'background/background.js' },
        action: {
            default_popup: 'popup/popup.html',
            default_icon: { '16': 'assets/icons/icon16.png', '48': 'assets/icons/icon48.png', '128': 'assets/icons/icon128.png' }
        },
        content_scripts: [
            { matches: ['<all_urls>'], js: ['content/isolated.js'], all_frames: true, match_about_blank: true, run_at: 'document_start', world: 'ISOLATED' },
            { matches: ['<all_urls>'], js: ['content/main.js'],     all_frames: true, match_about_blank: true, run_at: 'document_start', world: 'MAIN'     }
        ],
        icons: { '16': 'assets/icons/icon16.png', '48': 'assets/icons/icon48.png', '128': 'assets/icons/icon128.png' },
        host_permissions: ['<all_urls>', 'http://127.0.0.1:9527/*']
    }, null, 2));

    console.log('📦  Static files copied → dist/');
}

// ── Main ─────────────────────────────────────────────────────
buildStaticFiles();

if (isDev) {
    const contexts = await Promise.all(entries.map(e => esbuild.context({ ...common, ...e })));
    await Promise.all(contexts.map(ctx => ctx.watch()));
    console.log('👀  Watching src/ for changes...\n');
} else {
    await Promise.all(entries.map(e => esbuild.build({ ...common, ...e })));
    console.log('✅  Production build complete → dist/\n');
}
