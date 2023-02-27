import { useState, useEffect } from "react";
import Spiccato from 'spiccato';
import { ManagerNotFoundError } from "spiccato/errors";
export default function useSpiccatoState(spiccatoID, dependencies) {
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
    useEffect(() => {
        const callbacks = new Map();
        let callback;
        for (let dep of dependencies) {
            callback = (payload) => {
                var _a;
                const key = (_a = payload.path) === null || _a === void 0 ? void 0 : _a[0];
                if (!!key) {
                    setState((prevState) => {
                        return Object.assign(Object.assign({}, prevState), { [key]: payload.value });
                    });
                }
            };
            manager.addEventListener(dep, callback);
            callbacks.set(dep, callback);
        }
        return () => {
            for (let [path, callback] of callbacks.entries()) {
                manager.removeEventListener(path, callback);
            }
        };
    }, []);
    return { state, manager };
}
