export interface RGB {
    r: number;
    g: number;
    b: number;
}

export interface Mural {
    name: string;
    pixels: number[][];
    x: number;
    y: number;
}

export interface LoadUnload {
    load: () => Promise<void> | void;
    unload: () => Promise<void> | void;
}

export interface SelectedMural {
    m: MuralEx;
    w: number;
    h: number;
}

export interface MuralEx extends Mural {
    ref: HTMLCanvasElement;
    pixelCount: number;
}

export interface Point {
    x: number;
    y: number;
}