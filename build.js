/* eslint-disable */
const esbuild = require("esbuild");
const chokidar = require("chokidar");
const { debounce } = require("lodash");
const copyDir = require("copy-dir");
const fs = require("fs");
const path = require("path");

const package = require("./package.json");

function ensureFolder(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

function deleteFolder(path) {
    if (fs.existsSync(path)) {
        fs.rmSync(path, {recursive: true});
    }
}

function readJson(path) {
    return JSON.parse(fs.readFileSync(path, "utf-8"));
}

async function main(dev) {
    const buildDir = path.join(process.cwd(), "builds");
    const distDir = path.join(process.cwd(), "dist");
    const buildVersionDir = path.join(buildDir, `${package.name}-v${package.version}`.replace(/ /g, "-"));
    const fromAssetsDir = path.join(process.cwd(), "assets");
    const toAssetsDir = path.join(buildVersionDir, "assets");
    const manifestTemplateLocation = path.join(process.cwd(), "manifest.template.json");
    const userScriptTemplateLocation = path.join(process.cwd(), "user-script.template.js");
    const userScriptOutput = path.join(distDir, "user-script.user.js");
    const manifestLocation = path.join(buildVersionDir, "manifest.json");

    const scriptInput = path.join(process.cwd(), "src", "index.ts");
    const scriptOutput = path.join(buildVersionDir, "assets", "scripts",  "content.js");
    
    deleteFolder(distDir);
    ensureFolder(buildDir);
    ensureFolder(distDir);
    deleteFolder(buildVersionDir);
    ensureFolder(buildVersionDir);
    copyDir.sync(fromAssetsDir, toAssetsDir);

    const common = {
        entryPoints: [scriptInput],
        bundle: true,
        minify: !dev,
        platform: "browser",
    }

    await esbuild.build({
        ...common,
        sourcemap: !dev,
        define: {
            DEV: JSON.stringify(dev),
            ENVIRONMENT: JSON.stringify("browser-extension")
        },
        outfile: scriptOutput,
    });

    const manifest = readJson(manifestTemplateLocation);
    manifest.version = package.version;
    fs.writeFileSync(manifestLocation, JSON.stringify(manifest))

  await esbuild.build({
        ...common,
        define: {
            DEV: JSON.stringify(dev),
            ENVIRONMENT: JSON.stringify("user-script")
        },
        outfile: userScriptOutput,
    });

    const code = fs.readFileSync(userScriptOutput, "utf-8");
    let template = fs.readFileSync(userScriptTemplateLocation, "utf-8");
    const date = new Date();
    const version = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${(date.getDate() + 1).toString().padStart(2, "0")}`;
    template = template.replace("$VERSION$", version);
    template += code;
    fs.writeFileSync(userScriptOutput, template);
}

const dev = process.argv.includes("--dev");
main(dev);

if (dev) {
    const fn = debounce(() => {
        main(dev);
        console.log("Built");
    }, 1000); 
    
    chokidar.watch("./src").on("unlink", (event, path) => {
        fn();
    }).on("unlinkDir", (event, path) => {
        fn();
    }).on("change", (event, path) => {
        fn();
    })
    console.log("Watching ./src");
}
