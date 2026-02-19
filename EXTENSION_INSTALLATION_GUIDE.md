# 🚀 Cosmos AI Extension - Download & Install Guide

## Quick Installation (2 Minutes)

### Step 1: Download the Extension
- Visit your website and click **"Download Cosmos AI Extension"**
- You'll get a ZIP file: `cosmos-ai-extension-YYYY-MM-DD.zip`

### Step 2: Extract the ZIP
- Right-click on the ZIP file
- Select **"Extract All"** (Windows) or double-click (Mac)
- Remember the extracted folder location

### Step 3: Load in Chrome
1. Open Chrome and go to **`chrome://extensions/`**
2. Look for **"Developer mode"** toggle in the top-right corner
3. **Turn it ON** (it will turn blue)
4. Click **"Load unpacked"** button that appears
5. Select the extracted folder containing the extension
6. ✅ **Done!** You'll see Cosmos AI Extension is now installed

### Step 4: Start Using
- Look for the Cosmos AI icon in your Chrome toolbar
- Click it to open the extension panel
- Configure your API keys in Settings
- Start using AI features!

---

## Troubleshooting

### "File not found" error?
- Make sure you extracted the ZIP file completely
- Check that you selected the correct folder (should contain `manifest.json`)

### Extension not showing?
- Refresh the extension page (`chrome://extensions/`)
- Restart Chrome completely

### Want to uninstall?
- Go to `chrome://extensions/`
- Find Cosmos AI Extension
- Click the **Remove** button

---

## For Developers

### Build the Extension Locally
```bash
# Install dependencies (first time only)
pnpm install

# Build the extension
pnpm build:extension

# Create downloadable ZIP
pnpm package:extension
```

The ZIP file will be created in the `releases/` folder.

### Development Mode
```bash
# Start watching for changes
pnpm dev
```

### Update Version
Edit [chrome-extension/package.json](chrome-extension/package.json) and update the version number before building.

---

## Need Help?
- GitHub Issues: https://github.com/aayushsoam/cosmos-ai/issues
- Documentation: [See docs](../docs/)
- Contact: Support available on project page

---

**Happy automating with Cosmos AI! 🎉**
