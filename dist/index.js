import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import Spiccato from 'spiccato';
import { ManagerNotFoundError } from "spiccato/errors";
/**************** HOOK IMPLEMENTATION ****************/
export function useSpiccatoState(spiccatoID, dependencies) {
    // retrieve spiccato manager
    const manager = Spiccato.getManagerById(spiccatoID);
    if (!manager) {
        throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${spiccatoID}"`);
    }
    ;
    // create a local state object and initialize based on dependencies array
    const [state, setState] = useState(function () {
        const initialState = {};
        for (let dep of dependencies) {
            if (Array.isArray(dep) && dep.length) {
                initialState[dep[dep.length - 1]] = manager.getStateFromPath(dep);
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
                    var _a;
                    const key = (_a = payload.path) === null || _a === void 0 ? void 0 : _a[0];
                    if (!!key) {
                        setState((prevState) => {
                            return Object.assign(Object.assign({}, prevState), { [key]: payload.value });
                        });
                    }
                };
                if (typeof dep === "string") {
                    manager.addEventListener(`on_${dep}_update`, callback);
                }
                else if (Array.isArray(dep)) {
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
            const initialState = {};
            if (!Array.isArray(managerDefinitions))
                managerDefinitions = [managerDefinitions];
            for (let def of managerDefinitions) {
                const manager = Spiccato.getManagerById(def.managerID);
                if (!manager)
                    throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${def.managerID}"`);
                initialState[def.managerID] = {};
                const curState = initialState[def.managerID];
                for (let dep of def.dependencies) {
                    if (Array.isArray(dep) && dep.length) {
                        curState[dep[dep.length - 1]] = manager.getStateFromPath(dep);
                    }
                    else if (typeof dep === "string") {
                        curState[dep] = manager.getStateFromPath(dep);
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
                const manager = Spiccato.getManagerById(def.managerID);
                if (!manager)
                    throw new ManagerNotFoundError(`No Spiccato state manager found with ID "${def.managerID}"`);
                for (let dep of def.dependencies) {
                    if (dep === "*") {
                        callback = (payload) => {
                            console.log("SUBSCRIBE", payload);
                            // setState logic here
                        };
                        manager.addEventListener("update", callback);
                        callbacks.set({ manager, path: 'update' }, callback);
                    }
                    else {
                        callback = (payload) => {
                            var _a;
                            const key = (_a = payload.path) === null || _a === void 0 ? void 0 : _a[0];
                            if (!!key) {
                                console.log("SUBSCRIBE", payload);
                                // setState logic here
                            }
                        };
                        if (typeof dep === "string") {
                            manager.addEventListener(`on_${dep}_update`, callback);
                        }
                        else if (Array.isArray(dep)) {
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
            console.log("PAST MEMO");
            return _jsx(Component, Object.assign({}, props, state));
        }, [state]);
    };
    return SpiccatoSubscriber;
};
