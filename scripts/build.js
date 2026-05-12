const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const extensionDir = path.join(__dirname, '../extension');
const distDir = path.join(__dirname, '../dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Function to zip a directory
function zipDirectory(sourceDir, outPath, modifyManifest = null) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    archive
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());

    // Read all files in the extension directory
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      // Ignore macOS hidden files
      if (file === '.DS_Store') continue;

      const filePath = path.join(sourceDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        archive.directory(filePath, file);
      } else {
        if (file === 'manifest.json' && modifyManifest) {
          // Modify manifest.json if a callback is provided
          const manifestContent = fs.readFileSync(filePath, 'utf8');
          const manifestObj = JSON.parse(manifestContent);
          const newManifestObj = modifyManifest(manifestObj);
          archive.append(JSON.stringify(newManifestObj, null, 2), { name: 'manifest.json' });
        } else {
          archive.file(filePath, { name: file });
        }
      }
    }

    archive.finalize();
  });
}

async function build() {
  console.log('Starting build...');

  // Get version from base manifest
  const manifestPath = path.join(extensionDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version;

  // 1. Build Chrome/Edge (no modification)
  console.log('Building for Chrome/Edge...');
  await zipDirectory(extensionDir, path.join(distDir, `chrome-v${version}.zip`));
  
  // Create a copy for Edge specifically (though it's the exact same file)
  fs.copyFileSync(
    path.join(distDir, `chrome-v${version}.zip`), 
    path.join(distDir, `edge-v${version}.zip`)
  );

  // 2. Build Firefox (modify manifest to add browser_specific_settings)
  console.log('Building for Firefox...');
  await zipDirectory(extensionDir, path.join(distDir, `firefox-v${version}.zip`), (manifestObj) => {
    manifestObj.browser_specific_settings = {
      gecko: {
        // Replace this with your actual Firefox add-on ID once generated/assigned by AMO.
        // Or keep a domain-based generic ID if you haven't uploaded yet.
        id: "timestamp-injector-for-gemini@example.com",
        strict_min_version: "109.0",
        data_collection_permissions: {
          required: ["none"]
        }
      }
    };
    return manifestObj;
  });

  console.log('Build complete! Zip files are in the dist/ folder.');
}

build().catch(console.error);
