import { defineStore } from "pinia";

interface ComparisonState {
  selectedComparisonId: string | null;
  isComparing: boolean;
}

export const useComparisonStore = defineStore("comparison", {
  state: (): ComparisonState => ({
    selectedComparisonId: null,
    isComparing: false,
  }),

  getters: {
    getSelectedId: (state) => state.selectedComparisonId,
    getIsComparing: (state) => state.isComparing,
  },

  actions: {
    setSelectedComparisonId(id: string | null) {
      this.selectedComparisonId = id;
    },
    setComparingStatus(status: boolean) {
      this.isComparing = status;
    },
    resetComparison() {
      this.selectedComparisonId = null;
      this.isComparing = false;
    },
  },

  persist: {
    storage: localStorage,
    pick: ["selectedComparisonId"],
  },
});
