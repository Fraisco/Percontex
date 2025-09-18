<template>
  <div class="proceso-corte-container">
    <div class="navbar">
      <ul>
        <li @click="cambiarVista('Ordenes')" :class="{ active: vistaActiva === 'Ordenes' }">
          Órdenes
        </li>
        <li v-if="ordenSeleccionada" @click="cambiarVista('ExtenderTela')"
          :class="{ active: vistaActiva === 'ExtenderTela' }">
          Extender Tela
        </li>
        <li v-if="ordenSeleccionada" @click="cambiarVista('VistaCorte')"
          :class="{ active: vistaActiva === 'VistaCorte' }">
          Corte
        </li>
        <li v-if="ordenSeleccionada" @click="cambiarVista('Numeracion')"
          :class="{ active: vistaActiva === 'Numeracion' }">
          Numeración
        </li>
        <li v-if="ordenSeleccionada" @click="cambiarVista('Fusionar')" :class="{ active: vistaActiva === 'Fusionar' }">
          Fusionar
        </li>
        <li v-if="ordenSeleccionada" @click="cambiarVista('Finalizar')"
          :class="{ active: vistaActiva === 'Finalizar' }">
          Finalizar
        </li>
        <li @click="cambiarVista('SeguimientoCorte')" :class="{ active: vistaActiva === 'SeguimientoCorte' }"
          class="seguimiento-corte-button">
          ✂️ Seguimiento Corte
        </li>
        <li @click="cambiarVista('AvanceOrdenes')" :class="{ active: vistaActiva === 'AvanceOrdenes' }"
          class="avance-button">
          📊 Avance General
        </li>
        <li @click="logout" class="logout-button">Cerrar Sesión</li>
      </ul>
    </div>

    <div class="content-wrapper">
      <div class="corte-header">
        <section class="resumen-orden-corte" v-if="ordenSeleccionada">
          <div class="resumen-grid">
            <div class="col imagen">
              <img v-if="ordenSeleccionada.imagenDiseno" :src="ordenSeleccionada.imagenDiseno" alt="Imagen producto"
                class="imagen-producto-mini" />
              <div v-else class="imagen-placeholder-mini">📷</div>
            </div>
            <div class="col info">
              <div class="info-item">
                <strong>Cliente:</strong>
                {{ ordenSeleccionada.proveedor }}
              </div>
              <div class="info-item">
                <strong>Total Pedido:</strong> {{ totalPedidoCorte }} unidades
              </div>
              <div class="info-item">
                <strong>Total Producido:</strong> {{ totalCortadoCorte }} unidades
              </div>
              <div class="info-item">
                <strong>Pendiente:</strong>
                {{ Math.max(0, totalPedidoCorte - totalCortadoCorte) }} unidades
              </div>
            </div>
          </div>
        </section>

        <section class="nav-subprocesos-corte">
          <div class="nav-subprocesos" v-if="subprocesosCorte && subprocesosCorte.length">
            <button v-for="sp in subprocesosCorte" :key="sp.id" class="btn-subproceso"
              :class="{ active: activeSubprocesoId === sp.id }" @click="seleccionarSubproceso(sp.id)">
              {{ sp.nombre }}
            </button>
          </div>
          <div class="subproceso-add-bar">
            <input type="text" v-model="nuevoSubprocesoCorte" @keyup.enter="agregarSubprocesoCorte"
              placeholder="Nombre del nuevo subproceso" class="input-nuevo-subproceso-nav" />
            <button class="btn-agregar-subproceso-nav" @click="agregarSubprocesoCorte">
              Agregar Subproceso
            </button>
          </div>
        </section>

        <section class="historial-corte" v-if="ordenSeleccionada">
          <h3>📊 Historial de Movimientos</h3>
          <div class="filtros-tiempo">
            <div class="campo-tiempo">
              <label>Fecha</label>
              <input type="date" class="input" v-model="filtroFecha" />
            </div>
            <div class="campo-tiempo">
              <label>Hora inicio</label>
              <input type="time" class="input" v-model="filtroHoraInicio" />
            </div>
            <div class="campo-tiempo">
              <label>Hora fin</label>
              <input type="time" class="input" v-model="filtroHoraFin" />
            </div>
            <button class="btn balance" :disabled="!horaRangoValido" @click="generarBalance">
              ⚖️ Generar Balance
            </button>
          </div>
          <div class="lista-historial">
            <div v-for="(h, i) in historialFiltrado" :key="i" class="item-historial">
              <div class="info-hist">
                <span class="origen">{{ h.procesoOrigen }}</span>
                <span class="flecha">→</span>
                <span class="destino">{{ h.procesoDestino }}</span>
              </div>
              <div class="cantidad">{{ h.cantidadTransferida }} unidades</div>
              <div class="fecha">{{ formatearFecha(h.fechaTransferencia) }}</div>
            </div>
          </div>
          <div v-if="msgCorte" class="mensaje success">{{ msgCorte }}</div>
        </section>
      </div>
      <div v-if="vistaActiva === 'Ordenes'">
        <div v-if="ordenes.length === 0" class="sin-ordenes">
          <p>No hay órdenes registradas en el sistema.</p>
        </div>
        <div v-else class="orden-corte-box">
          <h1 class="orden-title">Lista de Órdenes de Corte</h1>
          <div class="search-bar">
            <input type="text" v-model="buscarOrdenId" @focus="mostrarOrdenesBusqueda" @blur="ocultarOrdenesBusqueda"
              placeholder="Buscar por ID o Consecutivo de Orden..." class="search-input" />
            <ul v-if="mostrarListaOrdenes && ordenesFiltradasBusqueda.length > 0" class="lista-ordenes-busqueda">
              <li v-for="orden in ordenesFiltradasBusqueda" :key="orden.id"
                @mousedown.prevent="seleccionarOrdenDesdeBusqueda(orden)" class="item-orden-busqueda">
                {{ orden.consecutivo }} - {{ orden.referencia_por_defecto }}
              </li>
            </ul>
          </div>

          <div v-if="ordenFiltrada" class="filtro-activo">
            <span class="texto-filtro">Mostrando orden específica:</span>
            <button @click="limpiarFiltroOrden" class="btn-limpiar-filtro">
              Ver Todas las Órdenes
            </button>
          </div>

          <ul class="ordenes-list">
            <li v-for="orden in ordenesParaMostrar" :key="orden.id" class="orden-item">
              <h2>Orden No: {{ orden.consecutivo }}</h2>
              <div class="orden-info">
                <p><strong>Referencia:</strong> {{ orden.referencia_por_defecto }}</p>
                <p><strong>Encargado:</strong> {{ orden.encargado }}</p>
                <p><strong>Proveedor:</strong> {{ orden.proveedor }}</p>
                <p><strong>Fecha Inicio:</strong> {{ orden.fecha }}</p>
                <p><strong>Total Cantidad:</strong> {{ orden.total_cantidad }}</p>

                <div class="progreso-corte">
                  <h3>Progreso del Corte</h3>
                  <div class="estado-items">
                    <div class="estado-item">
                      <div class="estado-header">
                        <span class="estado-label">Tela Extendida:</span>
                        <label class="aplica-checkbox">
                          <input type="checkbox" :checked="orden.estadoCorte?.aplicaExtension !== false" @change="
                            actualizarAplicabilidad(
                              orden.id,
                              'aplicaExtension',
                              $event.target.checked
                            )
                            " />
                          <span class="checkbox-label">Aplica</span>
                        </label>
                      </div>
                      <div v-if="orden.estadoCorte?.aplicaExtension !== false">
                        <span :class="{ 'badge-success': orden.tela_extendida }" class="badge">
                          {{ "Si" }}
                        </span>
                      </div>
                      <div v-else>
                        <span class="badge badge-disabled">No Aplica</span>
                      </div>
                    </div>
                    <div class="estado-item">
                      <div class="estado-header">
                        <span class="estado-label">Corte realizado:</span>
                        <label class="aplica-checkbox">
                          <input type="checkbox" :checked="orden.estadoCorte?.aplicaCorte !== false" @change="
                            actualizarAplicabilidad(
                              orden.id,
                              'aplicaCorte',
                              $event.target.checked
                            )
                            " />
                          <span class="checkbox-label">Aplica</span>
                        </label>
                      </div>
                      <div v-if="orden.estadoCorte?.aplicaCorte !== false">
                        <span class="badge badge-primary">{{ calcularUnidadesCortadas(orden) }} unidades</span>
                        <div class="mini-progreso">
                          <div class="barra-mini" :style="{ width: calcularPorcentajeCorte(orden) + '%' }"></div>
                          <span class="porcentaje-mini">{{ calcularPorcentajeCorte(orden).toFixed(1) }}%</span>
                        </div>
                      </div>
                      <div v-else>
                        <span class="badge badge-disabled">No Aplica</span>
                      </div>
                    </div>
                    <div class="estado-item">
                      <div class="estado-header">
                        <span class="estado-label">Numeración:</span>
                        <label class="aplica-checkbox">
                          <input type="checkbox" :checked="orden.estadoCorte?.aplicaNumeracion !== false" @change="
                            actualizarAplicabilidad(
                              orden.id,
                              'aplicaNumeracion',
                              $event.target.checked
                            )
                            " />
                          <span class="checkbox-label">Aplica</span>
                        </label>
                      </div>
                      <div v-if="orden.estadoCorte?.aplicaNumeracion !== false">
                        <span class="badge badge-primary">{{ calcularUnidadesNumeradas(orden) }} unidades</span>
                        <div class="mini-progreso">
                          <div class="barra-mini" :style="{ width: calcularPorcentajeNumeracion(orden) + '%' }"></div>
                          <span class="porcentaje-mini">{{ calcularPorcentajeNumeracion(orden).toFixed(1) }}%</span>
                        </div>
                      </div>
                      <div v-else>
                        <span class="badge badge-disabled">No Aplica</span>
                      </div>
                    </div>
                    <div class="estado-item">
                      <div class="estado-header">
                        <span class="estado-label">Fusionado:</span>
                        <label class="aplica-checkbox">
                          <input type="checkbox" :checked="orden.estadoCorte?.aplicaFusion !== false" @change="
                            actualizarAplicabilidad(
                              orden.id,
                              'aplicaFusion',
                              $event.target.checked
                            )
                            " />
                          <span class="checkbox-label">Aplica</span>
                        </label>
                      </div>
                      <div v-if="orden.estadoCorte?.aplicaFusion !== false">
                        <span class="badge badge-primary">{{ calcularunidadesFusionadas(orden) }} unidades</span>
                        <div class="mini-progreso">
                          <div class="barra-mini" :style="{ width: calcularPorcentajeFusion(orden) + '%' }"></div>
                          <span class="porcentaje-mini">{{ calcularPorcentajeFusion(orden).toFixed(1) }}%</span>
                        </div>
                      </div>
                      <div v-else>
                        <span class="badge badge-disabled">No Aplica</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="botones-orden">
                <button @click="seleccionarOrdenDesdeLista(orden)" class="btn-seleccionar">
                  Iniciar Proceso de Corte
                </button>
                <button @click="verDetalleOrden(orden)" class="btn-ver-detalle">
                  Ver Detalle Completo
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div v-else-if="vistaActiva === 'ExtenderTela' && ordenSeleccionada">
        <h2 class="section-title">
          Extender Tela para Orden: {{ ordenSeleccionada.consecutivo }}
        </h2>
        <p class="section-subtitle">Gestiona el proceso de extendido de tela.</p>
        <ExtenderTelaView :orden="ordenSeleccionada" />
      </div>

      <div v-else-if="vistaActiva === 'VistaCorte' && ordenSeleccionada">
        <h2 class="section-title">
          Vista de Corte para Orden: {{ ordenSeleccionada.consecutivo }}
        </h2>
        <p class="section-subtitle">Gestiona el proceso de corte de la tela.</p>
        <VistaCorteView :orden="ordenSeleccionada" />
      </div>

      <div v-else-if="vistaActiva === 'Numeracion' && ordenSeleccionada">
        <h2 class="section-title">
          Numeración para Orden: {{ ordenSeleccionada.consecutivo }}
        </h2>
        <p class="section-subtitle">Gestiona la numeración de las piezas cortadas.</p>
        <NumeracionView :orden="ordenSeleccionada" />
      </div>

      <div v-else-if="vistaActiva === 'Fusionar' && ordenSeleccionada">
        <h2 class="section-title">
          Fusionar para Orden: {{ ordenSeleccionada.consecutivo }}
        </h2>
        <p class="section-subtitle">Gestiona el proceso de fusión de piezas.</p>
        <FusionarView :orden="ordenSeleccionada" />
      </div>

      <div v-else-if="vistaActiva === 'Finalizar' && ordenSeleccionada">
        <h2 class="section-title">
          Finalizar Corte para Orden: {{ ordenSeleccionada.consecutivo }}
        </h2>
        <p class="section-subtitle">Finaliza y valida el proceso completo de corte.</p>
        <FinalizarView :orden="ordenSeleccionada" />
      </div>

      <div v-else-if="vistaActiva === 'SeguimientoCorte'">
        <SeguimientoCorte />
      </div>

      <div v-else-if="vistaActiva === 'AvanceOrdenes'">
        <AvanceOrdenes />
      </div>

      <div v-else class="no-orden-seleccionada">
        <p>
          Por favor, selecciona una orden para empezar a trabajar en los procesos de
          corte.
        </p>
        <button @click="cambiarVista('Ordenes')" class="btn-go-to-orders">
          Ir a Órdenes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useOrdenStore } from "../stores/ordenStore";
import { onMounted, computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
// Importar los componentes hijos
import ExtenderTelaView from "../views/ExtenderTela.vue";
import VistaCorteView from "../views/VistaCorte.vue";
import NumeracionView from "../views/Numeracion.vue";
import FusionarView from "../views/Fusionar.vue";
import FinalizarView from "../views/Finalizar.vue";
import AvanceOrdenes from "../views/AvanceOrdenes.vue";
import SeguimientoCorte from "../views/SeguimientoCorte.vue";

const router = useRouter();
const ordenStore = useOrdenStore();
const toast = useToast();
// Estado reactivo para la vista activa
const vistaActiva = ref(localStorage.getItem("vistaActivaProcesoCorte") || "Ordenes");

// Subprocesos dinámicos para Corte
const subprocesosCorte = ref([
  { id: "ordenes", nombre: "Órdenes" },
  { id: "extender_tela", nombre: "Extender Tela" },
  { id: "corte", nombre: "Corte" },
  { id: "numeracion", nombre: "Numeración" },
  { id: "fusionar", nombre: "Fusionar" },
  { id: "finalizar", nombre: "Finalizar" },
]);
const nuevoSubprocesoCorte = ref("");
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "");
}
function guardarSubprocesosCorteNav() {
  const personalizados = subprocesosCorte.value.filter((p) => p.custom === true);
  localStorage.setItem("subprocesosNavCorte", JSON.stringify(personalizados));
}
function cargarSubprocesosCorteNav() {
  const raw = localStorage.getItem("subprocesosNavCorte");
  if (!raw) return;
  try {
    const list = JSON.parse(raw);
    list.forEach((p) => {
      if (!subprocesosCorte.value.some((x) => x.id === p.id)) {
        subprocesosCorte.value.push({ id: p.id, nombre: p.nombre, custom: true });
      }
    });
  } catch { }
}
function agregarSubprocesoCorte() {
  const nombre = (nuevoSubprocesoCorte.value || "").trim();
  if (!nombre) return;
  const id = slugify(nombre);
  if (
    subprocesosCorte.value.some(
      (p) => p.id === id || p.nombre.toLowerCase() === nombre.toLowerCase()
    )
  )
    return;
  subprocesosCorte.value.push({ id, nombre, custom: true });
  guardarSubprocesosCorteNav();
  nuevoSubprocesoCorte.value = "";
}
const activeSubprocesoId = computed(() => {
  const map = {
    Ordenes: "ordenes",
    ExtenderTela: "extender_tela",
    VistaCorte: "corte",
    Numeracion: "numeracion",
    Fusionar: "fusionar",
    Finalizar: "finalizar",
  };
  return map[vistaActiva.value] || vistaActiva.value;
});
function seleccionarSubproceso(id) {
  const map = {
    ordenes: "Ordenes",
    extender_tela: "ExtenderTela",
    corte: "VistaCorte",
    numeracion: "Numeracion",
    fusionar: "Fusionar",
    finalizar: "Finalizar",
  };
  vistaActiva.value = map[id] || "VistaCorte";
}

// Resumen de pedido/producido/pendiente
const totalPedidoCorte = computed(() =>
  ordenSeleccionada.value ? calcularTotalPedido(ordenSeleccionada.value) : 0
);
const totalCortadoCorte = computed(() =>
  ordenSeleccionada.value ? calcularUnidadesCortadas(ordenSeleccionada.value) : 0
);

// Filtros de historial y balance
const filtroFecha = ref("");
const filtroHoraInicio = ref("");
const filtroHoraFin = ref("");
const horaRangoValido = computed(() => !!(filtroHoraInicio.value && filtroHoraFin.value));
const historialTransferencias = computed(
  () => ordenSeleccionada.value?.estadoCorte?.transferenciasCorte || []
);
const historialFiltrado = computed(() => {
  let list = historialTransferencias.value;
  if (filtroFecha.value) {
    const d = new Date(filtroFecha.value).toDateString();
    list = list.filter((x) => new Date(x.fechaTransferencia).toDateString() === d);
  }
  if (horaRangoValido.value) {
    const [h1, m1] = filtroHoraInicio.value.split(":").map(Number);
    const [h2, m2] = filtroHoraFin.value.split(":").map(Number);
    const min1 = h1 * 60 + m1,
      min2 = h2 * 60 + m2;
    list = list.filter((x) => {
      const d = new Date(x.fechaTransferencia);
      const mins = d.getHours() * 60 + d.getMinutes();
      return mins >= min1 && mins <= min2;
    });
  }
  return list;
});
const msgCorte = ref("");
function generarBalance() {
  const total = historialFiltrado.value.reduce(
    (s, x) => s + (x.cantidadTransferida || 0),
    0
  );
  msgCorte.value = `Balance: ${historialFiltrado.value.length} mov. / ${total} unidades`;
  setTimeout(() => {
    msgCorte.value = "";
  }, 4000);
}

// Computed properties del store de órdenes
const ordenes = computed(() => ordenStore.ordenes);
const ordenSeleccionada = computed(() => ordenStore.ordenSeleccionada);

// Búsqueda de órdenes para visualización
const buscarOrdenId = ref("");
const mostrarListaOrdenes = ref(false);
const ordenFiltrada = ref(null);

// Computed para órdenes mostradas (filtrada o todas)
const ordenesParaMostrar = computed(() => {
  if (ordenFiltrada.value) {
    return [ordenFiltrada.value];
  }
  return ordenes.value;
});

const ordenesFiltradasBusqueda = computed(() => {
  if (!buscarOrdenId.value) {
    return [];
  }
  return ordenStore.ordenes.filter(
    (orden) =>
      orden.id.toLowerCase().includes(buscarOrdenId.value.toLowerCase()) ||
      orden.consecutivo.toLowerCase().includes(buscarOrdenId.value.toLowerCase()) ||
      (orden.referenciaPorDefecto &&
        orden.referenciaPorDefecto
          .toLowerCase()
          .includes(buscarOrdenId.value.toLowerCase()))
  );
});

// Lógica de inicialización al montar el componente
onMounted(async () => {
  await ordenStore.cargarOrdenes();

  if (ordenes.value.length === 0) {
    // Mostrar toast en lugar de alert
    toast.info("No se han encontrado órdenes registradas en el sistema", {
      position: "top-right",
      duration: 4000,
      dismissible: true,
    });

    // Opcional: redirigir después de un pequeño delay para que el usuario vea el toast
    setTimeout(() => {
      router.push({ name: "OrdenProduccion" });
    }, 2000);
  }
  console.log(ordenes.value[0]);
});

// Guardar la vista activa en localStorage cada vez que cambia
watch(vistaActiva, (val) => {
  localStorage.setItem("vistaActivaProcesoCorte", val);
});

// Función para cambiar la vista de navegación
function cambiarVista(nuevaVista) {
  vistaActiva.value = nuevaVista;
}

// Al seleccionar una orden desde la lista principal
function seleccionarOrdenDesdeLista(orden) {
  ordenStore.seleccionarOrden(orden);
  vistaActiva.value = "ExtenderTela"; // Cambia a la primera vista del proceso
}

// Ver detalle de una orden específica
function verDetalleOrden(orden) {
  ordenFiltrada.value = orden;
}

// Al seleccionar una orden desde la búsqueda (solo para visualizar)
function seleccionarOrdenDesdeBusqueda(orden) {
  ordenFiltrada.value = orden;
  buscarOrdenId.value = `${orden.consecutivo} - ${orden.referenciaPorDefecto}`;
  mostrarListaOrdenes.value = false;
}

// Función para limpiar filtro y mostrar todas las órdenes
function limpiarFiltroOrden() {
  ordenFiltrada.value = null;
  buscarOrdenId.value = "";
}

// Funciones para la barra de búsqueda
function mostrarOrdenesBusqueda() {
  mostrarListaOrdenes.value = true;
}

function ocultarOrdenesBusqueda() {
  setTimeout(() => {
    mostrarListaOrdenes.value = false;
  }, 200);
}

// Funciones para calcular progreso en tiempo real
function calcularTotalPedido(orden) {
  return Array.isArray(orden.estadoCorte?.unidadesCortadas) ? orden.total_cantidad : 0;
}

function calcularUnidadesCortadas(orden) {
  return Array.isArray(orden.estadoCorte?.unidadesCortadas)
    ? orden.estadoCorte.unidadesCortadas.reduce(
      (sum, item) => sum + (parseInt(item.total_cortadas) || 0),
      0
    )
    : 0;
}

function calcularPorcentajeCorte(orden) {
  const total = Array.isArray(orden.estadoCorte?.unidadesCortadas)
    ? orden.estadoCorte.unidadesCortadas.reduce(
      (sum, item) => sum + parseInt(item.total_cantidad || 0),
      0
    )
    : 0;
  const cortadas = calcularUnidadesCortadas(orden);
  const Orden = orden.consecutivo;
  const porcentaje = total > 0 ? ((cortadas / total) * 100).toFixed(2) : 0;
  // Cálculo mejorado con validaciones
  if (total <= 0) return 0;
  if (cortadas <= 0) return 0;
  if (cortadas > total) return 100; // Evita porcentajes > 100%
  // Redondear a 1 decimal para mejor precisión
  return Math.round(porcentaje);
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
  const total = Array.isArray(orden.estadoCorte?.unidadesNumeradas)
    ? orden.estadoCorte.unidadesNumeradas.reduce(
      (sum, item) => sum + parseInt(item.total_cantidad || 0),
      0
    )
    : 0;
  const cortadas = calcularUnidadesNumeradas(orden);
  const Orden = orden.consecutivo;
  const porcentaje = total > 0 ? ((cortadas / total) * 100).toFixed(2) : 0;
  // Cálculo mejorado con validaciones
  if (total <= 0) return 0;
  if (cortadas <= 0) return 0;
  if (cortadas > total) return 100; // Evita porcentajes > 100%
  // Redondear a 1 decimal para mejor precisión
  return Math.round(porcentaje);
}

function calcularunidadesFusionadas(orden) {
  return (
    orden.estadoCorte?.unidadesFusionadas?.reduce(
      (sum, item) => sum + (parseInt(item.total_fusionadas) || 0),
      0
    ) || 0
  );
}

function calcularPorcentajeFusion(orden) {
  const unidadesFusionConAplicacion =
    orden.estadoCorte?.unidadesFusionadas?.filter((item) => item.aplica) || [];
  const totalPedidoFusion =
    unidadesFusionConAplicacion.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const fusionadas = calcularunidadesFusionadas(orden);
  return totalPedidoFusion > 0 ? (fusionadas / totalPedidoFusion) * 100 : 0;
}

// Función para actualizar aplicabilidad de procesos
function actualizarAplicabilidad(ordenId, campo, aplica) {
  const orden = ordenStore.ordenes.find((o) => o.id === ordenId);
  if (orden) {
    ordenStore.actualizarEstadoCorte(ordenId, {
      ...orden.estadoCorte,
      [campo]: aplica,
    });
    console.log(`📝 Aplicabilidad ${campo} actualizada para orden ${ordenId}: ${aplica}`);
  }
}

// Función para cerrar sesión
function logout() {
  localStorage.clear();
  router.push("/login");
}
</script>

<style scoped>
/* Los estilos principales están definidos en global-styles.css y main.css */
/* Solo mantenemos ajustes específicos para este componente */

.proceso-corte-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

/* Ajustes específicos para el contenido wrapper */
.content-wrapper {
  flex-grow: 1;
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: var(--spacing-lg) auto;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
}

/* Progreso del corte específico */
.progreso-corte {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--bg-soft);
  border-radius: var(--border-radius);
  border-left: 4px solid var(--primary-blue);
}

.progreso-corte h3 {
  color: var(--primary-blue-dark);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

.estado-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.estado-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.estado-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

/* Placeholder para vistas en desarrollo */
.proceso-placeholder {
  text-align: center;
  padding: var(--spacing-xxl);
  background-color: var(--bg-soft);
  border-radius: var(--border-radius);
  border: 2px dashed var(--border-color);
}

.proceso-placeholder p {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-md);
}

.proceso-placeholder p:first-child {
  font-weight: 600;
  color: var(--primary-blue);
  font-size: var(--font-size-xl);
}

/* Estilos para mini barras de progreso en tiempo real */
.mini-progreso {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

.barra-mini {
  flex: 1;
  height: 4px;
  background-color: var(--primary-blue);
  border-radius: 2px;
  transition: width 0.3s ease-in-out;
  position: relative;
}

.barra-mini::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--gray-300);
  border-radius: 2px;
  z-index: -1;
}

.porcentaje-mini {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 35px;
}

/* Sobreescrituras específicas que no están en global */
.search-input:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.item-orden-busqueda:last-child {
  border-bottom: none;
}

.orden-item {
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.orden-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.orden-item h2 {
  border-bottom: 2px solid var(--primary-blue);
  padding-bottom: var(--spacing-sm);
}

/* Estilos para filtro activo */
.filtro-activo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-md);
}

.texto-filtro {
  font-weight: 600;
  color: var(--info-text);
}

.btn-limpiar-filtro {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.btn-limpiar-filtro:hover {
  background-color: var(--primary-blue-dark);
  transform: translateY(-1px);
}

/* Estilos para botones de orden */
.botones-orden {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.btn-ver-detalle {
  background-color: var(--gray-600);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-ver-detalle:hover {
  background-color: var(--gray-700);
  transform: translateY(-1px);
}

.btn-seleccionar:hover,
.btn-go-to-orders:hover {
  transform: translateY(-1px);
}

/* Estilos para las casillas de aplicabilidad */
.estado-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.aplica-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  cursor: pointer;
}

.aplica-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-blue);
  cursor: pointer;
}

.checkbox-label {
  font-weight: 500;
  user-select: none;
}

.badge-disabled {
  background-color: var(--gray-400) !important;
  color: var(--gray-700) !important;
  font-weight: 500;
}

/* Estilos específicos para los botones de seguimiento */
.navbar .seguimiento-corte-button {
  background-color: var(--primary-blue) !important;
  color: white !important;
  font-weight: 600;
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
}

.navbar .seguimiento-corte-button:hover {
  background-color: var(--primary-blue-dark) !important;
  transform: scale(1.05);
}

.navbar .seguimiento-corte-button.active {
  background-color: var(--primary-blue-dark) !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.navbar .avance-button {
  background-color: var(--info) !important;
  color: white !important;
  font-weight: 600;
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
}

.navbar .avance-button:hover {
  background-color: var(--info-dark) !important;
  transform: scale(1.05);
}

.navbar .avance-button.active {
  background-color: var(--info-dark) !important;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

.corte-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.resumen-orden-corte {
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
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

.nav-subprocesos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-sm);
}

.btn-subproceso {
  flex: 1 1 calc(25% - var(--spacing-xs));
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-subproceso:hover {
  background: var(--primary-blue-bg);
}

.btn-subproceso.active {
  background: var(--primary-blue);
  color: #fff;
}

@media (max-width: 1024px) {
  .btn-subproceso {
    flex: 1 1 calc(33.333% - var(--spacing-xs));
  }
}

@media (max-width: 768px) {
  .btn-subproceso {
    flex: 1 1 calc(50% - var(--spacing-xs));
  }
}

@media (max-width: 480px) {
  .btn-subproceso {
    flex: 1 1 100%;
  }
}

.subproceso-add-bar {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-top: var(--spacing-sm);
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
  background: var(--primary-blue);
  color: #fff;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 700;
  cursor: pointer;
}

.historial-corte {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
}

.filtros-tiempo {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: end;
  margin-bottom: var(--spacing-md);
}

.campo-tiempo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.btn.balance {
  background: var(--success);
  color: #fff;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 700;
}

.lista-historial {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 280px;
  overflow-y: auto;
}

.item-historial {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  align-items: center;
}

.item-historial .flecha {
  color: var(--primary-blue);
  font-weight: 700;
}

.item-historial .cantidad {
  font-weight: 700;
  color: var(--success);
}

.item-historial .fecha {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.mensaje.success {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
  border-radius: var(--border-radius);
  font-weight: 600;
}
</style>
