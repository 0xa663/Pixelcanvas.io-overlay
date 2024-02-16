import React, { createRef } from "react";
import styled from "styled-components";
import { Point } from "../../interfaces";
import { clamp } from "lodash";
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
            } else {
                this.setState({x: 0, y: 0});
            }
            this.fixBounds();
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
        // if(this.shown) {
        //     const {left, top, width, height} = this.container.getBoundingClientRect();
        //     const s = this.container.style;
        //     if (width > window.innerWidth || height > window.innerHeight) {
        //         const padding = 10;
        //         if (width > window.innerWidth) {
        //             s.width = `${window.innerWidth - padding}px`;
        //         }
        //         if (height > window.innerHeight) {
        //             s.height = `${window.innerHeight - padding}px`;
        //         }
        //         s.overflow = "auto";
        //     } else {
        //         s.width = "";
        //         s.height = "";
        //         s.overflow = "";
        //         if (left < 0) {
        //             s.left = `0px`;
        //         }
        //         if (top < 0) {
        //             s.top = `0px`;
        //         }
        //         if(left + width > window.innerWidth) {
        //             s.left = `${window.innerWidth - width}px`;
        //         }
        //         if (top + height > window.innerHeight) {
        //             s.top = `${window.innerHeight - height}px`;
        //         }
        //     }
        // }
    };

    private handleMoveLogic(clientX: number, clientY: number) {
        const ref = this.dragRef.current?.getBoundingClientRect();
        if (ref && this.moving) {
            const xx = clamp(clientX, this.moving.xOff, window.innerWidth - ref!.width + this.moving.xOff);
            const yy = clamp(clientY, this.moving.yOff, window.innerHeight - ref!.height + this.moving.yOff) ;
            
            const x = xx - this.moving!.xOff;
            const y = yy - this.moving!.yOff;
            const point = { x, y };
            this.props.storage.setItem(this.storageKey, point);
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
