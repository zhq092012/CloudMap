import { defineStore } from "pinia";

interface WarningState {
  showWarningDialog: boolean;
}

export const useWarningStore = defineStore("warning", {
  state: (): WarningState => ({
    showWarningDialog: false,
  }),

  getters: {
    // isLogin: (state) => Boolean(state.token),
  },

  actions: {
    toggleWarningDialog(show: boolean) {
      this.showWarningDialog = show;
    },
  },

  persist: {
    storage: localStorage,
    pick: [],
  },
});
