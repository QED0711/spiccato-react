import React from "react";
import Spiccato from 'spiccato';
import { managerID, StateObject } from "spiccato/types";
/**************** HOOK IMPLEMENTATION ****************/
export declare function useSpiccatoState(spiccatoID: managerID, dependencies: string[] | string[][]): {
    state: StateObject;
    manager: Spiccato;
};
/**************** HOC IMPLEMENTATION ****************/
interface ManagerDefinition {
    managerID: managerID;
    dependencies: string[] | string[][];
}
export declare const subscribe: (Component: React.ComponentType, managerDefinitions: ManagerDefinition | ManagerDefinition[]) => (props: {
    [key: string]: any;
}) => JSX.Element;
export {};
