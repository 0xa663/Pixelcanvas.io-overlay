import { BasicEventEmitter, Listener } from "./EventEmitter";
import { LoadUnload, Mural, MuralEx, SelectedMural } from "./interfaces";
import { Palette } from "./palette";

import { Storage } from "./storage";
import { canvasFromMural, getMuralHeight, getMuralWidth, pushUnique, removeItem } from "./utils";

export enum StoreEvents {
    MuralAdd = 1,
    MuralRemoved,
    MuralUpdated,
    MuralSelect,
    MuralOverlay,
    MuralPhantomOverlay,
    Any,
}

export interface OverlayReturn {
    pixels: number[][];
    muralObj?: Partial<Mural>;
    cb: (name: string, x: number, y: number, confirm?: boolean) => void; 
}

export class Store implements LoadUnload {
    private readonly STORAGE_KEY_MURAL = "_murals";
    private readonly STORAGE_KEY_SELECTED = "_mural";
    private _murals: MuralEx[] = [];
    private _selected: SelectedMural | undefined;
    private emitter = new BasicEventEmitter();
    private _overlayIndices: number[] = [];
    private _phantomOverlay = -1;
    private _overlayModify?: OverlayReturn;
    
    constructor(private storage: Storage, private palette: Palette) {}

    async load() {
        this._murals = await this.storage.getItem<MuralEx[]>(this.STORAGE_KEY_MURAL) || [];
        for (const mural of this._murals) {
            const { canvas, pixels } = canvasFromMural(mural.pixels, this.palette.hex);
            mural.ref = canvas;
            mural.pixelCount = pixels;
        }
        const index = await this.storage.getItem<number>(this.STORAGE_KEY_SELECTED) ?? -1;
        this.select(this._murals[index]);
    }
    updateMural(_mural: Mural) {
        this.save();
        this.emit(StoreEvents.MuralUpdated);
    }
    unload() {
        this.save();
    }
    add(mural: Mural) {
        const m = mural as MuralEx;
        const { canvas, pixels } = canvasFromMural(mural.pixels, this.palette.hex);
        m.ref = canvas;
        m.pixelCount = pixels;
        this._murals.push(m);
        this.emit(StoreEvents.Any);
        this.save();
    }

    remove(mural: Mural) {
        removeItem(this._murals, mural);
        this.emit(StoreEvents.MuralRemoved);
        this.save();
    }
    addOverlay(mural: MuralEx) {
        const index = this._murals.indexOf(mural);
        if (index !== -1) {
            pushUnique(this._overlayIndices, index);
            if (this._phantomOverlay === index) {
                this._phantomOverlay = -1;
            }
        }
        this.emit(StoreEvents.MuralOverlay);
        this.save();
    }
    removeOverlay(mural: MuralEx) {
        const index = this._murals.indexOf(mural);
        if (index !== -1) {
            removeItem(this._overlayIndices, index);
        }
        this.emit(StoreEvents.MuralOverlay);
        this.save();
    }
    setOverlayModify(overlay: OverlayReturn) {
        this._overlayModify = overlay;
        const cb = overlay.cb;
        overlay.cb = (name, x, y, done) => {
            cb(name, x, y, done);
            this._overlayModify = undefined;
            this.emit(StoreEvents.MuralOverlay);
        };
        this.emit(StoreEvents.MuralOverlay);
    }
    hasOverlay(mural: MuralEx) {
        const index = this._murals.indexOf(mural);
        return this._overlayIndices.includes(index);
    }

    select(mural: MuralEx | undefined) {
        if (mural) {
            this._selected = {
                m: mural,
                h: getMuralHeight(mural),
                w: getMuralWidth(mural),
            };
        } else {
            this._selected = undefined;
        }
        this.emit(StoreEvents.MuralSelect);
        this.save();
    }

    async save() {
        await this.storage.setItem(this.STORAGE_KEY_MURAL, this._murals.map(m => ({ name: m.name, pixels: m.pixels, x: m.x, y: m.y } as Mural)));
        const selected = this._selected?.m ? this._murals.indexOf(this._selected?.m!) : -1;
        await this.storage.setItem(this.STORAGE_KEY_SELECTED, selected);
    }
    addPhantomOverlay(mural: MuralEx) {
        const index = this._murals.indexOf(mural);
        if (index !== this._phantomOverlay && !this._overlayIndices.includes(index)) {
            this._phantomOverlay = index;
            this.emit(StoreEvents.MuralPhantomOverlay);
        }
    }
    removePhantomOverlay() {
        if (this._phantomOverlay !== -1) {
            this._phantomOverlay = -1;
            this.emit(StoreEvents.MuralPhantomOverlay);
        }
    }
    get murals() {
        return this._murals;
    }
    get overlays() {
        return this._overlayIndices;
    }
    get phantomOverlay() {
        return this._phantomOverlay;
    }
    get overlayModify() {
        return this._overlayModify;
    }
    get selected() {
        return this._selected;
    }
    on(event: StoreEvents, listener: Listener<[Store]>) {
        this.emitter.on(event, listener);
    }
    off(event: StoreEvents, listener: Listener<[Store]>) {
        this.emitter.off(event, listener);
    }
    private emit(event: StoreEvents) {
        this.emitter.emit(event, this);
        this.emitter.emit(StoreEvents.Any, this);
    }
}