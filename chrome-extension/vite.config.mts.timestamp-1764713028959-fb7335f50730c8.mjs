// vite.config.mts
import { resolve as resolve2 } from "node:path";
import { defineConfig, loadEnv } from "file:///C:/Users/thaku/browser%20ai/cosmos-ai/node_modules/.pnpm/vite@6.3.6_@types+node@22.18.8_jiti@1.21.7_terser@5.44.0_tsx@4.20.6_yaml@2.8.1/node_modules/vite/dist/node/index.js";
import libAssetsPlugin from "file:///C:/Users/thaku/browser%20ai/cosmos-ai/node_modules/.pnpm/@laynezh+vite-plugin-lib-assets@0.6.1_vite@5.4.20_@types+node@22.18.8_terser@5.44.0_/node_modules/@laynezh/vite-plugin-lib-assets/dist/index.js";

// utils/plugins/make-manifest-plugin.ts
import fs from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process2 from "node:process";
import { colorLog, ManifestParser } from "file:///C:/Users/thaku/browser%20ai/cosmos-ai/packages/dev-utils/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\thaku\\browser ai\\cosmos-ai\\chrome-extension\\utils\\plugins";
var rootDir = resolve(__vite_injected_original_dirname, "..", "..");
var refreshFile = resolve(__vite_injected_original_dirname, "..", "refresh.js");
var manifestFile = resolve(rootDir, "manifest.js");
var getManifestWithCacheBurst = () => {
  const withCacheBurst = (path) => `${path}?${Date.now().toString()}`;
  if (process2.platform === "win32") {
    return import(withCacheBurst(pathToFileURL(manifestFile).href));
  }
  return import(withCacheBurst(manifestFile));
};
function makeManifestPlugin(config) {
  function makeManifest(manifest, to) {
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to);
    }
    const manifestPath = resolve(to, "manifest.json");
    const isFirefox = process2.env.__FIREFOX__ === "true";
    const isDev2 = process2.env.__DEV__ === "true";
    if (isDev2) {
      addRefreshContentScript(manifest);
    }
    fs.writeFileSync(manifestPath, ManifestParser.convertManifestToString(manifest, isFirefox ? "firefox" : "chrome"));
    if (isDev2) {
      fs.copyFileSync(refreshFile, resolve(to, "refresh.js"));
    }
    colorLog(`Manifest file copy complete: ${manifestPath}`, "success");
  }
  return {
    name: "make-manifest",
    buildStart() {
      this.addWatchFile(manifestFile);
    },
    async writeBundle() {
      const outDir2 = config.outDir;
      const manifest = await getManifestWithCacheBurst();
      makeManifest(manifest.default, outDir2);
    }
  };
}
function addRefreshContentScript(manifest) {
  manifest.content_scripts = manifest.content_scripts || [];
  manifest.content_scripts.push({
    matches: ["http://*/*", "https://*/*", "<all_urls>"],
    js: ["refresh.js"]
    // for public's HMR(refresh) support
  });
}

// vite.config.mts
import { watchPublicPlugin, watchRebuildPlugin } from "file:///C:/Users/thaku/browser%20ai/cosmos-ai/packages/hmr/dist/index.js";
import { isDev, isProduction, watchOption } from "file:///C:/Users/thaku/browser%20ai/cosmos-ai/packages/vite-config/index.mjs";
var __vite_injected_original_dirname2 = "C:\\Users\\thaku\\browser ai\\cosmos-ai\\chrome-extension";
var rootDir2 = resolve2(__vite_injected_original_dirname2);
var srcDir = resolve2(rootDir2, "src");
var outDir = resolve2(rootDir2, "..", "dist");
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve2(rootDir2, ".."), "VITE_");
  return {
    resolve: {
      alias: {
        "@root": rootDir2,
        "@src": srcDir,
        "@assets": resolve2(srcDir, "assets")
      },
      conditions: ["browser", "module", "import", "default"],
      mainFields: ["browser", "module", "main"]
    },
    server: {
      // Restrict CORS to only allow localhost
      cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
      },
      host: "localhost",
      sourcemapIgnoreList: false
    },
    plugins: [
      libAssetsPlugin({
        outputPath: outDir
      }),
      watchPublicPlugin(),
      makeManifestPlugin({ outDir }),
      isDev && watchRebuildPlugin({ reload: true, id: "chrome-extension-hmr" })
    ],
    publicDir: resolve2(rootDir2, "public"),
    build: {
      lib: {
        formats: ["iife"],
        entry: resolve2(__vite_injected_original_dirname2, "src/background/index.ts"),
        name: "BackgroundScript",
        fileName: "background"
      },
      outDir,
      emptyOutDir: false,
      sourcemap: isDev,
      minify: isProduction,
      reportCompressedSize: isProduction,
      watch: watchOption,
      rollupOptions: {
        external: [
          "chrome"
          // 'chromium-bidi/lib/cjs/bidiMapper/BidiMapper.js'
        ]
      }
    },
    define: {
      "import.meta.env.DEV": isDev,
      "import.meta.env.VITE_POSTHOG_API_KEY": JSON.stringify(env.VITE_POSTHOG_API_KEY || process.env.VITE_POSTHOG_API_KEY || "")
    },
    envDir: "../",
    envPrefix: "VITE_"
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInV0aWxzL3BsdWdpbnMvbWFrZS1tYW5pZmVzdC1wbHVnaW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx0aGFrdVxcXFxicm93c2VyIGFpXFxcXGNvc21vcy1haVxcXFxjaHJvbWUtZXh0ZW5zaW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx0aGFrdVxcXFxicm93c2VyIGFpXFxcXGNvc21vcy1haVxcXFxjaHJvbWUtZXh0ZW5zaW9uXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdGhha3UvYnJvd3NlciUyMGFpL2Nvc21vcy1haS9jaHJvbWUtZXh0ZW5zaW9uL3ZpdGUuY29uZmlnLm10c1wiO2ltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFBsdWdpbk9wdGlvbiwgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgbGliQXNzZXRzUGx1Z2luIGZyb20gJ0BsYXluZXpoL3ZpdGUtcGx1Z2luLWxpYi1hc3NldHMnO1xuaW1wb3J0IG1ha2VNYW5pZmVzdFBsdWdpbiBmcm9tICcuL3V0aWxzL3BsdWdpbnMvbWFrZS1tYW5pZmVzdC1wbHVnaW4nO1xuaW1wb3J0IHsgd2F0Y2hQdWJsaWNQbHVnaW4sIHdhdGNoUmVidWlsZFBsdWdpbiB9IGZyb20gJ0BleHRlbnNpb24vaG1yJztcbmltcG9ydCB7IGlzRGV2LCBpc1Byb2R1Y3Rpb24sIHdhdGNoT3B0aW9uIH0gZnJvbSAnQGV4dGVuc2lvbi92aXRlLWNvbmZpZyc7XG5cbmNvbnN0IHJvb3REaXIgPSByZXNvbHZlKF9fZGlybmFtZSk7XG5jb25zdCBzcmNEaXIgPSByZXNvbHZlKHJvb3REaXIsICdzcmMnKTtcblxuY29uc3Qgb3V0RGlyID0gcmVzb2x2ZShyb290RGlyLCAnLi4nLCAnZGlzdCcpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIC8vIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gdGhlIHBhcmVudCBkaXJlY3RvcnlcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCByZXNvbHZlKHJvb3REaXIsICcuLicpLCAnVklURV8nKTtcbiAgXG4gIHJldHVybiB7XG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0Byb290Jzogcm9vdERpcixcbiAgICAgICdAc3JjJzogc3JjRGlyLFxuICAgICAgJ0Bhc3NldHMnOiByZXNvbHZlKHNyY0RpciwgJ2Fzc2V0cycpLFxuICAgIH0sXG4gICAgY29uZGl0aW9uczogWydicm93c2VyJywgJ21vZHVsZScsICdpbXBvcnQnLCAnZGVmYXVsdCddLFxuICAgIG1haW5GaWVsZHM6IFsnYnJvd3NlcicsICdtb2R1bGUnLCAnbWFpbiddXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIC8vIFJlc3RyaWN0IENPUlMgdG8gb25seSBhbGxvdyBsb2NhbGhvc3RcbiAgICBjb3JzOiB7XG4gICAgICBvcmlnaW46IFsnaHR0cDovL2xvY2FsaG9zdDo1MTczJywgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCddLFxuICAgICAgbWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJywgJ09QVElPTlMnXSxcbiAgICAgIGNyZWRlbnRpYWxzOiB0cnVlXG4gICAgfSxcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBzb3VyY2VtYXBJZ25vcmVMaXN0OiBmYWxzZSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIGxpYkFzc2V0c1BsdWdpbih7XG4gICAgICBvdXRwdXRQYXRoOiBvdXREaXIsXG4gICAgfSkgYXMgUGx1Z2luT3B0aW9uLFxuICAgIHdhdGNoUHVibGljUGx1Z2luKCksXG4gICAgbWFrZU1hbmlmZXN0UGx1Z2luKHsgb3V0RGlyIH0pLFxuICAgIGlzRGV2ICYmIHdhdGNoUmVidWlsZFBsdWdpbih7IHJlbG9hZDogdHJ1ZSwgaWQ6ICdjaHJvbWUtZXh0ZW5zaW9uLWhtcicgfSksXG4gIF0sXG4gIHB1YmxpY0RpcjogcmVzb2x2ZShyb290RGlyLCAncHVibGljJyksXG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBmb3JtYXRzOiBbJ2lpZmUnXSxcbiAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9iYWNrZ3JvdW5kL2luZGV4LnRzJyksXG4gICAgICBuYW1lOiAnQmFja2dyb3VuZFNjcmlwdCcsXG4gICAgICBmaWxlTmFtZTogJ2JhY2tncm91bmQnLFxuICAgIH0sXG4gICAgb3V0RGlyLFxuICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcbiAgICBzb3VyY2VtYXA6IGlzRGV2LFxuICAgIG1pbmlmeTogaXNQcm9kdWN0aW9uLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBpc1Byb2R1Y3Rpb24sXG4gICAgd2F0Y2g6IHdhdGNoT3B0aW9uLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgICdjaHJvbWUnLFxuICAgICAgICAvLyAnY2hyb21pdW0tYmlkaS9saWIvY2pzL2JpZGlNYXBwZXIvQmlkaU1hcHBlci5qcydcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcblxuICBkZWZpbmU6IHtcbiAgICAnaW1wb3J0Lm1ldGEuZW52LkRFVic6IGlzRGV2LFxuICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9QT1NUSE9HX0FQSV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9QT1NUSE9HX0FQSV9LRVkgfHwgcHJvY2Vzcy5lbnYuVklURV9QT1NUSE9HX0FQSV9LRVkgfHwgJycpLFxuICB9LFxuXG4gIGVudkRpcjogJy4uLycsXG4gIGVudlByZWZpeDogJ1ZJVEVfJyxcbiAgfTtcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx0aGFrdVxcXFxicm93c2VyIGFpXFxcXGNvc21vcy1haVxcXFxjaHJvbWUtZXh0ZW5zaW9uXFxcXHV0aWxzXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHRoYWt1XFxcXGJyb3dzZXIgYWlcXFxcY29zbW9zLWFpXFxcXGNocm9tZS1leHRlbnNpb25cXFxcdXRpbHNcXFxccGx1Z2luc1xcXFxtYWtlLW1hbmlmZXN0LXBsdWdpbi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdGhha3UvYnJvd3NlciUyMGFpL2Nvc21vcy1haS9jaHJvbWUtZXh0ZW5zaW9uL3V0aWxzL3BsdWdpbnMvbWFrZS1tYW5pZmVzdC1wbHVnaW4udHNcIjtpbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHBhdGhUb0ZpbGVVUkwgfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgY29sb3JMb2csIE1hbmlmZXN0UGFyc2VyIH0gZnJvbSAnQGV4dGVuc2lvbi9kZXYtdXRpbHMnO1xuaW1wb3J0IHR5cGUgeyBQbHVnaW5PcHRpb24gfSBmcm9tICd2aXRlJztcbmltcG9ydCB0eXBlIHsgTWFuaWZlc3QgfSBmcm9tICdAZXh0ZW5zaW9uL2Rldi11dGlscy9kaXN0L2xpYi9tYW5pZmVzdC1wYXJzZXIvdHlwZSc7XG5cbmNvbnN0IHJvb3REaXIgPSByZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJyk7XG5jb25zdCByZWZyZXNoRmlsZSA9IHJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAncmVmcmVzaC5qcycpO1xuY29uc3QgbWFuaWZlc3RGaWxlID0gcmVzb2x2ZShyb290RGlyLCAnbWFuaWZlc3QuanMnKTtcblxuY29uc3QgZ2V0TWFuaWZlc3RXaXRoQ2FjaGVCdXJzdCA9ICgpOiBQcm9taXNlPHsgZGVmYXVsdDogY2hyb21lLnJ1bnRpbWUuTWFuaWZlc3RWMyB9PiA9PiB7XG4gIGNvbnN0IHdpdGhDYWNoZUJ1cnN0ID0gKHBhdGg6IHN0cmluZykgPT4gYCR7cGF0aH0/JHtEYXRlLm5vdygpLnRvU3RyaW5nKCl9YDtcbiAgLyoqXG4gICAqIEluIFdpbmRvd3MsIGltcG9ydCgpIGRvZXNuJ3Qgd29yayB3aXRob3V0IGZpbGU6Ly8gcHJvdG9jb2wuXG4gICAqIFNvLCB3ZSBuZWVkIHRvIGNvbnZlcnQgcGF0aCB0byBmaWxlOi8vIHByb3RvY29sLiAodXJsLnBhdGhUb0ZpbGVVUkwpXG4gICAqL1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgIHJldHVybiBpbXBvcnQod2l0aENhY2hlQnVyc3QocGF0aFRvRmlsZVVSTChtYW5pZmVzdEZpbGUpLmhyZWYpKTtcbiAgfVxuXG4gIHJldHVybiBpbXBvcnQod2l0aENhY2hlQnVyc3QobWFuaWZlc3RGaWxlKSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYWtlTWFuaWZlc3RQbHVnaW4oY29uZmlnOiB7IG91dERpcjogc3RyaW5nIH0pOiBQbHVnaW5PcHRpb24ge1xuICBmdW5jdGlvbiBtYWtlTWFuaWZlc3QobWFuaWZlc3Q6IGNocm9tZS5ydW50aW1lLk1hbmlmZXN0VjMsIHRvOiBzdHJpbmcpIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmModG8pKSB7XG4gICAgICBmcy5ta2RpclN5bmModG8pO1xuICAgIH1cbiAgICBjb25zdCBtYW5pZmVzdFBhdGggPSByZXNvbHZlKHRvLCAnbWFuaWZlc3QuanNvbicpO1xuXG4gICAgY29uc3QgaXNGaXJlZm94ID0gcHJvY2Vzcy5lbnYuX19GSVJFRk9YX18gPT09ICd0cnVlJztcbiAgICBjb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Ll9fREVWX18gPT09ICd0cnVlJztcblxuICAgIGlmIChpc0Rldikge1xuICAgICAgYWRkUmVmcmVzaENvbnRlbnRTY3JpcHQobWFuaWZlc3QpO1xuICAgIH1cblxuICAgIGZzLndyaXRlRmlsZVN5bmMobWFuaWZlc3RQYXRoLCBNYW5pZmVzdFBhcnNlci5jb252ZXJ0TWFuaWZlc3RUb1N0cmluZyhtYW5pZmVzdCwgaXNGaXJlZm94ID8gJ2ZpcmVmb3gnIDogJ2Nocm9tZScpKTtcbiAgICBpZiAoaXNEZXYpIHtcbiAgICAgIGZzLmNvcHlGaWxlU3luYyhyZWZyZXNoRmlsZSwgcmVzb2x2ZSh0bywgJ3JlZnJlc2guanMnKSk7XG4gICAgfVxuXG4gICAgY29sb3JMb2coYE1hbmlmZXN0IGZpbGUgY29weSBjb21wbGV0ZTogJHttYW5pZmVzdFBhdGh9YCwgJ3N1Y2Nlc3MnKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ21ha2UtbWFuaWZlc3QnLFxuICAgIGJ1aWxkU3RhcnQoKSB7XG4gICAgICB0aGlzLmFkZFdhdGNoRmlsZShtYW5pZmVzdEZpbGUpO1xuICAgIH0sXG4gICAgYXN5bmMgd3JpdGVCdW5kbGUoKSB7XG4gICAgICBjb25zdCBvdXREaXIgPSBjb25maWcub3V0RGlyO1xuICAgICAgY29uc3QgbWFuaWZlc3QgPSBhd2FpdCBnZXRNYW5pZmVzdFdpdGhDYWNoZUJ1cnN0KCk7XG4gICAgICBtYWtlTWFuaWZlc3QobWFuaWZlc3QuZGVmYXVsdCwgb3V0RGlyKTtcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBhZGRSZWZyZXNoQ29udGVudFNjcmlwdChtYW5pZmVzdDogTWFuaWZlc3QpIHtcbiAgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzID0gbWFuaWZlc3QuY29udGVudF9zY3JpcHRzIHx8IFtdO1xuICBtYW5pZmVzdC5jb250ZW50X3NjcmlwdHMucHVzaCh7XG4gICAgbWF0Y2hlczogWydodHRwOi8vKi8qJywgJ2h0dHBzOi8vKi8qJywgJzxhbGxfdXJscz4nXSxcbiAgICBqczogWydyZWZyZXNoLmpzJ10sIC8vIGZvciBwdWJsaWMncyBITVIocmVmcmVzaCkgc3VwcG9ydFxuICB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFYsU0FBUyxXQUFBQSxnQkFBZTtBQUN0WCxTQUFTLGNBQWlDLGVBQWU7QUFDekQsT0FBTyxxQkFBcUI7OztBQ0ZnWSxPQUFPLFFBQVE7QUFDM2EsU0FBUyxlQUFlO0FBQ3hCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU9DLGNBQWE7QUFDcEIsU0FBUyxVQUFVLHNCQUFzQjtBQUp6QyxJQUFNLG1DQUFtQztBQVF6QyxJQUFNLFVBQVUsUUFBUSxrQ0FBVyxNQUFNLElBQUk7QUFDN0MsSUFBTSxjQUFjLFFBQVEsa0NBQVcsTUFBTSxZQUFZO0FBQ3pELElBQU0sZUFBZSxRQUFRLFNBQVMsYUFBYTtBQUVuRCxJQUFNLDRCQUE0QixNQUF1RDtBQUN2RixRQUFNLGlCQUFpQixDQUFDLFNBQWlCLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLFNBQVMsQ0FBQztBQUt6RSxNQUFJQyxTQUFRLGFBQWEsU0FBUztBQUNoQyxXQUFPLE9BQU8sZUFBZSxjQUFjLFlBQVksRUFBRSxJQUFJO0FBQUEsRUFDL0Q7QUFFQSxTQUFPLE9BQU8sZUFBZSxZQUFZO0FBQzNDO0FBRWUsU0FBUixtQkFBb0MsUUFBMEM7QUFDbkYsV0FBUyxhQUFhLFVBQXFDLElBQVk7QUFDckUsUUFBSSxDQUFDLEdBQUcsV0FBVyxFQUFFLEdBQUc7QUFDdEIsU0FBRyxVQUFVLEVBQUU7QUFBQSxJQUNqQjtBQUNBLFVBQU0sZUFBZSxRQUFRLElBQUksZUFBZTtBQUVoRCxVQUFNLFlBQVlBLFNBQVEsSUFBSSxnQkFBZ0I7QUFDOUMsVUFBTUMsU0FBUUQsU0FBUSxJQUFJLFlBQVk7QUFFdEMsUUFBSUMsUUFBTztBQUNULDhCQUF3QixRQUFRO0FBQUEsSUFDbEM7QUFFQSxPQUFHLGNBQWMsY0FBYyxlQUFlLHdCQUF3QixVQUFVLFlBQVksWUFBWSxRQUFRLENBQUM7QUFDakgsUUFBSUEsUUFBTztBQUNULFNBQUcsYUFBYSxhQUFhLFFBQVEsSUFBSSxZQUFZLENBQUM7QUFBQSxJQUN4RDtBQUVBLGFBQVMsZ0NBQWdDLFlBQVksSUFBSSxTQUFTO0FBQUEsRUFDcEU7QUFFQSxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixhQUFhO0FBQ1gsV0FBSyxhQUFhLFlBQVk7QUFBQSxJQUNoQztBQUFBLElBQ0EsTUFBTSxjQUFjO0FBQ2xCLFlBQU1DLFVBQVMsT0FBTztBQUN0QixZQUFNLFdBQVcsTUFBTSwwQkFBMEI7QUFDakQsbUJBQWEsU0FBUyxTQUFTQSxPQUFNO0FBQUEsSUFDdkM7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxTQUFTLHdCQUF3QixVQUFvQjtBQUNuRCxXQUFTLGtCQUFrQixTQUFTLG1CQUFtQixDQUFDO0FBQ3hELFdBQVMsZ0JBQWdCLEtBQUs7QUFBQSxJQUM1QixTQUFTLENBQUMsY0FBYyxlQUFlLFlBQVk7QUFBQSxJQUNuRCxJQUFJLENBQUMsWUFBWTtBQUFBO0FBQUEsRUFDbkIsQ0FBQztBQUNIOzs7QUQ5REEsU0FBUyxtQkFBbUIsMEJBQTBCO0FBQ3RELFNBQVMsT0FBTyxjQUFjLG1CQUFtQjtBQUxqRCxJQUFNQyxvQ0FBbUM7QUFPekMsSUFBTUMsV0FBVUMsU0FBUUMsaUNBQVM7QUFDakMsSUFBTSxTQUFTRCxTQUFRRCxVQUFTLEtBQUs7QUFFckMsSUFBTSxTQUFTQyxTQUFRRCxVQUFTLE1BQU0sTUFBTTtBQUU1QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNQyxTQUFRRCxVQUFTLElBQUksR0FBRyxPQUFPO0FBRXpELFNBQU87QUFBQSxJQUNQLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLFNBQVNBO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixXQUFXQyxTQUFRLFFBQVEsUUFBUTtBQUFBLE1BQ3JDO0FBQUEsTUFDQSxZQUFZLENBQUMsV0FBVyxVQUFVLFVBQVUsU0FBUztBQUFBLE1BQ3JELFlBQVksQ0FBQyxXQUFXLFVBQVUsTUFBTTtBQUFBLElBQzFDO0FBQUEsSUFDQSxRQUFRO0FBQUE7QUFBQSxNQUVOLE1BQU07QUFBQSxRQUNKLFFBQVEsQ0FBQyx5QkFBeUIsdUJBQXVCO0FBQUEsUUFDekQsU0FBUyxDQUFDLE9BQU8sUUFBUSxPQUFPLFVBQVUsU0FBUztBQUFBLFFBQ25ELGFBQWE7QUFBQSxNQUNmO0FBQUEsTUFDQSxNQUFNO0FBQUEsTUFDTixxQkFBcUI7QUFBQSxJQUN2QjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsZ0JBQWdCO0FBQUEsUUFDZCxZQUFZO0FBQUEsTUFDZCxDQUFDO0FBQUEsTUFDRCxrQkFBa0I7QUFBQSxNQUNsQixtQkFBbUIsRUFBRSxPQUFPLENBQUM7QUFBQSxNQUM3QixTQUFTLG1CQUFtQixFQUFFLFFBQVEsTUFBTSxJQUFJLHVCQUF1QixDQUFDO0FBQUEsSUFDMUU7QUFBQSxJQUNBLFdBQVdBLFNBQVFELFVBQVMsUUFBUTtBQUFBLElBQ3BDLE9BQU87QUFBQSxNQUNMLEtBQUs7QUFBQSxRQUNILFNBQVMsQ0FBQyxNQUFNO0FBQUEsUUFDaEIsT0FBT0MsU0FBUUMsbUNBQVcseUJBQXlCO0FBQUEsUUFDbkQsTUFBTTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxNQUNBO0FBQUEsTUFDQSxhQUFhO0FBQUEsTUFDYixXQUFXO0FBQUEsTUFDWCxRQUFRO0FBQUEsTUFDUixzQkFBc0I7QUFBQSxNQUN0QixPQUFPO0FBQUEsTUFDUCxlQUFlO0FBQUEsUUFDYixVQUFVO0FBQUEsVUFDUjtBQUFBO0FBQUEsUUFFRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxRQUFRO0FBQUEsTUFDTix1QkFBdUI7QUFBQSxNQUN2Qix3Q0FBd0MsS0FBSyxVQUFVLElBQUksd0JBQXdCLFFBQVEsSUFBSSx3QkFBd0IsRUFBRTtBQUFBLElBQzNIO0FBQUEsSUFFQSxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsRUFDWDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInJlc29sdmUiLCAicHJvY2VzcyIsICJwcm9jZXNzIiwgImlzRGV2IiwgIm91dERpciIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSIsICJyb290RGlyIiwgInJlc29sdmUiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiXQp9Cg==
