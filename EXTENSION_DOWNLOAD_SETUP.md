# 📦 Extension Download Setup - Complete Guide

## Kya Setup Kiya Gaya?

### 1. **ZIP Creation Script**
File: `scripts/create-extension-zip.js`
- Extension ko build karai
- Production-ready ZIP file banai
- Automatically `releases/` folder mein save kare

### 2. **npm Scripts Added**
```bash
# Extension build karo
pnpm build:extension

# ZIP file banao (full process)
pnpm package:extension
```

### 3. **GitHub Actions Workflow**
File: `.github/workflows/build-extension.yml`
- Har tag par automatically build & release
- GitHub Releases mein ZIP upload hota hai
- Users directly download kar sakte hain

### 4. **Download Page**
File: `DOWNLOAD_PAGE.html`
- Beautiful UI with installation steps
- FAQ section
- Download button

### 5. **Installation Guide**
File: `EXTENSION_INSTALLATION_GUIDE.md`
- Complete step-by-step guide
- Troubleshooting tips
- Developer instructions

---

## 🚀 Local Mein ZIP Kaise Banao?

### Option 1: Script Se (Recommended)
```bash
cd cosmos-ai
pnpm install                    # First time only
pnpm package:extension          # ZIP banao
```

ZIP file `releases/` folder mein create hoga ✅

### Option 2: Manual
```bash
# Extension build karo
cd chrome-extension
pnpm install
pnpm build

# dist folder se ZIP banao (manually)
cd ..
zip -r cosmos-ai-extension.zip dist/
```

---

## 📤 GitHub Par Release Kaise Banao?

### Automatic (Recommended):
```bash
# Version bump karo
npm version minor

# Tag create karo
git tag -a v0.2.0 -m "Release v0.2.0"

# Push karo
git push origin main
git push origin v0.2.0
```

GitHub Actions automatically:
✅ Build karai  
✅ ZIP create karai  
✅ Release banai  
✅ Users download kar sakte hain

---

## 🌐 Website Par Download Link

### GitHub Releases Se:
```html
<a href="https://github.com/aayushsoam/cosmos-ai/releases/latest/download/cosmos-ai-extension.zip">
  Download Latest Version
</a>
```

### Apne Server Se:
```html
<a href="/releases/cosmos-ai-extension.zip">
  Download Latest Version
</a>
```

---

## ✅ User Installation Flow

1. **Download** → ZIP file download ho
2. **Extract** → User extract kare
3. **Open Chrome** → `chrome://extensions/`
4. **Developer Mode ON** → Toggle enable kare
5. **Load Unpacked** → Extracted folder select kare
6. **Done!** → Extension ready to use

---

## 📋 Checklist

- ✅ ZIP creation script ready
- ✅ npm scripts added
- ✅ GitHub Actions workflow ready
- ✅ Download page created
- ✅ Installation guide ready
- ⏳ Website par DOWNLOAD_PAGE.html integrate karo
- ⏳ GitHub par tag push karo release ke liye

---

## 🔄 Next Steps

1. **Apne website par** `DOWNLOAD_PAGE.html` integrate karo
2. **Download link update** karo (GitHub URL ya apna server URL)
3. **Version test** karo local mein: `pnpm package:extension`
4. **GitHub par push** karo aur tag create karo release ke liye
5. **Users ko download link** share karo!

---

**🎉 Ab users directly website se download kar ke Chrome mein load kar sakte hain!**
