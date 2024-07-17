import React from "react";
import Spiccato from 'spiccato';
import { managerID, SpiccatoInstance, StatePath, StateSchema, SpiccatoExtended, GettersSchema, SettersSchema, MethodsSchema, ExtensionSchema } from "spiccato/types";
import { PathNode } from "spiccato/utils/helpers";
type SpiccatoManagerInstance = Spiccato;
export declare function useSpiccatoState<StateSlice extends StateSchema = {}, State extends StateSchema = {}, Getters extends GettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Setters extends SettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Methods extends MethodsSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Extensions extends ExtensionSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}>(spiccatoManager: managerID | SpiccatoManagerInstance, dependencies: string[] | string[][] | PathNode[] | StatePath[]): {
    state: StateSlice;
    manager: SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>;
};
/**************** HOC IMPLEMENTATION ****************/
interface ManagerDefinition {
    spiccatoManager: managerID | SpiccatoManagerInstance;
    dependencies: Array<string | string[]>;
}
export declare const subscribe: (Component: React.ComponentType, managerDefinitions: ManagerDefinition | ManagerDefinition[]) => (props: {
    [key: string]: any;
}) => JSX.Element;
export {};
