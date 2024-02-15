/// <reference path="patch.d.ts" />
import { Coordinates } from "./coordinates";
import { Palette } from "./palette";
import { createUI } from "./UI/ui";
import { waitForDraw } from "./utils";
import { Storage } from "./storage";
import { Store  } from "./store";

async function main() {
    const palette = new Palette();
    while(!palette.init()) { await waitForDraw();}
    const storage = new Storage(ENVIRONMENT === "browser-extension");
    const store = new Store(storage, palette); 
    await store.load();
    const coordinates = new Coordinates();
    await coordinates.init();

    createUI(store,storage, coordinates, palette);

    console.log("%cOverlay by 0xa663 loaded", "color: red; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px #000000;");
}

if (document.readyState === "complete") {
    main();
} else {
    window.addEventListener("load", main);
}