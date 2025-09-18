import { defineStore } from 'pinia';

export const useProduccionStore = defineStore('produccion', {
  state: () => ({
    corte: {
      telaExtendida: false,
      unidadesCortadas: 0,
      unidadesNumeradas: 0,
      unidadesFusionadas: 0,
    },
    totalUnidades: 0, // Total de unidades de toda la producción
  }),
  actions: {
    // Acciones para actualizar los valores de cada etapa
    setTelaExtendida(value) {
      this.corte.telaExtendida = value;
      this.updateTotalUnidades();
    },
    setUnidadesCortadas(value) {
      this.corte.unidadesCortadas = value;
      this.updateTotalUnidades();
    },
    setUnidadesNumeradas(value) {
      this.corte.unidadesNumeradas = value;
      this.updateTotalUnidades();
    },
    setUnidadesFusionadas(value) {
      this.corte.unidadesFusionadas = value;
      this.updateTotalUnidades();
    },
    updateTotalUnidades() {
      // Calcula el total de unidades con base en cada etapa
      this.totalUnidades =
        this.corte.unidadesCortadas +
        this.corte.unidadesNumeradas +
        this.corte.unidadesFusionadas;
    },
  },
});
