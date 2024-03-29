import React from "react";
import Spiccato from 'spiccato';
import { managerID, StateObject } from "spiccato/types";
import { PathNode } from "spiccato/utils/helpers";
type spiccatoManagerInstance = Spiccato;
/**************** HOOK IMPLEMENTATION ****************/
export declare function useSpiccatoState(spiccatoManager: managerID | spiccatoManagerInstance, dependencies: string[] | string[][] | PathNode[]): {
    state: StateObject;
    manager: Spiccato;
};
/**************** HOC IMPLEMENTATION ****************/
interface ManagerDefinition {
    spiccatoManager: managerID | spiccatoManagerInstance;
    dependencies: Array<string | string[]>;
}
export declare const subscribe: (Component: React.ComponentType, managerDefinitions: ManagerDefinition | ManagerDefinition[]) => (props: {
    [key: string]: any;
}) => JSX.Element;
export {};
