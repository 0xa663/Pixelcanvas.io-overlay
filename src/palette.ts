import { RGB } from "./interfaces";
import { rgbToHex } from "./utils";

export class Palette {

    public buttons: HTMLButtonElement[] = [];
    public palette: RGB[] = [];
    public hex: string[] = [];
    init() {
        const buttons = [...document.getElementsByTagName("button")].filter(e => e.style.backgroundColor);
        if (buttons.length < 2) {
            return null;
        }
        const oW = new Map<number, number>();
        const oH = new Map<number, number>();
        const buttonsMap = buttons.map(btn => {
            const { width, height } = btn.getBoundingClientRect();
            let w = oW.get(width) || 0;
            let h = oH.get(height) || 0;
            w++;
            h++;
            oW.set(width, w);
            oH.set(height, h);
            return {
                btn, width, height
            };
        });
        const width = Array.from(oW).sort((a,b) => a[1] < b[1] ? 1 : -1)[0][0];
        const height = Array.from(oH).sort((a,b) => a[1] < b[1] ? 1 : -1)[0][0];
    
        const filtered = buttonsMap.filter(btn => btn.width === width && btn.height === height);
        this.buttons = filtered.map(e => e.btn);
        this.buttons[0].parentElement!.parentElement!.style.zIndex = "10";
        //this.buttons = filtered.map(e => e.);
        const palette = filtered.map(btnMap => {
            const values = btnMap.btn.style.backgroundColor.match(/\d+/g)!;
            return {
                r: parseInt(values[0]), 
                g: parseInt(values[1]), 
                b: parseInt(values[2])};
        }) as RGB[];
        this.palette = palette;
        this.hex = palette.map(e => rgbToHex(e.r, e.g, e.b));
        return palette;
    }

}
