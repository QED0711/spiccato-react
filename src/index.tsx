import React, { useState, useEffect, useMemo } from "react";
import Spiccato from 'spiccato';
import { ManagerNotFoundError } from "spiccato/errors";
import { EventPayload, managerID, SpiccatoInstance, StateObject, StatePath, StateSchema, SpiccatoExtended } from "spiccato/types";
import { PathNode } from "spiccato/utils/helpers";

type SpiccatoManagerInstance = Spiccato;

export function useSpiccatoState<
    State extends StateSchema = {},
    Instance = SpiccatoInstance<any, any, any, any> | SpiccatoExtended<any, any>
>(
    spiccatoManager: managerID | SpiccatoManagerInstance,
    dependencies: string[] | string[][] | PathNode[] | StatePath[],
): { state: State, manager: Instance } {
    // retrieve spiccato manager
    let manager: Spiccato;
    if (typeof spiccatoManager === "string") {
        manager = Spiccato.getManagerById(spiccatoManager);
        if (!manager) {
            throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${spiccatoManager}"`)
        };
    } else {
        manager = spiccatoManager;
    }

    // create a local state object and initialize based on dependencies array
    const [state, setState] = useState<StateObject>(function () {
        const initialState: StateObject = {};
        for (let dep of dependencies) {

            if (dep instanceof PathNode) dep = dep.__$path;

            if (Array.isArray(dep) && dep.length) {
                let curPath = initialState;
                for (let i = 0; i < dep.length; i++) {
                    if (i === dep.length - 1) {
                        curPath[dep[i]] = manager.getStateFromPath(dep)
                    } else {
                        curPath[dep[i]] = {}
                        curPath = curPath[dep[i]]
                    }
                }
            } else if (typeof dep === "string") {
                initialState[dep] = manager.getStateFromPath(dep);
            }
        }
        return initialState;
    })

    // Setup event listeners to update local state
    useEffect(() => {
        const callbacks: Map<string | string[] | PathNode | StatePath, Function> = new Map();

        let callback: Function;
        for (let dep of dependencies) {
            if (dep === "*") {
                callback = (payload: EventPayload) => {
                    setState(payload.state ?? {});
                }
                manager.addEventListener("update", callback);
                callbacks.set("*", callback)
            } else {
                callback = (payload: EventPayload) => {
                    if ("path" in payload) {
                        const { path, value } = payload;
                        if (!!path && path.length > 1) { // handle nested state update
                            setState((prevState: StateObject) => {
                                const state = { ...prevState };
                                let update = state;
                                for (let i = 0; i < path.length; i++) {
                                    if (i === path.length - 1) {
                                        update[path[i]] = value;
                                    } else {
                                        update = update[path[i]]
                                    }
                                }
                                return state;
                            })
                        } else if (!!path && path.length === 1) {
                            setState((prevState: StateObject) => {
                                return { ...prevState, [path[0]]: value };
                            })
                        }
                    }
                }
                if (typeof dep === "string") {
                    manager.addEventListener(`on_${dep}_update`, callback);
                } else if (Array.isArray(dep) || dep instanceof PathNode) {
                    manager.addEventListener(dep, callback);
                }

                callbacks.set(dep, callback)
            }
        }

        return () => {
            for (let [path, callback] of callbacks.entries()) {
                manager.removeEventListener(path, callback)
            }
        }
    }, [])

    return { state: state as State, manager: manager as Instance };
}


// HOC


interface ManagerDefinition {
    spiccatoManager: managerID | SpiccatoManagerInstance,
    dependencies: Array<string | string[] | PathNode | StatePath>
}

interface ManagerPathDefinition {
    manager: SpiccatoManagerInstance,
    path: string | string[] | PathNode | StatePath
}

export const subscribe = (Component: React.ComponentType<any>, managerDefinitions: ManagerDefinition | ManagerDefinition[]) => {

    const SpiccatoSubscriber = (props: { [key: string]: any }) => {

        const [state, setState] = useState<{ [key: string]: StateObject }>(function () {
            const initialState: { [key: string]: { [key: string]: StateObject } } = { spiccatoState: {} };

            if (!Array.isArray(managerDefinitions)) managerDefinitions = [managerDefinitions];
            for (let def of managerDefinitions) {

                let manager,
                    managerInstanceID

                if (typeof def.spiccatoManager === "string") {
                    manager = Spiccato.getManagerById(def.spiccatoManager);
                    if (!manager) throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${def.spiccatoManager}"`);
                    managerInstanceID = def.spiccatoManager;
                } else {
                    manager = def.spiccatoManager;
                    if (!manager) throw new ManagerNotFoundError('Provided `managerInstance` is not a valid spiccato state manager instance')
                    managerInstanceID = manager.id;
                }
                if (manager === undefined) throw new ManagerNotFoundError("Provided `managerInstance` could not retrieve a valid spiccato state manager");

                initialState.spiccatoState[managerInstanceID] = {};
                const curState: StateObject = initialState.spiccatoState[managerInstanceID];

                for (let dep of def.dependencies) {
                    if ((Array.isArray(dep) && dep.length) || dep instanceof PathNode) {
                        if (dep instanceof PathNode) { dep = dep.__$path }; // access the underlying string[] path in the pathNode
                        if (dep.length === 1 && dep[0] === "*") {
                            initialState.spiccatoState[managerInstanceID] = manager.state;
                        } else { // Handle updating nested state
                            let curPath = curState;
                            for (let i = 0; i < dep.length; i++) {
                                if (i === dep.length - 1) {
                                    curPath[dep[i]] = manager.getStateFromPath(dep);
                                } else {
                                    curPath[dep[i]] = {};
                                    curPath = curPath[dep[i]];
                                }
                            }
                        }
                    } else if (typeof dep === "string") {
                        if (dep === "*") {
                            initialState.spiccatoState[managerInstanceID] = manager.state;
                        } else {
                            curState[dep] = manager.getStateFromPath(dep)
                        }
                    }
                }
            }
            return initialState;
        })

        useEffect(() => {

            if (!Array.isArray(managerDefinitions)) managerDefinitions = [managerDefinitions];

            const callbacks: Map<ManagerPathDefinition, Function> = new Map();
            let callback: Function;

            for (let def of managerDefinitions) {

                let manager,
                    managerInstanceID: managerID

                if (typeof def.spiccatoManager === "string") {
                    manager = Spiccato.getManagerById(def.spiccatoManager);
                    if (!manager) throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${def.spiccatoManager}"`);
                    managerInstanceID = def.spiccatoManager;
                } else {
                    manager = def.spiccatoManager;
                    if (!manager) throw new ManagerNotFoundError('Provided `managerInstance` is not a valid spiccato state manager instance')
                    managerInstanceID = manager.id;
                }
                if (manager === undefined) throw new ManagerNotFoundError("Provided `managerInstance` could not retrieve a valid spiccato state manager");

                for (let dep of def.dependencies) {
                    if (dep instanceof PathNode) { dep = dep.__$path }; // access the underlying string[] path;

                    if (dep === "*" || (!(dep instanceof PathNode) && (dep as any).length === 1 && (dep as any)[0] === "*")) { // subscribe to all changes
                        callback = (payload: EventPayload) => {
                            setState(state => {
                                state.spiccatoState[managerInstanceID] = payload.state ?? {};
                                return { ...state };
                            })
                        }
                        manager.addEventListener("update", callback);
                        callbacks.set({ manager, path: 'update' }, callback)
                    } else {
                        callback = (payload: EventPayload) => {
                            if ("path" in payload) {
                                const { path, value } = payload;
                                if (!!path && path.length > 1) {
                                    setState(prevState => {
                                        const state = prevState.spiccatoState[managerInstanceID];
                                        let update = state;
                                        for (let i = 0; i < path.length; i++) {
                                            if (i === path.length - 1) {
                                                update[path[i]] = value;
                                            } else {
                                                update = update[path[i]];
                                            }
                                        }
                                        return { spiccatoState: { ...prevState.spiccatoState } }
                                    })
                                } else if (!!path && path.length === 1) {
                                    setState(prevState => {
                                        prevState.spiccatoState[managerInstanceID] = { ...(prevState.spiccatoState[managerInstanceID] ?? {}), [path[0]]: value }
                                        return { ...prevState }
                                    })
                                }
                            }
                        }

                        if (typeof dep === "string") {
                            manager.addEventListener(`on_${dep}_update`, callback);
                        } else if (Array.isArray(dep) || (dep as any) instanceof PathNode) {
                            manager.addEventListener(dep, callback);
                        }
                        callbacks.set({ manager, path: dep }, callback)
                    }
                }
            }

            return () => {
                for (let [managerPathDef, callback] of callbacks.entries()) {
                    managerPathDef.manager.removeEventListener(managerPathDef.path, callback)
                }
            }

        }, [])

        return useMemo(function () {
            return <Component {...props} {...state} />;
        }, [state, props])
    }

    return SpiccatoSubscriber;

}