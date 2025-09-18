// stores/ordenStore.js
import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';

export const useOrdenStore = defineStore('ordenStore', () => {
  const ordenes = ref([]);
  const orden = reactive({
    id: '',
    consecutivo: '',
    fecha: '',
    fechaInicio: '',
    fechaEstimada: '',
    encargado: '',
    proveedor: '',
    detalles: [],
    referenciaPorDefecto: '',
    totalCantidad: 0,
    // ¡IMPORTANTE! Asegúrate de que esto siempre esté aquí, incluso si está vacío
    cantidadesPorProceso: {},
    estadoCorte: {
      telaExtendida: false,
      aplicaExtension: false,
      aplicaCorte: true, // Por defecto aplica
      aplicaNumeracion: true, // Por defecto aplica
      aplicaFusion: true, // Por defecto aplica
      unidadesCortadas: [],
      unidadesNumeradas: [],
      unidadesFusionadas: [],
      unidadesExtendidasPorColor: [],
    },
    estadoPlanta: {
      aplicaDelantero: true, // Por defecto aplica
      aplicaTrasero: true, // Por defecto aplica
      aplicaEnsamble: true, // Por defecto aplica
      unidadesDelantero: [],
      unidadesTrasero: [],
      unidadesEnsamble: [],
    },
  });

  const ordenSeleccionada = ref(null);
  const LOCAL_STORAGE_KEY = 'misOrdenesDeProduccion';

  function generarIdUnico() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      console.warn("crypto.randomUUID no disponible, usando fallback simple para IDs. Considera usar la librería 'uuid'.");
      return `orden-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
  }
  async function cargarOrdenes() {
    try {
      const { data, error } = await supabase.rpc('consultar_ordenes');
      if (error) throw error;

      // La función devuelve un JSONB -> asegúrate de que sea array
      ordenes.value = data;
      console.log('✅ Órdenes cargadas desde Supabase:', ordenes.value);

    } catch (error) {
      console.error('❌ Error cargando órdenes desde Supabase:', error.message);
    }
  }
  function guardarEnLocalStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ordenes.value));
      console.log('✅ Órdenes guardadas en localStorage.');
    } catch (e) {
      console.error('❌ Error al guardar órdenes en localStorage:', e);
    }
  }

  function guardarOrden(ordenParaGuardar) {
    console.log('[OrdenStore] Intentando guardar/actualizar orden:', ordenParaGuardar);

    // Si la orden no tiene un ID, se considera nueva y se le asigna uno.
    if (!ordenParaGuardar.id) {
      ordenParaGuardar.id = generarIdUnico();
    }

    // Clonar la orden para asegurar la reactividad y evitar mutaciones directas
    // Asegura que `cantidadesPorProceso` sea un objeto, incluso si llega como `undefined` o `null`
    const ordenClonada = {
      ...ordenParaGuardar,
      cantidadesPorProceso: ordenParaGuardar.cantidadesPorProceso ? { ...ordenParaGuardar.cantidadesPorProceso } : {},
      estadoCorte: ordenParaGuardar.estadoCorte ? {
        telaExtendida: false,
        aplicaExtension: false,
        aplicaCorte: true, // Por defecto aplica
        aplicaNumeracion: true, // Por defecto aplica
        aplicaFusion: true, // Por defecto aplica
        unidadesCortadas: [],
        unidadesNumeradas: [],
        unidadesFusionadas: [],
        unidadesExtendidasPorColor: [],
        ...ordenParaGuardar.estadoCorte // Mantener valores existentes
      } : {
        telaExtendida: false,
        aplicaExtension: false,
        aplicaCorte: true, // Por defecto aplica
        aplicaNumeracion: true, // Por defecto aplica
        aplicaFusion: true, // Por defecto aplica
        unidadesCortadas: [],
        unidadesNumeradas: [],
        unidadesFusionadas: [],
        unidadesExtendidasPorColor: [],
      },
      estadoPlanta: ordenParaGuardar.estadoPlanta ? {
        aplicaDelantero: true, // Por defecto aplica
        aplicaTrasero: true, // Por defecto aplica
        aplicaEnsamble: true, // Por defecto aplica
        unidadesDelantero: [],
        unidadesTrasero: [],
        unidadesEnsamble: [],
        ...ordenParaGuardar.estadoPlanta // Mantener valores existentes
      } : {
        aplicaDelantero: true, // Por defecto aplica
        aplicaTrasero: true, // Por defecto aplica
        aplicaEnsamble: true, // Por defecto aplica
        unidadesDelantero: [],
        unidadesTrasero: [],
        unidadesEnsamble: [],
      },
    };

    const index = ordenes.value.findIndex(o => o.id === ordenClonada.id);
    if (index !== -1) {
      ordenes.value[index] = ordenClonada; // Reemplaza la orden existente

      // Si la orden actualizada es la orden seleccionada, actualizar también la referencia
      if (ordenSeleccionada.value && ordenSeleccionada.value.id === ordenClonada.id) {
        ordenSeleccionada.value = ordenClonada;
      }

      console.log('[OrdenStore] Orden existente actualizada.', ordenClonada);
    } else {
      ordenes.value.push(ordenClonada); // Añade la nueva orden
      console.log('[OrdenStore] Nueva orden añadida.', ordenClonada);
    }
    guardarEnLocalStorage();
  }

  function eliminarOrden(ordenId) {
    console.log('[OrdenStore] Intentando eliminar orden con ID:', ordenId);
    ordenes.value = ordenes.value.filter(o => o.id !== ordenId);
    guardarEnLocalStorage();
    console.log('[OrdenStore] Orden eliminada.');
  }

  function obtenerOrdenPorId(id) {
    const encontrada = ordenes.value.find(o => o.id === id);
    if (encontrada) {
      Object.assign(orden, JSON.parse(JSON.stringify(encontrada)));
      console.log('🔍 Orden cargada en buffer:', encontrada);
    } else {
      console.warn(`⚠️ Orden con ID ${id} no encontrada`);
      limpiarOrden();
    }
    return encontrada;
  }

  function actualizarOrden(datos) {
    Object.assign(orden, datos);
    console.log('✏�� Orden (buffer) actualizada:', orden);
  }

  function seleccionarOrden(nuevaOrdenSeleccionada) {
    ordenSeleccionada.value = nuevaOrdenSeleccionada;
    if (nuevaOrdenSeleccionada) {
      console.log('📌 Orden seleccionada:', nuevaOrdenSeleccionada.id);
    } else {
      console.log('📌 Orden deseleccionada');
    }
  }

  function actualizarEstadoCorte(ordenId, estadoParcial) {
    const index = ordenes.value.findIndex(o => o.id === ordenId);
    if (index !== -1) {
      // Actualizar directamente para mejor reactividad
      ordenes.value[index] = {
        ...ordenes.value[index],
        estadoCorte: {
          ...ordenes.value[index].estadoCorte,
          ...estadoParcial,
        }
      };

      // Si la orden actualizada es la orden seleccionada, actualizar también el buffer
      if (ordenSeleccionada.value && ordenSeleccionada.value.id === ordenId) {
        ordenSeleccionada.value = ordenes.value[index];
      }

      guardarEnLocalStorage();
      console.log(`🔄 Estado de corte actualizado para ${ordenId}`, estadoParcial);
      console.log(`📊 Nuevo estado:`, ordenes.value[index].estadoCorte);
    } else {
      console.warn(`⚠️ No se encontr�� orden con ID ${ordenId}`);
    }
  }

  function limpiarOrden() {
    Object.assign(orden, {
      id: '',
      consecutivo: '',
      fecha: '',
      tag: '', // Si usas 'tag' en tus objetos de orden, añádelo aquí
      fechaInicio: '',
      fechaEstimada: '',
      encargado: '',
      proveedor: '',
      detalles: [],
      referenciaPorDefecto: '',
      totalCantidad: 0,
      cantidadesPorProceso: {}, // Limpiar también esta propiedad
      estadoCorte: {
        telaExtendida: false,
        aplicaExtension: false,
        aplicaCorte: true, // Por defecto aplica
        aplicaNumeracion: true, // Por defecto aplica
        aplicaFusion: true, // Por defecto aplica
        unidadesCortadas: [],
        unidadesNumeradas: [],
        unidadesFusionadas: [],
        unidadesExtendidasPorColor: [],
      },
      estadoPlanta: {
        aplicaDelantero: true, // Por defecto aplica
        aplicaTrasero: true, // Por defecto aplica
        aplicaEnsamble: true, // Por defecto aplica
        unidadesDelantero: [],
        unidadesTrasero: [],
        unidadesEnsamble: [],
      },
    });
    console.log('🧼 Orden (buffer) limpiada');
  }


  function actualizarEstadoPlanta(ordenId, estadoParcial) {
    const index = ordenes.value.findIndex(o => o.id === ordenId);
    if (index !== -1) {
      // Actualizar directamente para mejor reactividad
      ordenes.value[index] = {
        ...ordenes.value[index],
        estadoPlanta: {
          ...ordenes.value[index].estadoPlanta,
          ...estadoParcial,
        }
      };

      // Si la orden actualizada es la orden seleccionada, actualizar también el buffer
      if (ordenSeleccionada.value && ordenSeleccionada.value.id === ordenId) {
        ordenSeleccionada.value = ordenes.value[index];
      }

      guardarEnLocalStorage();
      console.log(`🔄 Estado de planta actualizado para ${ordenId}`, estadoParcial);
      console.log(`📊 Nuevo estado:`, ordenes.value[index].estadoPlanta);
    } else {
      console.warn(`⚠️ No se encontró orden con ID ${ordenId}`);
    }
  }

  return {
    ordenes,
    orden,
    ordenSeleccionada,
    ordenesActivas: computed(() => ordenes.value),
    cargarOrdenes,
    guardarOrden,
    eliminarOrden,
    obtenerOrdenPorId,
    actualizarOrden,
    seleccionarOrden,
    limpiarOrden,
    actualizarEstadoCorte,
    actualizarEstadoPlanta,
    generarIdUnico,
  };
});
