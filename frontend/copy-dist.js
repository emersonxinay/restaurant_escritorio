import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');
const destPath = path.join(process.cwd(), '..', 'backend', 'public');

console.log('Copying frontend dist to backend public folder...');

if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
}

// Copy dist contents to backend/public
try {
    fs.cpSync(distPath, destPath, { recursive: true });
    console.log('Successfully copied frontend to backend.');
} catch (err) {
    console.error('Error copying files:', err);
    process.exit(1);
}
