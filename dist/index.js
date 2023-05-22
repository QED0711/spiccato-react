import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import Spiccato from 'spiccato';
import { ManagerNotFoundError } from "spiccato/errors";
import { PathNode } from "spiccato/utils/helpers";
/**************** HOOK IMPLEMENTATION ****************/
export function useSpiccatoState(spiccatoManager, dependencies) {
    // retrieve spiccato manager
    let manager;
    if (typeof spiccatoManager === "string") {
        manager = Spiccato.getManagerById(spiccatoManager);
        if (!manager) {
            throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${spiccatoManager}"`);
        }
        ;
    }
    else {
        manager = spiccatoManager;
    }
    // create a local state object and initialize based on dependencies array
    const [state, setState] = useState(function () {
        const initialState = {};
        for (let dep of dependencies) {
            if (Array.isArray(dep) && dep.length) {
                let curPath = initialState;
                for (let i = 0; i < dep.length; i++) {
                    if (i === dep.length - 1) {
                        curPath[dep[i]] = manager.getStateFromPath(dep);
                    }
                    else {
                        curPath[dep[i]] = {};
                        curPath = curPath[dep[i]];
                    }
                }
            }
            else if (typeof dep === "string") {
                initialState[dep] = manager.getStateFromPath(dep);
            }
        }
        return initialState;
    });
    // Setup event listeners to update local state
    useEffect(() => {
        const callbacks = new Map();
        let callback;
        for (let dep of dependencies) {
            if (dep === "*") {
                callback = (payload) => {
                    var _a;
                    setState((_a = payload.state) !== null && _a !== void 0 ? _a : {});
                };
                manager.addEventListener("update", callback);
                callbacks.set("*", callback);
            }
            else {
                callback = (payload) => {
                    if ("path" in payload) {
                        const { path, value } = payload;
                        if (!!path && path.length > 1) { // handle nested state update
                            setState((prevState) => {
                                const state = Object.assign({}, prevState);
                                let update = state;
                                for (let i = 0; i < path.length; i++) {
                                    if (i === path.length - 1) {
                                        update[path[i]] = value;
                                    }
                                    else {
                                        update = update[path[i]];
                                    }
                                }
                                return state;
                            });
                        }
                        else if (!!path && path.length === 1) {
                            setState((prevState) => {
                                return Object.assign(Object.assign({}, prevState), { [path[0]]: value });
                            });
                        }
                    }
                };
                if (typeof dep === "string") {
                    manager.addEventListener(`on_${dep}_update`, callback);
                }
                else if (Array.isArray(dep) || dep instanceof PathNode) {
                    manager.addEventListener(dep, callback);
                }
                callbacks.set(dep, callback);
            }
        }
        return () => {
            for (let [path, callback] of callbacks.entries()) {
                manager.removeEventListener(path, callback);
            }
        };
    }, []);
    return { state, manager };
}
export const subscribe = (Component, managerDefinitions) => {
    const SpiccatoSubscriber = (props) => {
        const [state, setState] = useState(function () {
            const initialState = { spiccatoState: {} };
            if (!Array.isArray(managerDefinitions))
                managerDefinitions = [managerDefinitions];
            for (let def of managerDefinitions) {
                let manager, managerInstanceID;
                if (typeof def.spiccatoManager === "string") {
                    manager = Spiccato.getManagerById(def.spiccatoManager);
                    if (!manager)
                        throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${def.spiccatoManager}"`);
                    managerInstanceID = def.spiccatoManager;
                }
                else {
                    manager = def.spiccatoManager;
                    if (!manager)
                        throw new ManagerNotFoundError('Provided `managerInstance` is not a valid spiccato state manager instance');
                    managerInstanceID = manager.id;
                }
                if (manager === undefined)
                    throw new ManagerNotFoundError("Provided `managerInstance` could not retrieve a valid spiccato state manager");
                initialState.spiccatoState[managerInstanceID] = {};
                const curState = initialState.spiccatoState[managerInstanceID];
                for (let dep of def.dependencies) {
                    if (Array.isArray(dep) && dep.length) {
                        if (dep.length === 1 && dep[0] === "*") {
                            initialState.spiccatoState[managerInstanceID] = manager.state;
                        }
                        else { // Handle updating nested state
                            let curPath = curState;
                            for (let i = 0; i < dep.length; i++) {
                                if (i === dep.length - 1) {
                                    curPath[dep[i]] = manager.getStateFromPath(dep);
                                }
                                else {
                                    curPath[dep[i]] = {};
                                    curPath = curPath[dep[i]];
                                }
                            }
                        }
                    }
                    else if (typeof dep === "string") {
                        if (dep === "*") {
                            initialState.spiccatoState[managerInstanceID] = manager.state;
                        }
                        else {
                            curState[dep] = manager.getStateFromPath(dep);
                        }
                    }
                }
            }
            return initialState;
        });
        useEffect(() => {
            if (!Array.isArray(managerDefinitions))
                managerDefinitions = [managerDefinitions];
            const callbacks = new Map();
            let callback;
            for (let def of managerDefinitions) {
                let manager, managerInstanceID;
                if (typeof def.spiccatoManager === "string") {
                    manager = Spiccato.getManagerById(def.spiccatoManager);
                    if (!manager)
                        throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${def.spiccatoManager}"`);
                    managerInstanceID = def.spiccatoManager;
                }
                else {
                    manager = def.spiccatoManager;
                    if (!manager)
                        throw new ManagerNotFoundError('Provided `managerInstance` is not a valid spiccato state manager instance');
                    managerInstanceID = manager.id;
                }
                console.log({ managerInstanceID });
                if (manager === undefined)
                    throw new ManagerNotFoundError("Provided `managerInstance` could not retrieve a valid spiccato state manager");
                for (let dep of def.dependencies) {
                    if (dep === "*" || (dep.length === 1 && dep[0] === "*")) {
                        callback = (payload) => {
                            setState(state => {
                                var _a;
                                state.spiccatoState[managerInstanceID] = (_a = payload.state) !== null && _a !== void 0 ? _a : {};
                                return Object.assign({}, state);
                            });
                        };
                        manager.addEventListener("update", callback);
                        callbacks.set({ manager, path: 'update' }, callback);
                    }
                    else {
                        callback = (payload) => {
                            if ("path" in payload) {
                                const { path, value } = payload;
                                if (!!path && path.length > 1) {
                                    setState(prevState => {
                                        const state = prevState.spiccatoState[managerInstanceID];
                                        let update = state;
                                        for (let i = 0; i < path.length; i++) {
                                            if (i === path.length - 1) {
                                                update[path[i]] = value;
                                            }
                                            else {
                                                update = update[path[i]];
                                            }
                                        }
                                        return { spiccatoState: Object.assign({}, prevState.spiccatoState) };
                                    });
                                }
                                else if (!!path && path.length === 1) {
                                    setState(prevState => {
                                        var _a;
                                        prevState.spiccatoState[managerInstanceID] = Object.assign(Object.assign({}, ((_a = prevState.spiccatoState[managerInstanceID]) !== null && _a !== void 0 ? _a : {})), { [path[0]]: value });
                                        return Object.assign({}, prevState);
                                    });
                                }
                            }
                        };
                        if (typeof dep === "string") {
                            manager.addEventListener(`on_${dep}_update`, callback);
                        }
                        else if (Array.isArray(dep) || dep instanceof PathNode) {
                            manager.addEventListener(dep, callback);
                        }
                        callbacks.set({ manager, path: dep }, callback);
                    }
                }
            }
            return () => {
                for (let [managerPathDef, callback] of callbacks.entries()) {
                    managerPathDef.manager.removeEventListener(managerPathDef.path, callback);
                }
            };
        }, []);
        return useMemo(function () {
            return _jsx(Component, Object.assign({}, props, state));
        }, [state, props]);
    };
    return SpiccatoSubscriber;
};
