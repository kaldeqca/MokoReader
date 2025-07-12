// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
// --- Add all necessary dependencies directly to main.js ---
const JSZip = require('jszip');
const sharp = require('sharp');
const xml2js = require('xml2js');

// --- PATH CONFIGURATION ---
// This correctly determines the base path for a portable app.
let userDataPath;
if (app.isPackaged) {
  // When packaged, the data (Library, previews) is relative to the EXE.
  userDataPath = path.dirname(app.getPath('exe'));
} else {
  // In development, it's relative to the project root.
  userDataPath = __dirname;
}

const userLibraryPath = path.join(userDataPath, 'Library');
if (!fs.existsSync(userLibraryPath)) {
    console.log(`Library folder not found, creating it for the user at: ${userLibraryPath}`);
    fs.mkdirSync(userLibraryPath, { recursive: true });
}
console.log(`User data path is set to: ${userDataPath}`);

// --- CORE LIBRARY GENERATION LOGIC (Moved from generate-library.js) ---

const LIBRARY_DIR = path.join(userDataPath, 'Library');
const PREVIEWS_DIR = path.join(userDataPath, 'previews');
const OUTPUT_JS_PATH = path.join(userDataPath, 'library-data.js');
const THUMBNAIL_WIDTH = 300;

function sanitizeFilename(filename) {
    return filename
        .replace(/\s+/g, '-')
        .replace(/[\[\]\(\)'":,]/g, '');
}

async function getEpubCover(fileBuffer) {
    const zip = await JSZip.loadAsync(fileBuffer);
    const containerFile = zip.file("META-INF/container.xml");
    if (!containerFile) throw new Error('META-INF/container.xml not found');
    const containerContent = await containerFile.async('string');
    const containerJson = await xml2js.parseStringPromise(containerContent);
    const opfPath = containerJson.container.rootfiles[0].rootfile[0].$['full-path'];
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error(`package.opf not found at path: ${opfPath}`);
    const opfContent = await opfFile.async('string');
    const opfJson = await xml2js.parseStringPromise(opfContent);
    const manifest = opfJson.package.manifest[0].item;
    const metadata = opfJson.package.metadata[0];
    let coverId = metadata['meta']?.find(m => m.$.name === 'cover')?.$.content;
    let coverItem = manifest.find(item => item.$.id === coverId);
    if (!coverItem) {
        coverItem = manifest.find(item => item.$.properties?.includes('cover-image'));
    }
    if (!coverItem) return null;
    const coverHref = coverItem.$.href;
    const coverPath = path.join(path.dirname(opfPath), coverHref).replace(/\\/g, '/');
    const coverFile = zip.file(coverPath);
    return coverFile ? coverFile.async('uint8array') : null;
}

async function getCbzCover(fileBuffer) {
    const zip = await JSZip.loadAsync(fileBuffer);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = Object.values(zip.files)
        .filter(file => !file.dir && imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext)))
        .sort((a, b) => a.name.localeCompare(b.name));
    return imageFiles.length > 0 ? imageFiles[0].async('uint8array') : null;
}

async function generatePreview(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.parse(filePath).name;
    const sanitizedName = sanitizeFilename(fileName);
    const previewFileName = `${sanitizedName}.jpg`;
    const previewPath = path.join(PREVIEWS_DIR, previewFileName);
    const relativePreviewPath = `previews/${previewFileName}`;

    if (fs.existsSync(previewPath)) {
        return relativePreviewPath;
    }

    let imageBuffer;
    try {
        if (extension === '.epub') {
            imageBuffer = await getEpubCover(fileBuffer);
        } else if (extension === '.cbz' || extension === '.zip') {
            imageBuffer = await getCbzCover(fileBuffer);
        }

        if (imageBuffer) {
            await sharp(imageBuffer)
                .resize(THUMBNAIL_WIDTH)
                .jpeg({ quality: 80 })
                .toFile(previewPath);
            console.log(`--> Generated preview for: ${path.basename(filePath)}`);
            return relativePreviewPath;
        }
    } catch (err) {
        console.error(`Could not process cover for ${path.basename(filePath)}: ${err.message}`);
    }
    return null;
}

async function scanDirectory(dirPath) {
    const node = { name: path.basename(dirPath), type: 'folder', items: [], previews: [] };
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        if (file.startsWith('.')) continue;
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            node.items.push(await scanDirectory(fullPath));
        } else {
            const previewPath = await generatePreview(fullPath);
            const relativePath = path.relative(userDataPath, fullPath).replace(/\\/g, '/');
            
            node.items.push({
                name: path.parse(file).name,
                type: 'file',
                path: relativePath,
                preview_image: previewPath || ''
            });
        }
    }
    const childFilePreviews = node.items.map(item => item.type === 'file' ? item.preview_image : (item.previews ? item.previews[0] : null)).filter(p => p).slice(0, 4);
    node.previews = childFilePreviews;
    return node;
}


/**
 * The main function to refresh the library. It is now part of main.js.
 */
async function runLibraryRefresh() {
  console.log('Starting library refresh from within the main process...');

  if (!fs.existsSync(PREVIEWS_DIR)) {
      fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
  }

  try {
      if (!fs.existsSync(LIBRARY_DIR)) {
          fs.writeFileSync(OUTPUT_JS_PATH, 'const libraryData = { "name": "Library", "type": "folder", "items": [] };');
          console.log("Library folder not found. Created empty library-data.js.");
          return;
      }
      const libraryStructure = await scanDirectory(LIBRARY_DIR);
      const jsonContent = JSON.stringify(libraryStructure, null, 2);
      const jsContent = `const libraryData = ${jsonContent};`;
      fs.writeFileSync(OUTPUT_JS_PATH, jsContent);
      const previewCount = fs.readdirSync(PREVIEWS_DIR).length;
      console.log(`\n✅ Library refresh complete. Found ${previewCount} previews.`);
  } catch (error) {
      console.error('Error during library generation:', error);
      throw error; // Propagate error to be caught by the caller
  }
}


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false 
    }
  });

  mainWindow.loadFile('index.html');
}

// --- IPC HANDLERS ---

ipcMain.handle('get-user-data-path', () => {
  return userDataPath;
});

ipcMain.handle('refresh-library', async () => {
  console.log('Received manual refresh request from renderer...');
  try {
    await runLibraryRefresh();
    return { success: true, message: 'Library refreshed successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to generate library.', error: error.message };
  }
});


// --- ELECTRON APP LIFECYCLE ---

app.whenReady().then(async () => {
  console.log('App is ready. Starting initial library refresh...');
  try {
    await runLibraryRefresh();
  } catch (error) {
    console.error("Initial library refresh failed:", error.message);
    // You might want to show a dialog to the user here.
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});