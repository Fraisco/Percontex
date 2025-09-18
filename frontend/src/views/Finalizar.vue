<template>
  <div class="finalizar-view">
    <h1 class="titulo-principal">✅ Subproceso "Finalizar"</h1>
    <p class="descripcion">
      Seguimiento en tiempo real de movimientos entre subprocesos y finalización de
      órdenes
    </p>

    <!-- Selector de orden activa -->
    <div class="selector-orden-finalizar">
      <div class="orden-selector">
        <label for="ordenSeleccionada" class="label-selector">Orden Activa:</label>
        <select id="ordenSeleccionada" v-model="ordenSeleccionadaId" @change="cambiarOrden" class="select-orden">
          <option value="">Seleccione una orden</option>
          <option v-for="orden in ordenes" :key="orden.id" :value="orden.id">
            {{ orden.consecutivo }} - {{ orden.referencia_por_defecto }}
          </option>
        </select>
      </div>

      <!-- Información rápida de la orden -->
      <div v-if="ordenSeleccionada" class="orden-info-rapida">
        <div class="info-item">
          <span class="info-label">Total Unidades:</span>
          <span class="info-valor">{{ calcularTotalPedido() }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Progreso General:</span>
          <span class="info-valor">{{ calcularProgresoGeneral().toFixed(1) }}%</span>
        </div>
        <div class="info-item">
          <span class="info-label">Estado:</span>
          <span class="info-valor" :class="getEstadoGeneralClass()">
            {{ getEstadoGeneralTexto() }}
          </span>
        </div>
      </div>

      <!-- Encabezado compacto con imagen y cliente -->
      <div v-if="ordenSeleccionada" class="orden-encabezado-compacto">
        <div class="imagen-col">
          <img v-if="ordenSeleccionada.imagenDiseno" :src="ordenSeleccionada.imagenDiseno" alt="Imagen producto"
            class="imagen-producto-mini" />
          <div v-else class="imagen-placeholder-mini">📷</div>
        </div>
        <div class="datos-col">
          <div class="dato-item">
            <strong>Cliente:</strong>
            {{ ordenSeleccionada.proveedor || "No especificado" }}
          </div>
          <div class="dato-item">
            <strong>Orden:</strong> {{ ordenSeleccionada.consecutivo }}
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de tiempo real -->
    <div v-if="ordenSeleccionada" class="panel-tiempo-real">
      <!-- Resumen de flujo de procesos -->
      <div class="resumen-flujo-procesos">
        <h2>🔄 Flujo de Procesos en Tiempo Real</h2>
        <div class="flujo-visual">
          <div class="proceso-nodo" v-for="proceso in procesosOrdenados" :key="proceso.id">
            <div class="nodo-header">
              <span class="nodo-nombre">{{ proceso.nombre }}</span>
              <span class="nodo-badge" :class="getProcesoEstadoClass(proceso.id)">
                {{ getProcesoUnidades(proceso.id) }}
              </span>
            </div>
            <div class="nodo-progreso">
              <div class="barra-nodo" :style="{
                width: calcularProgresoProceso(proceso.id) + '%',
                backgroundColor: getColorProgreso(calcularProgresoProceso(proceso.id)),
              }"></div>
            </div>
            <div class="nodo-estado">
              {{ getEstadoTexto(calcularProgresoProceso(proceso.id)) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Movimientos en tiempo real -->
      <div class="movimientos-tiempo-real">
        <div class="movimientos-header">
          <h2>📊 Movimientos en Tiempo Real</h2>
          <div class="controles-tiempo-real">
            <button @click="pausarActualizaciones" :class="{ active: pausado }" class="btn-pausa">
              {{ pausado ? "▶️ Reanudar" : "⏸️ Pausar" }}
            </button>
            <button @click="limpiarHistorial" class="btn-limpiar">🗑️ Limpiar</button>
            <span class="ultimo-update">
              Última actualización:
              {{ ultimaActualizacion ? formatearHora(ultimaActualizacion) : "Nunca" }}
            </span>
          </div>
        </div>

        <!-- Lista de movimientos en tiempo real -->
        <div class="lista-movimientos-tiempo-real">
          <div v-for="(movimiento, index) in movimientosRecientes" :key="movimiento.id" class="movimiento-tiempo-real"
            :class="getMovimientoClass(movimiento)">
            <div class="movimiento-timestamp">
              {{ formatearHoraCompleta(movimiento.timestamp) }}
            </div>

            <div class="movimiento-flujo">
              <div class="proceso-origen">
                <span class="proceso-nombre">{{ movimiento.subprocesoOrigen }}</span>
                <span class="proceso-tipo">ORIGEN</span>
              </div>

              <div class="flecha-movimiento">
                <div class="flecha-linea"></div>
                <div class="flecha-punta">→</div>
                <div class="cantidad-transferida">
                  {{ movimiento.cantidadMovida }} unidades
                </div>
              </div>

              <div class="proceso-destino">
                <span class="proceso-nombre">{{ movimiento.subprocesoDestino }}</span>
                <span class="proceso-tipo">DESTINO</span>
              </div>
            </div>

            <div class="movimiento-detalles">
              <div class="detalle-item">
                <span class="detalle-label">Fecha/Hora:</span>
                <span class="detalle-valor">{{
                  formatearFechaCompleta(movimiento.fechaHora)
                  }}</span>
              </div>
              <div class="detalle-item">
                <span class="detalle-label">Estado:</span>
                <span class="detalle-valor badge-estado" :class="getEstadoBadgeClass(movimiento.estado)">
                  {{ movimiento.estado }}
                </span>
              </div>
              <div class="detalle-item">
                <span class="detalle-label">Operador:</span>
                <span class="detalle-valor">{{ movimiento.operador || "Sistema" }}</span>
              </div>
            </div>
          </div>

          <!-- Mensaje cuando no hay movimientos -->
          <div v-if="movimientosRecientes.length === 0" class="sin-movimientos">
            <div class="sin-movimientos-icono">📊</div>
            <div class="sin-movimientos-texto">
              <h3>No hay movimientos registrados</h3>
              <p>Los movimientos entre subprocesos aparecerán aquí en tiempo real</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas de finalización -->
      <div class="estadisticas-finalizacion">
        <h2>📈 Estadísticas de Finalización</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icono">🏁</div>
            <div class="stat-numero">{{ contarMovimientosFinalizados() }}</div>
            <div class="stat-label">Movimientos Finalizados</div>
          </div>

          <div class="stat-card">
            <div class="stat-icono">⏳</div>
            <div class="stat-numero">{{ contarMovimientosPendientes() }}</div>
            <div class="stat-label">Movimientos Pendientes</div>
          </div>

          <div class="stat-card">
            <div class="stat-icono">🚀</div>
            <div class="stat-numero">{{ calcularVelocidadProceso() }}</div>
            <div class="stat-label">Unidades/Hora</div>
          </div>

          <div class="stat-card">
            <div class="stat-icono">⚡</div>
            <div class="stat-numero">{{ calcularTiempoPromedio() }}</div>
            <div class="stat-label">Tiempo Promedio (min)</div>
          </div>
        </div>
      </div>

      <!-- Panel de finalización de orden -->
      <div class="panel-finalizacion-orden">
        <h2>🎯 Finalización de Orden</h2>

        <div class="finalizacion-contenido">
          <!-- Validaciones previas -->
          <div class="validaciones-previas">
            <h3>✅ Validaciones Previas</h3>
            <div class="checklist-validaciones">
              <div class="validacion-item" :class="{ completed: validaciones.corteCompleto }">
                <span class="validacion-check">{{
                  validaciones.corteCompleto ? "✅" : "❌"
                  }}</span>
                <span class="validacion-texto">Corte 100% completado</span>
                <span class="validacion-progreso">({{ calcularProgresoCorte().toFixed(1) }}%)</span>
              </div>

              <div class="validacion-item" :class="{ completed: validaciones.numeracionCompleta }">
                <span class="validacion-check">{{
                  validaciones.numeracionCompleta ? "✅" : "❌"
                  }}</span>
                <span class="validacion-texto">Numeración 100% completada</span>
                <span class="validacion-progreso">({{ calcularProgresoNumeracion().toFixed(1) }}%)</span>
              </div>

              <div class="validacion-item" :class="{ completed: validaciones.fusionCompleta }">
                <span class="validacion-check">{{
                  validaciones.fusionCompleta ? "✅" : "❌"
                  }}</span>
                <span class="validacion-texto">Fusión aplicable completada</span>
                <span class="validacion-progreso">({{ calcularProgresoFusion().toFixed(1) }}%)</span>
              </div>

              <div class="validacion-item" :class="{ completed: validaciones.plantaCompleta }">
                <span class="validacion-check">{{
                  validaciones.plantaCompleta ? "✅" : "❌"
                  }}</span>
                <span class="validacion-texto">Procesos de planta completados</span>
                <span class="validacion-progreso">({{ calcularProgresoPlanta().toFixed(1) }}%)</span>
              </div>
            </div>
          </div>

          <!-- Botón de finalización -->
          <div class="boton-finalizacion">
            <button @click="finalizarOrden" :disabled="!puedeFinalizarOrden()"
              :class="{ 'puede-finalizar': puedeFinalizarOrden() }" class="btn-finalizar-orden">
              <span class="btn-icono">{{ puedeFinalizarOrden() ? "🎉" : "⏳" }}</span>
              <span class="btn-texto">
                {{
                  puedeFinalizarOrden()
                    ? "Finalizar Orden Completa"
                    : "Orden No Lista para Finalizar"
                }}
              </span>
            </button>

            <div v-if="!puedeFinalizarOrden()" class="mensaje-requisitos">
              <p>Para finalizar la orden, todos los procesos deben estar al 100%</p>
            </div>
          </div>

          <!-- Resumen final -->
          <div v-if="ordenFinalizada" class="resumen-final">
            <div class="resumen-header">
              <h3>🎊 ¡Orden Finalizada Exitosamente!</h3>
              <div class="fecha-finalizacion">
                Finalizada el {{ formatearFechaCompleta(fechaFinalizacion) }}
              </div>
            </div>

            <div class="resumen-metricas">
              <div class="metrica">
                <span class="metrica-label">Total Procesado:</span>
                <span class="metrica-valor">{{ calcularTotalPedido() }} unidades</span>
              </div>
              <div class="metrica">
                <span class="metrica-label">Tiempo Total:</span>
                <span class="metrica-valor">{{ calcularTiempoTotal() }}</span>
              </div>
              <div class="metrica">
                <span class="metrica-label">Eficiencia:</span>
                <span class="metrica-valor">{{ calcularEficiencia().toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje cuando no hay orden seleccionada -->
    <div v-else class="sin-orden-finalizar">
      <div class="mensaje-sin-orden">
        <h3>📋 Selecciona una orden para finalizar</h3>
        <p>
          Elige una orden de producción para ver el estado de finalización y gestionar
          movimientos en tiempo real.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orden-encabezado-compacto {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--spacing-lg);
  align-items: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.imagen-producto-mini {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: var(--border-radius);
  border: 2px solid var(--border-color);
}

.imagen-placeholder-mini {
  width: 120px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
}

.dato-item {
  margin-bottom: var(--spacing-xs);
}
</style>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from "vue";
import { useOrdenStore } from "../stores/ordenStore";
import { usePlantaRealtimeUpdates } from "../composables/useRealtimeUpdates";

const ordenStore = useOrdenStore();
const plantaUpdates = usePlantaRealtimeUpdates("finalizar");

// Estados reactivos
const ordenSeleccionadaId = ref("");
const pausado = ref(false);
const ultimaActualizacion = ref(null);
const ordenFinalizada = ref(false);
const fechaFinalizacion = ref(null);
const movimientosRecientes = ref([]);

// Timer para actualizaciones automáticas
let updateTimer = null;

// Procesos ordenados para el flujo visual
const procesosOrdenados = ref([
  { id: "falso_y_vista", nombre: "Falso y Vista" },
  { id: "filete_vistas", nombre: "Filete Vistas" },
  { id: "fileteritos_delanteros", nombre: "Fileteritos Delanteros" },
  { id: "aletilla", nombre: "Aletilla" },
  { id: "aletillon", nombre: "Aletillón" },
  { id: "cerrar_bolsillo", nombre: "Cerrar Bolsillo" },
  { id: "pesp_bolsillo", nombre: "Pesp. Bolsillo" },
  { id: "prender_bolsillo", nombre: "Prender Bolsillo" },
  { id: "hacer_oca", nombre: "Hacer OCA" },
  { id: "fijar_delantero", nombre: "Fijar Delantero" },
  { id: "prender_cierre", nombre: "Prender Cierre" },
  { id: "hacer_j", nombre: "Hacer J" },
  { id: "encaje", nombre: "Encaje" },
  { id: "presillar", nombre: "Presillar" },
  { id: "revocar", nombre: "Revocar" },
]);

// Computed properties
const ordenes = computed(() => ordenStore.ordenes);
const ordenSeleccionada = computed(() =>
  ordenes.value.find((orden) => orden.id === ordenSeleccionadaId.value)
);

// Validaciones para finalización
const validaciones = computed(() => {
  if (!ordenSeleccionada.value) {
    return {
      corteCompleto: false,
      numeracionCompleta: false,
      fusionCompleta: false,
      plantaCompleta: false,
    };
  }

  return {
    corteCompleto: calcularProgresoCorte() >= 100,
    numeracionCompleta: calcularProgresoNumeracion() >= 100,
    fusionCompleta: calcularProgresoFusion() >= 100,
    plantaCompleta: calcularProgresoPlanta() >= 100,
  };
});

// Funciones de cálculo de progreso
function calcularTotalPedido() {
  // Usar el total precalculado provisto por la orden
  if (!ordenSeleccionada.value) return 0;

  const total = ordenSeleccionada.value.total_cantidad;

  // Asegura que devolvemos un número válido (maneja strings, null, undefined)
  return total;
}

function calcularProgresoGeneral() {
  const procesos = [
    calcularProgresoCorte(),
    calcularProgresoNumeracion(),
    calcularProgresoFusion(),
    calcularProgresoPlanta(),
  ];

  return procesos.reduce((sum, progreso) => sum + progreso, 0) / procesos.length;
}

function calcularProgresoCorte() {
  if (!ordenSeleccionada.value) return 0;

  const total = calcularTotalPedido();
  if (total === 0) return 0;

  const cortado =
    ordenSeleccionada.value.estadoCorte?.unidadesCortadas?.reduce(
      (sum, item) => sum + (parseInt(item.total_cortadas) || 0),
      0
    ) || 0;

  return (cortado / total) * 100;
}

function calcularProgresoNumeracion() {
  if (!ordenSeleccionada.value) return 0;

  const total = calcularTotalPedido();
  if (total === 0) return 0;

  const numerado =
    ordenSeleccionada.value.estadoCorte?.unidadesNumeradas?.reduce(
      (sum, item) => sum + (parseInt(item.total_numeradas) || 0),
      0
    ) || 0;

  return (numerado / total) * 100;
}

function calcularProgresoFusion() {
  if (!ordenSeleccionada.value) return 0;

  const totalFusion = ordenSeleccionada.value.estadoCorte?.unidadesFusionadas?.reduce(
    (sum, item) => sum + (item.total_cantidad || 0),
    0
  );
  if (totalFusion === 0) return 100;

  const fusionado = ordenSeleccionada.value.estadoCorte?.unidadesFusionadas?.reduce(
    (sum, item) => sum + (parseInt(item.total_fusionadas) || 0),
    0
  );

  return (fusionado / totalFusion) * 100;
}

function calcularProgresoPlanta() {
  if (!ordenSeleccionada.value) return 0;

  const total = calcularTotalPedido();
  if (total === 0) return 0;

  const procesos = [];

  if (ordenSeleccionada.value.estadoPlanta?.aplicaDelantero !== false) {
    const delantero =
      ordenSeleccionada.value.estadoPlanta?.unidadesDelantero?.reduce(
        (sum, item) => sum + (parseInt(item.delantero) || 0),
        0
      ) || 0;
    procesos.push((delantero / total) * 100);
  }

  if (ordenSeleccionada.value.estadoPlanta?.aplicaTrasero !== false) {
    const trasero =
      ordenSeleccionada.value.estadoPlanta?.unidadesTrasero?.reduce(
        (sum, item) => sum + (parseInt(item.trasero) || 0),
        0
      ) || 0;
    procesos.push((trasero / total) * 100);
  }

  if (ordenSeleccionada.value.estadoPlanta?.aplicaEnsamble !== false) {
    const ensamble =
      ordenSeleccionada.value.estadoPlanta?.unidadesEnsamble?.reduce(
        (sum, item) => sum + (parseInt(item.ensamble) || 0),
        0
      ) || 0;
    procesos.push((ensamble / total) * 100);
  }

  return procesos.length > 0 ? Math.min(...procesos) : 0; // El mínimo determina el progreso
}

function calcularProgresoProceso(procesoId) {
  // Simular progreso por proceso (en implementación real vendría de datos específicos)
  const progresoGeneral = calcularProgresoGeneral();
  const variacion = Math.random() * 20 - 10; // ±10% de variación
  return Math.max(0, Math.min(100, progresoGeneral + variacion));
}

// Funciones de estado
function getEstadoGeneralClass() {
  const progreso = calcularProgresoGeneral();
  if (progreso >= 100) return "estado-completo";
  if (progreso >= 75) return "estado-avanzado";
  if (progreso >= 25) return "estado-en-proceso";
  return "estado-pendiente";
}

function getEstadoGeneralTexto() {
  const progreso = calcularProgresoGeneral();
  if (progreso >= 100) return "Completo";
  if (progreso >= 75) return "Avanzado";
  if (progreso >= 25) return "En Proceso";
  return "Pendiente";
}

function getProcesoEstadoClass(procesoId) {
  const progreso = calcularProgresoProceso(procesoId);
  if (progreso >= 100) return "proceso-completo";
  if (progreso >= 50) return "proceso-avanzado";
  return "proceso-pendiente";
}

function getProcesoUnidades(procesoId) {
  // Simular unidades por proceso
  const total = calcularTotalPedido();
  const progreso = calcularProgresoProceso(procesoId);
  const unidades = Math.floor((total * progreso) / 100);
  return `${unidades}/${total}`;
}

function getColorProgreso(progreso) {
  if (progreso >= 100) return "#28a745";
  if (progreso >= 75) return "#ffc107";
  if (progreso >= 25) return "#fd7e14";
  return "#dc3545";
}

function getEstadoTexto(progreso) {
  if (progreso >= 100) return "Completo";
  if (progreso >= 75) return "Avanzado";
  if (progreso >= 25) return "En Proceso";
  return "Pendiente";
}

function getMovimientoClass(movimiento) {
  const ahora = new Date();
  const tiempoMovimiento = new Date(movimiento.timestamp);
  const diferencia = ahora - tiempoMovimiento;

  return {
    "movimiento-reciente": diferencia < 60000, // Últimos 60 segundos
    "movimiento-finalizado": movimiento.estado === "finalizado",
    "movimiento-pendiente": movimiento.estado === "pendiente",
  };
}

function getEstadoBadgeClass(estado) {
  switch (estado?.toLowerCase()) {
    case "finalizado":
      return "badge-finalizado";
    case "pendiente":
      return "badge-pendiente";
    case "en proceso":
      return "badge-en-proceso";
    default:
      return "badge-default";
  }
}

// Funciones de estadísticas
function contarMovimientosFinalizados() {
  return movimientosRecientes.value.filter((m) => m.estado === "finalizado").length;
}

function contarMovimientosPendientes() {
  return movimientosRecientes.value.filter((m) => m.estado === "pendiente").length;
}

function calcularVelocidadProceso() {
  // Calcular unidades procesadas por hora basado en movimientos recientes
  const ahora = new Date();
  const unaHoraAtras = new Date(ahora.getTime() - 60 * 60 * 1000);

  const movimientosUltimaHora = movimientosRecientes.value.filter(
    (m) => new Date(m.timestamp) >= unaHoraAtras
  );

  const unidadesUltimaHora = movimientosUltimaHora.reduce(
    (sum, m) => sum + (m.cantidadMovida || 0),
    0
  );

  return unidadesUltimaHora;
}

function calcularTiempoPromedio() {
  if (movimientosRecientes.value.length < 2) return 0;

  // Calcular tiempo promedio entre movimientos
  const tiempos = [];
  for (let i = 1; i < movimientosRecientes.value.length; i++) {
    const anterior = new Date(movimientosRecientes.value[i - 1].timestamp);
    const actual = new Date(movimientosRecientes.value[i].timestamp);
    tiempos.push(Math.abs(anterior - actual));
  }

  const promedioMs = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
  return Math.round(promedioMs / (1000 * 60)); // Convertir a minutos
}

// Funciones de finalización
function puedeFinalizarOrden() {
  return (
    validaciones.value.corteCompleto &&
    validaciones.value.numeracionCompleta &&
    validaciones.value.fusionCompleta &&
    validaciones.value.plantaCompleta
  );
}

function finalizarOrden() {
  if (!puedeFinalizarOrden()) {
    alert("La orden no cumple con todos los requisitos para ser finalizada.");
    return;
  }

  const confirmar = confirm(
    `¿Está seguro de que desea finalizar la orden ${ordenSeleccionada.value.consecutivo}? Esta acción no se puede deshacer.`
  );

  if (confirmar) {
    ordenFinalizada.value = true;
    fechaFinalizacion.value = new Date().toISOString();

    // Agregar movimiento de finalización
    agregarMovimientoFinalizar();

    // Emitir evento de finalización
    emitirEventoFinalizacion();

    alert(`¡Orden ${ordenSeleccionada.value.consecutivo} finalizada exitosamente!`);
  }
}

function agregarMovimientoFinalizar() {
  const movimientoFinal = {
    id: `finalizar_${Date.now()}`,
    timestamp: new Date().toISOString(),
    fechaHora: new Date().toISOString(),
    subprocesoOrigen: "Todos los Procesos",
    subprocesoDestino: "FINALIZADO",
    cantidadMovida: calcularTotalPedido(),
    estado: "finalizado",
    operador: "Sistema",
  };

  movimientosRecientes.value.unshift(movimientoFinal);
}

// Funciones de utilidad
function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatearHoraCompleta(fecha) {
  return new Date(fecha).toLocaleTimeString("es-ES");
}

function formatearFechaCompleta(fecha) {
  return new Date(fecha).toLocaleString("es-ES");
}

function calcularTiempoTotal() {
  if (!ordenSeleccionada.value) return "0 hrs";

  const inicio = new Date(
    ordenSeleccionada.value.fechaInicio || ordenSeleccionada.value.fecha
  );
  const fin = new Date(fechaFinalizacion.value || new Date());
  const diferencia = fin - inicio;

  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

  return `${horas}h ${minutos}m`;
}

function calcularEficiencia() {
  // Cálculo simple de eficiencia basado en tiempo y cantidad
  const tiempoTotal = calcularTiempoTotal();
  const horasMatch = tiempoTotal.match(/(\d+)h/);
  const horas = horasMatch ? parseInt(horasMatch[1]) : 0;

  if (horas === 0) return 100;

  const unidadesPorHora = calcularTotalPedido() / horas;
  const eficienciaBase = 50; // unidades/hora base esperada

  return Math.min(100, (unidadesPorHora / eficienciaBase) * 100);
}

// Funciones de control
function cambiarOrden() {
  if (!ordenSeleccionadaId.value) return;

  ordenFinalizada.value = false;
  fechaFinalizacion.value = null;
  cargarMovimientosOrden();
  iniciarActualizacionesAutomaticas();
}

function pausarActualizaciones() {
  pausado.value = !pausado.value;

  if (pausado.value) {
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
  } else {
    iniciarActualizacionesAutomaticas();
  }
}

function limpiarHistorial() {
  movimientosRecientes.value = [];
  ultimaActualizacion.value = null;

  if (ordenSeleccionada.value) {
    localStorage.removeItem(`movimientos_finalizar_${ordenSeleccionada.value.id}`);
  }
}

function iniciarActualizacionesAutomaticas() {
  if (updateTimer) clearInterval(updateTimer);

  updateTimer = setInterval(() => {
    if (!pausado.value) {
      simularMovimientosTiempoReal();
      ultimaActualizacion.value = new Date();
    }
  }, 3000); // Actualizar cada 3 segundos
}

function simularMovimientosTiempoReal() {
  // Simular movimientos aleatorios para demostración
  if (Math.random() < 0.3 && movimientosRecientes.value.length < 50) {
    // 30% probabilidad
    const procesoOrigen =
      procesosOrdenados.value[Math.floor(Math.random() * procesosOrdenados.value.length)];
    const procesoDestino =
      procesosOrdenados.value[Math.floor(Math.random() * procesosOrdenados.value.length)];

    if (procesoOrigen.id !== procesoDestino.id) {
      const nuevoMovimiento = {
        id: `mov_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        fechaHora: new Date().toISOString(),
        subprocesoOrigen: procesoOrigen.nombre,
        subprocesoDestino: procesoDestino.nombre,
        cantidadMovida: Math.floor(Math.random() * 50) + 1,
        estado: Math.random() > 0.2 ? "finalizado" : "pendiente",
        operador: `Operador ${Math.floor(Math.random() * 5) + 1}`,
      };

      movimientosRecientes.value.unshift(nuevoMovimiento);

      // Limitar a los últimos 20 movimientos
      if (movimientosRecientes.value.length > 20) {
        movimientosRecientes.value = movimientosRecientes.value.slice(0, 20);
      }

      guardarMovimientosOrden();
    }
  }
}

function cargarMovimientosOrden() {
  if (!ordenSeleccionada.value) return;

  const key = `movimientos_finalizar_${ordenSeleccionada.value.id}`;
  const movimientosGuardados = localStorage.getItem(key);

  if (movimientosGuardados) {
    try {
      movimientosRecientes.value = JSON.parse(movimientosGuardados);
    } catch (e) {
      console.error("Error al cargar movimientos:", e);
      movimientosRecientes.value = [];
    }
  } else {
    movimientosRecientes.value = [];
  }
}

function guardarMovimientosOrden() {
  if (!ordenSeleccionada.value) return;

  const key = `movimientos_finalizar_${ordenSeleccionada.value.id}`;
  localStorage.setItem(key, JSON.stringify(movimientosRecientes.value));
}

function emitirEventoFinalizacion() {
  window.dispatchEvent(
    new CustomEvent("ordenFinalizada", {
      detail: {
        orden: ordenSeleccionada.value,
        fechaFinalizacion: fechaFinalizacion.value,
        timestamp: new Date(),
      },
    })
  );
}

// Watchers
watch(
  () => movimientosRecientes.value,
  () => {
    guardarMovimientosOrden();
  },
  { deep: true }
);

// Lifecycle
onMounted(() => {
  ordenStore.cargarOrdenes();

  // Auto-seleccionar la primera orden si hay órdenes disponibles
  setTimeout(() => {
    if (ordenes.value.length > 0 && !ordenSeleccionadaId.value) {
      ordenSeleccionadaId.value = ordenes.value[0].id;
      cambiarOrden();
    }
  }, 500);
});

onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer);
  }
});
</script>

<style scoped>
.finalizar-view {
  padding: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
  background-color: var(--bg-primary);
  min-height: 100vh;
}

.titulo-principal {
  text-align: center;
  color: var(--success-dark);
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-sm);
  font-weight: 700;
}

.descripcion {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  font-size: var(--font-size-lg);
}

/* Selector de orden */
.selector-orden-finalizar {
  background: linear-gradient(135deg, var(--success-bg), var(--bg-secondary));
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  border-left: 5px solid var(--success);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-lg);
  align-items: center;
}

.orden-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.label-selector {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
}

.select-orden {
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.select-orden:focus {
  border-color: var(--success);
  outline: none;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
}

.orden-info-rapida {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.info-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.info-valor {
  color: var(--text-primary);
  font-weight: 600;
}

.estado-completo {
  color: var(--success);
}

.estado-avanzado {
  color: var(--warning);
}

.estado-en-proceso {
  color: var(--info);
}

.estado-pendiente {
  color: var(--danger);
}

/* Panel de tiempo real */
.panel-tiempo-real {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* Flujo de procesos */
.resumen-flujo-procesos {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.resumen-flujo-procesos h2 {
  color: var(--success-dark);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
}

.flujo-visual {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.proceso-nodo {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  transition: transform var(--transition-fast);
}

.proceso-nodo:hover {
  transform: translateY(-2px);
}

.nodo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.nodo-nombre {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.nodo-badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.proceso-completo {
  background-color: var(--success);
  color: white;
}

.proceso-avanzado {
  background-color: var(--warning);
  color: white;
}

.proceso-pendiente {
  background-color: var(--danger);
  color: white;
}

.nodo-progreso {
  height: 6px;
  background-color: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.barra-nodo {
  height: 100%;
  transition: width 0.5s ease-in-out;
}

.nodo-estado {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

/* Movimientos en tiempo real */
.movimientos-tiempo-real {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.movimientos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.movimientos-header h2 {
  color: var(--success-dark);
  font-size: var(--font-size-xl);
  margin: 0;
}

.controles-tiempo-real {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.btn-pausa,
.btn-limpiar {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-pausa {
  background-color: var(--warning);
  color: white;
}

.btn-pausa.active {
  background-color: var(--success);
}

.btn-limpiar {
  background-color: var(--danger);
  color: white;
}

.ultimo-update {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-style: italic;
}

/* Lista de movimientos */
.lista-movimientos-tiempo-real {
  max-height: 500px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.movimiento-tiempo-real {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.movimiento-reciente {
  border-color: var(--success);
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
  animation: pulsoVerde 2s ease-in-out;
}

@keyframes pulsoVerde {
  0% {
    box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
  }

  50% {
    box-shadow: 0 0 20px rgba(40, 167, 69, 0.6);
  }

  100% {
    box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
  }
}

.movimiento-timestamp {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
  text-align: right;
}

.movimiento-flujo {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-md);
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.proceso-origen,
.proceso-destino {
  text-align: center;
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  border: 2px solid var(--border-color);
}

.proceso-origen {
  background-color: var(--info-bg);
  border-color: var(--info);
}

.proceso-destino {
  background-color: var(--success-bg);
  border-color: var(--success);
}

.proceso-nombre {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.proceso-tipo {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
}

.flecha-movimiento {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.flecha-linea {
  width: 40px;
  height: 2px;
  background-color: var(--primary-blue);
}

.flecha-punta {
  color: var(--primary-blue);
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.cantidad-transferida {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--primary-blue);
  text-align: center;
}

.movimiento-detalles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.detalle-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detalle-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.detalle-valor {
  color: var(--text-primary);
  font-weight: 600;
}

/* Badges de estado */
.badge-estado {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.badge-finalizado {
  background-color: var(--success);
  color: white;
}

.badge-pendiente {
  background-color: var(--warning);
  color: white;
}

.badge-en-proceso {
  background-color: var(--info);
  color: white;
}

.badge-default {
  background-color: var(--gray-400);
  color: white;
}

/* Sin movimientos */
.sin-movimientos {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.sin-movimientos-icono {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.sin-movimientos-texto h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.sin-movimientos-texto p {
  color: var(--text-secondary);
  margin: 0;
}

/* Estadísticas */
.estadisticas-finalizacion {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.estadisticas-finalizacion h2 {
  color: var(--success-dark);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  background-color: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  text-align: center;
  transition: transform var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icono {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
}

.stat-numero {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--success);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: var(--font-size-sm);
}

/* Panel de finalización */
.panel-finalizacion-orden {
  background: linear-gradient(135deg, var(--success-bg), var(--bg-secondary));
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 2px solid var(--success);
}

.panel-finalizacion-orden h2 {
  color: var(--success-dark);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
  text-align: center;
}

.finalizacion-contenido {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* Validaciones */
.validaciones-previas {
  background-color: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.validaciones-previas h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.checklist-validaciones {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.validacion-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.validacion-item.completed {
  background-color: var(--success-bg);
  border-color: var(--success);
}

.validacion-check {
  font-size: var(--font-size-lg);
}

.validacion-texto {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.validacion-progreso {
  color: var(--text-secondary);
  font-weight: 600;
}

/* Botón de finalización */
.boton-finalizacion {
  text-align: center;
}

.btn-finalizar-orden {
  padding: var(--spacing-lg) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-lg);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0 auto;
  background-color: var(--gray-400);
  color: var(--gray-700);
}

.btn-finalizar-orden.puede-finalizar {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  color: white;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.btn-finalizar-orden.puede-finalizar:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.btn-finalizar-orden:disabled {
  cursor: not-allowed;
}

.btn-icono {
  font-size: var(--font-size-xl);
}

.mensaje-requisitos {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--warning-bg);
  color: var(--warning-text);
  border-radius: var(--border-radius);
  text-align: center;
}

/* Resumen final */
.resumen-final {
  background: linear-gradient(135deg, var(--success-bg), var(--success-light));
  padding: var(--spacing-xl);
  border-radius: var(--border-radius);
  border: 2px solid var(--success);
  text-align: center;
}

.resumen-header h3 {
  color: var(--success-dark);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-2xl);
}

.fecha-finalizacion {
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: var(--spacing-lg);
}

.resumen-metricas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.metrica {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.metrica-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.metrica-valor {
  color: var(--success-dark);
  font-weight: 700;
  font-size: var(--font-size-lg);
}

/* Sin orden */
.sin-orden-finalizar {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.mensaje-sin-orden {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 2px dashed var(--border-color);
  max-width: 500px;
}

.mensaje-sin-orden h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.mensaje-sin-orden p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 1024px) {
  .selector-orden-finalizar {
    grid-template-columns: 1fr;
  }

  .movimientos-header {
    flex-direction: column;
    align-items: stretch;
  }

  .movimiento-flujo {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .flecha-movimiento {
    order: 2;
  }

  .proceso-destino {
    order: 3;
  }
}

@media (max-width: 768px) {
  .flujo-visual {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .resumen-metricas {
    grid-template-columns: 1fr;
  }

  .movimiento-detalles {
    grid-template-columns: 1fr;
  }
}
</style>
