<template>
  <div class="informes-balance-view">
    <!-- Header con auto-actualización -->
    <div class="header-informes">
      <h1 class="titulo-principal">📊 Informes y Balance - Auto-actualización</h1>
      <div class="filtros-principales">
        <div class="auto-update-control">
          <label class="auto-update-label">
            <input type="checkbox" v-model="autoUpdateActivo" @change="toggleAutoUpdate" class="auto-update-checkbox" />
            <span class="auto-update-text">📡 Auto-actualización</span>
          </label>
          <div class="update-status" :class="{ 'updating': actualizando }">
            <span class="status-dot" :class="{ 'active': autoUpdateActivo }"></span>
            <span class="status-text">
              {{ autoUpdateActivo ? (actualizando ? 'Actualizando...' : 'Activo') : 'Inactivo' }}
            </span>
          </div>
          <div class="last-update">
            Última actualización: {{ formatearHoraActualizacion(ultimaActualizacion) }}
          </div>
        </div>

        <div class="filtro-fechas">
          <label for="fechaInicio">Desde:</label>
          <input type="date" id="fechaInicio" v-model="filtros.fechaInicio" class="input-fecha"
            @change="actualizarReportes" />
        </div>
        <div class="filtro-fechas">
          <label for="fechaFin">Hasta:</label>
          <input type="date" id="fechaFin" v-model="filtros.fechaFin" class="input-fecha"
            @change="actualizarReportes" />
        </div>
        <button @click="actualizarReportes" class="btn-actualizar" :disabled="actualizando">
          {{ actualizando ? '⏳' : '🔄' }} {{ actualizando ? 'Actualizando' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <!-- Navegación de reportes -->
    <div class="nav-reportes">
      <RouterLink v-for="reporte in tiposReportes" :key="reporte.id" :to="`/informes/${reporte.id}`"
        :class="{ active: seccionActual === reporte.id }" class="btn-reporte">
        {{ reporte.icono }} {{ reporte.nombre }}
        <span v-if="reporte.nuevos > 0" class="badge-nuevos">{{ reporte.nuevos }}</span>
      </RouterLink>
    </div>

    <!-- Alertas de nuevos movimientos -->
    <div v-if="nuevosMovimientos.length > 0" class="alertas-movimientos">
      <div class="alerta-header">
        <h3>🚨 Nuevos Movimientos Detectados</h3>
        <button @click="limpiarAlertas" class="btn-limpiar-alertas">Marcar como Visto</button>
      </div>
      <div class="lista-alertas">
        <div v-for="(movimiento, index) in nuevosMovimientos.slice(0, 5)" :key="index" class="alerta-movimiento">
          <div class="alerta-icono">📈</div>
          <div class="alerta-contenido">
            <span class="alerta-texto">{{ movimiento.descripcion }}</span>
            <span class="alerta-tiempo">{{ formatearTiempoRelativo(movimiento.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard con métricas en tiempo real -->
    <div v-if="reporteActivo === 'dashboard'" class="dashboard">
      <div class="metricas-principales">
        <div class="metrica-card produccion" :class="{ 'actualizada': metricasActualizadas.produccion }">
          <div class="metrica-icono">🏭</div>
          <div class="metrica-info">
            <h3>Órdenes Activas</h3>
            <div class="metrica-numero">{{ metricas.ordenesActivas }}</div>
            <p>En producción</p>
            <div class="metrica-tendencia" :class="tendencias.ordenesActivas.tipo">
              {{ tendencias.ordenesActivas.texto }}
            </div>
          </div>
          <div v-if="metricasActualizadas.produccion" class="update-indicator">●</div>
        </div>

        <div class="metrica-card eficiencia" :class="{ 'actualizada': metricasActualizadas.eficiencia }">
          <div class="metrica-icono">⚡</div>
          <div class="metrica-info">
            <h3>Eficiencia Promedio</h3>
            <div class="metrica-numero">{{ metricas.eficienciaPromedio.toFixed(1) }}%</div>
            <p>Último período</p>
            <div class="metrica-tendencia" :class="tendencias.eficiencia.tipo">
              {{ tendencias.eficiencia.texto }}
            </div>
          </div>
          <div v-if="metricasActualizadas.eficiencia" class="update-indicator">��</div>
        </div>

        <div class="metrica-card unidades" :class="{ 'actualizada': metricasActualizadas.unidades }">
          <div class="metrica-icono">📦</div>
          <div class="metrica-info">
            <h3>Unidades Procesadas</h3>
            <div class="metrica-numero">{{ metricas.unidadesProducidas }}</div>
            <p>Tiempo real</p>
            <div class="metrica-tendencia" :class="tendencias.unidades.tipo">
              {{ tendencias.unidades.texto }}
            </div>
          </div>
          <div v-if="metricasActualizadas.unidades" class="update-indicator">●</div>
        </div>

        <div class="metrica-card tiempo" :class="{ 'actualizada': metricasActualizadas.tiempo }">
          <div class="metrica-icono">⏱️</div>
          <div class="metrica-info">
            <h3>Tiempo Promedio</h3>
            <div class="metrica-numero">{{ metricas.tiempoPromedio }}</div>
            <p>Por orden</p>
            <div class="metrica-tendencia" :class="tendencias.tiempo.tipo">
              {{ tendencias.tiempo.texto }}
            </div>
          </div>
          <div v-if="metricasActualizadas.tiempo" class="update-indicator">●</div>
        </div>
      </div>

      <!-- Gráfico de actividad en tiempo real -->
      <div class="actividad-tiempo-real">
        <h3>📊 Actividad en Tiempo Real</h3>
        <div class="timeline-actividad">
          <div v-for="(evento, index) in actividadReciente" :key="index" class="evento-timeline" :class="evento.tipo">
            <div class="evento-timestamp">{{ formatearHora(evento.timestamp) }}</div>
            <div class="evento-descripcion">{{ evento.descripcion }}</div>
            <div class="evento-proceso">{{ evento.proceso }}</div>
          </div>
        </div>
      </div>

      <!-- Resumen de procesos con actualizaciones automáticas -->
      <div class="resumen-procesos">
        <div class="resumen-header">
          <h3>Estado de Procesos</h3>
          <div class="controles-resumen">
            <button @click="pausarActualizacionesProcesos" class="btn-pausa-procesos">
              {{ procesosPausados ? '▶️ Reanudar' : '⏸️ Pausar' }}
            </button>
            <span class="contador-actualizaciones">
              Actualizaciones: {{ contadorActualizaciones }}
            </span>
          </div>
        </div>

        <div class="procesos-grid">
          <div v-for="proceso in resumenProcesos" :key="proceso.nombre" class="proceso-resumen-card"
            :class="[proceso.estado, { 'proceso-actualizado': proceso.actualizado }]">
            <div class="proceso-header">
              <h4>{{ proceso.nombre }}</h4>
              <div class="proceso-status" :class="proceso.estado">{{ proceso.estadoTexto }}</div>
              <div v-if="proceso.actualizado" class="proceso-update-dot">●</div>
            </div>
            <div class="proceso-metricas">
              <div class="metrica-item">
                <span class="metrica-label">Órdenes:</span>
                <span class="metrica-valor" :class="{ 'valor-actualizado': proceso.ordenesActualizado }">
                  {{ proceso.ordenes }}
                </span>
              </div>
              <div class="metrica-item">
                <span class="metrica-label">Progreso:</span>
                <span class="metrica-valor" :class="{ 'valor-actualizado': proceso.progresoActualizado }">
                  {{ proceso.progreso.toFixed(1) }}%
                </span>
              </div>
              <div class="metrica-item">
                <span class="metrica-label">Unidades:</span>
                <span class="metrica-valor" :class="{ 'valor-actualizado': proceso.unidadesActualizado }">
                  {{ proceso.unidades }}
                </span>
              </div>
            </div>
            <div class="proceso-barra">
              <div class="proceso-progreso" :style="{ width: proceso.progreso + '%' }"></div>
            </div>
            <div class="proceso-ultima-actualizacion">
              Actualizado: {{ formatearTiempoRelativo(proceso.ultimaActualizacion) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reporte por Órdenes con filtrado automático -->
    <div v-if="reporteActivo === 'ordenes'" class="reporte-ordenes">
      <div class="reporte-header">
        <h2>📋 Reporte por Órdenes - Auto-actualización</h2>
        <div class="controles-ordenes">
          <input type="text" v-model="busquedaOrden" placeholder="Buscar orden..." class="input-busqueda"
            @input="filtrarOrdenes" />
          <select v-model="filtroEstadoOrden" @change="filtrarOrdenes" class="select-filtro">
            <option value="">Todos los estados</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completada">Completada</option>
            <option value="pendiente">Pendiente</option>
          </select>
          <div class="resultado-filtros">
            {{ ordenesFiltradas.length }} de {{ ordenStore.ordenes.length }} órdenes
          </div>
        </div>
      </div>

      <div class="tabla-ordenes-container">
        <table class="tabla-reportes">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Referencia</th>
              <th>Estado</th>
              <th>Progreso Total</th>
              <th>Unidades</th>
              <th>Tiempo Estimado</th>
              <th>Eficiencia</th>
              <th>Última Actualización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="orden in ordenesFiltradas" :key="orden.id" class="fila-orden"
              :class="{ 'orden-actualizada': orden.recienActualizada }">
              <td>
                {{ orden.consecutivo }}
                <div v-if="orden.recienActualizada" class="indicador-nuevo">NUEVO</div>
              </td>
              <td>{{ orden.referenciaPorDefecto }}</td>
              <td>
                <span class="badge-estado" :class="getEstadoOrden(orden)">
                  {{ getEstadoOrdenTexto(orden) }}
                </span>
              </td>
              <td>
                <div class="progreso-inline">
                  <div class="barra-progreso-inline">
                    <div class="barra-relleno-inline" :style="{ width: calcularProgresoTotalOrden(orden) + '%' }"></div>
                  </div>
                  <span class="porcentaje-inline">{{ calcularProgresoTotalOrden(orden).toFixed(1) }}%</span>
                </div>
              </td>
              <td>{{ calcularTotalUnidadesOrden(orden) }}</td>
              <td>{{ calcularTiempoEstimado(orden) }}</td>
              <td>
                <span class="eficiencia" :class="getClaseEficiencia(orden)">
                  {{ calcularEficienciaOrden(orden).toFixed(1) }}%
                </span>
              </td>
              <td class="celda-actualizacion">
                {{ formatearTiempoRelativo(orden.ultimaActualizacion || orden.fecha) }}
              </td>
              <td>
                <button @click="verDetalleOrden(orden)" class="btn-detalle">
                  Ver Detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Movimientos en tiempo real -->
    <div v-if="reporteActivo === 'movimientos'" class="reporte-movimientos">
      <div class="reporte-header">
        <h2>🔄 Movimientos en Tiempo Real</h2>
        <div class="controles-movimientos">
          <div class="stats-movimientos">
            <span class="stat-item">Total hoy: {{ movimientosHoy.length }}</span>
            <span class="stat-item">Última hora: {{ movimientosUltimaHora.length }}</span>
            <span class="stat-item">Activos: {{ movimientosActivos.length }}</span>
          </div>
          <button @click="exportarMovimientos" class="btn-exportar">📊 Exportar</button>
        </div>
      </div>

      <div class="filtros-movimientos">
        <select v-model="filtroTipoMovimiento" @change="filtrarMovimientos" class="select-tipo">
          <option value="">Todos los tipos</option>
          <option value="subproceso">Entre Subprocesos</option>
          <option value="finalizacion">Finalización</option>
          <option value="inicio">Inicio</option>
        </select>

        <select v-model="filtroPeriodoMovimiento" @change="filtrarMovimientos" class="select-periodo">
          <option value="hoy">Hoy</option>
          <option value="ultima_hora">Última Hora</option>
          <option value="ultimos_30min">Últimos 30 min</option>
          <option value="tiempo_real">Tiempo Real</option>
        </select>
      </div>

      <div class="movimientos-tiempo-real">
        <div v-for="(movimiento, index) in movimientosFiltrados" :key="index" class="movimiento-item"
          :class="getClaseMovimiento(movimiento)">
          <div class="movimiento-timestamp">
            {{ formatearHoraCompleta(movimiento.timestamp) }}
          </div>
          <div class="movimiento-tipo">
            <span class="tipo-badge" :class="movimiento.tipo">{{ getTipoTexto(movimiento.tipo) }}</span>
          </div>
          <div class="movimiento-descripcion">
            {{ movimiento.descripcion }}
          </div>
          <div class="movimiento-proceso">
            <span class="proceso-origen">{{ movimiento.procesoOrigen }}</span>
            <span class="flecha">→</span>
            <span class="proceso-destino">{{ movimiento.procesoDestino }}</span>
          </div>
          <div class="movimiento-cantidad">
            {{ movimiento.cantidad }} unidades
          </div>
          <div class="movimiento-orden">
            Orden: {{ movimiento.ordenId }}
          </div>
        </div>
      </div>
    </div>

    <!-- Balance de Producción en tiempo real -->
    <div v-if="reporteActivo === 'balance'" class="balance-produccion">
      <div class="reporte-header">
        <h2>⚖️ Balance de Producción - Tiempo Real</h2>
        <div class="controles-balance">
          <select v-model="periodoBalance" @change="actualizarBalance" class="select-periodo">
            <option value="tiempo_real">Tiempo Real</option>
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
          <div class="balance-status">
            <span class="status-dot active"></span>
            Actualizando cada {{ intervaloActualizacion / 1000 }}s
          </div>
        </div>
      </div>

      <div class="resumen-balance">
        <div class="balance-card entrada" :class="{ 'card-actualizada': balanceActualizado.entradas }">
          <div class="balance-icono">📥</div>
          <div class="balance-info">
            <h3>Entradas</h3>
            <div class="balance-numero">{{ balance.entradas }}</div>
            <p>Órdenes iniciadas</p>
            <div class="balance-tendencia" :class="tendenciasBalance.entradas.tipo">
              {{ tendenciasBalance.entradas.texto }}
            </div>
          </div>
          <div v-if="balanceActualizado.entradas" class="update-indicator">●</div>
        </div>

        <div class="balance-card proceso" :class="{ 'card-actualizada': balanceActualizado.proceso }">
          <div class="balance-icono">🔄</div>
          <div class="balance-info">
            <h3>En Proceso</h3>
            <div class="balance-numero">{{ balance.enProceso }}</div>
            <p>Órdenes activas</p>
            <div class="balance-tendencia" :class="tendenciasBalance.proceso.tipo">
              {{ tendenciasBalance.proceso.texto }}
            </div>
          </div>
          <div v-if="balanceActualizado.proceso" class="update-indicator">●</div>
        </div>

        <div class="balance-card salida" :class="{ 'card-actualizada': balanceActualizado.salidas }">
          <div class="balance-icono">📤</div>
          <div class="balance-info">
            <h3>Salidas</h3>
            <div class="balance-numero">{{ balance.salidas }}</div>
            <p>Órdenes completadas</p>
            <div class="balance-tendencia" :class="tendenciasBalance.salidas.tipo">
              {{ tendenciasBalance.salidas.texto }}
            </div>
          </div>
          <div v-if="balanceActualizado.salidas" class="update-indicator">●</div>
        </div>

        <div class="balance-card eficiencia" :class="{ 'card-actualizada': balanceActualizado.eficiencia }">
          <div class="balance-icono">📈</div>
          <div class="balance-info">
            <h3>Eficiencia</h3>
            <div class="balance-numero">{{ balance.eficienciaGeneral.toFixed(1) }}%</div>
            <p>Promedio general</p>
            <div class="balance-tendencia" :class="tendenciasBalance.eficiencia.tipo">
              {{ tendenciasBalance.eficiencia.texto }}
            </div>
          </div>
          <div v-if="balanceActualizado.eficiencia" class="update-indicator">●</div>
        </div>
      </div>

      <!-- Tabla de balance detallado con actualizaciones -->
      <div class="tabla-balance">
        <h3>Detalle de Balance por Proceso</h3>
        <table class="tabla-reportes">
          <thead>
            <tr>
              <th>Proceso</th>
              <th>Entradas</th>
              <th>Procesadas</th>
              <th>Pendientes</th>
              <th>Completadas</th>
              <th>Eficiencia</th>
              <th>Tiempo Promedio</th>
              <th>Última Actualización</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in balance.detalleBalance" :key="item.proceso" class="fila-balance"
              :class="{ 'fila-actualizada': item.actualizado }">
              <td><strong>{{ item.proceso }}</strong></td>
              <td>{{ item.entradas }}</td>
              <td>{{ item.procesadas }}</td>
              <td>{{ item.pendientes }}</td>
              <td>{{ item.completadas }}</td>
              <td>
                <span class="eficiencia" :class="getClaseEficiencia({ eficiencia: item.eficiencia })">
                  {{ item.eficiencia.toFixed(1) }}%
                </span>
              </td>
              <td>{{ item.tiempoPromedio }}</td>
              <td>{{ formatearTiempoRelativo(item.ultimaActualizacion) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de detalle de orden -->
    <div v-if="mostrarDetalleOrden" class="modal-overlay" @click="cerrarDetalle">
      <div class="modal-detalle" @click.stop>
        <div class="modal-header">
          <h2>Detalle de Orden {{ ordenDetalle?.consecutivo }}</h2>
          <button @click="cerrarDetalle" class="btn-cerrar">×</button>
        </div>
        <div class="modal-content" v-if="ordenDetalle">
          <div class="detalle-general">
            <div class="info-item">
              <strong>Referencia:</strong> {{ ordenDetalle.referenciaPorDefecto }}
            </div>
            <div class="info-item">
              <strong>Encargado:</strong> {{ ordenDetalle.encargado }}
            </div>
            <div class="info-item">
              <strong>Total Unidades:</strong> {{ calcularTotalUnidadesOrden(ordenDetalle) }}
            </div>
            <div class="info-item">
              <strong>Progreso:</strong> {{ calcularProgresoTotalOrden(ordenDetalle).toFixed(1) }}%
            </div>
          </div>

          <div class="detalle-procesos">
            <h3>Estado por Proceso</h3>
            <div class="procesos-detalle">
              <div class="proceso-detalle-item">
                <h4>Área de Corte</h4>
                <div class="proceso-progreso-detalle">
                  <div class="barra-detalle">
                    <div class="relleno-detalle" :style="{ width: calcularProgresoCorte(ordenDetalle) + '%' }"></div>
                  </div>
                  <span>{{ calcularProgresoCorte(ordenDetalle).toFixed(1) }}%</span>
                </div>
              </div>

              <div class="proceso-detalle-item">
                <h4>Planta</h4>
                <div class="proceso-progreso-detalle">
                  <div class="barra-detalle">
                    <div class="relleno-detalle" :style="{ width: calcularProgresoPlanta(ordenDetalle) + '%' }"></div>
                  </div>
                  <span>{{ calcularProgresoPlanta(ordenDetalle).toFixed(1) }}%</span>
                </div>
              </div>

              <div class="proceso-detalle-item">
                <h4>Lavandería</h4>
                <div class="proceso-progreso-detalle">
                  <div class="barra-detalle">
                    <div class="relleno-detalle" :style="{ width: calcularProgresoLavanderia(ordenDetalle) + '%' }">
                    </div>
                  </div>
                  <span>{{ calcularProgresoLavanderia(ordenDetalle).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useOrdenStore } from '../stores/ordenStore'
import { useRealtimeUpdates } from '../composables/useRealtimeUpdates'
import { useRoute } from 'vue-router'

const ordenStore = useOrdenStore()
const realtimeUpdates = useRealtimeUpdates({
  interval: 5000,
  autoStart: true,
  onUpdate: manejarActualizacionTiempoReal,
  onError: manejarErrorActualizacion
})

// Estados de auto-actualización
const autoUpdateActivo = ref(true)
const actualizando = ref(false)
const ultimaActualizacion = ref(new Date())
const intervaloActualizacion = ref(5000) // 5 segundos
const contadorActualizaciones = ref(0)
const procesosPausados = ref(false)

// Timer para auto-actualización
let autoUpdateTimer = null

// Estados reactivos principales
const route = useRoute()
const reporteActivo = ref('dashboard')
const seccionActual = ref('dashboard')
const filtros = reactive({
  fechaInicio: '',
  fechaFin: ''
})

// Estados para nuevos movimientos y alertas
const nuevosMovimientos = ref([])
const actividadReciente = ref([])

// Estados para filtros y búsquedas
const busquedaOrden = ref('')
const filtroEstadoOrden = ref('')
const filtroTipoMovimiento = ref('')
const filtroPeriodoMovimiento = ref('hoy')
const periodoBalance = ref('tiempo_real')

// Estados para modales
const mostrarDetalleOrden = ref(false)
const ordenDetalle = ref(null)

// Estados de actualización por componente
const metricasActualizadas = reactive({
  produccion: false,
  eficiencia: false,
  unidades: false,
  tiempo: false
})

const balanceActualizado = reactive({
  entradas: false,
  proceso: false,
  salidas: false,
  eficiencia: false
})

// Tipos de reportes disponibles con contadores
const tiposReportes = ref([
  { id: 'dashboard', nombre: 'Dashboard', icono: '📊', nuevos: 0 },
  { id: 'ordenes', nombre: 'Por Órdenes', icono: '📋', nuevos: 0 },
  { id: 'movimientos', nombre: 'Movimientos', icono: '🔄', nuevos: 0 },
  { id: 'balance', nombre: 'Balance', icono: '⚖️', nuevos: 0 }
])

// Datos computados para métricas con histórico
const metricasAnteriores = ref({
  ordenesActivas: 0,
  eficienciaPromedio: 0,
  unidadesProducidas: 0,
  tiempoPromedio: '0h'
})

const metricas = computed(() => {
  const ordenes = ordenStore.ordenes
  const ordenesActivas = ordenes.filter(orden => {
    const progreso = calcularProgresoTotalOrden(orden)
    return progreso > 0 && progreso < 100
  }).length

  const eficienciaPromedio = ordenes.length > 0
    ? ordenes.reduce((sum, orden) => sum + calcularEficienciaOrden(orden), 0) / ordenes.length
    : 0

  const unidadesProducidas = ordenes.reduce((sum, orden) =>
    sum + calcularUnidadesCompletadas(orden), 0
  )

  const tiempoPromedio = calcularTiempoPromedioOrdenes()

  return {
    ordenesActivas,
    eficienciaPromedio,
    unidadesProducidas,
    tiempoPromedio
  }
})

// Tendencias calculadas
const tendencias = computed(() => ({
  ordenesActivas: calcularTendencia(metricas.value.ordenesActivas, metricasAnteriores.value.ordenesActivas),
  eficiencia: calcularTendencia(metricas.value.eficienciaPromedio, metricasAnteriores.value.eficienciaPromedio),
  unidades: calcularTendencia(metricas.value.unidadesProducidas, metricasAnteriores.value.unidadesProducidas),
  tiempo: { tipo: 'neutral', texto: 'Estable' }
}))

// Datos de balance con tendencias
const balance = reactive({
  entradas: 0,
  enProceso: 0,
  salidas: 0,
  eficienciaGeneral: 0,
  detalleBalance: []
})

const balanceAnterior = ref({
  entradas: 0,
  enProceso: 0,
  salidas: 0,
  eficienciaGeneral: 0
})

const tendenciasBalance = computed(() => ({
  entradas: calcularTendencia(balance.entradas, balanceAnterior.value.entradas),
  proceso: calcularTendencia(balance.enProceso, balanceAnterior.value.enProceso),
  salidas: calcularTendencia(balance.salidas, balanceAnterior.value.salidas),
  eficiencia: calcularTendencia(balance.eficienciaGeneral, balanceAnterior.value.eficienciaGeneral)
}))

// Movimientos filtrados por tiempo
const movimientosHoy = computed(() => {
  const hoy = new Date().toDateString()
  return nuevosMovimientos.value.filter(mov =>
    new Date(mov.timestamp).toDateString() === hoy
  )
})

const movimientosUltimaHora = computed(() => {
  const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000)
  return nuevosMovimientos.value.filter(mov =>
    new Date(mov.timestamp) >= unaHoraAtras
  )
})

const movimientosActivos = computed(() => {
  return nuevosMovimientos.value.filter(mov => mov.activo)
})

const movimientosFiltrados = computed(() => {
  let movimientos = nuevosMovimientos.value

  // Filtrar por tipo
  if (filtroTipoMovimiento.value) {
    movimientos = movimientos.filter(mov => mov.tipo === filtroTipoMovimiento.value)
  }

  // Filtrar por período
  const ahora = new Date()
  switch (filtroPeriodoMovimiento.value) {
    case 'ultima_hora':
      const unaHoraAtras = new Date(ahora.getTime() - 60 * 60 * 1000)
      movimientos = movimientos.filter(mov => new Date(mov.timestamp) >= unaHoraAtras)
      break
    case 'ultimos_30min':
      const treintaMinAtras = new Date(ahora.getTime() - 30 * 60 * 1000)
      movimientos = movimientos.filter(mov => new Date(mov.timestamp) >= treintaMinAtras)
      break
    case 'tiempo_real':
      const cincoCincoMinAtras = new Date(ahora.getTime() - 5 * 60 * 1000)
      movimientos = movimientos.filter(mov => new Date(mov.timestamp) >= cincoCincoMinAtras)
      break
    case 'hoy':
    default:
      const hoy = ahora.toDateString()
      movimientos = movimientos.filter(mov => new Date(mov.timestamp).toDateString() === hoy)
  }

  return movimientos.slice(0, 50) // Limitar a 50 elementos
})

// Resumen de procesos con estado de actualización
const resumenProcesos = computed(() => [
  {
    nombre: 'Orden de Producción',
    estado: 'activo',
    estadoTexto: 'Activo',
    ordenes: ordenStore.ordenes.length,
    progreso: 100,
    unidades: ordenStore.ordenes.reduce((sum, orden) => sum + calcularTotalUnidadesOrden(orden), 0),
    actualizado: false,
    ordenesActualizado: false,
    progresoActualizado: false,
    unidadesActualizado: false,
    ultimaActualizacion: new Date()
  },
  {
    nombre: 'Área de Corte',
    estado: 'en-proceso',
    estadoTexto: 'En Proceso',
    ordenes: ordenStore.ordenes.filter(orden => calcularProgresoCorte(orden) > 0).length,
    progreso: calcularProgresoPromedioCorte(),
    unidades: calcularUnidadesProcesadasCorte(),
    actualizado: Math.random() > 0.7,
    ordenesActualizado: Math.random() > 0.8,
    progresoActualizado: Math.random() > 0.6,
    unidadesActualizado: Math.random() > 0.5,
    ultimaActualizacion: new Date(Date.now() - Math.random() * 300000)
  },
  {
    nombre: 'Planta',
    estado: 'en-proceso',
    estadoTexto: 'En Proceso',
    ordenes: ordenStore.ordenes.filter(orden => calcularProgresoPlanta(orden) > 0).length,
    progreso: calcularProgresoPromedioPlanta(),
    unidades: calcularUnidadesProcesadasPlanta(),
    actualizado: Math.random() > 0.6,
    ordenesActualizado: Math.random() > 0.7,
    progresoActualizado: Math.random() > 0.8,
    unidadesActualizado: Math.random() > 0.9,
    ultimaActualizacion: new Date(Date.now() - Math.random() * 180000)
  },
  {
    nombre: 'Lavandería',
    estado: 'pendiente',
    estadoTexto: 'Pendiente',
    ordenes: ordenStore.ordenes.filter(orden => calcularProgresoLavanderia(orden) > 0).length,
    progreso: calcularProgresoPromedioLavanderia(),
    unidades: calcularUnidadesProcesadasLavanderia(),
    actualizado: Math.random() > 0.9,
    ordenesActualizado: Math.random() > 0.9,
    progresoActualizado: Math.random() > 0.8,
    unidadesActualizado: Math.random() > 0.7,
    ultimaActualizacion: new Date(Date.now() - Math.random() * 600000)
  }
])

// Órdenes filtradas para reporte
const ordenesFiltradas = computed(() => {
  let ordenes = ordenStore.ordenes.map(orden => ({
    ...orden,
    recienActualizada: Math.random() > 0.8, // Simular actualizaciones recientes
    ultimaActualizacion: new Date(Date.now() - Math.random() * 3600000)
  }))

  if (busquedaOrden.value) {
    const busqueda = busquedaOrden.value.toLowerCase()
    ordenes = ordenes.filter(orden =>
      orden.consecutivo.toLowerCase().includes(busqueda) ||
      orden.referenciaPorDefecto.toLowerCase().includes(busqueda)
    )
  }

  if (filtroEstadoOrden.value) {
    ordenes = ordenes.filter(orden =>
      getEstadoOrden(orden) === filtroEstadoOrden.value
    )
  }

  return ordenes
})

// Funciones de auto-actualización
function toggleAutoUpdate() {
  if (autoUpdateActivo.value) {
    iniciarAutoUpdate()
  } else {
    detenerAutoUpdate()
  }
}

function iniciarAutoUpdate() {
  if (autoUpdateTimer) clearInterval(autoUpdateTimer)

  autoUpdateTimer = setInterval(() => {
    if (autoUpdateActivo.value && !procesosPausados.value) {
      ejecutarActualizacionAutomatica()
    }
  }, intervaloActualizacion.value)
}

function detenerAutoUpdate() {
  if (autoUpdateTimer) {
    clearInterval(autoUpdateTimer)
    autoUpdateTimer = null
  }
}

function ejecutarActualizacionAutomatica() {
  actualizando.value = true

  // Simular actualización de datos
  setTimeout(() => {
    actualizarDatosEnTiempoReal()
    ultimaActualizacion.value = new Date()
    contadorActualizaciones.value++
    actualizando.value = false
  }, 1000)
}

function actualizarDatosEnTiempoReal() {
  // Guardar valores anteriores para calcular tendencias
  metricasAnteriores.value = { ...metricas.value }
  balanceAnterior.value = { ...balance }

  // Simular nuevos movimientos
  if (Math.random() > 0.7) {
    agregarNuevoMovimiento()
  }

  // Actualizar métricas con indicadores
  actualizarIndicadoresMetricas()

  // Actualizar balance
  actualizarBalance()

  // Agregar actividad reciente
  agregarActividadReciente()

  // Actualizar contadores de reportes
  actualizarContadoresReportes()
}

function agregarNuevoMovimiento() {
  const tipos = ['subproceso', 'finalizacion', 'inicio']
  const procesos = ['Corte', 'Numeración', 'Fusión', 'Delantero', 'Trasero', 'Ensamble']

  const nuevoMovimiento = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    tipo: tipos[Math.floor(Math.random() * tipos.length)],
    descripcion: `Movimiento de ${Math.floor(Math.random() * 50) + 1} unidades`,
    procesoOrigen: procesos[Math.floor(Math.random() * procesos.length)],
    procesoDestino: procesos[Math.floor(Math.random() * procesos.length)],
    cantidad: Math.floor(Math.random() * 50) + 1,
    ordenId: `ORD-${Math.floor(Math.random() * 1000)}`,
    activo: Math.random() > 0.3
  }

  nuevosMovimientos.value.unshift(nuevoMovimiento)

  // Limitar a los últimos 100 movimientos
  if (nuevosMovimientos.value.length > 100) {
    nuevosMovimientos.value = nuevosMovimientos.value.slice(0, 100)
  }

  // Agregar a alertas si es relevante
  if (nuevoMovimiento.cantidad > 30) {
    agregarAlerta(`Gran movimiento detectado: ${nuevoMovimiento.cantidad} unidades`)
  }
}

function agregarAlerta(descripcion) {
  nuevosMovimientos.value.unshift({
    descripcion,
    timestamp: new Date().toISOString(),
    tipo: 'alerta'
  })
}

function agregarActividadReciente() {
  const eventos = [
    'Orden iniciada',
    'Proceso completado',
    'Transferencia realizada',
    'Validación aprobada',
    'Estado actualizado'
  ]

  const procesos = ['Corte', 'Planta', 'Lavandería', 'Finalización']

  if (Math.random() > 0.5) {
    const evento = {
      timestamp: new Date().toISOString(),
      descripcion: eventos[Math.floor(Math.random() * eventos.length)],
      proceso: procesos[Math.floor(Math.random() * procesos.length)],
      tipo: Math.random() > 0.7 ? 'importante' : 'normal'
    }

    actividadReciente.value.unshift(evento)

    // Limitar a los últimos 20 eventos
    if (actividadReciente.value.length > 20) {
      actividadReciente.value = actividadReciente.value.slice(0, 20)
    }
  }
}

function actualizarIndicadoresMetricas() {
  // Simular actualizaciones aleatorias en métricas
  metricasActualizadas.produccion = Math.random() > 0.8
  metricasActualizadas.eficiencia = Math.random() > 0.7
  metricasActualizadas.unidades = Math.random() > 0.6
  metricasActualizadas.tiempo = Math.random() > 0.9

  // Limpiar indicadores después de un tiempo
  setTimeout(() => {
    Object.keys(metricasActualizadas).forEach(key => {
      metricasActualizadas[key] = false
    })
  }, 3000)
}

function actualizarBalance() {
  const ordenes = ordenStore.ordenes

  const nuevasEntradas = ordenes.length
  const nuevoEnProceso = ordenes.filter(orden => {
    const progreso = calcularProgresoTotalOrden(orden)
    return progreso > 0 && progreso < 100
  }).length
  const nuevasSalidas = ordenes.filter(orden => calcularProgresoTotalOrden(orden) === 100).length
  const nuevaEficiencia = ordenes.length > 0
    ? ordenes.reduce((sum, orden) => sum + calcularEficienciaOrden(orden), 0) / ordenes.length
    : 0

  // Detectar cambios
  balanceActualizado.entradas = balance.entradas !== nuevasEntradas
  balanceActualizado.proceso = balance.enProceso !== nuevoEnProceso
  balanceActualizado.salidas = balance.salidas !== nuevasSalidas
  balanceActualizado.eficiencia = Math.abs(balance.eficienciaGeneral - nuevaEficiencia) > 0.1

  // Actualizar valores
  balance.entradas = nuevasEntradas
  balance.enProceso = nuevoEnProceso
  balance.salidas = nuevasSalidas
  balance.eficienciaGeneral = nuevaEficiencia

  // Actualizar detalle de balance
  balance.detalleBalance = [
    {
      proceso: 'Orden de Producción',
      entradas: ordenes.length,
      procesadas: ordenes.length,
      pendientes: 0,
      completadas: ordenes.length,
      eficiencia: 100,
      tiempoPromedio: '10min',
      ultimaActualizacion: new Date(),
      actualizado: Math.random() > 0.8
    },
    {
      proceso: 'Área de Corte',
      entradas: ordenes.length,
      procesadas: Math.floor(calcularUnidadesProcesadasCorte()),
      pendientes: ordenes.reduce((sum, orden) => sum + calcularTotalUnidadesOrden(orden), 0) - Math.floor(calcularUnidadesProcesadasCorte()),
      completadas: ordenes.filter(orden => calcularProgresoCorte(orden) === 100).length,
      eficiencia: calcularProgresoPromedioCorte(),
      tiempoPromedio: '4h',
      ultimaActualizacion: new Date(Date.now() - Math.random() * 300000),
      actualizado: Math.random() > 0.7
    },
    {
      proceso: 'Planta',
      entradas: ordenes.length,
      procesadas: Math.floor(calcularUnidadesProcesadasPlanta()),
      pendientes: ordenes.reduce((sum, orden) => sum + calcularTotalUnidadesOrden(orden), 0) - Math.floor(calcularUnidadesProcesadasPlanta()),
      completadas: ordenes.filter(orden => calcularProgresoPlanta(orden) === 100).length,
      eficiencia: calcularProgresoPromedioPlanta(),
      tiempoPromedio: '8h',
      ultimaActualizacion: new Date(Date.now() - Math.random() * 180000),
      actualizado: Math.random() > 0.6
    },
    {
      proceso: 'Lavandería',
      entradas: ordenes.length,
      procesadas: Math.floor(calcularUnidadesProcesadasLavanderia()),
      pendientes: ordenes.reduce((sum, orden) => sum + calcularTotalUnidadesOrden(orden), 0) - Math.floor(calcularUnidadesProcesadasLavanderia()),
      completadas: ordenes.filter(orden => calcularProgresoLavanderia(orden) === 100).length,
      eficiencia: calcularProgresoPromedioLavanderia(),
      tiempoPromedio: '2h',
      ultimaActualizacion: new Date(Date.now() - Math.random() * 600000),
      actualizado: Math.random() > 0.9
    }
  ]

  // Limpiar indicadores de actualización
  setTimeout(() => {
    Object.keys(balanceActualizado).forEach(key => {
      balanceActualizado[key] = false
    })
  }, 3000)
}

function actualizarContadoresReportes() {
  // Simular nuevos elementos en reportes
  tiposReportes.value.forEach(reporte => {
    if (Math.random() > 0.8) {
      reporte.nuevos = Math.min(reporte.nuevos + 1, 99)
    }
  })
}

// Funciones de utilidad
function calcularTendencia(valorActual, valorAnterior) {
  if (valorAnterior === 0) return { tipo: 'neutral', texto: 'Sin datos anteriores' }

  const diferencia = valorActual - valorAnterior
  const porcentaje = Math.abs((diferencia / valorAnterior) * 100)

  if (Math.abs(diferencia) < 0.1) {
    return { tipo: 'neutral', texto: 'Estable' }
  } else if (diferencia > 0) {
    return { tipo: 'positiva', texto: `↗ +${porcentaje.toFixed(1)}%` }
  } else {
    return { tipo: 'negativa', texto: `↘ -${porcentaje.toFixed(1)}%` }
  }
}

function formatearHoraActualizacion(fecha) {
  if (!fecha) return 'Nunca'
  return fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatearTiempoRelativo(fecha) {
  if (!fecha) return 'Nunca'

  const ahora = new Date()
  const fechaObj = new Date(fecha)
  const diferencia = ahora - fechaObj

  const minutos = Math.floor(diferencia / (1000 * 60))
  const horas = Math.floor(diferencia / (1000 * 60 * 60))
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

  if (diferencia < 60000) return 'Hace unos segundos'
  if (minutos < 60) return `Hace ${minutos} min`
  if (horas < 24) return `Hace ${horas}h`
  return `Hace ${dias}d`
}

function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatearHoraCompleta(fecha) {
  return new Date(fecha).toLocaleString('es-ES')
}

function getTipoTexto(tipo) {
  const tipos = {
    'subproceso': 'Subproceso',
    'finalizacion': 'Finalización',
    'inicio': 'Inicio',
    'alerta': 'Alerta'
  }
  return tipos[tipo] || tipo
}

function getClaseMovimiento(movimiento) {
  const ahora = new Date()
  const tiempoMovimiento = new Date(movimiento.timestamp)
  const diferencia = ahora - tiempoMovimiento

  return {
    'movimiento-reciente': diferencia < 300000, // Últimos 5 minutos
    'movimiento-importante': movimiento.cantidad > 30,
    'movimiento-alerta': movimiento.tipo === 'alerta'
  }
}

// Funciones de control
function pausarActualizacionesProcesos() {
  procesosPausados.value = !procesosPausados.value
}

function limpiarAlertas() {
  nuevosMovimientos.value = nuevosMovimientos.value.filter(mov => mov.tipo !== 'alerta')

  // Limpiar contadores de nuevos elementos
  tiposReportes.value.forEach(reporte => {
    reporte.nuevos = 0
  })
}

function filtrarOrdenes() {
  // La lógica de filtrado ya está en el computed ordenesFiltradas
  console.log('Filtrando órdenes...')
}

function filtrarMovimientos() {
  // La lógica de filtrado ya está en el computed movimientosFiltrados
  console.log('Filtrando movimientos...')
}

function exportarMovimientos() {
  const datos = movimientosFiltrados.value.map(mov => ({
    Timestamp: formatearHoraCompleta(mov.timestamp),
    Tipo: getTipoTexto(mov.tipo),
    Descripcion: mov.descripcion,
    Origen: mov.procesoOrigen,
    Destino: mov.procesoDestino,
    Cantidad: mov.cantidad,
    Orden: mov.ordenId
  }))

  const csv = [
    Object.keys(datos[0]).join(','),
    ...datos.map(row => Object.values(row).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// Funciones de callbacks para tiempo real
function manejarActualizacionTiempoReal(timestamp) {
  console.log('Actualización en tiempo real recibida:', timestamp)
  ejecutarActualizacionAutomatica()
}

function manejarErrorActualizacion(error) {
  console.error('Error en actualización automática:', error)
  // No detener auto-actualización por errores temporales
}

// Funciones existentes (copiadas del código original)
function calcularTotalUnidadesOrden(orden) {
  if (!orden.detalles) return 0
  return orden.detalles.reduce((sum, detalle) =>
    sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0), 0
  )
}

function calcularProgresoTotalOrden(orden) {
  const progresoCorte = calcularProgresoCorte(orden)
  const progresoPlanta = calcularProgresoPlanta(orden)
  const progresoLavanderia = calcularProgresoLavanderia(orden)

  return (progresoCorte + progresoPlanta + progresoLavanderia) / 3
}

function calcularProgresoCorte(orden) {
  if (!orden.estadoCorte) return 0

  const totalPedido = calcularTotalUnidadesOrden(orden)
  if (totalPedido === 0) return 0

  let unidadesProcesadas = 0

  if (orden.estadoCorte.tiemposExtension?.unidadesProcesadas) {
    unidadesProcesadas += orden.estadoCorte.tiemposExtension.unidadesProcesadas
  }

  if (orden.estadoCorte.tiemposCorte?.unidadesProcesadas) {
    unidadesProcesadas += orden.estadoCorte.tiemposCorte.unidadesProcesadas
  }

  if (orden.estadoCorte.tiemposNumeracion?.unidadesProcesadas) {
    unidadesProcesadas += orden.estadoCorte.tiemposNumeracion.unidadesProcesadas
  }

  if (orden.estadoCorte.tiemposFusion?.unidadesProcesadas) {
    unidadesProcesadas += orden.estadoCorte.tiemposFusion.unidadesProcesadas
  }

  const promedioUnidades = unidadesProcesadas / 4
  return totalPedido > 0 ? (promedioUnidades / totalPedido) * 100 : 0
}

function calcularProgresoPlanta(orden) {
  const datosSubprocesos = localStorage.getItem(`subprocesosPlanta_${orden.id}`)
  if (!datosSubprocesos) return 0

  try {
    const datos = JSON.parse(datosSubprocesos)
    const estados = datos.estados || {}
    const totalPedido = calcularTotalUnidadesOrden(orden)

    if (totalPedido === 0) return 0

    const subprocesos = [
      'falso_y_vista', 'filete_vistas', 'fileteritos_delanteros', 'aletilla', 'aletillon',
      'cerrar_bolsillo', 'pesp_bolsillo', 'prender_bolsillo', 'hacer_oca', 'fijar_delantero',
      'prender_cierre', 'hacer_j', 'encaje', 'presillar', 'revocar'
    ]

    let sumaProgreso = 0
    subprocesos.forEach(subproceso => {
      const estado = estados[subproceso]
      if (estado && estado.unidadesProcesadas) {
        sumaProgreso += (estado.unidadesProcesadas / totalPedido) * 100
      }
    })

    return sumaProgreso / subprocesos.length
  } catch (error) {
    return 0
  }
}

function calcularProgresoLavanderia(orden) {
  const datosLavanderia = localStorage.getItem(`estadosLavanderia_${orden.id}`)
  if (!datosLavanderia) return 0

  try {
    const datos = JSON.parse(datosLavanderia)
    const totalPedido = calcularTotalUnidadesOrden(orden)

    if (totalPedido === 0) return 0

    let totalProcesadas = 0
    Object.values(datos).forEach(estado => {
      if (estado.salida) {
        totalProcesadas += estado.salida
      }
    })

    return (totalProcesadas / totalPedido) * 100
  } catch (error) {
    return 0
  }
}

function calcularProgresoPromedioCorte() {
  const ordenes = ordenStore.ordenes
  if (ordenes.length === 0) return 0

  const suma = ordenes.reduce((sum, orden) => sum + calcularProgresoCorte(orden), 0)
  return suma / ordenes.length
}

function calcularProgresoPromedioPlanta() {
  const ordenes = ordenStore.ordenes
  if (ordenes.length === 0) return 0

  const suma = ordenes.reduce((sum, orden) => sum + calcularProgresoPlanta(orden), 0)
  return suma / ordenes.length
}

function calcularProgresoPromedioLavanderia() {
  const ordenes = ordenStore.ordenes
  if (ordenes.length === 0) return 0

  const suma = ordenes.reduce((sum, orden) => sum + calcularProgresoLavanderia(orden), 0)
  return suma / ordenes.length
}

function calcularUnidadesProcesadasCorte() {
  return ordenStore.ordenes.reduce((sum, orden) => {
    const progreso = calcularProgresoCorte(orden) / 100
    return sum + (calcularTotalUnidadesOrden(orden) * progreso)
  }, 0)
}

function calcularUnidadesProcesadasPlanta() {
  return ordenStore.ordenes.reduce((sum, orden) => {
    const progreso = calcularProgresoPlanta(orden) / 100
    return sum + (calcularTotalUnidadesOrden(orden) * progreso)
  }, 0)
}

function calcularUnidadesProcesadasLavanderia() {
  return ordenStore.ordenes.reduce((sum, orden) => {
    const progreso = calcularProgresoLavanderia(orden) / 100
    return sum + (calcularTotalUnidadesOrden(orden) * progreso)
  }, 0)
}

function calcularUnidadesCompletadas(orden) {
  const progreso = calcularProgresoTotalOrden(orden)
  return Math.floor((calcularTotalUnidadesOrden(orden) * progreso) / 100)
}

function calcularEficienciaOrden(orden) {
  const progresoTotal = calcularProgresoTotalOrden(orden)

  if (progresoTotal === 0) return 0
  if (progresoTotal === 100) return 85 + Math.random() * 15 // 85-100%
  return 70 + Math.random() * 20 // 70-90% para órdenes en proceso
}

function calcularTiempoEstimado(orden) {
  const totalUnidades = calcularTotalUnidadesOrden(orden)
  const horasEstimadas = Math.ceil(totalUnidades / 50)
  return `${horasEstimadas}h`
}

function calcularTiempoPromedioOrdenes() {
  const ordenes = ordenStore.ordenes
  if (ordenes.length === 0) return '0h'

  const promedioUnidades = ordenes.reduce((sum, orden) =>
    sum + calcularTotalUnidadesOrden(orden), 0
  ) / ordenes.length

  const horasPromedio = Math.ceil(promedioUnidades / 50)
  return `${horasPromedio}h`
}

function getEstadoOrden(orden) {
  const progreso = calcularProgresoTotalOrden(orden)
  if (progreso === 0) return 'pendiente'
  if (progreso === 100) return 'completada'
  return 'en_proceso'
}

function getEstadoOrdenTexto(orden) {
  const estado = getEstadoOrden(orden)
  const textos = {
    'pendiente': 'Pendiente',
    'en_proceso': 'En Proceso',
    'completada': 'Completada'
  }
  return textos[estado]
}

function getClaseEficiencia(orden) {
  const eficiencia = calcularEficienciaOrden(orden)
  if (eficiencia >= 90) return 'excelente'
  if (eficiencia >= 80) return 'buena'
  if (eficiencia >= 70) return 'regular'
  return 'mala'
}

function actualizarReportes() {
  if (actualizando.value) return

  actualizando.value = true
  console.log('Actualizando reportes con filtros:', filtros)

  setTimeout(() => {
    ejecutarActualizacionAutomatica()
  }, 500)
}

function verDetalleOrden(orden) {
  ordenDetalle.value = orden
  mostrarDetalleOrden.value = true
}

function cerrarDetalle() {
  mostrarDetalleOrden.value = false
  ordenDetalle.value = null
}

// Lifecycle hooks
onMounted(() => {
  // Configurar fechas por defecto (último mes)
  const hoy = new Date()
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate())

  filtros.fechaInicio = mesAnterior.toISOString().split('T')[0]
  filtros.fechaFin = hoy.toISOString().split('T')[0]

  // Establecer sección inicial desde la ruta
  if (route.params.seccion && typeof route.params.seccion === 'string') {
    reporteActivo.value = route.params.seccion
    seccionActual.value = route.params.seccion
  } else {
    reporteActivo.value = 'dashboard'
    seccionActual.value = 'dashboard'
  }

  // Cargar datos iniciales
  ordenStore.cargarOrdenes()

  // Iniciar auto-actualización
  setTimeout(() => {
    iniciarAutoUpdate()
    ejecutarActualizacionAutomatica()
  }, 1000)

  // Escuchar eventos de otros componentes
  window.addEventListener('subprocesoActualizado', (event) => {
    console.log('Evento de subproceso recibido en informes:', event.detail)
    agregarNuevoMovimiento()
  })

  window.addEventListener('ordenFinalizada', (event) => {
    console.log('Orden finalizada recibida en informes:', event.detail)
    agregarAlerta(`Orden ${event.detail.orden.consecutivo} finalizada`)
  })
})

onUnmounted(() => {
  detenerAutoUpdate()
  realtimeUpdates.detener()
})

// Watchers
watch(() => autoUpdateActivo.value, (newVal) => {
  if (newVal) {
    iniciarAutoUpdate()
  } else {
    detenerAutoUpdate()
  }
})

watch(() => reporteActivo.value, (newVal) => {
  const reporte = tiposReportes.value.find(r => r.id === newVal)
  if (reporte) {
    reporte.nuevos = 0
  }
})

watch(() => route.params.seccion, (val) => {
  if (typeof val === 'string' && val.length > 0) {
    reporteActivo.value = val
    seccionActual.value = val
  }
})
</script>

<style scoped>
/* Estilos base existentes + nuevos estilos para auto-actualización */
.informes-balance-view {
  padding: var(--spacing-lg);
  max-width: 1600px;
  margin: 0 auto;
  background-color: var(--bg-primary);
  min-height: 100vh;
}

/* Header con auto-actualización */
.header-informes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--border-color);
}

.titulo-principal {
  color: var(--primary-blue-dark);
  font-size: var(--font-size-3xl);
  margin: 0;
  font-weight: 700;
}

.filtros-principales {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
  flex-wrap: wrap;
}

/* Controles de auto-actualización */
.auto-update-control {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 2px solid var(--border-color);
}

.auto-update-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-weight: 600;
  color: var(--text-primary);
}

.auto-update-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--success);
}

.update-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.update-status.updating {
  animation: pulso 1s ease-in-out infinite;
}

@keyframes pulso {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--gray-400);
  transition: all var(--transition-fast);
}

.status-dot.active {
  background-color: var(--success);
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
  animation: parpadeo 2s ease-in-out infinite;
}

@keyframes parpadeo {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.status-text {
  color: var(--text-secondary);
  font-weight: 500;
}

.last-update {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-style: italic;
}

/* Filtros de fecha */
.filtro-fechas {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.filtro-fechas label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.input-fecha {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.btn-actualizar {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-actualizar:hover:not(:disabled) {
  background-color: var(--primary-blue-dark);
  transform: translateY(-1px);
}

.btn-actualizar:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
}

/* Navegación de reportes con badges */
.nav-reportes {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
}

.btn-reporte {
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
  white-space: nowrap;
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-reporte:hover {
  background-color: var(--primary-blue-bg);
  border-color: var(--primary-blue);
}

.btn-reporte.active {
  background-color: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.badge-nuevos {
  background-color: var(--danger);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
  position: absolute;
  top: -8px;
  right: -8px;
  animation: rebote 0.5s ease-in-out;
}

@keyframes rebote {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }
}

/* Alertas de nuevos movimientos */
.alertas-movimientos {
  background: linear-gradient(135deg, var(--warning-bg), var(--bg-secondary));
  border: 2px solid var(--warning);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.alerta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.alerta-header h3 {
  margin: 0;
  color: var(--warning-dark);
  font-size: var(--font-size-lg);
}

.btn-limpiar-alertas {
  background-color: var(--warning);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-limpiar-alertas:hover {
  background-color: var(--warning-dark);
}

.lista-alertas {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.alerta-movimiento {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--warning-border);
}

.alerta-icono {
  font-size: var(--font-size-lg);
}

.alerta-contenido {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alerta-texto {
  color: var(--text-primary);
  font-weight: 500;
}

.alerta-tiempo {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* Métricas con indicadores de actualización */
.metrica-card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.metrica-card.actualizada {
  border-color: var(--success);
  box-shadow: 0 0 15px rgba(40, 167, 69, 0.3);
  animation: actualizado 1s ease-in-out;
}

@keyframes actualizado {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.02);
  }

  100% {
    transform: scale(1);
  }
}

.metrica-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.metrica-card.produccion {
  border-left: 4px solid var(--primary-blue);
}

.metrica-card.eficiencia {
  border-left: 4px solid var(--success);
}

.metrica-card.unidades {
  border-left: 4px solid var(--warning);
}

.metrica-card.tiempo {
  border-left: 4px solid var(--info);
}

.update-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  color: var(--success);
  font-size: var(--font-size-lg);
  animation: parpadeoRapido 0.5s ease-in-out 3;
}

@keyframes parpadeoRapido {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

.metrica-tendencia {
  font-size: var(--font-size-xs);
  font-weight: 600;
  margin-top: var(--spacing-xs);
}

.metrica-tendencia.positiva {
  color: var(--success);
}

.metrica-tendencia.negativa {
  color: var(--danger);
}

.metrica-tendencia.neutral {
  color: var(--text-secondary);
}

/* Actividad en tiempo real */
.actividad-tiempo-real {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  margin-bottom: var(--spacing-xl);
}

.actividad-tiempo-real h3 {
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
}

.timeline-actividad {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 300px;
  overflow-y: auto;
}

.evento-timeline {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border-left: 3px solid var(--border-color);
  transition: all var(--transition-fast);
}

.evento-timeline.importante {
  border-left-color: var(--warning);
  background-color: var(--warning-bg);
}

.evento-timeline:hover {
  transform: translateX(5px);
}

.evento-timestamp {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-family: monospace;
}

.evento-descripcion {
  color: var(--text-primary);
  font-weight: 500;
}

.evento-proceso {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

/* Resumen de procesos con actualizaciones */
.resumen-procesos {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
}

.resumen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.resumen-header h3 {
  margin: 0;
  color: var(--primary-blue-dark);
  font-size: var(--font-size-xl);
}

.controles-resumen {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.btn-pausa-procesos {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--warning);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-pausa-procesos:hover {
  background-color: var(--warning-dark);
}

.contador-actualizaciones {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.procesos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.proceso-resumen-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  transition: all var(--transition-fast);
  position: relative;
}

.proceso-resumen-card.proceso-actualizado {
  border-color: var(--info);
  box-shadow: 0 0 10px rgba(23, 162, 184, 0.3);
}

.proceso-resumen-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.proceso-resumen-card.activo {
  border-left: 4px solid var(--success);
}

.proceso-resumen-card.en-proceso {
  border-left: 4px solid var(--warning);
}

.proceso-resumen-card.pendiente {
  border-left: 4px solid var(--gray-400);
}

.proceso-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  position: relative;
}

.proceso-update-dot {
  position: absolute;
  top: -5px;
  right: -5px;
  color: var(--info);
  font-size: var(--font-size-sm);
  animation: parpadeoLento 2s ease-in-out infinite;
}

@keyframes parpadeoLento {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.valor-actualizado {
  color: var(--info) !important;
  font-weight: 700 !important;
  animation: resaltado 1s ease-in-out;
}

@keyframes resaltado {

  0%,
  100% {
    background-color: transparent;
  }

  50% {
    background-color: var(--info-bg);
  }
}

.proceso-ultima-actualizacion {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-style: italic;
  margin-top: var(--spacing-xs);
  text-align: center;
}

/* Movimientos en tiempo real */
.reporte-movimientos {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.controles-movimientos {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.stats-movimientos {
  display: flex;
  gap: var(--spacing-lg);
}

.stat-item {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.btn-exportar {
  background-color: var(--success);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-exportar:hover {
  background-color: var(--success-dark);
}

.filtros-movimientos {
  display: flex;
  gap: var(--spacing-md);
  margin: var(--spacing-lg) 0;
}

.select-tipo,
.select-periodo {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.movimientos-tiempo-real {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 600px;
  overflow-y: auto;
}

.movimiento-item {
  display: grid;
  grid-template-columns: auto auto 2fr 1fr auto auto;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
  align-items: center;
}

.movimiento-item.movimiento-reciente {
  border-color: var(--success);
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
}

.movimiento-item.movimiento-importante {
  border-color: var(--warning);
}

.movimiento-item.movimiento-alerta {
  border-color: var(--danger);
  background-color: var(--danger-bg);
}

.movimiento-timestamp {
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.tipo-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.tipo-badge.subproceso {
  background-color: var(--info);
  color: white;
}

.tipo-badge.finalizacion {
  background-color: var(--success);
  color: white;
}

.tipo-badge.inicio {
  background-color: var(--warning);
  color: white;
}

.tipo-badge.alerta {
  background-color: var(--danger);
  color: white;
}

.movimiento-descripcion {
  color: var(--text-primary);
  font-weight: 500;
}

.movimiento-proceso {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.proceso-origen {
  color: var(--info);
  font-weight: 600;
}

.flecha {
  color: var(--primary-blue);
  font-weight: 700;
}

.proceso-destino {
  color: var(--success);
  font-weight: 600;
}

.movimiento-cantidad {
  color: var(--primary-blue);
  font-weight: 600;
}

.movimiento-orden {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* Balance con tendencias */
.balance-card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-fast);
  position: relative;
}

.balance-card.card-actualizada {
  border-color: var(--success);
  box-shadow: 0 0 15px rgba(40, 167, 69, 0.3);
  animation: actualizado 1s ease-in-out;
}

.balance-tendencia {
  font-size: var(--font-size-xs);
  font-weight: 600;
  margin-top: var(--spacing-xs);
}

.balance-tendencia.positiva {
  color: var(--success);
}

.balance-tendencia.negativa {
  color: var(--danger);
}

.balance-tendencia.neutral {
  color: var(--text-secondary);
}

.balance-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Tablas con actualizaciones */
.orden-actualizada {
  background-color: var(--success-bg);
  border-left: 3px solid var(--success);
}

.fila-actualizada {
  background-color: var(--info-bg);
  border-left: 3px solid var(--info);
}

.indicador-nuevo {
  background-color: var(--danger);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  margin-left: var(--spacing-xs);
  animation: parpadeoNuevo 1s ease-in-out 3;
}

@keyframes parpadeoNuevo {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.celda-actualizacion {
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.resultado-filtros {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
  padding: var(--spacing-sm);
  background-color: var(--info-bg);
  border-radius: var(--border-radius);
}

/* Responsive */
@media (max-width: 1024px) {
  .filtros-principales {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .auto-update-control {
    order: -1;
  }

  .movimiento-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .controles-movimientos {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .header-informes {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .nav-reportes {
    flex-direction: column;
  }

  .alerta-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .controles-resumen {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .filtros-movimientos {
    flex-direction: column;
  }

  .stats-movimientos {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
