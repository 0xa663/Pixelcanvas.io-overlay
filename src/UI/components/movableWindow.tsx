import React, { createRef } from "react";
import styled from "styled-components";
import { Point } from "../../interfaces";
import { clamp, debounce } from "lodash";
import { Storage } from "../../storage";

const Movable = styled.div`
    position: fixed;
    padding-top: 20px;
    padding: 5px;
    z-index: 2;
    background-color: rgba(255, 255, 255, 0.75);
    color: rgb(10, 10, 10);
    border-radius: 12px;
    border: 2px solid black;
`;

const DragArea = styled.div`
    border: 1px black dotted;
    cursor: grab;
    user-select: none;
    border-radius: 12px;
    padding: 4px;
`;

interface Props {
    children: React.ReactNode;
    title: string;
    storage: Storage;
    storageKey: string;
}

interface State {
    x: number;
    y: number;
    moving: boolean;
}

interface PointEx extends Point {
    xOff: number;
    yOff: number;
}

export class MovableWindow extends React.Component<Props, State> {
    private ref = createRef<HTMLDivElement>();
    private dragRef = createRef<HTMLDivElement>();
    private moving?: PointEx;
    private destroyed = false;

    constructor(props: Props) {
        super(props);
        this.state = {
            x: -window.innerWidth,
            y: -window.innerHeight,
            moving: false,
        };
    }

    componentDidMount () {
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);
        window.addEventListener("resize", this.fixBounds);
        window.addEventListener("touchmove", this.onTouchMove);
        window.addEventListener("touchend", this.onMouseUp);
        this.props.storage.getItem<Point>(this.storageKey).then(point => {
            if (!this.destroyed && point) {
                this.setState({x: point.x, y: point.y});
                setTimeout(() => {
                    this.fixBounds();
                }, 1000);
            } else {
                this.setState({x: 0, y: 0});
            }
        });
    }
    componentWillUnmount () {
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
        window.removeEventListener("resize", this.fixBounds);
        window.removeEventListener("touchmove", this.onTouchMove);
        window.removeEventListener("touchend", this.onMouseUp);
        this.destroyed = false;
    }

    onTouchMove = (event: TouchEvent) => {
        if (!this.moving) return;
        if (!(event instanceof TouchEvent) || !event.isTrusted){
            return;
        }
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];
            const { clientX, clientY } = touch;
            this.handleMoveLogic(clientX, clientY);
        }
    };

    setMoving = (clientX: number, clientY: number, offsetX: number, offsetY: number) => {
        this.moving = {
            x: clientX,
            y: clientY,
            xOff: offsetX,
            yOff: offsetY,
        };
    };

    private onMouseMove = (event: MouseEvent) => {
        if (!this.moving) return;
        if (!(event instanceof MouseEvent) || event.ctrlKey || event.altKey || event.metaKey){
            return;
        }
        const { clientX, clientY } = event;
        this.handleMoveLogic(clientX, clientY);
    };
    private onMouseUp = () => {
        this.moving = undefined;
        this.setState({moving: false});
    };
    private fixBounds = () => {
        const bounds = this.ref.current?.getBoundingClientRect();
        if (bounds) {
            let x = this.state.x;
            let y = this.state.y;
            if (bounds.left < 0) {
                x = 0;
            } if (bounds.right > window.innerWidth) {
                x = window.innerWidth - bounds.width;
            }

            if (bounds.top < 0) {
                y = 0;
            } if (bounds.bottom > window.innerHeight) {
                y = window.innerHeight - bounds.height;
            }
            if (this.state.x !== x || this.state.y !== y) {
                this.setState({x, y});
            }
        }
    };

    savePoint = debounce((point: Point) => {
        this.props.storage.setItem(this.storageKey, point);
    }, 100);

    private handleMoveLogic(clientX: number, clientY: number) {
        const ref = this.ref.current?.getBoundingClientRect();
        if (ref && this.moving) {
            
            const xx = clientX - this.moving!.xOff;
            const yy = clientY - this.moving!.yOff;
            const x = clamp(xx, 0, window.innerWidth - ref!.width);
            const y = clamp(yy, 0, window.innerHeight - ref!.height) ;
            const point = { x, y };
            this.savePoint(point);
            this.setState(point);
        }
    }
    onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        this.setMoving(event.clientX,event.clientY, event.nativeEvent.offsetX, event.nativeEvent.offsetY);
        this.setState({moving: true});
    };
    onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        const lastTouch = event.nativeEvent.touches[event.nativeEvent.touches.length - 1];
        const div = event.target as HTMLDivElement;
        const { x, y, width, height} = div.getBoundingClientRect();
        const offsetX = (lastTouch.clientX - x) / width * div.offsetWidth;
        const offsetY = (lastTouch.clientY - y) / height * div.offsetHeight;
        this.setMoving(lastTouch.clientX, lastTouch.clientY, offsetX, offsetY);
        this.setState({moving: true});
    };

    get storageKey() {
        return `__storage__${this.props.storageKey}`;
    }
    render() {
        return <Movable ref={this.ref} style={{left: `${this.state.x}px`, top: `${this.state.y}px`}}>
            <DragArea ref={this.dragRef} style={{cursor: this.state.moving ? "grabbing" : ""}} onMouseDown={this.onMouseDown} onTouchStart={this.onTouchStart} > <h2>{this.props.title}</h2> </DragArea>


            {this.props.children}
        </Movable>;
    }
}
