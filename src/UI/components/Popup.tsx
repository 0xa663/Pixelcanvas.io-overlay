import React, { createRef } from "react";
import styled from "styled-components";
import { createRoot } from "react-dom/client";

const Box = styled.div`
    min-width: 250px;
    min-height: 50px;
    max-width: fit-content;
    max-height: fit-content;
    margin: 15px auto 15px auto;
    padding: 10px;
    pointer-events: all;
    touch-action: auto;
    
    background-color: rgba(255, 255, 255, 0.75);
    color: rgb(10, 10, 10);
    border-radius: 12px;
    border: 2px solid black;
`;

const P = styled.p`
    white-space: pre-warp;
`;

const BtnFlex = styled.div`
    display: flex;
`;

const Input = styled.input`
    margin: 2px;
    padding: 5px;
    outline: none !important;

    background-color: rgba(255, 255, 255, 0.75);
    color: rgb(10, 10, 10);
    border-radius: 12px;
    border: 2px solid black;
`;

const Btn = styled.button`
    background-color: rgba(255, 255, 255, 0.75);
    color: rgb(10, 10, 10);
    border-radius: 12px;
    border: 2px solid black;
    
    width: 100%;
    border-radius: none;
    margin: 2px;
    padding: 2px;
    outline: none !important;
    &:hover {
        background-color: rgba(158, 158, 158, 0.75);
    }
    transition: background-color 250ms;
`;

export class Popup {
    private static _ref: HTMLDivElement;
    private static active?: () => void;
    private static root: any;
    static alert(message: string, title?: string) {
        return new Promise<void>(resolve => {
            Popup.clear();
            const onClick = () => {
                resolve();
                this.active = undefined;
                this.clear();
            };
            this.active = onClick;

            Popup.renderContent(
                <div>
                    <h5>{title || `${location.host} says`}</h5>
                    <P>{message}</P>
                    <Btn onClick={() => onClick()}>OK</Btn>
                </div>,
            );
        });
    }
    static async confirm(message: string, title?: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            Popup.clear();
            const onClick = (value: boolean) => {
                resolve(value);
                this.active = undefined;
                this.clear();
            };
            this.active = () => onClick(false);

            Popup.renderContent(
                <div>
                    <h5>{title || `${location.host} says`}</h5>
                    <P>{message}</P>
                    <BtnFlex>
                        <Btn onClick={() => onClick(true)}>OK</Btn>
                        <Btn onClick={() => onClick(false)}>Cancel</Btn>
                    </BtnFlex>
                </div>,
            );
        });
    }
    static async prompt(message?: string, _default?: string, title?: string) {
        return new Promise<string | null>(resolve => {
            Popup.clear();
            const onClick = (value: string | null) => {
                resolve(value);
                this.active = undefined;
                this.clear();
            };
            this.active = () => onClick("");
            const inputRef = createRef<HTMLInputElement>();
            Popup.renderContent(
                <div>
                    <h5>{title || `${location.host} says`}</h5>
                    <P>{message}</P>
                    <Input ref={inputRef} type='text' />
                    <BtnFlex>
                        <Btn onClick={() => onClick(inputRef.current && inputRef.current.value)}>OK</Btn>
                        <Btn onClick={() => onClick(null)}>Cancel</Btn>
                    </BtnFlex>
                </div>,
            );
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.value = _default || "";
                inputRef.current.addEventListener("keyup", event => {
                    if (event.key.toLowerCase() === "enter") {
                        if (inputRef.current) {
                            onClick(inputRef.current.value);
                        }
                    }
                });
            } else {
                console.error("Missing reference");
            }
        });
    }
    static custom(
        element: JSX.Element,
        buttons?: {
            content: string | JSX.Element;
            click: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void | boolean | null | Promise<any>;
        }[],
    ) {
        return new Promise<void>(resolve => {
            Popup.clear();
            const onClick = () => {
                this.active = undefined;
                resolve();
                this.clear();
            };
            this.active = () => onClick();
            Popup.renderContent(
                <div>
                    {element}
                    <BtnFlex>
                        {buttons
                            ? buttons.map((e, i) => (
                                <Btn
                                    key={i}
                                    onClick={async ev => {
                                        const raw = e.click(ev);
                                        let stayActive: any;
                                        if (raw instanceof Promise) {
                                            stayActive = await raw;
                                        } else {
                                            stayActive = raw;
                                        }

                                        if (!stayActive) {
                                            this.active = undefined;
                                            this.clear();
                                            resolve();
                                        }
                                    }}
                                >
                                    {e.content}
                                </Btn>
                            ))
                            : null}
                    </BtnFlex>
                </div>,
            );
        });
    }
    static close() {
        this.clear();
    }

    private static clear() {
        if (this.root) {
            this.root.unmount();
            this.root = undefined;
        }
        // while (Popup.ref.children.length) {
        //     const child = Popup._ref.children[0];
        //     child.parentNode.removeChild(child);
        // }
        const style = Popup.ref.style;
        style.pointerEvents = "none";
        style.touchAction = "none";
        style.backgroundColor = "rgba(0, 0, 0, 0)";
        if (this.active) {
            this.active();
        }
        this.active = undefined;
    }

    private static renderContent(content: JSX.Element) {
        const rootElement = Popup.createBase(content);
        this.root = createRoot(Popup.ref);
        this.root.render(rootElement);
        const style = Popup.ref.style;
        style.pointerEvents = "all";
        style.touchAction = "auto";
        style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    }

    private static createBase(content: JSX.Element) {
        return <Box>{content}</Box>;
    }

    private static get ref() {
        if (Popup._ref) {
            return Popup._ref;
        }
        const ref = document.createElement("div");
        document.body.appendChild(ref);
        Popup._ref = ref;
        const style = ref.style;
        style.position = "fixed";
        style.zIndex = `${Number.MAX_SAFE_INTEGER}`;
        style.width = "100%";
        style.height = "100%";
        style.pointerEvents = "none";
        style.touchAction = "none";
        style.backgroundColor = "rgba(0, 0, 0, 0)";
        style.transition = "background-color 1s";
        style.overflowY = "auto";
        style.overflowX = "hidden";
        return ref;
    }
}
