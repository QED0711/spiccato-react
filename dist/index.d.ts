import Spiccato from 'spiccato';
import { managerID, StateObject } from "spiccato/types";
export default function useSpiccatoState(spiccatoID: managerID, dependencies: string[] | string[][]): {
    state: StateObject;
    manager: Spiccato;
};
