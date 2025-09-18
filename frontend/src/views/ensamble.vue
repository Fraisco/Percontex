<template>
  <div class="ensamble-view">
    <h1 class="titulo-principal">⚙️ Gestión de Procesos - Ensamble</h1>

    <!-- Componente de múltiples órdenes -->
    <MultiOrdenManager proceso="Ensamble" @orden-seleccionada="manejarOrdenSeleccionada"
      @ordenes-actualizadas="manejarOrdenesActualizadas" ref="multiOrdenManager">
      <template #default="{ orden, actualizar }">
        <div v-if="orden" class="proceso-ensamble-container">
          <!-- Header de la orden activa -->
          <div class="orden-header">
            <h2 class="orden-titulo">
              Orden {{ orden.consecutivo }} - {{ orden.referenciaPorDefecto }}
            </h2>
            <div class="orden-resumen">
              <span class="total-pedido">{{ calcularTotalPedido(orden) }} unidades</span>
              <span class="progreso-general">{{ calcularProgresoOrden(orden).toFixed(1) }}% completado</span>
            </div>
          </div>

          <!-- Agregar nuevo proceso -->
          <div class="agregar-proceso">
            <div class="input-grupo">
              <label for="nuevoProcesoNombre">Agregar Nuevo Proceso:</label>
              <input type="text" id="nuevoProcesoNombre" v-model="nuevoProcesoInput" @keyup.enter="agregarNuevoProceso"
                placeholder="Ej: Proceso Extra Ensamble" class="input-nuevo-proceso" />
            </div>
            <button @click="agregarNuevoProceso" class="btn-agregar-proceso">
              Agregar Proceso
            </button>
          </div>

          <!-- Gestor de Subprocesos - Navegación con botones, historial y balance -->
          <section class="gestor-subprocesos">
            <h3 class="titulo-seccion">Subprocesos - Ensamble</h3>
            <SubprocesoManager :orden="orden" :subprocesos="procesosEnsamble" namespace="ensamble" />
          </section>

          <!-- Resumen de la orden: imagen, cliente, estado, total -->
          <section class="resumen-orden">
            <div class="resumen-grid">
              <div class="col imagen">
                <img v-if="orden.imagenDiseno" :src="orden.imagenDiseno" alt="Imagen producto"
                  class="imagen-producto-mini" />
                <div v-else class="imagen-placeholder-mini">📷</div>
              </div>
              <div class="col info">
                <div class="info-item">
                  <strong>Cliente:</strong> {{ orden.proveedor || "No especificado" }}
                </div>
                <div class="info-item">
                  <strong>Estado:</strong> {{ calcularProgresoOrden(orden).toFixed(1) }}%
                  en progreso
                </div>
                <div class="info-item">
                  <strong>Total Pedido:</strong> {{ calcularTotalPedido(orden) }} unidades
                </div>
              </div>
            </div>
          </section>

          <!-- Seguimiento -->
          <section class="gestor-subprocesos">
            <div class="subproceso-add-bar">
              <input type="text" v-model="nuevoSubprocesoNombre" @keyup.enter="agregarSubproceso"
                placeholder="Nombre del nuevo subproceso" class="input-nuevo-subproceso-nav" />
              <button class="btn-agregar-subproceso-nav" @click="agregarSubproceso">
                Agregar Subproceso
              </button>
            </div>
            <h3 class="titulo-seccion">📊 Seguimiento de Ensamble</h3>
            <SubprocesoManager :orden="orden" :subprocesos="procesosEnsamble" namespace="ensamble" />
          </section>

          <!-- Tabla de procesos (removida) -->
          <div class="tabla-procesos-container" style="display: none">
            <table class="tabla-procesos">
              <thead>
                <tr>
                  <th>Proceso</th>
                  <th>Color</th>
                  <th>Total Requerido</th>
                  <th>Hecho</th>
                  <th>Falta</th>
                  <th>Progreso</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="Object.keys(procesosFiltrados).length === 0">
                  <tr>
                    <td colspan="7" class="celda-vacia">
                      No hay procesos disponibles o que coincidan con el filtro.
                    </td>
                  </tr>
                </template>
                <template v-for="(estado, procesoId, procesoIndex) in procesosFiltrados" :key="procesoId">
                  <!-- Separador entre procesos -->
                  <tr v-if="procesoIndex > 0" class="separador-proceso">
                    <td colspan="7" class="linea-separador"></td>
                  </tr>

                  <template v-for="(total, color, colorIndex) in estado.totalPorColor" :key="`${procesoId}-${color}`">
                    <tr :class="getClassesFila(estado, color, total, colorIndex)">
                      <td class="celda-proceso">
                        <span v-if="colorIndex === 0" class="nombre-proceso">
                          {{ estado.nombreDisplay }}
                        </span>
                      </td>
                      <td class="celda-color">
                        <div class="color-info">
                          <span class="muestra-color" :style="{
                            backgroundColor: color,
                            border: color === '#FFFFFF' ? '1px solid #ccc' : 'none',
                          }" :title="getFriendlyColorName(color)"></span>
                          <span class="nombre-color">{{
                            getFriendlyColorName(color)
                            }}</span>
                        </div>
                      </td>
                      <td class="celda-total">{{ total }}</td>
                      <td class="celda-hecho">{{ estado.hechoPorColor[color] || 0 }}</td>
                      <td class="celda-falta">
                        {{ Math.max(0, total - (estado.hechoPorColor[color] || 0)) }}
                      </td>
                      <td class="celda-progreso">
                        <div v-if="total > 0" class="progreso-container">
                          <div class="barra-progreso">
                            <div class="progreso-fill" :style="{
                              width: `${calcularProgreso(procesoId, color)}%`,
                              '--color-base': getProgressBarColor(procesoId, color)
                                .base,
                              '--color-light': getProgressBarColor(procesoId, color)
                                .light,
                            }">
                              <span class="progreso-texto">
                                {{
                                  calcularProgreso(procesoId, color) === 100
                                    ? "Completado"
                                    : Math.round(calcularProgreso(procesoId, color)) + "%"
                                }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span v-else class="no-aplica">No Aplica</span>
                      </td>
                      <td class="celda-accion">
                        <!-- Modo edición -->
                        <div v-if="
                          procesoEnEdicion.procesoId === procesoId &&
                          procesoEnEdicion.color === color
                        " class="modo-edicion">
                          <input type="number" v-model.number="cantidadInputInline" @keyup.enter="confirmarEntrada"
                            @blur="confirmarEntrada" :ref="(el) => setInlineInputRef(el, procesoId, color)"
                            class="input-cantidad" :min="0"
                            :max="Math.max(0, total - (estado.hechoPorColor[color] || 0))" />
                          <div v-if="procesoId === 'presillar_pasadores'" class="unidad-medida">
                            <span>por</span>
                            <input type="number" v-model.number="unidadMedidaSeleccionada" :min="1"
                              class="input-unidad" />
                          </div>
                          <div class="botones-edicion">
                            <button @click="confirmarEntrada" class="btn-confirmar">
                              ✓
                            </button>
                            <button @click="cancelarEdicion" class="btn-cancelar-edicion">
                              ✗
                            </button>
                          </div>
                        </div>

                        <!-- Botón ingresar -->
                        <button v-else @click="iniciarEdicion(procesoId, color)" :disabled="(estado.hechoPorColor[color] || 0) >= total && total > 0
                          " class="btn-ingresar" :class="{
                            disabled:
                              (estado.hechoPorColor[color] || 0) >= total && total > 0,
                          }">
                          Ingresar
                        </button>
                      </td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Botones de guardar/cancelar -->
          <GuardarCancelarDialog :orden-actual="orden" proceso-nombre="Ensamble" :cambios-realizados="cambiosRealizados"
            :puede-guardar="hayCambiosPendientes" :puede-cancelar="hayCambiosPendientes" @guardar="guardarCambios"
            @cancelar="cancelarCambios" ref="guardarCancelarDialog" />
        </div>
      </template>
    </MultiOrdenManager>
  </div>
</template>

<script setup>
import { ref, computed, reactive, nextTick, watch, onMounted, onUnmounted } from "vue";
import { useOrdenStore } from "../stores/ordenStore";
import MultiOrdenManager from "../components/MultiOrdenManager.vue";
import GuardarCancelarDialog from "../components/GuardarCancelarDialog.vue";
import SubprocesoManager from "../components/SubprocesoManager.vue";
import {
  usePlantaRealtimeUpdates,
  useCrossBrowserSync,
} from "../composables/useRealtimeUpdates";

const ordenStore = useOrdenStore();

// Referencias
const multiOrdenManager = ref(null);
const guardarCancelarDialog = ref(null);

// Sistema de tiempo real
const plantaUpdates = usePlantaRealtimeUpdates("ensamble");
const crossBrowserSync = useCrossBrowserSync();

// Estados del proceso
const ordenActual = ref(null);
const procesosPorOrden = reactive(new Map());
const estadoOriginal = reactive(new Map());
const cambiosRealizados = ref([]);

// Estados de edición
const procesoEnEdicion = ref({ procesoId: null, color: null });
const cantidadInputInline = ref(0);
const unidadMedidaSeleccionada = ref(1);
const inlineInputRefs = reactive(new Map());

// Filtros
const filtroProceso = ref("");
const filtroEstado = ref("");
const nuevoProcesoInput = ref("");

// Filtro por rango horario
const filtroHorario = reactive({
  desde: "",
  hasta: "",
  activo: false,
});
const registrosFiltradosPorHora = ref([]);

// Procesos predefinidos para Ensamble
const procesosEnsamble = ref([
  { id: "ensamblar_delantero_trasero", nombre: "Ensamblar Delantero y Trasero" },
  { id: "cerrar_lateral", nombre: "Cerrar Lateral" },
  { id: "cerrar_entrepierna", nombre: "Cerrar Entrepierna" },
  { id: "pespuntar_lateral", nombre: "Pespuntar Lateral" },
  { id: "fijar_pasadores", nombre: "Fijar Pasadores" },
  { id: "empretinar", nombre: "Empretinar" },
  { id: "hacer_punta", nombre: "Hacer Punta" },
  { id: "dobladillar_ruedo", nombre: "Dobladillar Ruedo" },
  { id: "presillar_pasadores", nombre: "Presillar Pasadores" },
  { id: "ojalar", nombre: "Ojalar" },
  { id: "paquetear", nombre: "Paquetear" },
]);

const procesosPersonalizados = ref([]);

// Subprocesos dinámicos para navegación de planta (Ensamble)
const nuevoSubprocesoNombre = ref("");
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "");
}
function guardarSubprocesosNav() {
  const personalizados = procesosEnsamble.value.filter((p) => p.custom === true);
  localStorage.setItem("subprocesosNavEnsamble", JSON.stringify(personalizados));
}
function cargarSubprocesosNav() {
  const raw = localStorage.getItem("subprocesosNavEnsamble");
  if (!raw) return;
  try {
    const list = JSON.parse(raw);
    list.forEach((p) => {
      if (!procesosEnsamble.value.some((x) => x.id === p.id)) {
        procesosEnsamble.value.push({ id: p.id, nombre: p.nombre, custom: true });
      }
    });
  } catch { }
}
function agregarSubproceso() {
  const nombre = (nuevoSubprocesoNombre.value || "").trim();
  if (!nombre) return;
  const id = slugify(nombre);
  if (
    procesosEnsamble.value.some(
      (p) => p.id === id || p.nombre.toLowerCase() === nombre.toLowerCase()
    )
  )
    return;
  procesosEnsamble.value.push({ id, nombre, custom: true });
  guardarSubprocesosNav();
  nuevoSubprocesoNombre.value = "";
}

// Clase para encapsular estado de proceso
class ProcesoEstado {
  constructor(totalPorColor = {}, hechoPorColor = {}, nombreDisplay = "") {
    this.totalPorColor = reactive({ ...totalPorColor });
    this.hechoPorColor = reactive({ ...hechoPorColor });
    this.nombreDisplay = nombreDisplay;
  }

  clone() {
    return new ProcesoEstado(
      { ...this.totalPorColor },
      { ...this.hechoPorColor },
      this.nombreDisplay
    );
  }
}

// Mapeo de colores (igual que en delantero y trasero)
const colorMapping = ref({
  "#F0F8FF": "Azul Alicia",
  "#FAEBD7": "Blanco Antiguo",
  "#00FFFF": "Aqua",
  "#7FFFD4": "Aguamarina",
  "#F0FFFF": "Azure",
  "#F5F5DC": "Beige",
  "#FFE4C4": "Bisque",
  "#000000": "Negro",
  "#FFEBCD": "Almendra Blanqueada",
  "#0000FF": "Azul",
  "#8A2BE2": "Azul Violeta",
  "#A52A2A": "Marrón",
  "#DEB887": "Madera Clara",
  "#5F9EA0": "Azul Cadete",
  "#7FFF00": "Verde Chartreuse",
  "#D2691E": "Chocolate",
  "#FF7F50": "Coral",
  "#6495ED": "Azul Aciano",
  "#FFF8DC": "Seda de Maíz",
  "#DC143C": "Carmesí",
  "#00008B": "Azul Marino",
  "#008B8B": "Cian Oscuro",
  "#B8860B": "Vara de Oro Oscura",
  "#A9A9A9": "Gris Oscuro",
  "#006400": "Verde Oscuro",
  "#BDB76B": "Caqui Oscuro",
  "#8B008B": "Magenta Oscuro",
  "#556B2F": "Verde Oliva Oscuro",
  "#FF8C00": "Naranja Oscuro",
  "#9932CC": "Orquídea Oscura",
  "#8B0000": "Rojo Oscuro",
  "#E9967A": "Salmón Oscuro",
  "#8FBC8F": "Verde Mar Oscuro",
  "#483D8B": "Pizarra Azul Oscuro",
  "#2F4F4F": "Gris Pizarra Oscuro",
  "#00CED1": "Turquesa Oscuro",
  "#9400D3": "Violeta Oscuro",
  "#FF1493": "Rosa Intenso",
  "#00BFFF": "Azul Cielo Profundo",
  "#696969": "Gris Tenue",
  "#1E90FF": "Azul Profundo",
  "#B22222": "Rojo Ladrillo",
  "#FFFAF0": "Blanco Floral",
  "#228B22": "Verde Bosque",
  "#FF00FF": "Fucsia",
  "#DCDCDC": "Gainsboro",
  "#F8F8FF": "Blanco Fantasma",
  "#FFD700": "Dorado",
  "#DAA520": "Vara de Oro",
  "#808080": "Gris",
  "#008000": "Verde",
  "#ADFF2F": "Verde Amarillo",
  "#F0FFF0": "Rocío de Miel",
  "#FF69B4": "Rosa Fuerte",
  "#CD5C5C": "Rojo Indio",
  "#4B0082": "Índigo",
  "#FFFFF0": "Marfil",
  "#F0E68C": "Caqui",
  "#E6E6FA": "Lavanda",
  "#FFF0F5": "Blanco Lavanda",
  "#7CFC00": "Verde Césped",
  "#FFFACD": "Amarillo Limón Gasa",
  "#ADD8E6": "Azul Claro",
  "#F08080": "Coral Claro",
  "#E0FFFF": "Cian Claro",
  "#FAFAD2": "Vara de Oro Claro",
  "#D3D3D3": "Gris Claro",
  "#90EE90": "Verde Claro",
  "#FFB6C1": "Rosa Claro",
  "#FFA07A": "Salmón Claro",
  "#20B2AA": "Verde Mar Claro",
  "#87CEFA": "Azul Cielo Claro",
  "#778899": "Gris Pizarra Claro",
  "#B0C4DE": "Azul Acero Claro",
  "#FFFFE0": "Amarillo Claro",
  "#00FF00": "Lima",
  "#32CD32": "Verde Lima",
  "#FAF0E6": "Lino",
  "#800000": "Granate",
  "#66CDAA": "Aguamarina Medio",
  "#0000CD": "Azul Medio",
  "#BA55D3": "Orquídea Medio",
  "#9370DB": "Púrpura Medio",
  "#3CB371": "Verde Mar Medio",
  "#7B68EE": "Pizarra Azul Medio",
  "#00FA9A": "Verde Primavera Medio",
  "#48D1CC": "Turquesa Medio",
  "#C71585": "Violeta Rojo Medio",
  "#191970": "Azul Medianoche",
  "#F5FFFA": "Crema de Menta",
  "#FFE4E1": "Rosa Neblinoso",
  "#FFE4B5": "Mocasín",
  "#FFDEAD": "Navajo Blanco",
  "#000080": "Naval",
  "#FDF5E6": "Encaje Viejo",
  "#808000": "Oliva",
  "#6B8E23": "Verde Oliva",
  "#FFA500": "Naranja",
  "#FF4500": "Rojo Naranja",
  "#DA70D6": "Orquídea",
  "#EEE8AA": "Vara de Oro Pálido",
  "#98FB98": "Verde Pálido",
  "#AFEEEE": "Turquesa Pálido",
  "#DB7093": "Violeta Rojo Pálido",
  "#FFEFD5": "Blanco Papaya",
  "#FFDAB9": "Melocotón",
  "#CD853F": "Perú",
  "#FFC0CB": "Rosa",
  "#DDA0DD": "Ciruela",
  "#B0E0E6": "Azul Polvo",
  "#800080": "Púrpura",
  "#FF0000": "Rojo",
  "#BC8F8F": "Rosa Marrón",
  "#4169E1": "Azul Real",
  "#8B4513": "Marrón Silla",
  "#FA8072": "Salmón",
  "#F4A460": "Marrón Arenoso",
  "#2E8B57": "Verde Mar",
  "#FFF5EE": "Concha Marina",
  "#A0522D": "Siena",
  "#C0C0C0": "Plata",
  "#87CEEB": "Azul Cielo",
  "#6A5ACD": "Pizarra Azul",
  "#708090": "Gris Pizarra",
  "#FFFAFA": "Nieve",
  "#00FF7F": "Verde Primavera",
  "#4682B4": "Azul Acero",
  "#D2B48C": "Tan",
  "#008080": "Verde Azulado",
  "#D8BFD8": "Cardo",
  "#FF6347": "Tomate",
  "#40E0D0": "Turquesa",
  "#EE82EE": "Violeta",
  "#F5DEB3": "Trigo",
  "#FFFFFF": "Blanco",
  "#F5F5F5": "Humo Blanco",
  "#FFFF00": "Amarillo",
  "#9ACD32": "Verde Amarillento",
});

// Computed
const todosLosProcesos = computed(() => {
  const all = [...procesosEnsamble.value];
  procesosPersonalizados.value.forEach((p) => {
    if (
      !all.some(
        (existingP) =>
          existingP.id === p.id ||
          existingP.nombre.toLowerCase() === p.nombre.toLowerCase()
      )
    ) {
      all.push(p);
    }
  });
  return all;
});

const procesos = computed(() => {
  if (!ordenActual.value?.id) return {};
  if (!procesosPorOrden.has(ordenActual.value.id)) {
    inicializarProcesosParaOrden(ordenActual.value.id, ordenActual.value.detalles);
  }
  return procesosPorOrden.get(ordenActual.value.id) || {};
});

const procesosFiltrados = computed(() => {
  const currentProcesos = procesos.value;
  const filtered = {};

  for (const procesoId in currentProcesos) {
    const procesoEstado = currentProcesos[procesoId];
    if (!procesoEstado || !procesoEstado.nombreDisplay) continue;

    const nombreMatch = procesoEstado.nombreDisplay
      .toLowerCase()
      .includes(filtroProceso.value.toLowerCase());

    if (!nombreMatch) continue;

    const procesoFiltradoPorColor = new ProcesoEstado(
      { ...procesoEstado.totalPorColor },
      { ...procesoEstado.hechoPorColor },
      procesoEstado.nombreDisplay
    );
    let hasMatchingColor = false;

    for (const color in procesoEstado.totalPorColor) {
      const total = procesoEstado.totalPorColor[color];
      const hecho = procesoEstado.hechoPorColor[color] || 0;
      const esCompleto = hecho >= total && total > 0;
      const esPendiente = hecho < total;
      const esEnProceso = hecho > 0 && hecho < total;

      let colorStateMatch = false;
      if (filtroEstado.value === "completo") {
        colorStateMatch = esCompleto;
      } else if (filtroEstado.value === "pendiente") {
        colorStateMatch = esPendiente;
      } else if (filtroEstado.value === "en_proceso") {
        colorStateMatch = esEnProceso;
      } else {
        colorStateMatch = true;
      }

      if (colorStateMatch) {
        hasMatchingColor = true;
      } else {
        delete procesoFiltradoPorColor.totalPorColor[color];
        delete procesoFiltradoPorColor.hechoPorColor[color];
      }
    }

    if (
      hasMatchingColor &&
      Object.keys(procesoFiltradoPorColor.totalPorColor).length > 0
    ) {
      filtered[procesoId] = procesoFiltradoPorColor;
    }
  }
  return filtered;
});

const hayCambiosPendientes = computed(() => {
  if (!ordenActual.value?.id) return false;

  const estadoOriginalOrden = estadoOriginal.get(ordenActual.value.id);
  const estadoActualOrden = procesosPorOrden.get(ordenActual.value.id);

  if (!estadoOriginalOrden || !estadoActualOrden) return false;

  return JSON.stringify(estadoOriginalOrden) !== JSON.stringify(estadoActualOrden);
});

// Funciones principales (similares a las anteriores pero ajustadas para ensamble)
function manejarOrdenSeleccionada(orden) {
  ordenActual.value = orden;
  if (orden) {
    inicializarProcesosParaOrden(orden.id, orden.detalles);
    guardarEstadoOriginal(orden.id);
  }
}

function manejarOrdenesActualizadas(ordenes) {
  actualizarCambiosRealizados();
}

function inicializarProcesosParaOrden(ordenId, detallesOrden) {
  let estadoActualOrden = procesosPorOrden.get(ordenId);
  if (!estadoActualOrden) {
    estadoActualOrden = reactive({});
    procesosPorOrden.set(ordenId, estadoActualOrden);
  }

  const totalesOrdenActual = {};
  if (detallesOrden) {
    detallesOrden.forEach((detalle) => {
      const cantidadTotalDetalle = Object.values(detalle.tallas).reduce(
        (acc, val) => acc + (parseInt(val) || 0),
        0
      );
      if (cantidadTotalDetalle > 0) {
        todosLosProcesos.value.forEach((proceso) => {
          if (!totalesOrdenActual[proceso.id]) {
            totalesOrdenActual[proceso.id] = {};
          }
          if (!totalesOrdenActual[proceso.id][detalle.color]) {
            totalesOrdenActual[proceso.id][detalle.color] = 0;
          }

          // Para 'presillar_pasadores', cada prenda tiene 2 presillas por pasador
          if (proceso.id === "presillar_pasadores") {
            totalesOrdenActual[proceso.id][detalle.color] += cantidadTotalDetalle * 2;
          } else {
            totalesOrdenActual[proceso.id][detalle.color] += cantidadTotalDetalle;
          }
        });
      }
    });
  }

  // Cargar estado existente desde localStorage
  const estadoGuardado = cargarEstadoLocal(ordenId);

  const newProcesosForOrder = {};
  todosLosProcesos.value.forEach(({ id, nombre }) => {
    const totalPorColor = totalesOrdenActual[id] || {};
    const hechoPorColorExistente = estadoGuardado[id]?.hechoPorColor || {};

    const hechoPorColorConsolidado = {};
    for (const color in totalPorColor) {
      hechoPorColorConsolidado[color] = hechoPorColorExistente[color] || 0;
    }

    newProcesosForOrder[id] = reactive(
      new ProcesoEstado(totalPorColor, hechoPorColorConsolidado, nombre)
    );
  });

  // Limpiar y asignar nuevos procesos
  for (const key in estadoActualOrden) {
    delete estadoActualOrden[key];
  }
  Object.assign(estadoActualOrden, newProcesosForOrder);
}

function guardarEstadoOriginal(ordenId) {
  const estadoActual = procesosPorOrden.get(ordenId);
  if (estadoActual) {
    const estadoClonado = {};
    for (const procesoId in estadoActual) {
      estadoClonado[procesoId] = estadoActual[procesoId].clone();
    }
    estadoOriginal.set(ordenId, estadoClonado);
  }
}

// Funciones de color
function getFriendlyColorName(hexColor) {
  if (!hexColor) return "Color desconocido";

  let normalizedHex = hexColor.toUpperCase();
  if (normalizedHex.length === 4) {
    normalizedHex =
      "#" +
      normalizedHex[1] +
      normalizedHex[1] +
      normalizedHex[2] +
      normalizedHex[2] +
      normalizedHex[3] +
      normalizedHex[3];
  }

  return colorMapping.value[normalizedHex] || normalizedHex;
}

// Funciones de cálculo
function calcularTotalPedido(orden) {
  return (
    orden.detalles?.reduce(
      (sum, detalle) =>
        sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0),
      0
    ) || 0
  );
}

function calcularProgresoOrden(orden) {
  const procesos = [];

  if (orden.estadoCorte?.aplicaExtension !== false) {
    procesos.push(orden.estadoCorte?.telaExtendida ? 100 : 0);
  }
  if (orden.estadoCorte?.aplicaCorte !== false) {
    const total = calcularTotalPedido(orden);
    const cortadas =
      orden.estadoCorte?.unidadesCortadas?.reduce(
        (sum, item) => sum + (parseInt(item.cortadas) || 0),
        0
      ) || 0;
    procesos.push(total > 0 ? (cortadas / total) * 100 : 0);
  }

  return procesos.length > 0 ? procesos.reduce((a, b) => a + b, 0) / procesos.length : 0;
}

function calcularProgreso(procesoId, color) {
  const proceso = procesos.value[procesoId];
  if (!proceso) return 0;
  const total = proceso.totalPorColor[color] || 0;
  const hecho = proceso.hechoPorColor[color] || 0;
  if (total === 0) return 0;
  return (hecho / total) * 100;
}

function getProgressBarColor(procesoId, color) {
  const progreso = calcularProgreso(procesoId, color);
  if (progreso >= 100) {
    return {
      base: "rgb(34, 197, 94)", // Verde
      light: "rgb(72, 187, 120)",
    };
  } else if (progreso >= 75) {
    return {
      base: "rgb(251, 191, 36)", // Amarillo
      light: "rgb(252, 211, 77)",
    };
  } else if (progreso >= 25) {
    return {
      base: "rgb(249, 115, 22)", // Naranja
      light: "rgb(251, 146, 60)",
    };
  } else if (progreso > 0) {
    return {
      base: "rgb(239, 68, 68)", // Rojo
      light: "rgb(248, 113, 113)",
    };
  } else {
    return {
      base: "rgb(156, 163, 175)", // Gris
      light: "rgb(209, 213, 219)",
    };
  }
}

function getClassesFila(estado, color, total, colorIndex) {
  const hecho = estado.hechoPorColor[color] || 0;
  return {
    "fila-completa": hecho >= total && total > 0,
    "fila-parcial": hecho > 0 && hecho < total,
    "fila-pendiente": total > 0 && hecho === 0,
    "fila-no-aplica": total === 0,
    "primera-fila-proceso": colorIndex === 0,
  };
}

// Funciones de edición
function iniciarEdicion(procesoId, color) {
  procesoEnEdicion.value = { procesoId, color };
  unidadMedidaSeleccionada.value = 1;

  const proceso = procesos.value[procesoId];
  if (!proceso) return;

  const totalRequerido = proceso.totalPorColor[color] || 0;
  const cantidadActualHecha = proceso.hechoPorColor[color] || 0;
  const cantidadRestante = Math.max(0, totalRequerido - cantidadActualHecha);

  cantidadInputInline.value = cantidadRestante > 0 ? 1 : 0;

  nextTick(() => {
    const inputElement = inlineInputRefs.get(`${procesoId}-${color}`);
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  });
}

function confirmarEntrada() {
  const { procesoId, color } = procesoEnEdicion.value;
  let cantidadIngresada = parseInt(cantidadInputInline.value);
  const proceso = procesos.value[procesoId];

  if (!proceso || isNaN(cantidadIngresada) || cantidadIngresada < 0) {
    cancelarEdicion();
    return;
  }

  if (
    procesoId === "presillar_pasadores" &&
    (isNaN(unidadMedidaSeleccionada.value) || unidadMedidaSeleccionada.value <= 0)
  ) {
    alert("Para Presillar Pasadores, la unidad de medida debe ser un número positivo.");
    return;
  }

  let cantidadARegistrar = cantidadIngresada;
  if (procesoId === "presillar_pasadores") {
    cantidadARegistrar = cantidadIngresada * unidadMedidaSeleccionada.value;
  }

  if (proceso.hechoPorColor[color] === undefined) {
    proceso.hechoPorColor[color] = 0;
  }

  const totalRequerido = proceso.totalPorColor[color] || 0;
  const cantidadActualHecha = proceso.hechoPorColor[color];

  if (totalRequerido > 0 && cantidadActualHecha + cantidadARegistrar > totalRequerido) {
    const cantidadMaxima = totalRequerido - cantidadActualHecha;
    alert(`La cantidad excede el límite. Máximo permitido: ${cantidadMaxima}`);
    return;
  }

  // Actualizar el valor
  proceso.hechoPorColor[color] += cantidadARegistrar;

  // Registrar el cambio
  registrarCambio(
    `${proceso.nombreDisplay} - ${getFriendlyColorName(
      color
    )}: +${cantidadARegistrar} unidades`
  );

  cancelarEdicion();
}

function cancelarEdicion() {
  procesoEnEdicion.value = { procesoId: null, color: null };
  cantidadInputInline.value = 0;
  unidadMedidaSeleccionada.value = 1;
}

function setInlineInputRef(el, procesoId, color) {
  if (el) {
    inlineInputRefs.set(`${procesoId}-${color}`, el);
  } else {
    inlineInputRefs.delete(`${procesoId}-${color}`);
  }
}

// Funciones de gestión de procesos
function agregarNuevoProceso() {
  const nombre = nuevoProcesoInput.value.trim();
  if (!nombre) {
    alert("Por favor, ingresa un nombre para el nuevo proceso.");
    return;
  }

  const newId = `custom_ensamble_${Date.now()}`;
  const newProceso = { id: newId, nombre: nombre };

  if (
    todosLosProcesos.value.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase())
  ) {
    alert(`El proceso "${nombre}" ya existe.`);
    return;
  }

  procesosPersonalizados.value.push(reactive(newProceso));
  guardarProcesosPersonalizados();
  nuevoProcesoInput.value = "";

  if (ordenActual.value?.id) {
    inicializarProcesosParaOrden(ordenActual.value.id, ordenActual.value.detalles);
  }
}

// Funciones de persistencia
function guardarEstadoLocal(ordenId) {
  const estadoOrden = procesosPorOrden.get(ordenId);
  if (!estadoOrden) return;

  const raw = {};
  for (const procesoId in estadoOrden) {
    const procEstado = estadoOrden[procesoId];
    raw[procesoId] = {
      totalPorColor: { ...procEstado.totalPorColor },
      hechoPorColor: { ...procEstado.hechoPorColor },
      nombreDisplay: procEstado.nombreDisplay,
    };
  }

  localStorage.setItem(`procesosEnsambleEstado_${ordenId}`, JSON.stringify(raw));
}

function cargarEstadoLocal(ordenId) {
  const raw = JSON.parse(
    localStorage.getItem(`procesosEnsambleEstado_${ordenId}`) || "{}"
  );
  return raw;
}

function guardarProcesosPersonalizados() {
  localStorage.setItem(
    "procesosPersonalizadosEnsamble",
    JSON.stringify(procesosPersonalizados.value)
  );
}

function cargarProcesosPersonalizados() {
  const stored = localStorage.getItem("procesosPersonalizadosEnsamble");
  if (stored) {
    const loadedData = JSON.parse(stored);
    procesosPersonalizados.value = reactive(loadedData.map((p) => reactive(p)));
  }
}

// Funciones de cambios
function registrarCambio(descripcion) {
  const ahora = new Date();
  const horaFormateada = ahora.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const descripcionConHora = `[${horaFormateada}] ${descripcion}`;
  cambiosRealizados.value.push(descripcionConHora);

  // Si hay filtro horario activo, actualizar registros filtrados
  if (filtroHorario.activo) {
    actualizarRegistrosFiltradosPorHora();
  }
}

function actualizarCambiosRealizados() {
  if (!ordenActual.value?.id) {
    cambiosRealizados.value = [];
    return;
  }

  const estadoOriginalOrden = estadoOriginal.get(ordenActual.value.id);
  const estadoActualOrden = procesosPorOrden.get(ordenActual.value.id);

  if (!estadoOriginalOrden || !estadoActualOrden) {
    cambiosRealizados.value = [];
    return;
  }

  const cambios = [];
  for (const procesoId in estadoActualOrden) {
    const estadoActual = estadoActualOrden[procesoId];
    const estadoOriginalProceso = estadoOriginalOrden[procesoId];

    if (!estadoOriginalProceso) continue;

    for (const color in estadoActual.hechoPorColor) {
      const valorActual = estadoActual.hechoPorColor[color] || 0;
      const valorOriginal = estadoOriginalProceso.hechoPorColor[color] || 0;

      if (valorActual !== valorOriginal) {
        const diferencia = valorActual - valorOriginal;
        cambios.push(
          `${estadoActual.nombreDisplay} - ${getFriendlyColorName(color)}: ${diferencia > 0 ? "+" : ""
          }${diferencia} unidades`
        );
      }
    }
  }

  cambiosRealizados.value = cambios;
}

// Funciones del dialog
async function guardarCambios() {
  if (!ordenActual.value?.id) return;

  try {
    guardarEstadoLocal(ordenActual.value.id);
    guardarEstadoOriginal(ordenActual.value.id);
    cambiosRealizados.value = [];

    // Notificar cambios a otros componentes y ventanas
    crossBrowserSync.notificarCambio("proceso_actualizado", {
      proceso: "ensamble",
      ordenId: ordenActual.value.id,
      timestamp: new Date(),
    });

    // Emitir evento para seguimiento en tiempo real
    window.dispatchEvent(
      new CustomEvent("plantaProcesoUpdate", {
        detail: {
          procesoTipo: "ensamble",
          ordenId: ordenActual.value.id,
          cambios: cambiosRealizados.value,
          timestamp: new Date(),
        },
      })
    );

    if (multiOrdenManager.value) {
      multiOrdenManager.value.actualizarEstado();
    }

    console.log("Cambios guardados exitosamente");
  } catch (error) {
    console.error("Error al guardar cambios:", error);
    throw error;
  }
}

async function cancelarCambios() {
  if (!ordenActual.value?.id) return;

  try {
    const estadoOriginalOrden = estadoOriginal.get(ordenActual.value.id);
    if (estadoOriginalOrden) {
      const estadoRestaurado = {};
      for (const procesoId in estadoOriginalOrden) {
        estadoRestaurado[procesoId] = estadoOriginalOrden[procesoId].clone();
      }
      procesosPorOrden.set(ordenActual.value.id, reactive(estadoRestaurado));
    }

    cambiosRealizados.value = [];
    cancelarEdicion();

    console.log("Cambios cancelados exitosamente");
  } catch (error) {
    console.error("Error al cancelar cambios:", error);
    throw error;
  }
}

// Funciones de filtro horario
function aplicarFiltroHorario() {
  if (!filtroHorario.desde || !filtroHorario.hasta) {
    alert("Por favor, seleccione ambas horas (desde y hasta)");
    return;
  }

  if (filtroHorario.desde >= filtroHorario.hasta) {
    alert('La hora "desde" debe ser menor que la hora "hasta"');
    return;
  }

  filtroHorario.activo = true;
  actualizarRegistrosFiltradosPorHora();
  console.log(
    `[Ensamble] Filtro horario aplicado: ${filtroHorario.desde} - ${filtroHorario.hasta}`
  );
}

function limpiarFiltroHorario() {
  filtroHorario.desde = "";
  filtroHorario.hasta = "";
  filtroHorario.activo = false;
  registrosFiltradosPorHora.value = [];
  console.log("[Ensamble] Filtro horario limpiado");
}

function actualizarRegistrosFiltradosPorHora() {
  if (!filtroHorario.activo) {
    registrosFiltradosPorHora.value = [];
    return;
  }

  const ahora = new Date();
  const fechaHoy = ahora.toDateString();

  // Crear fechas completas para comparación
  const horaDesde = new Date(`${fechaHoy} ${filtroHorario.desde}:00`);
  const horaHasta = new Date(`${fechaHoy} ${filtroHorario.hasta}:59`);

  // Filtrar registros de cambios por hora
  const registrosFiltrados = cambiosRealizados.value.filter((cambio) => {
    // Extraer hora del cambio (formato [HH:mm])
    const matchHora = cambio.match(/\[(\d{2}:\d{2})\]/);
    if (!matchHora) return false;

    const horaCambio = new Date(`${fechaHoy} ${matchHora[1]}:00`);
    return horaCambio >= horaDesde && horaCambio <= horaHasta;
  });

  registrosFiltradosPorHora.value = registrosFiltrados;
  console.log(`[Ensamble] Registros filtrados por hora: ${registrosFiltrados.length}`);
}

function estaEnRangoHorario(fecha) {
  if (!filtroHorario.activo) return true;

  const fechaMovimiento = new Date(fecha);
  const horaMovimiento = fechaMovimiento.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return horaMovimiento >= filtroHorario.desde && horaMovimiento <= filtroHorario.hasta;
}

// Watchers
watch(
  () => hayCambiosPendientes.value,
  () => {
    actualizarCambiosRealizados();
  }
);

watch(
  () => filtroHorario.activo,
  (activo) => {
    if (activo) {
      actualizarRegistrosFiltradosPorHora();
    }
  }
);

// Listener para limpiar estado cuando se cambia de vista
const handleVistaCambiando = (event) => {
  if (event.detail.vistaAnterior === "Ensamble") {
    console.log("[Ensamble] Limpiando estado al cambiar de vista");
    cancelarEdicion();
    filtroProceso.value = "";
    filtroEstado.value = "";
    nuevoProcesoInput.value = "";
    // Limpiar filtro horario
    limpiarFiltroHorario();
    ordenActual.value = null;
  }
};

// Lifecycle
onMounted(() => {
  cargarSubprocesosNav();
  cargarProcesosPersonalizados();

  window.addEventListener("vistaPlantaCambiando", handleVistaCambiando);

  const handlePlantaUpdate = (event) => {
    if (event.detail.procesoTipo === "ensamble") {
      console.log("[Ensamble] Actualización de proceso recibida:", event.detail);
      nextTick(() => {
        if (multiOrdenManager.value) {
          multiOrdenManager.value.actualizarEstado();
        }
      });
    }
  };

  const handleRealtimeUpdate = (event) => {
    console.log("[Ensamble] Actualización en tiempo real:", event.detail);
    actualizarCambiosRealizados();
  };

  const handleCrossBrowserSync = (event) => {
    if (
      event.detail.tipo === "proceso_actualizado" &&
      event.detail.datos.proceso === "ensamble"
    ) {
      console.log("[Ensamble] Sincronización entre ventanas:", event.detail);
      setTimeout(() => {
        if (ordenActual.value?.id) {
          inicializarProcesosParaOrden(ordenActual.value.id, ordenActual.value.detalles);
        }
      }, 200);
    }
  };

  window.addEventListener("plantaProcesoUpdate", handlePlantaUpdate);
  window.addEventListener("realtimeUpdate", handleRealtimeUpdate);
  window.addEventListener("crossBrowserSync", handleCrossBrowserSync);

  onUnmounted(() => {
    window.removeEventListener("vistaPlantaCambiando", handleVistaCambiando);
    window.removeEventListener("plantaProcesoUpdate", handlePlantaUpdate);
    window.removeEventListener("realtimeUpdate", handleRealtimeUpdate);
    window.removeEventListener("crossBrowserSync", handleCrossBrowserSync);
  });
});
</script>

<style scoped>
.ensamble-view {
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  min-height: 100vh;
}

.titulo-principal {
  font-size: var(--font-size-3xl);
  color: var(--primary-blue-dark);
  text-align: center;
  margin-bottom: var(--spacing-xl);
  font-weight: 700;
}

.proceso-ensamble-container {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.resumen-orden {
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.resumen-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--spacing-lg);
  align-items: center;
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

.info-item {
  margin-bottom: var(--spacing-xs);
}

.gestor-subprocesos {
  padding: var(--spacing-lg);
}

.gestor-subprocesos {
  padding: var(--spacing-lg);
}

.orden-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--success);
  color: white;
}

.orden-titulo {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin: 0;
}

.orden-resumen {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
}

.total-pedido {
  font-weight: 600;
  font-size: var(--font-size-lg);
}

.progreso-general {
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.filtros-proceso {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.input-filtro {
  flex: 1;
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
}

.input-filtro:focus {
  border-color: var(--success);
  outline: none;
}

.select-filtro {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
}

.agregar-proceso {
  display: flex;
  gap: var(--spacing-md);
  align-items: end;
  padding: var(--spacing-lg);
  background-color: var(--success-bg);
  border-bottom: 1px solid var(--border-color);
}

.input-grupo {
  flex: 1;
}

.input-grupo label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.input-nuevo-proceso {
  width: 100%;
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
}

.input-nuevo-proceso:focus {
  border-color: var(--success);
  outline: none;
}

.btn-agregar-proceso {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--success);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-agregar-proceso:hover {
  background-color: var(--success-dark);
  transform: translateY(-1px);
}

.tabla-procesos-container {
  overflow-x: auto;
}

.tabla-procesos {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
}

.tabla-procesos th {
  background-color: var(--success-dark);
  color: white;
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.tabla-procesos td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.fila-completa {
  background-color: var(--success-bg);
}

.fila-parcial {
  background-color: var(--warning-bg);
}

.fila-pendiente {
  background-color: var(--danger-bg);
}

.fila-no-aplica {
  background-color: var(--gray-50);
}

.separador-proceso .linea-separador {
  height: 1px;
  background: linear-gradient(to right,
      var(--gray-300),
      var(--gray-400),
      var(--gray-300));
}

.celda-vacia {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
  font-style: italic;
}

.nombre-proceso {
  font-weight: 600;
  color: var(--success-dark);
}

.color-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.muestra-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.nombre-color {
  font-size: var(--font-size-sm);
}

.celda-total {
  font-weight: 600;
  color: var(--text-primary);
}

.celda-hecho {
  font-weight: 600;
  color: var(--success-dark);
}

.celda-falta {
  font-weight: 600;
  color: var(--warning-dark);
}

.progreso-container {
  width: 100%;
  max-width: 120px;
}

.barra-progreso {
  width: 100%;
  height: 24px;
  background-color: var(--gray-200);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--gray-300);
}

.progreso-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: linear-gradient(90deg, var(--color-base), var(--color-light));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.progreso-fill::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progress-shimmer 2s infinite;
}

@keyframes progress-shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.progreso-texto {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: white;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
}

.no-aplica {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-style: italic;
}

.modo-edicion {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
}

.input-cantidad {
  width: 80px;
  padding: var(--spacing-xs);
  border: 2px solid var(--success);
  border-radius: var(--border-radius);
  text-align: center;
  font-size: var(--font-size-sm);
}

.unidad-medida {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.input-unidad {
  width: 50px;
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  text-align: center;
  font-size: var(--font-size-xs);
}

.botones-edicion {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-confirmar {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--success);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.btn-confirmar:hover {
  background-color: var(--success-dark);
}

.btn-cancelar-edicion {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--danger);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.btn-cancelar-edicion:hover {
  background-color: var(--danger-dark);
}

.btn-ingresar {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--success);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-ingresar:hover {
  background-color: var(--success-dark);
}

.btn-ingresar.disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
}

.btn-ingresar.disabled:hover {
  background-color: var(--gray-400);
}

/* Filtro por rango horario */
.filtro-horario {
  padding: var(--spacing-lg);
  background-color: var(--success-bg);
  border-bottom: 1px solid var(--border-color);
  border-left: 4px solid var(--success);
}

.filtro-horario h4 {
  color: var(--success-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.filtro-horario-campos {
  display: flex;
  gap: var(--spacing-md);
  align-items: end;
  flex-wrap: wrap;
}

.campo-hora {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 120px;
}

.campo-hora label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.input-hora {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.input-hora:focus {
  border-color: var(--success);
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.botones-filtro-horario {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-aplicar-filtro {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--success);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-aplicar-filtro:hover {
  background-color: var(--success-dark);
  transform: translateY(-1px);
}

.btn-limpiar-filtro {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--gray-600);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-limpiar-filtro:hover {
  background-color: var(--gray-700);
  transform: translateY(-1px);
}

.filtro-activo-info {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--border-radius);
  color: var(--info-dark);
  font-weight: 600;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

@media (max-width: 768px) {
  .orden-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .orden-resumen {
    align-items: flex-start;
  }

  .filtros-proceso {
    flex-direction: column;
  }

  .agregar-proceso {
    flex-direction: column;
    align-items: stretch;
  }

  .filtro-horario-campos {
    flex-direction: column;
    align-items: stretch;
  }

  .botones-filtro-horario {
    justify-content: stretch;
  }

  .btn-aplicar-filtro,
  .btn-limpiar-filtro {
    flex: 1;
  }
}

.subproceso-add-bar {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-md);
}

.input-nuevo-subproceso-nav {
  flex: 1 1 240px;
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
}

.btn-agregar-subproceso-nav {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--success);
  color: #fff;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 700;
  cursor: pointer;
}
</style>
