import esbuild from "esbuild";
import process from "node:process";
import builtins from "builtin-modules";
import { existsSync } from "node:fs";
import {
  cp,
  mkdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";

interface NpmPackage {
  name: string;
}

export enum BuildMode {
  Development,
  Production
}

export default async function buildPlugin({
  mode,
  obsidianConfigDir = process.env["OBSIDIAN_CONFIG_DIR"]
}:
{
  mode: BuildMode
  obsidianConfigDir?: string
}): Promise<void> {
  const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

  const isProductionBuild = mode === BuildMode.Production;

  const distDir = isProductionBuild ? "dist/build" : "dist/dev";
  if (existsSync(distDir)) {
    await rm(distDir, { recursive: true });
  }
  await mkdir(distDir, { recursive: true });

  const distFileNames = ["manifest.json", "styles.css"];
  if (!isProductionBuild) {
    await writeFile(`${distDir}/.hotreload`, "", "utf-8");
  }

  for (const fileName of distFileNames) {
    const localFile = `./${fileName}`;
    const distFile = `${distDir}/${fileName}`;

    if (existsSync(localFile)) {
      await cp(localFile, distFile);
    }
  }

  const context = await esbuild.context({
    banner: {
      js: banner,
    },
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: [
      "obsidian",
      "electron",
      "@codemirror/autocomplete",
      "@codemirror/collab",
      "@codemirror/commands",
      "@codemirror/language",
      "@codemirror/lint",
      "@codemirror/search",
      "@codemirror/state",
      "@codemirror/view",
      "@lezer/common",
      "@lezer/highlight",
      "@lezer/lr",
      ...builtins],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: isProductionBuild ? false : "inline",
    treeShaking: true,
    outfile: `${distDir}/main.js`,
    plugins: [
      {
        name: "copy-to-obsidian-plugins-folder",
        setup: (build): void => {
          build.onEnd(async () => {
            if (isProductionBuild || !obsidianConfigDir) {
              return;
            }

            const npmPackage = JSON.parse(await readFile("./package.json", "utf8")) as NpmPackage;
            const pluginName = npmPackage.name;
            const pluginDir = `${obsidianConfigDir}/plugins/${pluginName}`;
            if (!existsSync(pluginDir)) {
              await mkdir(pluginDir);
            }

            await cp(distDir, pluginDir, { recursive: true });
          });
        }
      }
    ]
  });

  if (isProductionBuild) {
    await context.rebuild();
  } else {
    await context.watch();
  }
}
