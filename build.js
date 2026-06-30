const fs = require('fs');
const path = require('path');

// 1. Create dist folder if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
  console.log('Created dist/ directory.');
}

// 2. Files to copy to dist
const filesToCopy = ['index.html', 'style.css', 'db.js', 'app.js'];
filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to dist/`);
  } else {
    console.error(`Error: Source file ${file} does not exist.`);
    process.exit(1);
  }
});

// 3. Generate config.js dynamically from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const configContent = `// Generated dynamically during deployment on Vercel
window.SUPABASE_CONFIG = ${supabaseUrl && supabaseAnonKey ? JSON.stringify({
  url: supabaseUrl,
  anonKey: supabaseAnonKey
}, null, 2) : 'null'};
`;

fs.writeFileSync(path.join(distDir, 'config.js'), configContent);
console.log('Generated config.js with Supabase environmental variables.');
console.log('Build completed successfully.');
