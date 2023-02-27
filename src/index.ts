import { useState, useEffect } from "react";
import Spiccato from 'spiccato';
import { ManagerNotFoundError } from "spiccato/errors"
import { EventPayload, managerID, StateObject } from "spiccato/types";

export default function useSpiccatoState(
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
                initialState[dep[dep.length - 1]] = manager.getStateFromPath(dep)
            } else if (typeof dep === "string") {
                initialState[dep] = manager.getStateFromPath(dep);
            }
        }
        return initialState;
    })


    useEffect(() => {
        const callbacks: Map<string | string[], Function> = new Map();

        let callback: Function
        for (let dep of dependencies) {
            callback = (payload: EventPayload) => {
                const key = payload.path?.[0];
                if (!!key) {
                    setState((prevState: StateObject) => {
                        return { ...prevState, [key]: payload.value }
                    })
                }
            }
            manager.addEventListener(dep, callback);
            callbacks.set(dep, callback)

        }

        return () => {
            for (let [path, callback] of callbacks.entries()) {
                manager.removeEventListener(path, callback)
            }
        }
    }, [])

    return { state, manager };
}