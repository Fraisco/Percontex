<template>
  <div class="seguimiento-corte-container">
    <h2 class="titulo-principal">✂️ Seguimiento de Procesos de Corte</h2>
    <p class="descripcion">
      Monitoreo en tiempo real del progreso de los subprocesos de corte: Extensión, Corte,
      Numeración y Fusión
    </p>

    <!-- Filtros y búsqueda -->
    <div class="filtros-seccion">
      <div class="busqueda-ordenes">
        <input type="text" v-model="filtroTexto" placeholder="Buscar por ID, consecutivo o referencia..."
          class="input-busqueda" />
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

    <!-- Resumen general de corte -->
    <div class="resumen-general-corte">
      <h3>📈 Resumen General de Procesos de Corte</h3>
      <div class="metricas-generales">
        <div class="metrica-card">
          <div class="metrica-numero">{{ ordenesFiltradas.length }}</div>
          <div class="metrica-label">Total Órdenes</div>
        </div>
        <div class="metrica-card metrica-extension">
          <div class="metrica-numero">{{ ordenesExtendidas.length }}</div>
          <div class="metrica-label">📐 Extendidas</div>
          <div class="progreso-metrica">{{ porcentajeExtension.toFixed(1) }}%</div>
        </div>
        <div class="metrica-card metrica-corte">
          <div class="metrica-numero">{{ totalUnidadesCortadas }}</div>
          <div class="metrica-label">✂️ Cortadas</div>
          <div class="progreso-metrica">{{ promedioCorte.toFixed(1) }}%</div>
        </div>
        <div class="metrica-card metrica-numeracion">
          <div class="metrica-numero">{{ totalUnidadesNumeradas }}</div>
          <div class="metrica-label">🔢 Numeradas</div>
          <div class="progreso-metrica">{{ promedioNumeracion.toFixed(1) }}%</div>
        </div>
        <div class="metrica-card metrica-fusion">
          <div class="metrica-numero">{{ totalUnidadesFusionadas }}</div>
          <div class="metrica-label">🔥 Fusionadas</div>
          <div class="progreso-metrica">{{ promedioFusion.toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <!-- Gráfico de progreso visual por proceso -->
    <div class="grafico-procesos-corte">
      <h3>📊 Progreso Visual por Proceso de Corte</h3>
      <div class="barras-progreso-procesos">
        <div class="proceso-barra proceso-extension">
          <div class="proceso-header">
            <span class="proceso-nombre">📐 Extensión de Tela</span>
            <span class="proceso-porcentaje">{{ porcentajeExtension.toFixed(1) }}%</span>
          </div>
          <div class="barra-contenedor">
            <div class="barra-progreso-visual" :style="{
              width: porcentajeExtension + '%',
              backgroundColor: getColorPorPorcentaje(porcentajeExtension),
            }"></div>
          </div>
          <div class="proceso-detalle">
            {{ ordenesExtendidas.length }} de {{ ordenesFiltradas.length }} órdenes
          </div>
        </div>

        <div class="proceso-barra proceso-corte">
          <div class="proceso-header">
            <span class="proceso-nombre">✂️ Corte</span>
            <span class="proceso-porcentaje">{{ promedioCorte.toFixed(1) }}%</span>
          </div>
          <div class="barra-contenedor">
            <div class="barra-progreso-visual" :style="{
              width: promedioCorte + '%',
              backgroundColor: getColorPorPorcentaje(promedioCorte),
            }"></div>
          </div>
          <div class="proceso-detalle">
            {{ totalUnidadesCortadas }} / {{ totalUnidadesRequeridas }} unidades
          </div>
        </div>

        <div class="proceso-barra proceso-numeracion">
          <div class="proceso-header">
            <span class="proceso-nombre">🔢 Numeración</span>
            <span class="proceso-porcentaje">{{ promedioNumeracion.toFixed(1) }}%</span>
          </div>
          <div class="barra-contenedor">
            <div class="barra-progreso-visual" :style="{
              width: promedioNumeracion + '%',
              backgroundColor: getColorPorPorcentaje(promedioNumeracion),
            }"></div>
          </div>
          <div class="proceso-detalle">
            {{ totalUnidadesNumeradas }} / {{ totalUnidadesRequeridas }} unidades
          </div>
        </div>

        <div class="proceso-barra proceso-fusion">
          <div class="proceso-header">
            <span class="proceso-nombre">🔥 Fusión</span>
            <span class="proceso-porcentaje">{{ promedioFusion.toFixed(1) }}%</span>
          </div>
          <div class="barra-contenedor">
            <div class="barra-progreso-visual" :style="{
              width: promedioFusion + '%',
              backgroundColor: getColorPorPorcentaje(promedioFusion),
            }"></div>
          </div>
          <div class="proceso-detalle">
            {{ totalUnidadesFusionadas }} / {{ totalUnidadesFusionRequeridas }} unidades
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de seguimiento detallado por orden -->
    <div class="tabla-seguimiento-corte">
      <h3>🔍 Seguimiento Detallado por Orden - Procesos de Corte</h3>
      <div class="tabla-container">
        <table class="tabla-corte">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Referencia</th>
              <th>Total Unidades</th>
              <th>📐 Extensión</th>
              <th>✂️ Corte</th>
              <th>🔢 Numeración</th>
              <th>🔥 Fusión</th>
              <th>Estado Corte</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="orden in ordenesFiltradas" :key="orden.id" class="fila-orden-corte">
              <td class="celda-orden">
                <div class="orden-info">
                  <span class="orden-consecutivo">{{ orden.consecutivo }}</span>
                  <span class="orden-id">{{ orden.id }}</span>
                </div>
              </td>
              <td class="celda-referencia">{{ orden.referencia_por_defecto }}</td>
              <td class="celda-total">
                <span class="total-unidades">{{ calcularTotalPedido(orden) }}</span>
              </td>

              <!-- Extensión -->
              <td class="celda-proceso-corte">
                <div v-if="orden.estadoCorte?.aplicaExtension !== false" class="proceso-activo">
                  <div class="estado-extension" :class="{ 'extension-completa': orden.estadoCorte?.telaExtendida }">
                    {{
                      orden.estadoCorte?.telaExtendida ? "✅ Completa" : "⏳ Pendiente"
                    }}
                  </div>
                  <div class="detalle-extension">
                    {{
                      orden.estadoCorte?.telaExtendida ? calcularTotalPedido(orden) : 0
                    }}
                    unidades
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <!-- Corte -->
              <td class="celda-proceso-corte">
                <div v-if="orden.estadoCorte?.aplicaCorte !== false" class="proceso-activo">
                  <div class="progreso-circular-corte" :style="{
                    background: `conic-gradient(${getColorPorPorcentaje(
                      calcularPorcentajeCorte(orden)
                    )} ${calcularPorcentajeCorte(orden) * 3.6
                      }deg, var(--gray-300) 0deg)`,
                  }">
                    <span>{{ calcularPorcentajeCorte(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesCortadas(orden) }}/{{
                    calcularTotalPedido(orden)
                  }}</span>
                  <div class="estado-proceso" :class="getEstadoClass(calcularPorcentajeCorte(orden))">
                    {{ getEstadoTexto(calcularPorcentajeCorte(orden)) }}
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <!-- Numeración -->
              <td class="celda-proceso-corte">
                <div v-if="orden.estadoCorte?.aplicaNumeracion !== false" class="proceso-activo">
                  <div class="progreso-circular-corte" :style="{
                    background: `conic-gradient(${getColorPorPorcentaje(
                      calcularPorcentajeNumeracion(orden)
                    )} ${calcularPorcentajeNumeracion(orden) * 3.6
                      }deg, var(--gray-300) 0deg)`,
                  }">
                    <span>{{ calcularPorcentajeNumeracion(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesNumeradas(orden) }}/{{
                    calcularTotalPedido(orden)
                  }}</span>
                  <div class="estado-proceso" :class="getEstadoClass(calcularPorcentajeNumeracion(orden))">
                    {{ getEstadoTexto(calcularPorcentajeNumeracion(orden)) }}
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <!-- Fusión -->
              <td class="celda-proceso-corte">
                <div v-if="orden.estadoCorte?.aplicaFusion !== false" class="proceso-activo">
                  <div class="progreso-circular-corte" :style="{
                    background: `conic-gradient(${getColorPorPorcentaje(
                      calcularPorcentajeFusion(orden)
                    )} ${calcularPorcentajeFusion(orden) * 3.6
                      }deg, var(--gray-300) 0deg)`,
                  }">
                    <span>{{ calcularPorcentajeFusion(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesFusionadas(orden) }}/{{
                    calcularTotalPedido(orden)
                  }}</span>
                  <div class="estado-proceso" :class="getEstadoClass(calcularPorcentajeFusion(orden))">
                    {{ getEstadoTexto(calcularPorcentajeFusion(orden)) }}
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <!-- Estado General de Corte -->
              <td class="celda-estado-corte">
                <div class="badge-estado-corte" :class="getEstadoClass(calcularProgresoGeneralCorte(orden))">
                  <span class="estado-icono">{{
                    getEstadoIcono(calcularProgresoGeneralCorte(orden))
                    }}</span>
                  <span class="estado-texto">{{
                    getEstadoTexto(calcularProgresoGeneralCorte(orden))
                    }}</span>
                </div>
                <div class="progreso-general-orden">
                  <div class="barra-progreso-general-orden">
                    <div class="progreso-fill" :style="{
                      width: calcularProgresoGeneralCorte(orden) + '%',
                      backgroundColor: getColorPorPorcentaje(
                        calcularProgresoGeneralCorte(orden)
                      ),
                    }"></div>
                  </div>
                  <span class="progreso-porcentaje">{{ calcularProgresoGeneralCorte(orden).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Acciones -->
    <div class="acciones-seguimiento-corte">
      <button @click="exportarReporteCortePDF" class="btn-exportar">
        📄 Exportar Reporte de Corte
      </button>
      <button @click="actualizarDatos" class="btn-actualizar">🔄 Actualizar Datos</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useOrdenStore } from "../stores/ordenStore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ordenStore = useOrdenStore();

// Estados reactivos para filtros
const filtroTexto = ref("");
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
    ordenesFiltradas = ordenesFiltradas.filter(
      (orden) =>
        orden.id.toLowerCase().includes(texto) ||
        orden.consecutivo.toLowerCase().includes(texto) ||
        (orden.referenciaPorDefecto &&
          orden.referenciaPorDefecto.toLowerCase().includes(texto))
    );
  }

  // Filtro por estado
  ordenesFiltradas = ordenesFiltradas.filter((orden) => {
    const progreso = calcularProgresoGeneralCorte(orden);
    const estado = getEstadoTexto(progreso);
    return (
      (mostrarCompletas.value && estado === "Completo") ||
      (mostrarPendientes.value && estado === "Pendiente") ||
      (mostrarEnProceso.value && (estado === "En Proceso" || estado === "Avanzado"))
    );
  });

  return ordenesFiltradas;
});

// Computed para métricas generales de corte
const ordenesExtendidas = computed(() =>
  ordenes.value.filter((orden) => orden.estadoCorte?.telaExtendida)
);

const porcentajeExtension = computed(() => {
  const ordenesQueAplican = ordenes.value.filter(
    (orden) => orden.estadoCorte?.aplicaExtension !== false
  );
  if (ordenesQueAplican.length === 0) return 0;
  return (ordenesExtendidas.value.length / ordenesQueAplican.length) * 100;
});

const totalUnidadesCortadas = computed(() =>
  ordenes.value.reduce((total, orden) => total + calcularUnidadesCortadas(orden), 0)
);

const totalUnidadesNumeradas = computed(() =>
  ordenes.value.reduce((total, orden) => total + calcularUnidadesNumeradas(orden), 0)
);

const totalUnidadesFusionadas = computed(() =>
  ordenes.value.reduce((total, orden) => total + calcularUnidadesFusionadas(orden), 0)
);

const totalUnidadesRequeridas = computed(() =>
  ordenes.value.reduce((total, orden) => total + calcularTotalPedido(orden), 0)
);

const totalUnidadesFusionRequeridas = computed(() =>
  ordenes.value.reduce((total, orden) => total + calcularTotalPedidoFusion(orden), 0)
);

const promedioCorte = computed(() => {
  const ordenes = ordenesFiltradas.value.filter(
    (orden) => orden.estadoCorte?.aplicaCorte !== false
  );
  if (ordenes.length === 0) return 0;
  const totalPorcentaje = ordenes.reduce(
    (sum, orden) => sum + calcularPorcentajeCorte(orden),
    0
  );
  return totalPorcentaje / ordenes.length;
});

const promedioNumeracion = computed(() => {
  const ordenes = ordenesFiltradas.value.filter(
    (orden) => orden.estadoCorte?.aplicaNumeracion !== false
  );
  if (ordenes.length === 0) return 0;
  const totalPorcentaje = ordenes.reduce(
    (sum, orden) => sum + calcularPorcentajeNumeracion(orden),
    0
  );
  return totalPorcentaje / ordenes.length;
});

const promedioFusion = computed(() => {
  const ordenes = ordenesFiltradas.value.filter(
    (orden) => orden.estadoCorte?.aplicaFusion !== false
  );
  if (ordenes.length === 0) return 0;
  const totalPorcentaje = ordenes.reduce(
    (sum, orden) => sum + calcularPorcentajeFusion(orden),
    0
  );
  return totalPorcentaje / ordenes.length;
});

// Funciones de cálculo específicas para corte
function calcularTotalPedido(orden) {
  // Usa el total_cantidad de la orden; convierte a número y cae a 0 si no existe o no es válido
  const total = orden?.total_cantidad;
  return typeof total === "number" ? total : Number(total) || 0;
}

function calcularUnidadesCortadas(orden) {
  return (
    orden.estadoCorte?.unidadesCortadas?.reduce(
      (sum, item) => sum + (parseInt(item.total_cortadas) || 0),
      0
    ) || 0
  );
}

function calcularPorcentajeCorte(orden) {
  const total = calcularTotalPedido(orden);
  const cortadas = calcularUnidadesCortadas(orden);
  return total > 0 ? (cortadas / total) * 100 : 0;
}

function calcularUnidadesNumeradas(orden) {
  return (
    orden.estadoCorte?.unidadesNumeradas?.reduce(
      (sum, item) => sum + (parseInt(item.total_numeradas) || 0),
      0
    ) || 0
  );
}

function calcularPorcentajeNumeracion(orden) {
  const total = calcularTotalPedido(orden);
  const numeradas = calcularUnidadesNumeradas(orden);
  return total > 0 ? (numeradas / total) * 100 : 0;
}

function calcularUnidadesFusionadas(orden) {
  return orden.estadoCorte.unidadesFusionadas.reduce(
    (sum, item) => sum + (parseInt(item.total_fusionadas) || 0),
    0
  );
}
function calcularTotalPedidoFusion(orden) {
  // No hay "aplica": sumamos todos los elementos
  const unidades = orden.estadoCorte?.unidadesFusionadas || [];
  return unidades.reduce((sum, item) => sum + (Number(item.total_cantidad) || 0), 0);
}

function calcularPorcentajeFusion(orden) {
  const totalPedidoFusion = calcularTotalPedidoFusion(orden);
  const fusionadas = calcularUnidadesFusionadas(orden);
  return totalPedidoFusion > 0 ? (fusionadas / totalPedidoFusion) * 100 : 0;
}

function calcularProgresoGeneralCorte(orden) {
  const procesos = [];

  if (orden.estadoCorte?.aplicaExtension !== false) {
    procesos.push(orden.estadoCorte?.telaExtendida ? 100 : 0);
  }
  if (orden.estadoCorte?.aplicaCorte !== false) {
    procesos.push(calcularPorcentajeCorte(orden));
  }
  if (orden.estadoCorte?.aplicaNumeracion !== false) {
    procesos.push(calcularPorcentajeNumeracion(orden));
  }
  if (orden.estadoCorte?.aplicaFusion !== false) {
    procesos.push(calcularPorcentajeFusion(orden));
  }

  return procesos.length > 0 ? procesos.reduce((a, b) => a + b, 0) / procesos.length : 0;
}

// Funciones de estado y colores
function getColorPorPorcentaje(porcentaje) {
  if (porcentaje >= 100) return "#28a745"; // Verde
  if (porcentaje >= 75) return "#ffc107"; // Amarillo
  if (porcentaje >= 25) return "#fd7e14"; // Naranja
  return "#dc3545"; // Rojo
}

function getEstadoTexto(porcentaje) {
  if (porcentaje >= 100) return "Completo";
  if (porcentaje >= 75) return "Avanzado";
  if (porcentaje >= 25) return "En Proceso";
  return "Pendiente";
}

function getEstadoIcono(porcentaje) {
  if (porcentaje >= 100) return "✅";
  if (porcentaje >= 75) return "🟡";
  if (porcentaje >= 25) return "🟠";
  return "🔴";
}

function getEstadoClass(porcentaje) {
  if (porcentaje >= 100) return "estado-completo";
  if (porcentaje >= 75) return "estado-avanzado";
  if (porcentaje >= 25) return "estado-proceso";
  return "estado-pendiente";
}

// Funciones de acción
function actualizarDatos() {
  ordenStore.cargarOrdenes();
}

function exportarReporteCortePDF() {
  const doc = new jsPDF();

  // Titulo y resumen general
  doc.setFontSize(14);
  doc.text("REPORTE DE SEGUIMIENTO DE PROCESOS DE CORTE", 10, 12);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleString()}`, 10, 18);

  // Resumen general
  const resumen = [
    ["Total órdenes", ordenes.value.length],
    ["Órdenes extendidas", ordenesExtendidas.value.length],
    ["Total unidades cortadas", totalUnidadesCortadas.value],
    ["Total unidades numeradas", totalUnidadesNumeradas.value],
    ["Total unidades fusionadas", totalUnidadesFusionadas.value],
  ];
  autoTable(doc, {
    head: [["Métrica", "Valor"]],
    body: resumen,
    startY: 22,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 9 },
    theme: "striped",
  });

  // Espacio antes de la tabla principal
  let startY = doc.lastAutoTable.finalY + 10;

  // Tabla de seguimiento detallado
  const columns = [
    { header: "Orden", dataKey: "consecutivo" },
    { header: "Referencia", dataKey: "referencia" },
    { header: "Unidades", dataKey: "unidades" },
    { header: "Extensión", dataKey: "extension" },
    { header: "Corte", dataKey: "corte" },
    { header: "Numeración", dataKey: "numeracion" },
    { header: "Fusión", dataKey: "fusion" },
    { header: "Estado", dataKey: "estado" },
    { header: "% General", dataKey: "progreso" },
  ];

  const data = ordenesFiltradas.value.map((orden) => ({
    consecutivo: `${orden.consecutivo} (${orden.id})`,
    referencia: orden.referenciaPorDefecto ?? orden.referencia_por_defecto ?? "",
    unidades: calcularTotalPedido(orden),
    extension:
      orden.estadoCorte?.aplicaExtension === false
        ? "N/A"
        : orden.estadoCorte?.telaExtendida
          ? "Completa"
          : "Pendiente",
    corte:
      orden.estadoCorte?.aplicaCorte === false
        ? "N/A"
        : `${calcularUnidadesCortadas(orden)}/${calcularTotalPedido(
          orden
        )} (${calcularPorcentajeCorte(orden).toFixed(1)}%)`,
    numeracion:
      orden.estadoCorte?.aplicaNumeracion === false
        ? "N/A"
        : `${calcularUnidadesNumeradas(orden)}/${calcularTotalPedido(
          orden
        )} (${calcularPorcentajeNumeracion(orden).toFixed(1)}%)`,
    fusion:
      orden.estadoCorte?.aplicaFusion === false
        ? "N/A"
        : `${calcularUnidadesFusionadas(orden)}/${calcularTotalPedidoFusion(
          orden
        )} (${calcularPorcentajeFusion(orden).toFixed(1)}%)`,
    estado: getEstadoTexto(calcularProgresoGeneralCorte(orden)),
    progreso: `${calcularProgresoGeneralCorte(orden).toFixed(1)}%`,
  }));

  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => row[col.dataKey])),
    startY,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 28 }, // Orden
      1: { cellWidth: 35 }, // Referencia
      2: { cellWidth: 18 }, // Unidades
      // Las demás columnas quedan automáticas o puedes ajustar si deseas
    },
    didDrawPage: function (data) {
      // Header en cada página
      if (data.pageNumber > 1) {
        doc.setFontSize(14);
        doc.text("REPORTE DE SEGUIMIENTO DE PROCESOS DE CORTE", 10, 12);
      }
    },
  });

  doc.save(`seguimiento_corte_${new Date().toISOString().split("T")[0]}.pdf`);
}
onMounted(() => {
  ordenStore.cargarOrdenes();
});
</script>

<style scoped>
.seguimiento-corte-container {
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  min-height: 100vh;
}

.titulo-principal {
  font-size: var(--font-size-3xl);
  color: var(--primary-blue-dark);
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
  border-color: var(--primary-blue);
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
.resumen-general-corte {
  background: linear-gradient(135deg,
      var(--primary-blue-bg) 0%,
      var(--bg-secondary) 100%);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
  border-left: 5px solid var(--primary-blue);
}

.resumen-general-corte h3 {
  color: var(--primary-blue-dark);
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

.metrica-extension {
  border-left: 4px solid #17a2b8;
}

.metrica-corte {
  border-left: 4px solid #dc3545;
}

.metrica-numeracion {
  border-left: 4px solid #6f42c1;
}

.metrica-fusion {
  border-left: 4px solid #fd7e14;
}

.metrica-numero {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--primary-blue);
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
  color: var(--primary-blue-dark);
}

/* Gráfico de procesos */
.grafico-procesos-corte {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
}

.grafico-procesos-corte h3 {
  color: var(--primary-blue-dark);
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

.proceso-extension {
  border-left: 4px solid #17a2b8;
}

.proceso-corte {
  border-left: 4px solid #dc3545;
}

.proceso-numeracion {
  border-left: 4px solid #6f42c1;
}

.proceso-fusion {
  border-left: 4px solid #fd7e14;
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
  color: var(--primary-blue-dark);
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
.tabla-seguimiento-corte {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
}

.tabla-seguimiento-corte h3 {
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.tabla-container {
  overflow-x: auto;
}

.tabla-corte {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.tabla-corte th {
  background-color: var(--primary-blue);
  color: white;
  padding: var(--spacing-md);
  text-align: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.tabla-corte td {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  text-align: center;
  vertical-align: middle;
}

.fila-orden-corte:hover {
  background-color: var(--primary-blue-bg);
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
  color: var(--primary-blue-dark);
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
  color: var(--primary-blue);
}

.celda-proceso-corte {
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

.estado-extension {
  font-size: var(--font-size-sm);
  font-weight: 600;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  background-color: var(--danger-bg);
  color: var(--danger-text);
}

.estado-extension.extension-completa {
  background-color: var(--success-bg);
  color: var(--success-text);
}

.detalle-extension {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.progreso-circular-corte {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-xs);
  position: relative;
}

.progreso-circular-corte span {
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

/* Estado general de corte */
.celda-estado-corte {
  min-width: 140px;
}

.badge-estado-corte {
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
.acciones-seguimiento-corte {
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
  background-color: var(--primary-blue);
  color: white;
}

.btn-exportar:hover {
  background-color: var(--primary-blue-dark);
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

  .acciones-seguimiento-corte {
    flex-direction: column;
  }
}
</style>
