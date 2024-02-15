import React from "react";
import { createRef, ReactNode } from "react";

interface Props {
    canvas: HTMLCanvasElement;
    width?: number;
    height?: number;
}

export class CanvasToCanvasJSX extends React.Component<{ canvas: HTMLCanvasElement, width?: number, height?: number }> {
    private ref = createRef<HTMLCanvasElement>();

    override componentDidMount(): void {
        this.update();
    }
    componentDidUpdate(prevProps: Readonly<Props> ) {
        if (prevProps.canvas !== this.props.canvas || prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
            this.update();
        }
    }
    update() {
        const canvas = this.ref.current!;
        const width = (canvas.width = this.props.width || this.props.canvas.width);
        const height = (canvas.height = this.props.height || this.props.canvas.height);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(this.props.canvas, 0, 0, width, height);
    }
    override render(): ReactNode {
        return <canvas ref={this.ref} />;
    }
}
