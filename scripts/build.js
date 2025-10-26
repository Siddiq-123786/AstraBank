#!/usr/bin/env node

/**
 * Smart build script that automatically selects the correct Vite config
 * based on the deployment environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isReplit = process.env.REPL_ID !== undefined;
const configFile = isReplit ? 'vite.config.ts' : 'vite.config.production.ts';

console.log(`🔧 Detected environment: ${isReplit ? 'Replit' : 'Production (Digital Ocean)'}`);
console.log(`📦 Using config: ${configFile}`);

// Build server
console.log('\n🏗️  Building server...');
execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
  stdio: 'inherit'
});

// Build client with appropriate config
console.log('\n🎨 Building client...');
execSync(`vite build --config ${configFile}`, {
  stdio: 'inherit'
});

console.log('\n✅ Build complete!');
