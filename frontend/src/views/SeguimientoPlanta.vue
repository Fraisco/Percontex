<template>
  <div class="seguimiento-planta-container">
    <h2 class="titulo-principal">🏭 Seguimiento de Procesos de Planta</h2>
    <p class="descripcion">Monitoreo en tiempo real del progreso de los subprocesos de planta: Delantero, Trasero y Ensamble</p>

    <!-- Filtros y búsqueda -->
    <div class="filtros-seccion">
      <div class="busqueda-ordenes">
        <input
          type="text"
          v-model="filtroTexto"
          placeholder="Buscar por ID, consecutivo o referencia..."
          class="input-busqueda"
        />
      </div>
      <div class="filtros-estado">
        <label>
          <input type="checkbox" v-model="mostrarCompletas" />
          Órdenes Completas
        </label>
        <label>
          <input type="checkbox" v-model="mostrarPendientes" />
          Órdenes Pendientes
        </label>
        <label>
          <input type="checkbox" v-model="mostrarEnProceso" />
          Órdenes en Proceso
        </label>
      </div>
    </div>

    <!-- Resumen general de planta -->
    <div class="resumen-general-planta">
      <h3>📈 Resumen General de Procesos de Planta</h3>
      <div class="metricas-generales">
        <div class="metrica-card">
          <div class="metrica-numero">{{ ordenesFiltradas.length }}</div>
          <div class="metrica-label">Total Órdenes</div>
        </div>
        <div class="metrica-card metrica-delantero">
          <div class="metrica-numero">{{ totalUnidadesDelantero }}</div>
          <div class="metrica-label">🔧 Delantero</div>
          <div class="progreso-metrica">{{ promedioDelantero.toFixed(1) }}%</div>
        </div>
        <div class="metrica-card metrica-trasero">
          <div class="metrica-numero">{{ totalUnidadesTrasero }}</div>
          <div class="metrica-label">🔨 Trasero</div>
          <div class="progreso-metrica">{{ promedioTrasero.toFixed(1) }}%</div>
        </div>
        <div class="metrica-card metrica-ensamble">
          <div class="metrica-numero">{{ totalUnidadesEnsamble }}</div>
          <div class="metrica-label">⚙️ Ensamble</div>
          <div class="progreso-metrica">{{ promedioEnsamble.toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <!-- Gráfico de progreso visual por proceso -->
    <div class="grafico-procesos">
      <h3>📊 Progreso Visual por Proceso</h3>
      <div class="barras-progreso-procesos">
        <div class="proceso-barra">
          <div class="proceso-header">
            <span class="proceso-nombre">🔧 Delantero</span>
            <span class="proceso-porcentaje">{{ promedioDelantero.toFixed(1) }}%</span>
          </div>
          <div class="barra-contenedor">
            <div class="barra-progreso-visual" :style="{ width: promedioDelantero + '%', backgroundColor: getColorPorPorcentaje(promedioDelantero) }"></div>
          </div>
          <div class="proceso-detalle">{{ totalUnidadesDelantero }} / {{ totalUnidadesRequeridas }} unidades</div>
        </div>
        
        <div class="proceso-barra">
          <div class="proceso-header">
            <span class="proceso-nombre">🔨 Trasero</span>
            <span class="proceso-porcentaje">{{ promedioTrasero.toFixed(1) }}%</span>
          </div>
          <div class="barra-contenedor">
            <div class="barra-progreso-visual" :style="{ width: promedioTrasero + '%', backgroundColor: getColorPorPorcentaje(promedioTrasero) }"></div>
          </div>
          <div class="proceso-detalle">{{ totalUnidadesTrasero }} / {{ totalUnidadesRequeridas }} unidades</div>
        </div>
        
        <div class="proceso-barra">
          <div class="proceso-header">
            <span class="proceso-nombre">⚙️ Ensamble</span>
            <span class="proceso-porcentaje">{{ promedioEnsamble.toFixed(1) }}%</span>
          </div>
          <div class="barra-contenedor">
            <div class="barra-progreso-visual" :style="{ width: promedioEnsamble + '%', backgroundColor: getColorPorPorcentaje(promedioEnsamble) }"></div>
          </div>
          <div class="proceso-detalle">{{ totalUnidadesEnsamble }} / {{ totalUnidadesRequeridas }} unidades</div>
        </div>
      </div>
    </div>

    <!-- Tabla de seguimiento detallado por orden -->
    <div class="tabla-seguimiento-planta">
      <h3>🔍 Seguimiento Detallado por Orden - Procesos de Planta</h3>
      <div class="tabla-container">
        <table class="tabla-planta">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Referencia</th>
              <th>Total Unidades</th>
              <th>🔧 Delantero</th>
              <th>🔨 Trasero</th>
              <th>⚙️ Ensamble</th>
              <th>Estado Planta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="orden in ordenesFiltradas" :key="orden.id" class="fila-orden-planta">
              <td class="celda-orden">
                <div class="orden-info">
                  <span class="orden-consecutivo">{{ orden.consecutivo }}</span>
                  <span class="orden-id">{{ orden.id }}</span>
                </div>
              </td>
              <td class="celda-referencia">{{ orden.referenciaPorDefecto }}</td>
              <td class="celda-total">
                <span class="total-unidades">{{ calcularTotalPedido(orden) }}</span>
              </td>
              
              <!-- Delantero -->
              <td class="celda-proceso-planta">
                <div v-if="orden.estadoPlanta?.aplicaDelantero !== false" class="proceso-activo">
                  <div class="progreso-circular-planta" :style="{ background: `conic-gradient(${getColorPorPorcentaje(calcularPorcentajeDelantero(orden))} ${calcularPorcentajeDelantero(orden) * 3.6}deg, var(--gray-300) 0deg)` }">
                    <span>{{ calcularPorcentajeDelantero(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesDelantero(orden) }}/{{ calcularTotalPedido(orden) }}</span>
                  <div class="estado-proceso" :class="getEstadoClass(calcularPorcentajeDelantero(orden))">
                    {{ getEstadoTexto(calcularPorcentajeDelantero(orden)) }}
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>
              
              <!-- Trasero -->
              <td class="celda-proceso-planta">
                <div v-if="orden.estadoPlanta?.aplicaTrasero !== false" class="proceso-activo">
                  <div class="progreso-circular-planta" :style="{ background: `conic-gradient(${getColorPorPorcentaje(calcularPorcentajeTrasero(orden))} ${calcularPorcentajeTrasero(orden) * 3.6}deg, var(--gray-300) 0deg)` }">
                    <span>{{ calcularPorcentajeTrasero(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesTrasero(orden) }}/{{ calcularTotalPedido(orden) }}</span>
                  <div class="estado-proceso" :class="getEstadoClass(calcularPorcentajeTrasero(orden))">
                    {{ getEstadoTexto(calcularPorcentajeTrasero(orden)) }}
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>
              
              <!-- Ensamble -->
              <td class="celda-proceso-planta">
                <div v-if="orden.estadoPlanta?.aplicaEnsamble !== false" class="proceso-activo">
                  <div class="progreso-circular-planta" :style="{ background: `conic-gradient(${getColorPorPorcentaje(calcularPorcentajeEnsamble(orden))} ${calcularPorcentajeEnsamble(orden) * 3.6}deg, var(--gray-300) 0deg)` }">
                    <span>{{ calcularPorcentajeEnsamble(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesEnsamble(orden) }}/{{ calcularTotalPedido(orden) }}</span>
                  <div class="estado-proceso" :class="getEstadoClass(calcularPorcentajeEnsamble(orden))">
                    {{ getEstadoTexto(calcularPorcentajeEnsamble(orden)) }}
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>
              
              <!-- Estado General de Planta -->
              <td class="celda-estado-planta">
                <div class="badge-estado-planta" :class="getEstadoClass(calcularProgresoGeneralOrden(orden))">
                  <span class="estado-icono">{{ getEstadoIcono(calcularProgresoGeneralOrden(orden)) }}</span>
                  <span class="estado-texto">{{ getEstadoTexto(calcularProgresoGeneralOrden(orden)) }}</span>
                </div>
                <div class="progreso-general-orden">
                  <div class="barra-progreso-general-orden">
                    <div class="progreso-fill" :style="{ width: calcularProgresoGeneralOrden(orden) + '%', backgroundColor: getColorPorPorcentaje(calcularProgresoGeneralOrden(orden)) }"></div>
                  </div>
                  <span class="progreso-porcentaje">{{ calcularProgresoGeneralOrden(orden).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Acciones -->
    <div class="acciones-seguimiento-planta">
      <button @click="exportarReportePlanta" class="btn-exportar">
        📄 Exportar Reporte de Planta
      </button>
      <button @click="actualizarDatos" class="btn-actualizar">
        🔄 Actualizar Datos
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useOrdenStore } from '../stores/ordenStore';

const ordenStore = useOrdenStore();

// Estados reactivos para filtros
const filtroTexto = ref('');
const mostrarCompletas = ref(true);
const mostrarPendientes = ref(true);
const mostrarEnProceso = ref(true);

// Computed para obtener las órdenes
const ordenes = computed(() => ordenStore.ordenes);

// Computed para filtrar órdenes
const ordenesFiltradas = computed(() => {
  let ordenesFiltradas = ordenes.value;

  // Filtro por texto
  if (filtroTexto.value) {
    const texto = filtroTexto.value.toLowerCase();
    ordenesFiltradas = ordenesFiltradas.filter(orden =>
      orden.id.toLowerCase().includes(texto) ||
      orden.consecutivo.toLowerCase().includes(texto) ||
      (orden.referenciaPorDefecto && orden.referenciaPorDefecto.toLowerCase().includes(texto))
    );
  }

  // Filtro por estado
  ordenesFiltradas = ordenesFiltradas.filter(orden => {
    const progreso = calcularProgresoGeneralOrden(orden);
    const estado = getEstadoTexto(progreso);
    return (
      (mostrarCompletas.value && estado === 'Completo') ||
      (mostrarPendientes.value && estado === 'Pendiente') ||
      (mostrarEnProceso.value && (estado === 'En Proceso' || estado === 'Avanzado'))
    );
  });

  return ordenesFiltradas;
});

// Computed para métricas generales
const totalUnidadesDelantero = computed(() => 
  ordenes.value.reduce((total, orden) => total + calcularUnidadesDelantero(orden), 0)
);

const totalUnidadesTrasero = computed(() => 
  ordenes.value.reduce((total, orden) => total + calcularUnidadesTrasero(orden), 0)
);

const totalUnidadesEnsamble = computed(() => 
  ordenes.value.reduce((total, orden) => total + calcularUnidadesEnsamble(orden), 0)
);

const totalUnidadesRequeridas = computed(() => 
  ordenes.value.reduce((total, orden) => total + calcularTotalPedido(orden), 0)
);

const promedioDelantero = computed(() => {
  const ordenes = ordenesFiltradas.value.filter(orden => orden.estadoPlanta?.aplicaDelantero !== false);
  if (ordenes.length === 0) return 0;
  const totalPorcentaje = ordenes.reduce((sum, orden) => sum + calcularPorcentajeDelantero(orden), 0);
  return totalPorcentaje / ordenes.length;
});

const promedioTrasero = computed(() => {
  const ordenes = ordenesFiltradas.value.filter(orden => orden.estadoPlanta?.aplicaTrasero !== false);
  if (ordenes.length === 0) return 0;
  const totalPorcentaje = ordenes.reduce((sum, orden) => sum + calcularPorcentajeTrasero(orden), 0);
  return totalPorcentaje / ordenes.length;
});

const promedioEnsamble = computed(() => {
  const ordenes = ordenesFiltradas.value.filter(orden => orden.estadoPlanta?.aplicaEnsamble !== false);
  if (ordenes.length === 0) return 0;
  const totalPorcentaje = ordenes.reduce((sum, orden) => sum + calcularPorcentajeEnsamble(orden), 0);
  return totalPorcentaje / ordenes.length;
});

// Funciones de cálculo específicas para planta
function calcularTotalPedido(orden) {
  return orden.detalles?.reduce((sum, detalle) =>
    sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0), 0) || 0;
}

function calcularUnidadesDelantero(orden) {
  return orden.estadoPlanta?.unidadesDelantero?.reduce((sum, item) =>
    sum + (parseInt(item.delantero) || 0), 0) || 0;
}

function calcularPorcentajeDelantero(orden) {
  const total = calcularTotalPedido(orden);
  const delantero = calcularUnidadesDelantero(orden);
  return total > 0 ? (delantero / total) * 100 : 0;
}

function calcularUnidadesTrasero(orden) {
  return orden.estadoPlanta?.unidadesTrasero?.reduce((sum, item) =>
    sum + (parseInt(item.trasero) || 0), 0) || 0;
}

function calcularPorcentajeTrasero(orden) {
  const total = calcularTotalPedido(orden);
  const trasero = calcularUnidadesTrasero(orden);
  return total > 0 ? (trasero / total) * 100 : 0;
}

function calcularUnidadesEnsamble(orden) {
  return orden.estadoPlanta?.unidadesEnsamble?.reduce((sum, item) =>
    sum + (parseInt(item.ensamble) || 0), 0) || 0;
}

function calcularPorcentajeEnsamble(orden) {
  const total = calcularTotalPedido(orden);
  const ensamble = calcularUnidadesEnsamble(orden);
  return total > 0 ? (ensamble / total) * 100 : 0;
}

function calcularProgresoGeneralOrden(orden) {
  const procesos = [];
  
  if (orden.estadoPlanta?.aplicaDelantero !== false) {
    procesos.push(calcularPorcentajeDelantero(orden));
  }
  if (orden.estadoPlanta?.aplicaTrasero !== false) {
    procesos.push(calcularPorcentajeTrasero(orden));
  }
  if (orden.estadoPlanta?.aplicaEnsamble !== false) {
    procesos.push(calcularPorcentajeEnsamble(orden));
  }

  return procesos.length > 0 ? procesos.reduce((a, b) => a + b, 0) / procesos.length : 0;
}

// Funciones de estado y colores
function getColorPorPorcentaje(porcentaje) {
  if (porcentaje >= 100) return '#28a745'; // Verde
  if (porcentaje >= 75) return '#ffc107'; // Amarillo
  if (porcentaje >= 25) return '#fd7e14'; // Naranja
  return '#dc3545'; // Rojo
}

function getEstadoTexto(porcentaje) {
  if (porcentaje >= 100) return 'Completo';
  if (porcentaje >= 75) return 'Avanzado';
  if (porcentaje >= 25) return 'En Proceso';
  return 'Pendiente';
}

function getEstadoIcono(porcentaje) {
  if (porcentaje >= 100) return '✅';
  if (porcentaje >= 75) return '🟡';
  if (porcentaje >= 25) return '🟠';
  return '🔴';
}

function getEstadoClass(porcentaje) {
  if (porcentaje >= 100) return 'estado-completo';
  if (porcentaje >= 75) return 'estado-avanzado';
  if (porcentaje >= 25) return 'estado-proceso';
  return 'estado-pendiente';
}

// Funciones de acción
function actualizarDatos() {
  ordenStore.fetchOrdenes();
}

function exportarReportePlanta() {
  let reporte = 'REPORTE DE SEGUIMIENTO DE PROCESOS DE PLANTA\n';
  reporte += '='.repeat(60) + '\n\n';
  reporte += `Fecha: ${new Date().toLocaleString()}\n`;
  reporte += `Total órdenes: ${ordenes.value.length}\n`;
  reporte += `Total unidades Delantero: ${totalUnidadesDelantero.value}\n`;
  reporte += `Total unidades Trasero: ${totalUnidadesTrasero.value}\n`;
  reporte += `Total unidades Ensamble: ${totalUnidadesEnsamble.value}\n\n`;

  ordenesFiltradas.value.forEach(orden => {
    reporte += `ORDEN: ${orden.consecutivo} | ${orden.referenciaPorDefecto}\n`;
    reporte += `Total unidades: ${calcularTotalPedido(orden)}\n`;
    
    if (orden.estadoPlanta?.aplicaDelantero !== false) {
      reporte += `- Delantero: ${calcularUnidadesDelantero(orden)}/${calcularTotalPedido(orden)} (${calcularPorcentajeDelantero(orden).toFixed(1)}%)\n`;
    }
    if (orden.estadoPlanta?.aplicaTrasero !== false) {
      reporte += `- Trasero: ${calcularUnidadesTrasero(orden)}/${calcularTotalPedido(orden)} (${calcularPorcentajeTrasero(orden).toFixed(1)}%)\n`;
    }
    if (orden.estadoPlanta?.aplicaEnsamble !== false) {
      reporte += `- Ensamble: ${calcularUnidadesEnsamble(orden)}/${calcularTotalPedido(orden)} (${calcularPorcentajeEnsamble(orden).toFixed(1)}%)\n`;
    }
    reporte += `Estado General: ${getEstadoTexto(calcularProgresoGeneralOrden(orden))} (${calcularProgresoGeneralOrden(orden).toFixed(1)}%)\n\n`;
  });

  const blob = new Blob([reporte], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seguimiento_planta_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

onMounted(() => {
  ordenStore.fetchOrdenes();
});
</script>

<style scoped>
.seguimiento-planta-container {
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  min-height: 100vh;
}

.titulo-principal {
  font-size: var(--font-size-3xl);
  color: var(--success-dark);
  text-align: center;
  margin-bottom: var(--spacing-sm);
  font-weight: 700;
}

.descripcion {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  font-size: var(--font-size-lg);
}

/* Filtros */
.filtros-seccion {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.input-busqueda {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
}

.input-busqueda:focus {
  border-color: var(--success);
  outline: none;
}

.filtros-estado {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.filtros-estado label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
}

/* Resumen general */
.resumen-general-planta {
  background: linear-gradient(135deg, var(--success-bg) 0%, var(--bg-secondary) 100%);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
  border-left: 5px solid var(--success);
}

.resumen-general-planta h3 {
  color: var(--success-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.metricas-generales {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.metrica-card {
  background-color: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  text-align: center;
  border: 1px solid var(--border-color);
  transition: transform var(--transition-fast);
}

.metrica-card:hover {
  transform: translateY(-2px);
}

.metrica-delantero {
  border-left: 4px solid #007bff;
}

.metrica-trasero {
  border-left: 4px solid #6f42c1;
}

.metrica-ensamble {
  border-left: 4px solid #20c997;
}

.metrica-numero {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--success);
  margin-bottom: var(--spacing-xs);
}

.metrica-label {
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.progreso-metrica {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--success-dark);
}

/* Gráfico de procesos */
.grafico-procesos {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
}

.grafico-procesos h3 {
  color: var(--success-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.barras-progreso-procesos {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.proceso-barra {
  background-color: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.proceso-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.proceso-nombre {
  font-weight: 600;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.proceso-porcentaje {
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: var(--success-dark);
}

.barra-contenedor {
  width: 100%;
  height: 20px;
  background-color: var(--gray-200);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.barra-progreso-visual {
  height: 100%;
  transition: width 0.5s ease-in-out;
  border-radius: 10px;
}

.proceso-detalle {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* Tabla de seguimiento */
.tabla-seguimiento-planta {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
}

.tabla-seguimiento-planta h3 {
  color: var(--success-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.tabla-container {
  overflow-x: auto;
}

.tabla-planta {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.tabla-planta th {
  background-color: var(--success);
  color: white;
  padding: var(--spacing-md);
  text-align: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.tabla-planta td {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  text-align: center;
  vertical-align: middle;
}

.fila-orden-planta:hover {
  background-color: var(--success-bg);
}

.celda-orden {
  text-align: left !important;
}

.orden-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.orden-consecutivo {
  font-weight: 600;
  color: var(--success-dark);
}

.orden-id {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.celda-referencia {
  text-align: left !important;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.celda-total {
  font-weight: 600;
}

.total-unidades {
  font-size: var(--font-size-lg);
  color: var(--success);
}

.celda-proceso-planta {
  min-width: 140px;
}

.proceso-activo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
}

.proceso-no-aplica {
  color: var(--text-secondary);
  font-style: italic;
  font-size: var(--font-size-sm);
}

.progreso-circular-planta {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-xs);
  position: relative;
}

.progreso-circular-planta span {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proceso-unidades {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.estado-proceso {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius);
  text-transform: uppercase;
}

.estado-completo {
  background-color: var(--success-bg);
  color: var(--success-text);
}

.estado-avanzado {
  background-color: var(--warning-bg);
  color: var(--warning-text);
}

.estado-proceso {
  background-color: var(--info-bg);
  color: var(--info-text);
}

.estado-pendiente {
  background-color: var(--danger-bg);
  color: var(--danger-text);
}

/* Estado general de planta */
.celda-estado-planta {
  min-width: 140px;
}

.badge-estado-planta {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  justify-content: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.progreso-general-orden {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.barra-progreso-general-orden {
  width: 100%;
  height: 6px;
  background-color: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.progreso-fill {
  height: 100%;
  transition: width 0.3s ease-in-out;
}

.progreso-porcentaje {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 600;
}

/* Acciones */
.acciones-seguimiento-planta {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.btn-exportar,
.btn-actualizar {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-exportar {
  background-color: var(--success);
  color: white;
}

.btn-exportar:hover {
  background-color: var(--success-dark);
  transform: translateY(-1px);
}

.btn-actualizar {
  background-color: var(--info);
  color: white;
}

.btn-actualizar:hover {
  background-color: var(--info-dark);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .filtros-seccion {
    padding: var(--spacing-md);
  }
  
  .filtros-estado {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .metricas-generales {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .acciones-seguimiento-planta {
    flex-direction: column;
  }
}
</style>
