import { Listener, BasicEventEmitter } from "./EventEmitter";
import { CHUNK_SIZE, waitForDraw } from "./utils";

export enum CordType {
  Div,
  Url  
}

export class Coordinates {
    private cords: HTMLDivElement;
    private emitter = new BasicEventEmitter();
    private _x = 0;
    private _y = 0;
    private frame: number;

    private _ux = 0;
    private _uy = 0;
    private _uScale = 0;
    //div: HTMLDivElement;
    constructor() {
        // this.div = document.createElement("div");
        // this.div.style.position = "fixed";
        // this.div.style.backgroundColor = "orange";
        // document.body.appendChild(this.div);
        // this.div.style.opacity = "0.75";
        // this.div.style.zIndex = "10px";
        // this.div.style.pointerEvents = "none";
    }

    on(event: CordType, listener: Listener<[number, number, number]>) {
        this.emitter.on(event, listener);
    }
    off(event: CordType, listener: Listener<[number, number, number]>) {
        this.emitter.off(event, listener);
    }

    async init() {
        while(!this.cords) {
            const cords = [...document.getElementsByTagName("div")].filter(e => e.textContent && e.textContent.match(/^\(\s*-?\d+\s*,\s*-?\d+\s*\)$/));
            for (const cord of cords) {
                if (cord.children.length === 0) {
                    this.cords = cord;
                    this.frame = requestAnimationFrame(this.observe);
                }
            }
            await waitForDraw();
        }
    }

    stop() {
        if (this.frame) {
            cancelAnimationFrame(this.frame);
        }
    }
 
    private get centerCanvas() {
        const hww = window.innerWidth / 2; 
        const hhw = window.innerHeight / 2;
        const canvasObject = [...document.getElementsByTagName("canvas")].filter(c => c.classList.contains("leaflet-tile")).map(c => {
            const bounds = c.getBoundingClientRect();
            return {
                canvas: c,
                bounds: {
                    width: bounds.width,
                    height: bounds.height,
                    top: bounds.top,
                    bottom: bounds.bottom,
                    left: bounds.left,
                    right: bounds.right,
                },
            };
        }).find(r => hww > r.bounds.left && hww < r.bounds.right && hhw > r.bounds.top && hhw < r.bounds.bottom);
        if (canvasObject) {
            const ratio = canvasObject.canvas.width / CHUNK_SIZE;
            if (ratio === 2) { // scale -1
                const hw = canvasObject.bounds.left + canvasObject.bounds.width / 2;
                const hh = canvasObject.bounds.top + canvasObject.bounds.height / 2;
                const chunkW = CHUNK_SIZE / canvasObject.canvas.width;
                const chunkH = CHUNK_SIZE / canvasObject.canvas.height;
                canvasObject.bounds.width = chunkW;
                canvasObject.bounds.height = chunkH; 

                if (hww <= hw && hhw <= hh) {
                    // top left
                } else if (hww > hw && hhw < hh) {
                    // top right
                    canvasObject.bounds.top += chunkW;
                } else if (hww > hw && hhw > hh) {
                    // bottom left
                    canvasObject.bounds.left += chunkH;
                } else {
                    // bottom left right
                    canvasObject.bounds.left += chunkW;
                    canvasObject.bounds.top += chunkH;
                }  
                canvasObject.bounds.bottom = canvasObject.bounds.top + chunkW;
                canvasObject.bounds.right = canvasObject.bounds.left + chunkH;   
                return null;
            }
            canvasObject.bounds.width /= ratio;
            canvasObject.bounds.height /= ratio; 
            canvasObject.bounds.right = canvasObject.bounds.left + canvasObject.bounds.width;
            canvasObject.bounds.bottom = canvasObject.bounds.bottom + canvasObject.bounds.height;
        }

        return canvasObject;
    }
    get pixelSize() {
        return Math.pow(2, this.uScale);
    }
    screenToGrid(sx: number, sy: number) {
        const c = this.centerCanvas;
        if (!c) return null;
        this.getCordsFromUrl();
        const chunkX = Math.floor(this.ux / CHUNK_SIZE) * CHUNK_SIZE;
        const chunkY = Math.floor(this.uy / CHUNK_SIZE) * CHUNK_SIZE;
        const xx = ((sx - c.bounds.left) / this.pixelSize) + chunkX;
        const yy = ((sy - c.bounds.top) / this.pixelSize) + chunkY;
        return {x: xx, y: yy};
    }

    gridToScreen(gridX: number, gridY: number) {
        const c = this.centerCanvas;
        if (!c) return null;
    
        const chunkX = Math.floor(this.ux / CHUNK_SIZE) * CHUNK_SIZE;
        const chunkY = Math.floor(this.uy / CHUNK_SIZE) * CHUNK_SIZE;
        const screenX = (gridX - chunkX);
        const screenY = (gridY - chunkY);
    
        const x = c.bounds.left + (screenX * this.pixelSize);
        const y = c.bounds.top + (screenY * this.pixelSize);
        return { x, y };
    }

    getCordsFromUrl() {
        const pathNames = location.pathname.split("/").filter(e => e);
        const cordsRaw = pathNames[0];
        if (cordsRaw) {
            const cords = cordsRaw.match(/-?\d+/g)!.map(n => parseInt(n));
            if (typeof cords[0] === "number" && typeof cords[1] === "number" && typeof cords[2] === "number") {
                this._ux = cords[0];
                this._uy = cords[1];
                this._uScale = cords[2];
                return cords;
            }
        }
        return null;
    }

    private parse() {
        const arr = this.cords.textContent!.match(/-?\d+/g)!.map(n => parseInt(n));
        this._x = arr[0];
        this._y = arr[1];
    }

    observe = () => {
        const x = this._x;
        const y = this._y;
        this.parse();

        if (x !== this._x || y !== this._y) {
            this.emitter.emit(CordType.Div, this._x, this._y);
        }

        const ux = this._ux;
        const uy = this._uy;
        const uScale = this._uScale;
        this.getCordsFromUrl();
        if (ux !== this._ux || uy !== this._uy || uScale !== this._uScale) {
            this.emitter.emit(CordType.Url, this._ux, this._uy, this._uScale);
        }

        this.frame = requestAnimationFrame(this.observe);
    };
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }

    get ux() {
        return this._ux;
    }
    get uy() {
        return this._uy;
    }
    get uScale() {
        return this._uScale;
    }
}