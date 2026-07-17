const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Vercel Deployment Script
 * 
 * Usage: node deploy.js [--env=production|preview]
 * 
 * This script:
 * 1. Pulls latest environment variables from .env
 * 2. Builds the Next.js project
 * 3. Deploys to Vercel
 * 4. Updates domain aliases if needed
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'fachschmiede';

function deploy() {
  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN not set in environment');
    console.log('   Get it from: https://vercel.com/account/tokens');
    process.exit(1);
  }

  const env = process.argv.find(a => a.startsWith('--env='))?.split('=')[1] || 'production';
  
  console.log(`🚀 Deploying FachSchmiede to ${env}...`);
  
  try {
    // Build
    console.log('📦 Building...');
    execSync('npm run build', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit' 
    });
    
    // Deploy
    console.log('🌐 Deploying to Vercel...');
    const deployCmd = env === 'production' 
      ? `vercel --prod --token=${VERCEL_TOKEN}`
      : `vercel --token=${VERCEL_TOKEN}`;
    
    execSync(deployCmd, { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit' 
    });
    
    console.log('✅ Deployment complete!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

function deployBulk(pages) {
  // For bulk deployment of generated pages
  console.log(`🚀 Deploying ${pages.length} generated pages...`);
  
  // Write pages to app's data directory
  const dataDir = path.join(__dirname, '..', 'src', 'data', 'generated');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(dataDir, 'pages.json'),
    JSON.stringify(pages, null, 2)
  );
  
  // Trigger deployment
  deploy();
}

if (require.main === module) {
  deploy();
}

module.exports = { deploy, deployBulk };
