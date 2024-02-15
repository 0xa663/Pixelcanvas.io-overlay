import styled from "styled-components";

export const SELECTED_COLOR = "#a8a8a8";

export const Flex = styled.div`
    display: flex;
    flex-direction: row;
`;

export const FlexC = styled.div`
    display: flex;
    flex-direction: column;
`;


export const Btn = styled.button`
    border: 1px solid white;
    font-size: 10pt;

    background-color: rgba(255, 255, 255, 0.75);
    color: rgb(10, 10, 10);
    border-radius: 12px;
    border: 2px solid black;


    margin: 2px;
    display: flex;
    padding: 2px;
    outline: none !important;
    text-decoration: none;

    svg {
        margin: 2pt;
        width: 10pt;
        height: 10pt;
    }
    &:hover {
        background-color: rgba(158, 158, 158, 0.75);
    }
    &:visited {
        text-decoration: none;
    }
    &:disabled {
        color: gray;
        border-color: gray;
        cursor: not-allowed;
    }
    transition: background-color 250ms;
`;

export const Theme = styled.div`
    background-color: rgba(255, 255, 255, 0.75);
    color: rgb(10, 10, 10);
    border: 2px solid black;
    border-radius: 12px;
`

export const Border = styled.div`
    border: 2px solid black;
    border-radius: 12px;
    margin: 5px;
    padding: 5px;
    width: auto;
`;

export const Input = styled.input`
    background-color: rgba(255, 255, 255, 0.75);
    color: rgb(10, 10, 10);
    border: 2px solid black;
    border-radius: 12px;
    padding: 2px;
`;
