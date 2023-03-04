import React, { useState, useEffect, useMemo } from "react";
import Spiccato from 'spiccato';
import { ManagerNotFoundError, ReservedStateKeyError } from "spiccato/errors";
import { EventPayload, managerID, StateObject } from "spiccato/types";



/**************** HOOK IMPLEMENTATION ****************/
export function useSpiccatoState(
    spiccatoID: managerID,
    dependencies: string[] | string[][],
) {
    // retrieve spiccato manager
    const manager = Spiccato.getManagerById(spiccatoID);
    if (!manager) {
        throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${spiccatoID}"`)
    };

    // create a local state object and initialize based on dependencies array
    const [state, setState] = useState<StateObject>(function () {
        const initialState: StateObject = {};
        for (let dep of dependencies) {
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
        const callbacks: Map<string | string[], Function> = new Map();

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
                } else if (Array.isArray(dep)) {
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

    return { state, manager };
}




/**************** HOC IMPLEMENTATION ****************/
interface ManagerDefinition {
    managerID: managerID,
    dependencies: string[] | string[][],
}

interface ManagerPathDefinition {
    manager: Spiccato,
    path: string | string[]
}

export const subscribe = (Component: React.ComponentType, managerDefinitions: ManagerDefinition | ManagerDefinition[]) => {

    const SpiccatoSubscriber = (props: { [key: string]: any }) => {
        const [state, setState] = useState<{ [key: string]: StateObject }>(function () {
            const initialState: { [key: string]: { [key: string]: StateObject } } = { spiccatoState: {} };

            if (!Array.isArray(managerDefinitions)) managerDefinitions = [managerDefinitions];
            for (let def of managerDefinitions) {

                const manager = Spiccato.getManagerById(def.managerID);
                if (!manager) throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${def.managerID}"`);

                initialState.spiccatoState[def.managerID] = {};
                const curState: StateObject = initialState.spiccatoState[def.managerID];

                for (let dep of def.dependencies) {
                    if (Array.isArray(dep) && dep.length) {
                        if (dep.length === 1 && dep[0] === "*") {
                            initialState.spiccatoState[def.managerID] = manager.state;
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
                            initialState.spiccatoState[def.managerID] = manager.state;
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
                const manager = Spiccato.getManagerById(def.managerID);
                if (!manager) throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${def.managerID}"`);

                for (let dep of def.dependencies) {
                    if (dep === "*" || (dep.length === 1 && dep[0] === "*")) {
                        callback = (payload: EventPayload) => {
                            setState(state => {
                                state.spiccatoState[def.managerID] = payload.state ?? {};
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
                                        const state = prevState.spiccatoState[def.managerID];
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
                                        prevState.spiccatoState[def.managerID] = { ...(prevState.spiccatoState[def.managerID] ?? {}), [path[0]]: value }
                                        return {...prevState}
                                    })
                                }
                            }
                        }
                        if (typeof dep === "string") {
                            manager.addEventListener(`on_${dep}_update`, callback);
                        } else if (Array.isArray(dep)) {
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