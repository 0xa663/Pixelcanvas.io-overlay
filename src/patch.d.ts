declare const ENVIRONMENT: "browser-extension" | "user-script";

declare module "rgbquant" {
    export type DitheringKernel =
        | "FloydSteinberg"
        | "FalseFloydSteinberg"
        | "Stucki"
        | "Atkinson"
        | "Jarvis"
        | "Burkes"
        | "Sierra"
        | "TwoSierra"
        | "SierraLite";

    export interface RGBQuantOptions {
        colors?: number; // desired palette size
        method?: number; // histogram method, 2: min-population threshold within subregions; 1: global top-population
        boxSize?: [number, number]; // subregion dims (if method = 2)
        boxPxls?: number; // min-population threshold (if method = 2)
        initColors?: number; // # of top-occurring colors  to start with (if method = 1)
        minHueCols?: number; // # of colors per hue group to evaluate regardless of counts, to retain low-count hues
        dithKern?: number; // dithering kernel name, see available kernels in docs below
        dithDelta?: number; // dithering threshhold (0-1) e.g: 0.05 will not dither colors with <= 5% difference
        dithSerp?: boolean; // enable serpentine pattern dithering
        palette?: [number, number, number][]; // a predefined palette to start with in r,g,b tuple format: [[r,g,b],[r,g,b]...]
        reIndex?: boolean; // affects predefined palettes only. if true, allows compacting of sparsed palette once target palette size is reached. also enables palette sorting.
        useCache?: boolean; // enables caching for perf usually, but can reduce perf in some cases, like pre-def palettes
        cacheFreq?: number; // min color occurance count needed to qualify for caching
        colorDist?: "euclidean" | "manhattan"; // method used to determine color distance, can also be "manhattan"
    }

    export default class RgbQuant {
        constructor(options?: RGBQuantOptions);
        sample(image: HTMLCanvasElement): void;
        palette(tuples?: false, sort?: boolean): [number, number, number][];
        palette(tuples?: true, sort?: boolean): Uint8Array;
        palette(tuples?: boolean, sort?: boolean): Uint8Array;
        reduce(image: HTMLCanvasElement, retType: 2, dithKern?: DitheringKernel, dithSerp?: boolean): number[];
        reduce(image: HTMLCanvasElement, retType: 1, dithKern?: DitheringKernel, dithSerp?: boolean): Uint8Array;
        reduce(image: HTMLCanvasElement, retType?: number, dithKern?: DitheringKernel, dithSerp?: boolean): Uint8Array;
    }
}
