import { Coordinates, CordType } from "../../coordinates";
import { SelectedMural } from "../../interfaces";
import React from "react";
import { Btn, SELECTED_COLOR } from "../styles";
import { faCrosshairs, faMagnifyingGlassMinus, faMagnifyingGlassPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import { createCanvas, drawPixelsOntoCanvas } from "../../utils";
import { Palette } from "../../palette";
import { clamp, debounce } from "lodash";
import { Store } from "../../store";
import { Storage } from "../../storage";

const Flex = styled.div`
    display: flex;
    flex-direction: row;
`;

const ColorBox = styled.div`
    width: 25px;
    height: 25px;
    padding: 2px;
    margin: 2px;
    border: 1px solid black;
    text-align: center;
    font-weight: bolder;
`;

const Scale = styled.span`
    width: 25px;
    text-align: center;
    margin: auto;
`;

const Canvas = styled.canvas`
    border-radius: 12px;
    border: 2px solid black;
`;

interface Props {
    selected: SelectedMural;
    cords: Coordinates;
    store: Store;
    storage: Storage;
    palette: Palette;
}

interface Stats {
    size: number;
    color: number;
    colorAssistant: boolean;
}

interface StorageSettings {
    colorAssistant: boolean;
    size: number;
}

export class Minimap extends React.Component<Props, Stats> {
    private ref = React.createRef<HTMLCanvasElement>();
    private cache = new Map<number, HTMLCanvasElement>();
    private transparentGrid = ["#c5c5c540", "#8d8d8d40"];
    private highlighColor = "#00000040";
    private lastColor = -1;
    private storageKey  = "_minimap_settings";
    private destroyed = false;

    constructor(props:Props) {
        super(props);
        this.state = {
            size: 16,
            color: -1,
            colorAssistant: false,
        };
    }

    componentDidUpdate ( prevProps: Readonly<Props>, prevState: Readonly<Stats>): void {
        if (prevProps.selected.m.ref !== this.props.selected.m.ref) {
            this.cache.clear();
            this.draw();
        } else if (prevState.size !== this.state.size) {
            this.draw();
        }
        
    }

    private click = debounce((colorIndex: number) => {
        if (colorIndex >= 0 && colorIndex < this.props.palette.palette.length) {
          if (!this.props.palette.buttons[colorIndex].classList.contains("outline-2")) {
            if (this.state.colorAssistant) {
                this.props.palette.buttons[colorIndex].click();
            }
          }
      }
      }, 50);
  

    componentDidMount () {
        this.props.cords.on(CordType.Div, this.update);
        this.props.cords.on(CordType.Div, this.onCords);
        this.props.storage.getItem<StorageSettings>(this.storageKey).then(settings => {
            if (settings && !this.destroyed) {
                this.setState({
                    colorAssistant: settings.colorAssistant,
                    size: settings.size
                });
            }
        });
        this.draw();
    }

    componentWillUnmount () {
        this.destroyed = true;
        this.props.cords.off(CordType.Div, this.update);
        this.props.cords.off(CordType.Div, this.onCords);
    }

    saveSettings() {
        this.props.storage.setItem(this.storageKey, {
            colorAssistant: this.state.colorAssistant,
            size: this.state.size
        });
    }

    onCords = (x: number, y: number) => {
        const store = this.props.store;
        if (store.selected && store.selected.m.x < x && store.selected.m.y < y && store.selected.w + store.selected.m.x > x && store.selected.h + store.selected.m.y > y) {
            const xx = x - store.selected.m.x; 
            const yy = y - store.selected.m.y;
            const colorIndex = store.selected.m.pixels[yy][xx];
            if (this.lastColor !== colorIndex) {
                this.lastColor = colorIndex;
                this.click(colorIndex);
            }
        }
    };

    drawGrid(ctx: CanvasRenderingContext2D, gridSize: number, width: number, height: number) {
        for (let y = 0; y < height; y += gridSize) {
            for (let x = 0; x < width; x += gridSize) {
                const isEvenRow = Math.floor(y / gridSize) % 2 === 0;
                const isEvenColumn = Math.floor(x / gridSize) % 2 === 0;
                const isEvenCell = (isEvenRow && isEvenColumn) || (!isEvenRow && !isEvenColumn);
    
                ctx.fillStyle = isEvenCell ? this.transparentGrid[0] : this.transparentGrid[1];
                ctx.fillRect(x, y, gridSize, gridSize);
            }
        }
    }

    update = () => {
        const m = this.props.selected.m;
        const xx = this.props.cords.x - m.x; 
        const yy = this.props.cords.y - m.y;
        
        if (m.pixels[yy] !== undefined) {
            if (m.pixels[yy][xx] !== undefined) {
                const colorIndex = m.pixels[yy]![xx]!;
                this.setState({
                    color: colorIndex
                });
                this.draw();
                return;
            }
        }
        this.setState({
            color: -1,
        });
        this.draw();
    };

    getCachedImage(size: number) {
        const image = this.cache.get(size);
        if (image) {
            return image;
        }

        const s = this.props.selected;
        const canvas = createCanvas();
        drawPixelsOntoCanvas(canvas, s.m.pixels, this.props.palette.hex, size);
        this.cache.set(size, canvas);
        return canvas;
    }

    draw = () => {
        const canvas = this.ref.current!;
        const ctx = canvas.getContext("2d")!;
        const w = canvas.width = 200;
        const h = canvas.height = 200;
        const hh = w / 2;
        const hw = h / 2;
        ctx.clearRect(0, 0, w, h);
        const s = this.state.size;
        this.drawGrid(ctx, s * 4, w, h);

        const pixelSize = (1 * s) / 2;
        const dx = ((this.props.selected.m.x - this.props.cords.x) * s) + Math.ceil(hh - pixelSize);
        const dy = ((this.props.selected.m.y - this.props.cords.y) * s) + Math.ceil(hw - pixelSize);
        //const img = this.props.selected.m.ref;
        const img = this.getCachedImage(s);

        ctx.drawImage(img, dx, dy, img.width, img.height);
        if (s != 1) {
            ctx.fillStyle = this.highlighColor;
            const halfHO = (h / 2);
            const halfWO = (h / 2);
            ctx.fillRect(0, 0, w, halfHO - pixelSize);
            ctx.fillRect(0, halfHO + pixelSize, w, halfHO - pixelSize);
            ctx.fillRect(0, halfHO - pixelSize, halfWO - pixelSize, pixelSize * 2);
            ctx.fillRect(halfWO + pixelSize, halfHO - pixelSize, halfWO - pixelSize, pixelSize * 2);

        }
    };

    up = () => {
        this.setState({
            size: this.clamp(this.state.size * 2)
        });
    };

    down = () => {
        this.setState({
            size: this.clamp(this.state.size / 2)
        });
    };
    setSize(size: number) {
        this.setState({size});
    }

    clamp(size: number) {
        return clamp(size, 1, 32);
    }

    renderColor() {
        if (this.state.color !== -1) {
            return <ColorBox style={{backgroundColor: this.props.palette.hex[this.state.color]}}></ColorBox>;
        } else {
            return <ColorBox> / </ColorBox>;
        }
    }
    toggleColorAssistant = () => {
        this.setState({
            colorAssistant: !this.state.colorAssistant,
        });
    };

    render() {
        return <div>
            <Flex>
                <Btn onClick={this.up}><FontAwesomeIcon icon={ faMagnifyingGlassPlus }></FontAwesomeIcon></Btn>
                <Scale>{this.state.size}</Scale>
                <Btn onClick={this.down}><FontAwesomeIcon icon={ faMagnifyingGlassMinus }></FontAwesomeIcon></Btn>
                <span style={{flex: 1}}>
                <Btn title="Color assistant" style={{ borderColor: this.state.colorAssistant ? SELECTED_COLOR : ""} } onClick={() => this.toggleColorAssistant()}>Assist<FontAwesomeIcon icon={faCrosshairs} /> </Btn>
                </span>
                {this.renderColor()}
            </Flex>
            <Canvas ref={this.ref} />
        </div>;
    }

}