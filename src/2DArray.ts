export class Array2D<V = any> {
    public array:V[] = [];
    constructor(defaultValue: V, private width: number, height: number) {
        this.array = new Array(width * height);
        this.array.fill(defaultValue); 
    }
    at(x: number, y: number){
        return y * this.width + x;
    }
    set(x: number, y: number, value: V) {
        this.array[this.at(x, y)] = value;
    }
    get(x: number, y: number) {
        return this.array[this.at(x, y)];
    }
    static from<V>(array: V[][], width: number, height: number) {
        const arr = new Array2D(array[0][0]!, width, height);
        for (let y = 0; y < array.length; y++) {
            for (let x = 0; x < array[y].length; x++) {
                arr.set(x, y, array[y][x]!);
            }
        }
        return arr;
    }
}
