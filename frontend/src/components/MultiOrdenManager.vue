<template>
  <div class="multi-orden-manager">
    <div class="buscador-ordenes">
      <h3 class="titulo-seccion">🔍 Seleccionar Órdenes para {{ proceso }}</h3>

      <!-- Buscador de órdenes -->
      <div class="search-container">
        <input type="text" v-model="busquedaTexto" @input="filtrarOrdenes"
          placeholder="Buscar por ID, consecutivo o referencia..." class="input-busqueda" />
        <div class="search-icon">🔍</div>
      </div>

      <!-- Lista de órdenes filtradas -->
      <div v-if="ordenesFiltradas.length > 0" class="lista-ordenes">
        <div class="encabezado-lista">
          <span class="col-info">Información</span>
          <span class="col-estado">Estado</span>
          <span class="col-accion">Acción</span>
        </div>

        <div v-for="orden in ordenesFiltradas" :key="orden.id" class="item-orden"
          :class="{ 'seleccionada': ordenesSeleccionadas.has(orden.id) }">
          <div class="orden-info">
            <div class="orden-principal">
              <span class="consecutivo">{{ orden.consecutivo }}</span>
              <span class="referencia">{{ orden.referenciaPorDefecto }}</span>
            </div>
            <div class="orden-detalles">
              <span class="total">{{ calcularTotalPedido(orden) }} unidades</span>
              <span class="proveedor">{{ orden.proveedor }}</span>
            </div>
          </div>

          <div class="orden-estado">
            <div class="progreso-visual">
              <div class="barra-mini">
                <div class="progreso-mini" :style="{ width: calcularProgresoOrden(orden) + '%' }"></div>
              </div>
              <span class="porcentaje-mini">{{ calcularProgresoOrden(orden).toFixed(0) }}%</span>
            </div>
          </div>

          <div class="orden-accion">
            <button @click="toggleOrdenSeleccion(orden)" class="btn-toggle"
              :class="{ 'seleccionado': ordenesSeleccionadas.has(orden.id) }">
              {{ ordenesSeleccionadas.has(orden.id) ? 'Quitar' : 'Agregar' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="busquedaTexto" class="sin-resultados">
        <p>No se encontraron órdenes que coincidan con "{{ busquedaTexto }}"</p>
      </div>

      <div v-else class="mensaje-inicial">
        <p>Escribe para buscar órdenes disponibles</p>
      </div>
    </div>

    <!-- Panel de órdenes seleccionadas -->
    <div v-if="ordenesSeleccionadas.size > 0" class="panel-seleccionadas">
      <h4 class="titulo-panel">
        📋 Órdenes Seleccionadas ({{ ordenesSeleccionadas.size }})
      </h4>

      <div class="tabs-ordenes">
        <button v-for="orden in ordenesSeleccionadasArray" :key="orden.id" @click="seleccionarOrdenActiva(orden)"
          class="tab-orden" :class="{ 'active': ordenActiva?.id === orden.id }">
          <span class="tab-consecutivo">{{ orden.consecutivo }}</span>
          <span @click.stop="quitarOrdenSeleccion(orden)" class="btn-cerrar-tab" title="Quitar orden">
            ×
          </span>
        </button>
      </div>

      <!-- Vista de la orden activa -->
      <div v-if="ordenActiva" class="orden-activa-container">
        <div class="orden-activa-header">
          <h5 class="orden-activa-titulo">
            {{ ordenActiva.consecutivo }} - {{ ordenActiva.referenciaPorDefecto }}
          </h5>
          <div class="orden-activa-info">
            <span class="total-unidades">{{ calcularTotalPedido(ordenActiva) }} unidades</span>
            <span class="progreso-orden">{{ calcularProgresoOrden(ordenActiva).toFixed(1) }}% completado</span>
          </div>
        </div>

        <!-- Aquí se mostrará el componente del proceso específico -->
        <div class="proceso-container">
          <slot :orden="ordenActiva" :actualizar="actualizarEstado"></slot>
        </div>
      </div>
    </div>

    <!-- Mensaje cuando no hay órdenes seleccionadas -->
    <div v-else class="mensaje-no-seleccionadas">
      <div class="icono-vacio">📦</div>
      <h4>No hay órdenes seleccionadas</h4>
      <p>Busca y selecciona órdenes para comenzar a trabajar en el proceso de {{ proceso }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useOrdenStore } from '../stores/ordenStore'

const props = defineProps({
  proceso: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['orden-seleccionada', 'ordenes-actualizadas'])

const ordenStore = useOrdenStore()

// Estados reactivos
const busquedaTexto = ref('')
const ordenesSeleccionadas = ref(new Map())
const ordenActiva = ref(null)
const ordenesFiltradas = ref([])

// Computed
const ordenesSeleccionadasArray = computed(() => {
  return Array.from(ordenesSeleccionadas.value.values())
})

const todasLasOrdenes = computed(() => ordenStore.ordenes)

// Funciones
function filtrarOrdenes() {
  if (!busquedaTexto.value || busquedaTexto.value.length < 2) {
    ordenesFiltradas.value = []
    return
  }

  const texto = busquedaTexto.value.toLowerCase()
  ordenesFiltradas.value = todasLasOrdenes.value.filter(orden => {
    return (
      orden.id.toLowerCase().includes(texto) ||
      orden.consecutivo.toLowerCase().includes(texto) ||
      (orden.referenciaPorDefecto && orden.referenciaPorDefecto.toLowerCase().includes(texto)) ||
      (orden.proveedor && orden.proveedor.toLowerCase().includes(texto))
    )
  }).slice(0, 10) // Limitar a 10 resultados
}

function calcularTotalPedido(orden) {
  return orden.detalles?.reduce((sum, detalle) =>
    sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0), 0) || 0
}

function calcularProgresoOrden(orden) {
  // Calcula el progreso general basado en todos los procesos aplicables
  const procesos = []

  if (orden.estadoCorte?.aplicaExtension !== false) {
    procesos.push(orden.estadoCorte?.telaExtendida ? 100 : 0)
  }
  if (orden.estadoCorte?.aplicaCorte !== false) {
    const total = calcularTotalPedido(orden)
    const cortadas = orden.estadoCorte?.unidadesCortadas?.reduce((sum, item) =>
      sum + (parseInt(item.cortadas) || 0), 0) || 0
    procesos.push(total > 0 ? (cortadas / total) * 100 : 0)
  }
  if (orden.estadoCorte?.aplicaNumeracion !== false) {
    const total = calcularTotalPedido(orden)
    const numeradas = orden.estadoCorte?.unidadesNumeradas?.reduce((sum, item) =>
      sum + (parseInt(item.numeradas) || 0), 0) || 0
    procesos.push(total > 0 ? (numeradas / total) * 100 : 0)
  }
  if (orden.estadoCorte?.aplicaFusion !== false) {
    const unidadesFusionConAplicacion = orden.estadoCorte?.unidadesFusionadas?.filter(item => item.aplica) || []
    const totalFusion = unidadesFusionConAplicacion.reduce((sum, item) => sum + (item.total || 0), 0)
    const fusionadas = unidadesFusionConAplicacion.reduce((sum, item) => sum + (parseInt(item.fusionadas) || 0), 0)
    procesos.push(totalFusion > 0 ? (fusionadas / totalFusion) * 100 : 0)
  }

  // Procesos de planta
  if (orden.estadoPlanta?.aplicaDelantero !== false) {
    const total = calcularTotalPedido(orden)
    const delantero = orden.estadoPlanta?.unidadesDelantero?.reduce((sum, item) =>
      sum + (parseInt(item.delantero) || 0), 0) || 0
    procesos.push(total > 0 ? (delantero / total) * 100 : 0)
  }
  if (orden.estadoPlanta?.aplicaTrasero !== false) {
    const total = calcularTotalPedido(orden)
    const trasero = orden.estadoPlanta?.unidadesTrasero?.reduce((sum, item) =>
      sum + (parseInt(item.trasero) || 0), 0) || 0
    procesos.push(total > 0 ? (trasero / total) * 100 : 0)
  }
  if (orden.estadoPlanta?.aplicaEnsamble !== false) {
    const total = calcularTotalPedido(orden)
    const ensamble = orden.estadoPlanta?.unidadesEnsamble?.reduce((sum, item) =>
      sum + (parseInt(item.ensamble) || 0), 0) || 0
    procesos.push(total > 0 ? (ensamble / total) * 100 : 0)
  }

  return procesos.length > 0 ? procesos.reduce((a, b) => a + b, 0) / procesos.length : 0
}

function toggleOrdenSeleccion(orden) {
  if (ordenesSeleccionadas.value.has(orden.id)) {
    quitarOrdenSeleccion(orden)
  } else {
    agregarOrdenSeleccion(orden)
  }
}

function agregarOrdenSeleccion(orden) {
  ordenesSeleccionadas.value.set(orden.id, orden)

  // Si no hay orden activa, seleccionar esta
  if (!ordenActiva.value) {
    seleccionarOrdenActiva(orden)
  }

  emit('ordenes-actualizadas', ordenesSeleccionadasArray.value)
}

function quitarOrdenSeleccion(orden) {
  ordenesSeleccionadas.value.delete(orden.id)

  // Si la orden activa fue quitada, seleccionar otra o ninguna
  if (ordenActiva.value?.id === orden.id) {
    const restantes = ordenesSeleccionadasArray.value
    ordenActiva.value = restantes.length > 0 ? restantes[0] : null

    if (ordenActiva.value) {
      emit('orden-seleccionada', ordenActiva.value)
    }
  }

  emit('ordenes-actualizadas', ordenesSeleccionadasArray.value)
}

function seleccionarOrdenActiva(orden) {
  ordenActiva.value = orden
  emit('orden-seleccionada', orden)
}

function actualizarEstado() {
  // Forzar actualización del store y reactividad
  ordenStore.cargarOrdenes();

  // Actualizar las órdenes seleccionadas con datos frescos
  const ordenesActualizadas = new Map()
  for (const [id, orden] of ordenesSeleccionadas.value) {
    const ordenActualizada = todasLasOrdenes.value.find(o => o.id === id)
    if (ordenActualizada) {
      ordenesActualizadas.set(id, ordenActualizada)
    }
  }
  ordenesSeleccionadas.value = ordenesActualizadas

  // Actualizar orden activa
  if (ordenActiva.value) {
    const ordenActivaActualizada = todasLasOrdenes.value.find(o => o.id === ordenActiva.value.id)
    if (ordenActivaActualizada) {
      ordenActiva.value = ordenActivaActualizada
      emit('orden-seleccionada', ordenActiva.value)
    }
  }

  emit('ordenes-actualizadas', ordenesSeleccionadasArray.value)

  // Emitir evento de actualización completada
  window.dispatchEvent(new CustomEvent('multiOrdenManagerUpdated', {
    detail: {
      proceso: props.proceso,
      ordenesCount: ordenesSeleccionadas.value.size,
      timestamp: new Date()
    }
  }))
}

// Watchers
watch(() => busquedaTexto.value, (newValue) => {
  if (!newValue) {
    ordenesFiltradas.value = []
  }
})

// Lifecycle
onMounted(() => {
  ordenStore.cargarOrdenes()

  // Escuchar actualizaciones en tiempo real
  const handlePlantaUpdate = (event) => {
    console.log(`[MultiOrdenManager:${props.proceso}] Proceso actualizado:`, event.detail)
    // Actualizar estados cuando hay cambios en procesos
    setTimeout(() => {
      actualizarEstado()
    }, 200)
  }

  const handleRealtimeUpdate = (event) => {
    console.log(`[MultiOrdenManager:${props.proceso}] Actualización en tiempo real:`, event.detail)
    actualizarEstado()
  }

  const handleCrossBrowserSync = (event) => {
    console.log(`[MultiOrdenManager:${props.proceso}] Sincronización entre ventanas:`, event.detail)
    if (event.detail.tipo === 'proceso_actualizado') {
      setTimeout(() => {
        actualizarEstado()
      }, 100)
    }
  }

  window.addEventListener('plantaProcesoUpdate', handlePlantaUpdate)
  window.addEventListener('realtimeUpdate', handleRealtimeUpdate)
  window.addEventListener('crossBrowserSync', handleCrossBrowserSync)

  // Cleanup en unmounted
  onUnmounted(() => {
    window.removeEventListener('plantaProcesoUpdate', handlePlantaUpdate)
    window.removeEventListener('realtimeUpdate', handleRealtimeUpdate)
    window.removeEventListener('crossBrowserSync', handleCrossBrowserSync)
  })
})

// Exponer funciones para uso externo
defineExpose({
  actualizarEstado,
  seleccionarOrdenActiva,
  agregarOrdenSeleccion,
  quitarOrdenSeleccion
})
</script>

<style scoped>
.multi-orden-manager {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
}

.titulo-seccion {
  color: var(--primary-blue-dark);
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

/* Buscador */
.search-container {
  position: relative;
  margin-bottom: var(--spacing-md);
}

.input-busqueda {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-xl) var(--spacing-md) var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.input-busqueda:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-icon {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

/* Lista de órdenes */
.lista-ordenes {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.encabezado-lista {
  display: grid;
  grid-template-columns: 2fr 1fr 120px;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--primary-blue);
  color: white;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.item-orden {
  display: grid;
  grid-template-columns: 2fr 1fr 120px;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.item-orden:hover {
  background-color: var(--gray-50);
}

.item-orden.seleccionada {
  background-color: var(--primary-blue-bg);
  border-color: var(--primary-blue);
}

.orden-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.orden-principal {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.consecutivo {
  font-weight: 600;
  color: var(--primary-blue-dark);
  font-size: var(--font-size-base);
}

.referencia {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.orden-detalles {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.total {
  font-weight: 600;
}

.orden-estado {
  display: flex;
  align-items: center;
  justify-content: center;
}

.progreso-visual {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
  width: 100%;
}

.barra-mini {
  width: 80px;
  height: 6px;
  background-color: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.progreso-mini {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-blue), var(--primary-blue-dark));
  transition: width 0.5s ease-in-out;
  position: relative;
}

.progreso-mini::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.porcentaje-mini {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-secondary);
}

.orden-accion {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-toggle {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--primary-blue);
  border-radius: var(--border-radius);
  background-color: transparent;
  color: var(--primary-blue);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.btn-toggle:hover {
  background-color: var(--primary-blue);
  color: white;
}

.btn-toggle.seleccionado {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  border-color: var(--success);
  color: white;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  transform: scale(1.02);
}

.btn-toggle.seleccionado:hover {
  background-color: var(--success-dark);
}

/* Mensajes */
.sin-resultados,
.mensaje-inicial {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
  font-style: italic;
}

.mensaje-no-seleccionadas {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 2px dashed var(--border-color);
}

.icono-vacio {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.mensaje-no-seleccionadas h4 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.mensaje-no-seleccionadas p {
  color: var(--text-secondary);
}

/* Panel de órdenes seleccionadas */
.panel-seleccionadas {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.titulo-panel {
  padding: var(--spacing-md);
  background-color: var(--success);
  color: white;
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.tabs-ordenes {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: var(--spacing-sm);
  background-color: var(--gray-100);
  border-bottom: 1px solid var(--border-color);
}

.tab-orden {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.tab-orden:hover {
  background-color: var(--gray-50);
}

.tab-orden.active {
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
  color: white;
  border-color: var(--primary-blue);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  transform: translateY(-1px);
}

.tab-consecutivo {
  font-weight: 600;
}

.btn-cerrar-tab {
  background: none;
  border: none;
  color: inherit;
  font-size: var(--font-size-lg);
  cursor: pointer;
  padding: 0;
  margin-left: var(--spacing-xs);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color var(--transition-fast);
}

.btn-cerrar-tab:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Orden activa */
.orden-activa-container {
  padding: var(--spacing-lg);
}

.orden-activa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.orden-activa-titulo {
  color: var(--primary-blue-dark);
  font-size: var(--font-size-lg);
  margin: 0;
}

.orden-activa-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
}

.total-unidades {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.progreso-orden {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.proceso-container {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}

/* Indicador de actividad en tiempo real */
.actividad-indicator {
  position: relative;
}

.actividad-indicator::before {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: var(--success);
  border-radius: 50%;
  animation: pulse-indicator 2s infinite;
}

@keyframes pulse-indicator {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Efecto hover mejorado */
.item-orden:hover {
  background-color: var(--gray-50);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-orden.seleccionada:hover {
  background-color: var(--primary-blue-bg);
  transform: translateX(4px);
}

@media (max-width: 768px) {

  .encabezado-lista,
  .item-orden {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .orden-principal {
    flex-direction: column;
    align-items: flex-start;
  }

  .orden-detalles {
    flex-direction: column;
  }

  .tabs-ordenes {
    flex-direction: column;
  }

  .orden-activa-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .orden-activa-info {
    align-items: flex-start;
  }

  .multi-orden-manager {
    padding: var(--spacing-md);
  }

  .lista-ordenes {
    border-radius: var(--border-radius);
    overflow: hidden;
  }
}
</style>
