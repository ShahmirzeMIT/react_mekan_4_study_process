import {create} from "zustand";


type CanvasStore = {
    list: any[],
    setList: (list: any[]) => void,
}
const apiCanvasStore = create<CanvasStore>((set) => ({
    list: [],
    setList: (list) => set({list})
}));
export const useApiCanvasStore = () => apiCanvasStore(state => state);