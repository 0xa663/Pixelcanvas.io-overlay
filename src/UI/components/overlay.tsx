import React from "react";
import styled from "styled-components";
import { Mural, MuralEx } from "../../interfaces";
import { canvasFromMural, get2DArrHeight, get2DArrWidth } from "../../utils";
import { Coordinates, CordType } from "../../coordinates";
import { Palette } from "../../palette";
import { MovableWindow } from "./movableWindow";
import { Storage } from "../../storage";
import { MuralEditor } from "./muralEditor";

const Canvas = styled.canvas`
    position: fixed;
    z-index: 1;
    pointer-events: none;
`;

interface Props {
    mural: MuralEx | Mural | number[][];
    muralObj?: Partial<Mural>;
    onChange?: (name: string, x: number, y:number, confirm?: boolean) => void;
    cords: Coordinates;
    storage: Storage;
    palette: Palette;
    opacity: number;
}

interface State {
    name: string;
    x: number;
    y: number;
}

export class Overlay extends React.Component<Props, State> {
    private ref = React.createRef<HTMLCanvasElement>();
    private _refImage?: HTMLCanvasElement; 

    constructor(props: Props) {
        super(props);
        this.state = {
            x: 0,
            y: 0,
            name: "",
        };
    }

    componentDidMount() {
        this.draw();
        this.props.cords.on(CordType.Url, this.draw);
        window.addEventListener("mousemove", this.draw);
        if (this.props.muralObj) {
            this.setState({
                name: this.props.muralObj.name || "",
                x: this.props.muralObj.x ?? 0,
                y: this.props.muralObj.y ?? 0,
            });
        }
    }
    componentWillUnmount() {
        this.props.cords.off(CordType.Url, this.draw);
        window.removeEventListener("mousemove", this.draw);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        if (prevProps.mural !== this.props.mural) {
            this._refImage = undefined;
            this.setState({
                x: 0, y: 0
            });
        }
        if (prevState.x !== this.state.x || prevState.y !== this.state.y) {
            this.draw();
        }
    }

    private isPixels(pixels: MuralEx | Mural | number[][]): pixels is number[][] {
        return Array.isArray(pixels);
    }   

    get pixels() {
        if (this.isPixels(this.props.mural)) {
            return this.props.mural;
        } else {
            return this.props.mural.pixels;
        }
    }

    get x() {
        if (this.isPixels(this.props.mural)) {
            return this.state.x;
        } else {
            return this.props.mural.x;
        }
    }

    get y() {
        if (this.isPixels(this.props.mural)) {
            return this.state.y;
        } else {
            return this.props.mural.y;
        }
    }

    get refImg() {
        if (!Array.isArray(this.props.mural) && "ref" in this.props.mural) {
            return this.props.mural.ref;
        }
        if (this._refImage) {
            return this._refImage;
        }
        this._refImage = canvasFromMural(this.pixels, this.props.palette.hex).canvas;
        return this._refImage;
    }

    draw = () => {
        const canvas = this.ref.current!;
        const scale = Math.pow(2, this.props.cords.uScale);
        const cords = this.props.cords.gridToScreen(this.x, this.y)!;
        if (!cords) {
            const ctx = canvas.getContext("2d")!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        const { x, y } = cords;

        const width = get2DArrWidth(this.pixels) * scale;
        const height = get2DArrHeight(this.pixels) * scale; 
        if (width !== canvas.width || height !== canvas.height ) {
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        canvas.style.left = `${x}px`;
        canvas.style.top = `${y}px`;

        ctx.drawImage(this.refImg, 0, 0, canvas.width, canvas.height);
    };


    private get style(): React.CSSProperties {
        return { left: this.state.x, top: this.state.y, opacity: this.props.opacity / 100};
    }

    renderModifyWindow() {
        if (this.props.onChange) {
            const copy = {...this.state};
            return <MovableWindow storage={this.props.storage} storageKey="overlay-set" title="Position editor">
                <MuralEditor 
                    name={this.state.name}
                    x={this.state.x}
                    y={this.state.y}
                    onX={x => this.setState({x})}
                    onY={y => this.setState({y})}
                    onName={name => this.setState({name})}
                    onCancel={() => {
                        this.setState(copy);
                        this.props.onChange!(copy.name, copy.x, copy.y, false);
                    }}
                    onConfirm={() => {
                        this.props.onChange!(this.state.name, this.state.x, this.state.y, true);

                    }}
                ></MuralEditor>
            </MovableWindow>;
        }
        return null;
    }

    render() {
        return <>
            <Canvas ref={this.ref} style={this.style} />
            {this.renderModifyWindow()}
        </>;
    }
}