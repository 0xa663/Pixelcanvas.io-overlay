import { Mural } from "../interfaces";
import { canvasToImageData, createCanvas, flatQuantizeImageData,
    getExtension, getMuralHeight, getMuralWidth, imageDataToPaletteIndices,
    imageToCanvas, loadImageSource, readAsDataUrl, readAsString, resize, validateMural } from "../utils";
import { FileInput } from "./Fileinput";
import { Palette } from "../palette";
import { Store } from "../store";
import React from "react";
import { Coordinates } from "../coordinates";
import { Storage } from "../storage";
import { Main } from "./components/main";
import { createRoot } from "react-dom/client";

const TEXT_FORMATS = ["muraljson", "json"];

export function createUI(store: Store, storage: Storage, cords: Coordinates, palette: Palette) {
    return appendWindow(<Main cords={cords} store={store} storage={storage} palette={palette} />);
}

function appendWindow(children: React.ReactNode) {
    const rootElement = document.createElement("div")!;
    createRoot(rootElement).render(children);
    document.body.appendChild(rootElement);
    return () => {
        rootElement.parentElement?.removeChild(rootElement);
    };
}

export class UI {
    private container: HTMLDivElement;
    private list: HTMLDivElement;

    constructor(private store: Store, private palette: Palette) {
        this.container = document.createElement("div");
        const s = this.container.style;
        this.container.setAttribute("mod", "pixel-canvas-overlay");
        s.position = "fixed";
        s.zIndex = "1000";
        s.left = "0px";
        s.bottom = "0px";
        const container = document.createElement("div");
        const ss = container.style;
        this.container.appendChild(container);
        ss.backgroundColor = "black";
        ss.color = "white";
        ss.margin = "5px";
        ss.padding = "5px";
        ss.border = "1px solid white";

        const h = document.createElement("h3");
        h.textContent = "Pixel Canvas overlay";

        const input = this.btn("Import", async () => {
            const mural = await this.import();
            if (mural) {
                this.store.add(mural);
                this.renderList();
            }
        });
        container.appendChild(h);
        container.appendChild(input);    
        this.list = document.createElement("div");
        this.list.style.display = "flex";
        this.list.style.flexDirection = "column";
        container.appendChild(this.list);
    }

    private btn(value: string, onClick: () => void) {
        const button = document.createElement("button");   
        button.style.backgroundColor = "black";
        button.style.color = "white";
        button.style.border = "1px solid white";
        button.style.padding = "2px";
        button.textContent = value;
        button.addEventListener("click", onClick);

        return button;
    }

    import = async () => {
        const file = await this.importFile();
        if (file) {
            if (file.type === "mural") {
                return file.data as Mural;
            } else {
                const pixels = await this.imageToMural(file.data as HTMLImageElement);
                await new Promise<Mural>((resolve, reject)=> {
                    this.store.setOverlayModify({
                        pixels,
                        cb: (name, x, y, confirm) => {
                            if (confirm) {
                                resolve({ name, pixels, x, y });
                            } else {
                                reject(new Error("Canceled by user"));
                            }
                        }
                    });
                });
                const heights = prompt(`Enter name and location [name, x, y]`) || "";
                const data = heights.split(",");
                const numbers = [data[1], data[2]].map(e=> parseInt(e.trim(), 10));
                if (typeof numbers[1] === "number" && typeof numbers[2] === "number") {
                    alert("Invalid size");
                }
                const mural: Mural = {
                    name: data[0],
                    x: numbers[0],
                    y: numbers[1],
                    pixels
                };
                try {
                    validateMural(mural);
                } catch (error) {
                    alert(error.message);
                }
                return mural;
            }
        }
    };
    private async importFile() {
        const fileInput = new FileInput();
        fileInput.setAcceptType(["png", "jpg", "jpeg", ...TEXT_FORMATS]);
        const files = await fileInput.show();
        const fileData = files[0];
        if (!fileData) {
            throw new Error("Empty file");
        }
        const ex = getExtension(fileData.name);
        const name = ex.text;
        if (TEXT_FORMATS.includes(ex.ex)) {
            const content = await readAsString(fileData);
            const mural = JSON.parse(content) as Mural;
            if (!mural.name) {
                mural.name = prompt("Missing name for this mural. Please enter it manually", name) || "";
            }
            validateMural(mural);
            return {
                type: "mural",
                data: mural,
            };
        } else {
            const readData = await readAsDataUrl(fileData);
            return {
                type: "image",
                data: await loadImageSource(`${ex.text}.${ex.ex}`, readData),
            };
        }
    }
    private async imageToMural(image: HTMLImageElement) {
        const actualImage = await this.getImageSettingFromUser(image);
        const canvas = imageToCanvas(actualImage);
        const imageData = canvasToImageData(canvas);
        flatQuantizeImageData(imageData, this.palette.palette);
        return imageDataToPaletteIndices(imageData, this.palette.palette);
    }
    private async  getImageSettingFromUser(image: HTMLImageElement) {  
        const should = confirm(`You are importing image with size ${image.width}x${image.height}. Do you want to preform any image manipulations?`);
        if (should) {
            if (confirm(`Do you want to resize?\n Image ${image.width}x${image.height}?`)) {
                const heights = prompt(`Enter new [width x height]`) || "";
                const numbers = heights.split("x").map(e=> parseInt(e.trim(), 10));
                if (typeof numbers[0] === "number" && typeof numbers[1] === "number" && numbers[0] > 0 && numbers[1] > 0) {
                    alert("Invalid size");
                    return image;
                }
                image = await resize(image, numbers[0], numbers[1]);
            }
        }
        return image;
    }
    private renderList() {
        while (this.list.children.length) {
            this.list.removeChild(this.list.children[0]);
        }

        for (const mural of this.store.murals) {
            const container = document.createElement("div");
            container.style.border = `${this.store.selected?.m === mural ? 3 : 1}px solid white`;
            container.style.padding = "2px";
            const h5 = document.createElement("h5");
            h5.textContent = mural.name;
            const canvas = createCanvas();
            canvas.style.maxHeight = "100px";
            canvas.style.maxWidth = "100px";
            const ctx = canvas.getContext("2d")!;
            canvas.width = getMuralWidth(mural);
            canvas.height = getMuralHeight(mural);
            ctx.drawImage(mural.ref, 0, 0, canvas.width, canvas.height);
            const wh = document.createElement("div");
            wh.textContent = `Size ${getMuralWidth(mural)}x${getMuralHeight(mural)}`;
            const at = document.createElement("div");
            at.textContent = `At: ${mural.x}x${mural.y}`;
            container.appendChild(h5);
            container.appendChild(wh);
            container.appendChild(at);
            container.appendChild(canvas);
            const select = this.btn("select", () => {
                this.store.select(mural);
                this.renderList();
            });
            const del = this.btn("delete", () => {
                this.store.remove(mural);
                this.renderList();
            });
            container.appendChild(select);
            container.appendChild(del);
            this.list.appendChild(container);
        }
    }
    async append() {
        document.body.appendChild(this.container);
        this.renderList();
    }
    destroy() {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
