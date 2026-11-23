import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import compression from "vite-plugin-compression";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import sharp from "sharp";
import { optimize as optimizeSvg } from "svgo";
import type { OutputBundle, OutputOptions } from "rollup";

function optimizeBundleAssets() {
  const rasterExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

  return {
    name: "optimize-bundle-assets",
    apply: "build",
    async generateBundle(_outputOptions: OutputOptions, bundle: OutputBundle) {
      const tasks = Object.entries(bundle).map(async ([fileName, chunk]) => {
        if (chunk.type !== "asset" || !fileName.startsWith("assets/")) {
          return;
        }

        const extension = path.extname(fileName).toLowerCase();
        if (extension === ".svg") {
          const source =
            typeof chunk.source === "string"
              ? chunk.source
              : Buffer.from(chunk.source).toString("utf8");
          try {
            const optimized = optimizeSvg(source, {
              multipass: true,
              plugins: ["preset-default", "removeDimensions"],
            });

            if (optimized.data.length < source.length) {
              chunk.source = optimized.data;
            }
          } catch {
            return;
          }
          return;
        }

        if (!rasterExtensions.has(extension)) {
          return;
        }

        const input = Buffer.isBuffer(chunk.source)
          ? chunk.source
          : Buffer.from(chunk.source);
        const image = sharp(input, { limitInputPixels: false });

        if (extension === ".png") {
          chunk.source = await image
            .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 8 })
            .toBuffer();
          return;
        }

        if (extension === ".jpg" || extension === ".jpeg") {
          chunk.source = await image
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();
          return;
        }

        if (extension === ".webp") {
          chunk.source = await image
            .webp({ quality: 82, effort: 6 })
            .toBuffer();
          return;
        }

        if (extension === ".avif") {
          chunk.source = await image
            .avif({ quality: 50, effort: 4 })
            .toBuffer();
        }
      });

      await Promise.all(tasks);
    },
  };
}
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      vue(),
      tailwindcss(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      compression({
        algorithm: "gzip",
        ext: ".gz",
        threshold: 10240,
        deleteOriginFile: false,
      }),
      optimizeBundleAssets(),
      {
        name: "strip-glsl-version",
        enforce: "pre",
        transform(code, id) {
          const cleanId = id.split("?")[0];
          if (/\.(glsl|vert|frag)$/.test(cleanId)) {
            return code.replace(/#version\s+300\s+es/g, "");
          }
        },
      },
    ],
    build: {
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1200,
      rolldownOptions: {
        onLog(level, log, defaultHandler) {
          if (log.code === "EVAL") {
            return;
          }

          defaultHandler(level, log);
        },
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("cesium")) {
              return "cesium";
            }

            if (id.includes("element-plus")) {
              return "element-plus";
            }

            if (id.includes("vue")) {
              return "vue";
            }

            if (id.includes("three")) {
              return "three";
            }
            if (id.includes("babylonjs")) {
              return "babylonjs";
            }

            return "vendor";
          },
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("cesium")) {
              return "cesium";
            }

            if (id.includes("element-plus")) {
              return "element-plus";
            }

            if (id.includes("vue")) {
              return "vue";
            }

            if (id.includes("three")) {
              return "three";
            }

            if (id.includes("babylonjs")) {
              return "babylonjs";
            }

            return "vendor";
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },
    server: {
      port: 7105,
      host: "0.0.0.0",
      cors: true,
      proxy: {
        "/api": {
          // 后端接口,可经 .env / .env.local 或环境变量 VITE_API_PROXY_URL 覆盖
          target: "http://192.168.51.198:18090",
          changeOrigin: true,
          // KB 文档上传 + Ollama embedding 是慢路径：10-50MB PDF 切 512 字块约
          // 1000-5000 chunks，Ollama qwen3-embedding 单 chunk 串行 100-500ms +
          // 冷加载 60s。生产走异步上传 + 轮询（见知识库上传控制器 deferred 注释），
          // 但本机/当前同步范式下上传必须能跑完，超时取 30min 兜底。
          timeout: 1_800_000,
          proxyTimeout: 1_800_000,
        },
      },
    },
  };
});
