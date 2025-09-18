<template>
  <div class="avance-ordenes-container">
    <h2 class="titulo-principal">📊 Seguimiento de Avance - Todas las Órdenes</h2>
    <p class="descripcion">
      Monitoreo en tiempo real del progreso completo de todas las órdenes de producción
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

    <!-- Resumen general -->
    <div class="resumen-general">
      <h3>📈 Resumen General del Sistema</h3>
      <div class="metricas-generales">
        <div class="metrica-card">
          <div class="metrica-numero">{{ ordenesFiltradas.length }}</div>
          <div class="metrica-label">Total Órdenes</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-numero">{{ ordenesCompletas.length }}</div>
          <div class="metrica-label">Órdenes Completas</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-numero">{{ ordenesPendientes.length }}</div>
          <div class="metrica-label">Órdenes Pendientes</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-numero">{{ totalUnidadesProducir }}</div>
          <div class="metrica-label">Total Unidades</div>
        </div>
      </div>
    </div>

    <!-- Tabla de seguimiento detallado -->
    <div class="tabla-seguimiento">
      <h3>🔍 Seguimiento Detallado por Orden</h3>
      <div class="tabla-container">
        <table class="tabla-avance" :class="{ loading: cargandoDatos }">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Referencia</th>
              <th>Total</th>
              <th colspan="4">Procesos de Corte</th>
              <th colspan="3">Procesos de Planta</th>
              <th>Estado General</th>
            </tr>
            <tr class="subheader">
              <th></th>
              <th></th>
              <th></th>
              <th>Extensión</th>
              <th>Corte</th>
              <th>Numeración</th>
              <th>Fusión</th>
              <th>Delantero</th>
              <th>Trasero</th>
              <th>Ensamble</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="orden in ordenesFiltradas" :key="orden.id" class="fila-orden">
              <td class="celda-orden">
                <div class="orden-info">
                  <span class="orden-consecutivo">{{ orden.consecutivo }}</span>
                  <span class="orden-id">{{ orden.id }}</span>
                </div>
              </td>
              <td class="celda-referencia">{{ orden.referencia_por_defecto }}</td>
              <td class="celda-total">
                <span class="total-unidades">{{ calcularTotalPedido(orden) }}</span>
                <span class="total-label">unidades</span>
              </td>

              <!-- Procesos de Corte -->
              <td class="celda-proceso">
                <div v-if="orden.estadoCorte?.aplicaExtension !== false" class="proceso-activo">
                  <div class="estado-indicador" :class="{ completo: orden.estadoCorte?.telaExtendida }">
                    {{ orden.estadoCorte?.telaExtendida ? "✅" : "⏳" }}
                  </div>
                  <span class="proceso-texto">{{
                    orden.estadoCorte?.telaExtendida ? "Completa" : "Pendiente"
                    }}</span>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <td class="celda-proceso">
                <div v-if="orden.estadoCorte?.aplicaCorte !== false" class="proceso-activo">
                  <div class="progreso-circular">
                    <span>{{ calcularPorcentajeCorte(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesCortadas(orden) }}/{{
                    calcularTotalPedido(orden)
                  }}</span>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <td class="celda-proceso">
                <div v-if="orden.estadoCorte?.aplicaNumeracion !== false" class="proceso-activo">
                  <div class="progreso-circular">
                    <span>{{ calcularPorcentajeNumeracion(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesNumeradas(orden) }}/{{
                    calcularTotalPedido(orden)
                  }}</span>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <td class="celda-proceso">
                <div v-if="orden.estadoCorte?.aplicaFusion !== false" class="proceso-activo">
                  <div class="progreso-circular">
                    <span>{{ calcularPorcentajeFusion(orden).toFixed(0) }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesFusionadas(orden) }}/{{
                    calcularTotalPedidoFusion(orden)
                  }}</span>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <!-- Procesos de Planta -->
              <td class="celda-proceso">
                <div v-if="orden.estadoPlanta?.aplicaDelantero !== false" class="proceso-activo">
                  <div class="progreso-circular" :style="{
                    '--progress-deg':
                      calcularPorcentajePlantaReal(orden, 'delantero') * 3.6 + 'deg',
                  }">
                    <span>{{
                      calcularPorcentajePlantaReal(orden, "delantero").toFixed(0)
                    }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesPlantaReales(orden).delantero }}/{{
                    calcularTotalPedido(orden)
                  }}</span>
                  <div class="estado-planta">
                    <span class="badge-planta" :style="{
                      backgroundColor: getEstadoColorPlanta(
                        calcularPorcentajePlantaReal(orden, 'delantero')
                      ),
                    }">
                      {{
                        getEstadoTextoPlanta(
                          calcularPorcentajePlantaReal(orden, "delantero")
                        )
                      }}
                    </span>
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <td class="celda-proceso">
                <div v-if="orden.estadoPlanta?.aplicaTrasero !== false" class="proceso-activo">
                  <div class="progreso-circular" :style="{
                    '--progress-deg':
                      calcularPorcentajePlantaReal(orden, 'trasero') * 3.6 + 'deg',
                  }">
                    <span>{{
                      calcularPorcentajePlantaReal(orden, "trasero").toFixed(0)
                    }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesPlantaReales(orden).trasero }}/{{
                    calcularTotalPedido(orden)
                  }}</span>
                  <div class="estado-planta">
                    <span class="badge-planta" :style="{
                      backgroundColor: getEstadoColorPlanta(
                        calcularPorcentajePlantaReal(orden, 'trasero')
                      ),
                    }">
                      {{
                        getEstadoTextoPlanta(
                          calcularPorcentajePlantaReal(orden, "trasero")
                        )
                      }}
                    </span>
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <td class="celda-proceso">
                <div v-if="orden.estadoPlanta?.aplicaEnsamble !== false" class="proceso-activo">
                  <div class="progreso-circular" :style="{
                    '--progress-deg':
                      calcularPorcentajePlantaReal(orden, 'ensamble') * 3.6 + 'deg',
                  }">
                    <span>{{
                      calcularPorcentajePlantaReal(orden, "ensamble").toFixed(0)
                    }}%</span>
                  </div>
                  <span class="proceso-unidades">{{ calcularUnidadesPlantaReales(orden).ensamble }}/{{
                    calcularTotalPedido(orden)
                  }}</span>
                  <div class="estado-planta">
                    <span class="badge-planta" :style="{
                      backgroundColor: getEstadoColorPlanta(
                        calcularPorcentajePlantaReal(orden, 'ensamble')
                      ),
                    }">
                      {{
                        getEstadoTextoPlanta(
                          calcularPorcentajePlantaReal(orden, "ensamble")
                        )
                      }}
                    </span>
                  </div>
                </div>
                <div v-else class="proceso-no-aplica">N/A</div>
              </td>

              <!-- Estado General -->
              <td class="celda-estado">
                <div class="badge-estado" :class="getEstadoClass(orden)">
                  <span class="estado-icono">{{ getEstadoIcono(orden) }}</span>
                  <span class="estado-texto">{{ getEstadoTexto(orden) }}</span>
                </div>
                <div class="progreso-general">
                  <div class="barra-progreso-general">
                    <div class="progreso-fill" :style="{ width: calcularProgresoGeneral(orden) + '%' }"></div>
                  </div>
                  <span class="progreso-porcentaje">{{ calcularProgresoGeneral(orden).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Acciones adicionales -->
    <div class="acciones-seguimiento">
      <div class="control-actualizaciones">
        <button @click="toggleActualizacionesAutomaticas" class="btn-toggle-auto"
          :class="{ activo: actualizacionesAutomaticas }" :disabled="cargandoDatos">
          <span v-if="cargandoDatos">🔄</span>
          <span v-else>{{ actualizacionesAutomaticas ? "⏸️" : "▶️" }}</span>
          {{ actualizacionesAutomaticas ? "Pausar" : "Reanudar" }} Auto-actualización
        </button>
        <div v-if="ultimaActualizacion" class="info-actualizacion">
          <span class="ultima-actualizacion">Última actualización: {{ ultimaActualizacion.toLocaleTimeString() }}</span>
          <div class="indicador-tiempo-real" :class="{ activo: realtimeUpdates.isActive.value }"></div>
        </div>
      </div>

      <button @click="forzarActualizacion" class="btn-actualizar" :disabled="cargandoDatos">
        <span v-if="cargandoDatos" class="spinner">🔄</span>
        <span v-else>🔄</span>
        {{ cargandoDatos ? "Actualizando..." : "Actualizar Ahora" }}
      </button>

      <button @click="exportarReporteSeguimiento" class="btn-exportar">
        📄 Exportar Reporte Completo
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useOrdenStore } from "../stores/ordenStore";
import {
  useRealtimeUpdates,
  useCrossBrowserSync,
} from "../composables/useRealtimeUpdates";

const ordenStore = useOrdenStore();

// Estados reactivos para filtros
const filtroTexto = ref("");
const mostrarCompletas = ref(true);
const mostrarPendientes = ref(true);
const mostrarEnProceso = ref(true);

// Sistema de actualizaciones en tiempo real
const realtimeUpdates = useRealtimeUpdates({
  interval: 10000, // 10 segundos para seguimiento
  onUpdate: (timestamp) => {
    console.log("🔄 Seguimiento actualizado:", timestamp.toLocaleTimeString());
  },
});

const crossBrowserSync = useCrossBrowserSync();
const ultimaActualizacion = ref(null);
const actualizacionesAutomaticas = ref(true);
const cargandoDatos = ref(false);

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
    const estado = getEstadoTexto(orden);
    return (
      (mostrarCompletas.value && estado === "Completa") ||
      (mostrarPendientes.value && estado === "Pendiente") ||
      (mostrarEnProceso.value && estado === "En Proceso")
    );
  });

  return ordenesFiltradas;
});

// Computed para métricas generales
const ordenesCompletas = computed(() =>
  ordenes.value.filter((orden) => getEstadoTexto(orden) === "Completa")
);

const ordenesPendientes = computed(() =>
  ordenes.value.filter((orden) => getEstadoTexto(orden) === "Pendiente")
);

const totalUnidadesProducir = computed(() =>
  ordenes.value.reduce((total, orden) => total + calcularTotalPedido(orden), 0)
);

// Funciones de cálculo para procesos
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

function calcularUnidadesDelantero(orden) {
  return (
    orden.estadoPlanta?.unidadesDelantero?.reduce(
      (sum, item) => sum + (parseInt(item.delantero) || 0),
      0
    ) || 0
  );
}

function calcularPorcentajeDelantero(orden) {
  const total = calcularTotalPedido(orden);
  const delantero = calcularUnidadesDelantero(orden);
  return total > 0 ? (delantero / total) * 100 : 0;
}

function calcularUnidadesTrasero(orden) {
  return (
    orden.estadoPlanta?.unidadesTrasero?.reduce(
      (sum, item) => sum + (parseInt(item.trasero) || 0),
      0
    ) || 0
  );
}

function calcularPorcentajeTrasero(orden) {
  const total = calcularTotalPedido(orden);
  const trasero = calcularUnidadesTrasero(orden);
  return total > 0 ? (trasero / total) * 100 : 0;
}

function calcularUnidadesEnsamble(orden) {
  return (
    orden.estadoPlanta?.unidadesEnsamble?.reduce(
      (sum, item) => sum + (parseInt(item.ensamble) || 0),
      0
    ) || 0
  );
}

function calcularPorcentajeEnsamble(orden) {
  const total = calcularTotalPedido(orden);
  const ensamble = calcularUnidadesEnsamble(orden);
  return total > 0 ? (ensamble / total) * 100 : 0;
}

// Funciones para estado general
function calcularProgresoGeneral(orden) {
  const procesos = [];

  // Solo contar procesos que aplican
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

function getEstadoTexto(orden) {
  const progreso = calcularProgresoGeneral(orden);
  if (progreso >= 100) return "Completa";
  if (progreso >= 1) return "En Proceso";
  return "Pendiente";
}

function getEstadoIcono(orden) {
  const estado = getEstadoTexto(orden);
  switch (estado) {
    case "Completa":
      return "✅";
    case "En Proceso":
      return "⚠️";
    case "Pendiente":
      return "❌";
    default:
      return "❓";
  }
}

function getEstadoClass(orden) {
  const estado = getEstadoTexto(orden);
  switch (estado) {
    case "Completa":
      return "estado-completa";
    case "En Proceso":
      return "estado-proceso";
    case "Pendiente":
      return "estado-pendiente";
    default:
      return "estado-desconocido";
  }
}

// Funciones de acción
async function actualizarDatos() {
  if (cargandoDatos.value) {
    console.log("📊 Actualización ya en progreso, saltando...");
    return;
  }

  cargandoDatos.value = true;
  try {
    await ordenStore.cargarOrdenes();
    ultimaActualizacion.value = new Date();
    console.log("📊 Datos de seguimiento actualizados exitosamente");

    // Emitir evento de actualización completada
    window.dispatchEvent(
      new CustomEvent("seguimientoActualizado", {
        detail: {
          timestamp: ultimaActualizacion.value,
          ordenesCount: ordenes.value.length,
        },
      })
    );
  } catch (error) {
    console.error("❌ Error al actualizar datos de seguimiento:", error);
  } finally {
    cargandoDatos.value = false;
  }
}

function toggleActualizacionesAutomaticas() {
  actualizacionesAutomaticas.value = !actualizacionesAutomaticas.value;

  if (actualizacionesAutomaticas.value) {
    realtimeUpdates.iniciar();
  } else {
    realtimeUpdates.detener();
  }
}

function forzarActualizacion() {
  realtimeUpdates.forzarActualizacion();
}

// Función para obtener datos específicos de localStorage de procesos
function obtenerDatosProcesosPlanta(orden) {
  const datosProcesos = {
    delantero: {},
    trasero: {},
    ensamble: {},
  };

  try {
    // Cargar datos de localStorage de cada proceso
    const datosDelantero = JSON.parse(
      localStorage.getItem(`procesosDelanteroEstado_${orden.id}`) || "{}"
    );
    const datosTrasero = JSON.parse(
      localStorage.getItem(`procesosTraseroEstado_${orden.id}`) || "{}"
    );
    const datosEnsamble = JSON.parse(
      localStorage.getItem(`procesosEnsambleEstado_${orden.id}`) || "{}"
    );

    // Calcular totales de unidades hechas por proceso
    for (const procesoId in datosDelantero) {
      const proceso = datosDelantero[procesoId];
      if (proceso && proceso.hechoPorColor) {
        for (const color in proceso.hechoPorColor) {
          datosProcesos.delantero[color] =
            (datosProcesos.delantero[color] || 0) + (proceso.hechoPorColor[color] || 0);
        }
      }
    }

    for (const procesoId in datosTrasero) {
      const proceso = datosTrasero[procesoId];
      if (proceso && proceso.hechoPorColor) {
        for (const color in proceso.hechoPorColor) {
          datosProcesos.trasero[color] =
            (datosProcesos.trasero[color] || 0) + (proceso.hechoPorColor[color] || 0);
        }
      }
    }

    for (const procesoId in datosEnsamble) {
      const proceso = datosEnsamble[procesoId];
      if (proceso && proceso.hechoPorColor) {
        for (const color in proceso.hechoPorColor) {
          datosProcesos.ensamble[color] =
            (datosProcesos.ensamble[color] || 0) + (proceso.hechoPorColor[color] || 0);
        }
      }
    }
  } catch (error) {
    console.error("Error al cargar datos de procesos de planta:", error);
  }

  return datosProcesos;
}

// Función mejorada para calcular unidades de planta usando datos reales
function calcularUnidadesPlantaReales(orden) {
  const datosProcesos = obtenerDatosProcesosPlanta(orden);

  const totalDelantero = Object.values(datosProcesos.delantero).reduce(
    (sum, val) => sum + val,
    0
  );
  const totalTrasero = Object.values(datosProcesos.trasero).reduce(
    (sum, val) => sum + val,
    0
  );
  const totalEnsamble = Object.values(datosProcesos.ensamble).reduce(
    (sum, val) => sum + val,
    0
  );

  return {
    delantero: totalDelantero,
    trasero: totalTrasero,
    ensamble: totalEnsamble,
    maximo: Math.max(totalDelantero, totalTrasero, totalEnsamble),
  };
}

// Función para calcular porcentaje real de procesos de planta
function calcularPorcentajePlantaReal(orden, proceso) {
  const totalPedido = calcularTotalPedido(orden);
  const unidadesReales = calcularUnidadesPlantaReales(orden);

  if (totalPedido === 0) return 0;

  return (unidadesReales[proceso] / totalPedido) * 100;
}

// Funciones para estados de planta
function getEstadoColorPlanta(porcentaje) {
  if (porcentaje >= 100) return "#28a745"; // Verde
  if (porcentaje >= 75) return "#ffc107"; // Amarillo
  if (porcentaje >= 25) return "#fd7e14"; // Naranja
  return "#dc3545"; // Rojo
}

function getEstadoTextoPlanta(porcentaje) {
  if (porcentaje >= 100) return "Completo";
  if (porcentaje >= 75) return "Avanzado";
  if (porcentaje >= 25) return "En Proceso";
  return "Pendiente";
}

async function loadScriptOnce(src, id) {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    if (id) script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`No se pudo cargar el script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureJsPdfWithAutoTable() {
  try {
    // Ya cargado
    if (window.jspdf?.jsPDF && window.jspdf?.jsPDF?.API?.autoTable) {
      return window.jspdf.jsPDF;
    }

    // Cargar jsPDF UMD
    await loadScriptOnce(
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
      "cdn-jspdf"
    );

    // Cargar plugin autoTable
    await loadScriptOnce(
      "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.1/dist/jspdf.plugin.autotable.min.js",
      "cdn-jspdf-autotable"
    );

    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF || !jsPDF.API?.autoTable) {
      throw new Error("jsPDF o autoTable no se inicializaron correctamente");
    }

    return jsPDF;
  } catch (e) {
    console.error("Error cargando jsPDF/autoTable:", e);
    throw e;
  }
}

// Generador de reporte plano (fallback TXT) - reutiliza la lógica anterior
function buildPlainTextReport() {
  let reporte = "REPORTE DE SEGUIMIENTO COMPLETO DE ÓRDENES\n";
  reporte += "=".repeat(60) + "\n\n";
  reporte += `Fecha: ${new Date().toLocaleString()}\n`;
  reporte += `Total órdenes: ${ordenes.value.length}\n`;
  reporte += `Órdenes completas: ${ordenesCompletas.value.length}\n`;
  reporte += `Órdenes pendientes: ${ordenesPendientes.value.length}\n`;
  reporte += `Total unidades a producir: ${totalUnidadesProducir.value}\n\n`;

  ordenesFiltradas.value.forEach((orden) => {
    const referencia = orden.referencia_por_defecto || orden.referenciaPorDefecto || "";
    reporte += `ORDEN: ${orden.consecutivo} | ${referencia}\n`;
    reporte += `Estado: ${getEstadoTexto(orden)} (${calcularProgresoGeneral(
      orden
    ).toFixed(1)}%)\n`;
    reporte += `Total unidades: ${calcularTotalPedido(orden)}\n`;

    if (orden.estadoCorte?.aplicaExtension !== false) {
      reporte += `- Extensión: ${orden.estadoCorte?.telaExtendida ? "Completa" : "Pendiente"
        }\n`;
    }
    if (orden.estadoCorte?.aplicaCorte !== false) {
      reporte += `- Corte: ${calcularUnidadesCortadas(orden)}/${calcularTotalPedido(
        orden
      )} (${calcularPorcentajeCorte(orden).toFixed(1)}%)\n`;
    }
    if (orden.estadoCorte?.aplicaNumeracion !== false) {
      reporte += `- Numeración: ${calcularUnidadesNumeradas(orden)}/${calcularTotalPedido(
        orden
      )} (${calcularPorcentajeNumeracion(orden).toFixed(1)}%)\n`;
    }
    if (orden.estadoCorte?.aplicaFusion !== false) {
      reporte += `- Fusión: ${calcularUnidadesFusionadas(
        orden
      )}/${calcularTotalPedidoFusion(orden)} (${calcularPorcentajeFusion(orden).toFixed(
        1
      )}%)\n`;
    }

    // Planta (usa funciones de "reales" para mantener consistencia con la UI)
    const reales = calcularUnidadesPlantaReales(orden);
    reporte += `- Planta General: ${calcularUnidadesPlantaMax(
      orden
    )}/${calcularTotalPedido(orden)} (${calcularProgresoGeneralPlanta(orden).toFixed(
      1
    )}%)\n`;
    reporte += `  * Delantero: ${reales.delantero} unidades\n`;
    reporte += `  * Trasero: ${reales.trasero} unidades\n`;
    reporte += `  * Ensamble: ${reales.ensamble} unidades\n`;
    reporte += "\n";
  });

  return reporte;
}

// Reemplazo: exportarReporteSeguimiento -> ahora genera PDF (con fallback a TXT si falla)
async function exportarReporteSeguimiento() {
  try {
    const jsPDF = await ensureJsPdfWithAutoTable();
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });

    const margin = 36; // 0.5in
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REPORTE DE SEGUIMIENTO COMPLETO DE ÓRDENES", pageWidth / 2, margin, {
      align: "center",
    });

    // Subtítulo / Resumen
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const resumen = [
      `Fecha: ${new Date().toLocaleString()}`,
      `Total órdenes: ${ordenes.value.length}`,
      `Órdenes completas: ${ordenesCompletas.value.length}`,
      `Órdenes pendientes: ${ordenesPendientes.value.length}`,
      `Total unidades a producir: ${totalUnidadesProducir.value}`,
    ];
    let y = margin + 18;
    resumen.forEach((linea) => {
      doc.text(linea, margin, y);
      y += 14;
    });

    // Preparar tabla
    const head = [
      [
        "Orden",
        "Referencia",
        "Total",
        "Extensión",
        "Corte",
        "Numeración",
        "Fusión",
        "Delantero",
        "Trasero",
        "Ensamble",
        "Estado",
        "Progreso",
      ],
    ];

    const body = ordenesFiltradas.value.map((orden) => {
      const referencia = orden.referencia_por_defecto || orden.referenciaPorDefecto || "";
      const total = calcularTotalPedido(orden);

      // Corte
      const cortePct = calcularPorcentajeCorte(orden);
      const corteStr = `${calcularUnidadesCortadas(orden)}/${total} (${cortePct.toFixed(
        0
      )}%)`;

      // Numeración
      const numPct = calcularPorcentajeNumeracion(orden);
      const numStr = `${calcularUnidadesNumeradas(orden)}/${total} (${numPct.toFixed(
        0
      )}%)`;

      // Fusión
      const fusionTotal = calcularTotalPedidoFusion(orden);
      const fusionPct = calcularPorcentajeFusion(orden);
      const fusionStr = `${calcularUnidadesFusionadas(
        orden
      )}/${fusionTotal} (${fusionPct.toFixed(0)}%)`;

      // Extensión
      const extensionStr =
        orden.estadoCorte?.aplicaExtension === false
          ? "N/A"
          : orden.estadoCorte?.telaExtendida
            ? "Completa"
            : "Pendiente";

      // Planta reales
      const reales = calcularUnidadesPlantaReales(orden);
      const delPct = calcularPorcentajePlantaReal(orden, "delantero");
      const traPct = calcularPorcentajePlantaReal(orden, "trasero");
      const ensPct = calcularPorcentajePlantaReal(orden, "ensamble");

      const delanteroStr = `${reales.delantero}/${total} (${delPct.toFixed(0)}%)`;
      const traseroStr = `${reales.trasero}/${total} (${traPct.toFixed(0)}%)`;
      const ensambleStr = `${reales.ensamble}/${total} (${ensPct.toFixed(0)}%)`;

      const estado = getEstadoTexto(orden);
      const progreso = `${calcularProgresoGeneral(orden).toFixed(1)}%`;

      return [
        String(orden.consecutivo ?? orden.id ?? ""),
        referencia,
        String(total),
        extensionStr,
        orden.estadoCorte?.aplicaCorte === false ? "N/A" : corteStr,
        orden.estadoCorte?.aplicaNumeracion === false ? "N/A" : numStr,
        orden.estadoCorte?.aplicaFusion === false ? "N/A" : fusionStr,
        orden.estadoPlanta?.aplicaDelantero === false ? "N/A" : delanteroStr,
        orden.estadoPlanta?.aplicaTrasero === false ? "N/A" : traseroStr,
        orden.estadoPlanta?.aplicaEnsamble === false ? "N/A" : ensambleStr,
        estado,
        progreso,
      ];
    });

    // Si no hay filas, imprimir nota
    if (!body.length) {
      y += 6;
      doc.setTextColor(200, 0, 0);
      doc.text("No hay órdenes para exportar con los filtros actuales.", margin, y);
      doc.setTextColor(0, 0, 0);
    } else {
      // autoTable
      doc.autoTable({
        head,
        body,
        startY: y + 8,
        styles: { fontSize: 8, cellPadding: 4, valign: "middle" },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 60 }, // Orden
          1: { cellWidth: 150 }, // Referencia
          2: { cellWidth: 50 }, // Total
        },
        didDrawPage: (data) => {
          // Footer con paginación
          const page = doc.getNumberOfPages();
          const str = `Página ${data.pageNumber} de ${page}`;
          doc.setFontSize(9);
          doc.setTextColor(120);
          doc.text(str, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, {
            align: "right",
          });
        },
        margin: { left: margin, right: margin },
      });
    }

    const fileName = `seguimiento_completo_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.warn("Fallo al generar PDF, usando fallback TXT...", err);
    const reporte = buildPlainTextReport();
    const blob = new Blob([reporte], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seguimiento_completo_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
// Funciones de compatibilidad para el reporte
function calcularUnidadesPlantaMax(orden) {
  const unidadesReales = calcularUnidadesPlantaReales(orden);
  return unidadesReales.maximo;
}

function calcularProgresoGeneralPlanta(orden) {
  const total = calcularTotalPedido(orden);
  const maxUnidades = calcularUnidadesPlantaMax(orden);
  return total > 0 ? (maxUnidades / total) * 100 : 0;
}

onMounted(() => {
  ordenStore.cargarOrdenes();
  ultimaActualizacion.value = new Date();

  // Inicializar sincronización entre ventanas
  const cleanupSync = crossBrowserSync.iniciarSincronizacion();

  // Escuchar actualizaciones de procesos de planta
  const handlePlantaUpdate = (event) => {
    console.log("🏭 Actualización de proceso de planta recibida:", event.detail);
    // Forzar actualización cuando hay cambios en planta
    setTimeout(async () => {
      await realtimeUpdates.forzarActualizacion();
      // Forzar re-renderizado de los datos
      await nextTick();
    }, 500);
  };

  const handleRealtimeUpdate = (event) => {
    console.log("⚡ Actualización en tiempo real:", event.detail);
    ultimaActualizacion.value = new Date(event.detail.timestamp);
    // Trigger reactivity update
    nextTick();
  };

  const handleCrossBrowserSync = (event) => {
    console.log("🔄 Sincronización entre ventanas:", event.detail);
    if (event.detail.tipo === "proceso_actualizado") {
      setTimeout(async () => {
        await realtimeUpdates.forzarActualizacion();
        await nextTick();
      }, 300);
    }
  };

  const handleMultiOrdenUpdate = (event) => {
    console.log("📋 Actualización de MultiOrdenManager:", event.detail);
    setTimeout(() => {
      realtimeUpdates.forzarActualizacion();
    }, 200);
  };

  window.addEventListener("plantaProcesoUpdate", handlePlantaUpdate);
  window.addEventListener("realtimeUpdate", handleRealtimeUpdate);
  window.addEventListener("crossBrowserSync", handleCrossBrowserSync);
  window.addEventListener("multiOrdenManagerUpdated", handleMultiOrdenUpdate);
  window.addEventListener("plantaProcesoTypeUpdate", handlePlantaUpdate);

  // Cleanup en unmounted
  onUnmounted(() => {
    cleanupSync();
    window.removeEventListener("plantaProcesoUpdate", handlePlantaUpdate);
    window.removeEventListener("realtimeUpdate", handleRealtimeUpdate);
    window.removeEventListener("crossBrowserSync", handleCrossBrowserSync);
    window.removeEventListener("multiOrdenManagerUpdated", handleMultiOrdenUpdate);
    window.removeEventListener("plantaProcesoTypeUpdate", handlePlantaUpdate);
  });
});
</script>

<style scoped>
.avance-ordenes-container {
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
.resumen-general {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
}

.resumen-general h3 {
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

.metrica-numero {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--primary-blue);
  margin-bottom: var(--spacing-xs);
}

.metrica-label {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Tabla de seguimiento */
.tabla-seguimiento {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
}

.tabla-seguimiento h3 {
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.tabla-container {
  overflow-x: auto;
}

.tabla-avance {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.tabla-avance th {
  background-color: var(--primary-blue);
  color: white;
  padding: var(--spacing-md);
  text-align: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.tabla-avance .subheader th {
  background-color: var(--primary-blue-dark);
  font-size: var(--font-size-xs);
  padding: var(--spacing-sm);
}

.tabla-avance td {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  text-align: center;
  vertical-align: middle;
}

.fila-orden:hover {
  background-color: var(--gray-50);
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
  display: block;
  font-size: var(--font-size-lg);
  color: var(--primary-blue);
}

.total-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.celda-proceso {
  min-width: 100px;
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

.estado-indicador {
  font-size: var(--font-size-lg);
}

.estado-indicador.completo {
  color: var(--success);
}

.proceso-texto {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.progreso-circular {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-xs);
  position: relative;
  background: conic-gradient(var(--primary-blue) var(--progress-deg, 0deg),
      var(--gray-300) var(--progress-deg, 0deg));
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progreso-circular::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background: var(--bg-primary);
  border-radius: 50%;
  z-index: 1;
}

.progreso-circular::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(transparent 0deg,
      rgba(255, 255, 255, 0.3) var(--progress-deg, 0deg),
      transparent var(--progress-deg, 0deg));
  animation: progress-rotation 3s linear infinite;
}

@keyframes progress-rotation {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.progreso-circular span {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--text-primary);
  position: relative;
  z-index: 2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.proceso-unidades {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* Estado general */
.celda-estado {
  min-width: 120px;
}

.badge-estado {
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

.estado-completa {
  background-color: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.estado-proceso {
  background-color: var(--warning-bg);
  color: var(--warning-text);
  border: 1px solid var(--warning-border);
}

.estado-pendiente {
  background-color: var(--danger-bg);
  color: var(--danger-text);
  border: 1px solid var(--danger-border);
}

.progreso-general {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.barra-progreso-general {
  width: 100%;
  height: 8px;
  background-color: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--gray-300);
}

.progreso-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-blue), var(--primary-blue-dark));
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.progreso-fill::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: progress-shine 2.5s infinite;
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.progreso-porcentaje {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 600;
}

/* Estilos específicos para proceso de planta */
.estado-planta {
  margin-top: var(--spacing-xs);
}

.badge-planta {
  font-size: var(--font-size-xs);
  color: white;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius);
  font-weight: 600;
  display: inline-block;
  min-width: 80px;
  text-align: center;
}

/* Acciones */
.acciones-seguimiento {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.btn-exportar,
.btn-actualizar {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-exportar {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-exportar:hover {
  background: linear-gradient(135deg, var(--success-dark), #1e7e34);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(40, 167, 69, 0.4);
}

.btn-exportar::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-exportar:hover::before {
  left: 100%;
}

.btn-actualizar {
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-actualizar:hover {
  background: linear-gradient(135deg, var(--primary-blue-dark), #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
}

.btn-actualizar::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-actualizar:hover::before {
  left: 100%;
}

/* Estilos para procesos de planta */
.estado-planta {
  margin-top: var(--spacing-xs);
}

.badge-planta {
  font-size: var(--font-size-xs);
  color: white;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius);
  font-weight: 600;
  display: inline-block;
  min-width: 80px;
  text-align: center;
}

/* Estilos para controles de tiempo real */
.control-actualizaciones {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-items: flex-start;
}

.btn-toggle-auto {
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--warning);
  border-radius: var(--border-radius);
  background-color: var(--bg-primary);
  color: var(--warning);
  font-size: var(--font-size-base);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-toggle-auto:hover {
  background-color: var(--warning-bg);
}

.btn-toggle-auto.activo {
  background: linear-gradient(135deg, var(--warning), var(--warning-dark));
  color: white;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
  transform: translateY(-1px);
}

.info-actualizacion {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ultima-actualizacion {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.indicador-tiempo-real {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--danger);
  transition: all var(--transition-fast);
}

.indicador-tiempo-real.activo {
  background-color: var(--success);
  box-shadow: 0 0 10px var(--success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Indicadores de estado mejorados */
.fila-orden {
  transition: all var(--transition-fast);
}

.fila-orden:hover {
  background-color: var(--gray-50);
  transform: translateX(2px);
}

.proceso-activo {
  position: relative;
}

.proceso-activo::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, transparent, rgba(37, 99, 235, 0.1), transparent);
  border-radius: var(--border-radius);
  z-index: -1;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.proceso-activo:hover::before {
  opacity: 1;
}

/* Loading states */
.tabla-avance.loading {
  opacity: 0.7;
  pointer-events: none;
}

.tabla-avance.loading::after {
  content: "Actualizando datos...";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-weight: 600;
  color: var(--primary-blue);
}

@media (max-width: 1024px) {
  .tabla-container {
    font-size: var(--font-size-sm);
  }

  .progreso-circular {
    width: 36px;
    height: 36px;
  }

  .metricas-generales {
    grid-template-columns: repeat(2, 1fr);
  }
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
    grid-template-columns: 1fr;
  }

  .acciones-seguimiento {
    flex-direction: column;
    gap: var(--spacing-md);
    position: sticky;
    bottom: 0;
    background: var(--bg-primary);
    padding: var(--spacing-md);
    border-top: 2px solid var(--border-color);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  }

  .control-actualizaciones {
    order: 2;
  }

  .btn-exportar,
  .btn-actualizar {
    width: 100%;
    justify-content: center;
  }

  .tabla-avance th,
  .tabla-avance td {
    padding: var(--spacing-xs);
    font-size: var(--font-size-xs);
  }

  .progreso-circular {
    width: 32px;
    height: 32px;
  }

  .badge-planta,
  .badge-estado {
    font-size: var(--font-size-xs);
    padding: var(--spacing-xs);
  }
}

/* Spinner animation */
.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
