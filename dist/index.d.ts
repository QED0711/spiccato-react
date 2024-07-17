import React from "react";
import Spiccato from 'spiccato';
import { managerID, SpiccatoInstance, StatePath, StateSchema, SpiccatoExtended } from "spiccato/types";
import { PathNode } from "spiccato/utils/helpers";
type SpiccatoManagerInstance = Spiccato;
export declare function useSpiccatoState<State extends StateSchema = {}, Instance = SpiccatoInstance<any, any, any, any> | SpiccatoExtended<any, any>>(spiccatoManager: managerID | SpiccatoManagerInstance, dependencies: string[] | string[][] | PathNode[] | StatePath[]): {
    state: State;
    manager: Instance;
};
interface ManagerDefinition {
    spiccatoManager: managerID | SpiccatoManagerInstance;
    dependencies: Array<string | string[] | PathNode | StatePath>;
}
export declare const subscribe: (Component: React.ComponentType<any>, managerDefinitions: ManagerDefinition | ManagerDefinition[]) => (props: {
    [key: string]: any;
}) => JSX.Element;
export {};
