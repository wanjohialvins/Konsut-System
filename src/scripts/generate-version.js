
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target: public/version.json
const publicDir = path.resolve(__dirname, '../../public');
const versionFile = path.join(publicDir, 'version.json');

const versionData = {
    version: Date.now().toString(),
    buildDate: new Date().toISOString()
};

fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));

console.log(`✅ Version file generated at ${versionFile}`);
console.log(`   Version: ${versionData.version}`);
