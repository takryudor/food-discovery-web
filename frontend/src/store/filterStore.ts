import { create } from "zustand";

interface FilterState {
  selectedConcepts: number[];
  selectedPurposes: number[];
  selectedAmenities: number[];
  selectedBudgetRanges: number[];
  radius: number;
  numberOfPlaces: number;
  setRadius: (value: number) => void;
  setNumberOfPlaces: (value: number) => void;
  toggleConcept: (id: number) => void;
  togglePurpose: (id: number) => void;
  toggleAmenity: (id: number) => void;
  toggleBudgetRange: (id: number) => void;
  clearFilters: () => void;
}

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedConcepts: [],
  selectedPurposes: [],
  selectedAmenities: [],
  selectedBudgetRanges: [],
  radius: 5,
  numberOfPlaces: 5,
  setRadius: (value) => set({ radius: value }),
  setNumberOfPlaces: (value) => set({ numberOfPlaces: value }),
  toggleConcept: (id) =>
    set((state) => ({ selectedConcepts: toggleId(state.selectedConcepts, id) })),
  togglePurpose: (id) =>
    set((state) => ({ selectedPurposes: toggleId(state.selectedPurposes, id) })),
  toggleAmenity: (id) =>
    set((state) => ({ selectedAmenities: toggleId(state.selectedAmenities, id) })),
  toggleBudgetRange: (id) =>
    set((state) => ({
      selectedBudgetRanges: toggleId(state.selectedBudgetRanges, id),
    })),
  clearFilters: () =>
    set({
      selectedConcepts: [],
      selectedPurposes: [],
      selectedAmenities: [],
      selectedBudgetRanges: [],
      radius: 5,
      numberOfPlaces: 5,
    }),
}));
