import React from "react";
import { Border, Btn, Flex, Input } from "../styles";
import { processNumberEvent } from "../../utils";

interface Props {
    name: string;
    x: number;
    y: number;
    onName: (name: string) => void;
    onY: (y: number) => void;
    onX: (x: number) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export class MuralEditor extends React.Component<Props> {

    render() {
        return <Border>
            <div>
                <span>Name</span> <Input type="text" value={this.props.name} onChange={e => this.props.onName(e.target.value)} />
            </div>
            <div>
                <span>X</span> <Input type="number" value={this.props.x} onChange={e => processNumberEvent(e, this.props.onX)}/>
            </div>
            <div>
                <span>Y</span> <Input type="number" value={this.props.y} onChange={e => processNumberEvent(e, this.props.onY)} />
            </div>
            <Flex>
                <Btn onClick={() => this.props.onConfirm()} style={{flex: 1}}>Confirm</Btn><Btn onClick={() => this.props.onCancel()} style={{flex: 1}}>Cancel</Btn>
            </Flex>
            <small>Overlay does not work on scale -1. To fix that zoom in.</small>
        </Border>;
    }

}