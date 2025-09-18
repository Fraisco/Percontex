<template>
  <div class="subprocesos-planta-view">
    <h1 class="titulo-principal">🏭 Subprocesos de Planta</h1>

    <!-- Selector de orden con visualización de datos -->
    <div class="selector-orden-completo">
      <div class="selector-orden">
        <label for="ordenSeleccionada" class="label-selector">Seleccionar Orden:</label>
        <select id="ordenSeleccionada" v-model="ordenSeleccionadaId" @change="cambiarOrden" class="select-orden">
          <option value="">Seleccione una orden</option>
          <option v-for="orden in ordenes" :key="orden.id" :value="orden.id">
            {{ orden.consecutivo }} - {{ orden.referencia_por_defecto }}
          </option>
        </select>
      </div>

      <!-- Visualización de datos de Orden de Producción -->
      <div v-if="ordenSeleccionada" class="datos-orden-produccion">
        <div class="orden-imagen">
          <div class="imagen-placeholder">
            <div v-if="ordenSeleccionada.imagenDiseno" class="imagen-orden">
              <img :src="ordenSeleccionada.imagenDiseno" :alt="`Orden ${ordenSeleccionada.consecutivo}`" />
            </div>
            <div v-else class="sin-imagen">📷 Sin imagen</div>
          </div>
        </div>

        <div class="orden-detalles-completos">
          <h2>
            {{ ordenSeleccionada.consecutivo }} -
            {{ ordenSeleccionada.referenciaPorDefecto }}
          </h2>
          <div class="detalles-grid">
            <div class="detalle-item">
              <span class="detalle-label">Código:</span>
              <span class="detalle-valor">{{ ordenSeleccionada.consecutivo }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Tipo de Tela:</span>
              <span class="detalle-valor">{{ obtenerTipoTela(ordenSeleccionada) }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Color:</span>
              <span class="detalle-valor">{{
                obtenerColoresOrden(ordenSeleccionada)
                }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Cliente:</span>
              <span class="detalle-valor">{{
                ordenSeleccionada.proveedor || "No especificado"
                }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Fecha de Creación:</span>
              <span class="detalle-valor">{{
                formatearFecha(ordenSeleccionada.fecha)
                }}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Total Unidades:</span>
              <span class="detalle-valor total-unidades">{{
                calcularTotalPedido()
                }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navegación de subprocesos -->
    <div v-if="ordenSeleccionada" class="navegacion-subprocesos">
      <div class="tabs-subprocesos">
        <button v-for="subproceso in subprocesos" :key="subproceso.id" @click="cambiarSubprocesoActivo(subproceso.id)"
          :class="{ active: subprocesoActivo === subproceso.id }" class="tab-subproceso">
          {{ subproceso.nombre }}
          <span class="tab-badge" :class="getStatusBadgeClass(subproceso.id)">
            {{ getStatusBadgeText(subproceso.id) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Vista de subproceso individual -->
    <div v-if="ordenSeleccionada && subprocesoActivo" class="vista-subproceso-individual">
      <!-- Filtros por estado -->
      <div class="filtros-estado">
        <h3>🔍 Filtro por Estado de Registros</h3>
        <div class="filtros-botones">
          <button @click="cambiarFiltroEstado('todos')" :class="{ active: filtroEstado === 'todos' }"
            class="btn-filtro">
            Todos
          </button>
          <button @click="cambiarFiltroEstado('finalizado')" :class="{ active: filtroEstado === 'finalizado' }"
            class="btn-filtro btn-finalizado">
            Finalizado
          </button>
          <button @click="cambiarFiltroEstado('pendiente')" :class="{ active: filtroEstado === 'pendiente' }"
            class="btn-filtro btn-pendiente">
            Pendiente
          </button>
          <button @click="cambiarFiltroEstado('no_iniciado')" :class="{ active: filtroEstado === 'no_iniciado' }"
            class="btn-filtro btn-no-iniciado">
            No Iniciado
          </button>
        </div>
      </div>

      <!-- Tabla Excel-like del subproceso actual -->
      <div class="tabla-subproceso-excel">
        <h3>{{ obtenerNombreSubproceso(subprocesoActivo) }}</h3>

        <div class="tabla-container">
          <table class="tabla-excel">
            <thead>
              <tr>
                <th>Fecha/Hora del Movimiento</th>
                <th>Cantidad Terminada</th>
                <th>Cantidad Enviada</th>
                <th>Subproceso Destino</th>
                <th>Hora de Envío</th>
                <th>Subproceso Origen</th>
                <th>Estado</th>
                <th>Aplica / No Aplica</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(registro, index) in registrosFiltrados" :key="index" :class="getRegistroRowClass(registro)">
                <!-- Fecha/Hora del movimiento (automática) -->
                <td class="celda-fecha">
                  {{ formatearFechaHora(registro.fechaMovimiento) }}
                </td>

                <!-- Cantidad terminada -->
                <td class="celda-cantidad">
                  <div v-if="registro.editando && registro.campo === 'cantidadTerminada'" class="celda-edicion">
                    <input type="number" v-model.number="registro.cantidadTerminadaEdit"
                      @blur="guardarCampo(registro, 'cantidadTerminada')"
                      @keyup.enter="guardarCampo(registro, 'cantidadTerminada')" @keyup.esc="cancelarEdicion(registro)"
                      class="input-edicion" min="0" :max="calcularMaximoCantidad(registro)" />
                  </div>
                  <div v-else @click="iniciarEdicion(registro, 'cantidadTerminada')" class="celda-editable">
                    {{ registro.cantidadTerminada || 0 }}
                  </div>
                </td>

                <!-- Cantidad enviada -->
                <td class="celda-cantidad">
                  <div v-if="registro.editando && registro.campo === 'cantidadEnviada'" class="celda-edicion">
                    <input type="number" v-model.number="registro.cantidadEnviadaEdit"
                      @blur="guardarCampo(registro, 'cantidadEnviada')"
                      @keyup.enter="guardarCampo(registro, 'cantidadEnviada')" @keyup.esc="cancelarEdicion(registro)"
                      class="input-edicion" min="0" :max="registro.cantidadTerminada" />
                  </div>
                  <div v-else @click="iniciarEdicion(registro, 'cantidadEnviada')" class="celda-editable">
                    {{ registro.cantidadEnviada || 0 }}
                  </div>
                </td>

                <!-- Subproceso destino -->
                <td class="celda-subproceso">
                  <div v-if="registro.editando && registro.campo === 'subprocesoDestino'" class="celda-edicion">
                    <select v-model="registro.subprocesoDestinoEdit" @blur="guardarCampo(registro, 'subprocesoDestino')"
                      @change="guardarCampo(registro, 'subprocesoDestino')" class="select-edicion">
                      <option value="">Seleccionar destino</option>
                      <option v-for="subproceso in subprocesosDestino" :key="subproceso.id" :value="subproceso.id"
                        :disabled="subproceso.id === subprocesoActivo">
                        {{ subproceso.nombre }}
                      </option>
                    </select>
                  </div>
                  <div v-else @click="iniciarEdicion(registro, 'subprocesoDestino')" class="celda-editable">
                    {{ obtenerNombreSubproceso(registro.subprocesoDestino) || "-" }}
                  </div>
                </td>

                <!-- Hora de envío (automática) -->
                <td class="celda-fecha">
                  {{ registro.horaEnvio ? formatearFechaHora(registro.horaEnvio) : "-" }}
                </td>

                <!-- Subproceso origen -->
                <td class="celda-subproceso">
                  {{ obtenerNombreSubproceso(registro.subprocesoOrigen) || "-" }}
                </td>

                <!-- Estado -->
                <td class="celda-estado">
                  <span class="badge-estado" :class="getEstadoBadgeClass(registro.estado)">
                    {{ getEstadoTexto(registro.estado) }}
                  </span>
                </td>

                <!-- Aplica / No aplica -->
                <td class="celda-aplica">
                  <label class="toggle-aplica">
                    <input type="checkbox" v-model="registro.aplica" @change="actualizarAplicabilidad(registro)" />
                    <span class="toggle-text">{{
                      registro.aplica ? "Aplica" : "No Aplica"
                      }}</span>
                  </label>
                </td>

                <!-- Acciones -->
                <td class="celda-acciones">
                  <div class="botones-accion">
                    <button @click="guardarRegistro(registro)" :disabled="!registro.modificado" class="btn-guardar"
                      title="Guardar">
                      💾
                    </button>
                    <button @click="editarRegistro(registro)" class="btn-editar" title="Editar">
                      ✏️
                    </button>
                    <button @click="cancelarCambios(registro)" :disabled="!registro.modificado" class="btn-cancelar"
                      title="Cancelar">
                      ❌
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Fila para agregar nuevo registro -->
              <tr class="fila-nuevo-registro">
                <td colspan="9">
                  <button @click="agregarNuevoRegistro" class="btn-agregar-registro">
                    ➕ Agregar Nuevo Registro
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Movimiento entre subprocesos -->
      <div class="movimiento-subprocesos">
        <h3>🔄 Movimiento entre Subprocesos</h3>
        <div class="formulario-movimiento">
          <div class="campo-movimiento">
            <label>Cantidad a Enviar:</label>
            <input type="number" v-model.number="nuevoMovimiento.cantidad" min="1" :max="calcularDisponibleParaEnviar()"
              class="input-movimiento" placeholder="Ingrese cantidad" />
          </div>

          <div class="campo-movimiento">
            <label>Subproceso Destino:</label>
            <select v-model="nuevoMovimiento.subprocesoDestino" class="select-movimiento">
              <option value="">Seleccionar proceso destino</option>
              <option v-for="subproceso in subprocesosDestino" :key="subproceso.id" :value="subproceso.id"
                :disabled="subproceso.id === subprocesoActivo">
                {{ subproceso.nombre }}
              </option>
            </select>
          </div>

          <div class="botones-movimiento">
            <button @click="enviarUnidades" :disabled="!puedeEnviar()" class="btn-enviar">
              📤 Enviar / Guardar
            </button>
            <button @click="limpiarFormularioMovimiento" class="btn-limpiar">
              🧹 Limpiar
            </button>
          </div>
        </div>

        <!-- Validaciones y mensajes -->
        <div v-if="mensajeValidacion" class="mensaje-validacion" :class="tipoMensaje">
          {{ mensajeValidacion }}
        </div>
      </div>

      <!-- Historial de movimientos en tiempo real -->
      <div class="historial-movimientos">
        <h3>📊 Historial de Movimientos en Tiempo Real</h3>
        <div class="filtros-tiempo">
          <div class="campo-tiempo">
            <label>Fecha:</label>
            <input type="date" v-model="filtroFecha" class="input-tiempo" />
          </div>
          <div class="campo-tiempo">
            <label>Hora inicio:</label>
            <input type="time" v-model="filtroHoraInicio" class="input-tiempo" />
          </div>
          <div class="campo-tiempo">
            <label>Hora fin:</label>
            <input type="time" v-model="filtroHoraFin" class="input-tiempo" />
          </div>
          <button class="btn-generar-balance" :disabled="!horaFiltroAplicado" @click="generarBalance">
            ⚖️ Generar Balance
          </button>
        </div>
        <div class="movimientos-lista">
          <div v-for="(movimiento, index) in historialFiltrado" :key="index" class="movimiento-item"
            :class="getMovimientoItemClass(movimiento)">
            <div class="movimiento-info">
              <span class="movimiento-origen">{{
                obtenerNombreSubproceso(movimiento.origen)
                }}</span>
              <span class="movimiento-flecha">→</span>
              <span class="movimiento-destino">{{
                obtenerNombreSubproceso(movimiento.destino)
                }}</span>
            </div>
            <div class="movimiento-cantidad">{{ movimiento.cantidad }} unidades</div>
            <div class="movimiento-fecha">{{ formatearFechaHora(movimiento.fecha) }}</div>
            <div class="movimiento-estado">
              <span class="badge-estado" :class="getEstadoBadgeClass(movimiento.estado)">
                {{ getEstadoTexto(movimiento.estado) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje cuando no hay orden seleccionada -->
    <div v-else class="sin-orden">
      <div class="mensaje-sin-orden">
        <h3>📋 Selecciona una orden para gestionar subprocesos</h3>
        <p>
          Elige una orden de producción del selector para acceder a la gestión completa de
          subprocesos de planta.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch, nextTick } from "vue";
import { useOrdenStore } from "../stores/ordenStore";
import { usePlantaRealtimeUpdates } from "../composables/useRealtimeUpdates";

const ordenStore = useOrdenStore();
const plantaUpdates = usePlantaRealtimeUpdates("subprocesos");

// Estados reactivos
const ordenSeleccionadaId = ref("");
const subprocesoActivo = ref("");
const filtroEstado = ref("todos");
const mensajeValidacion = ref("");
const tipoMensaje = ref("");

// Subprocesos específicos de planta (15 subprocesos según requerimiento)
const subprocesos = ref([
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

// Estados de registros por subproceso
const registrosPorSubproceso = reactive(new Map());
const historialMovimientos = ref([]);

// Filtros de tiempo para historial
const filtroFecha = ref("");
const filtroHoraInicio = ref("");
const filtroHoraFin = ref("");

const horaFiltroAplicado = computed(
  () => !!(filtroHoraInicio.value && filtroHoraFin.value)
);

const historialFiltrado = computed(() => {
  let lista = historialMovimientos.value;
  if (filtroFecha.value) {
    lista = lista.filter(
      (m) =>
        new Date(m.fecha).toDateString() === new Date(filtroFecha.value).toDateString()
    );
  }
  if (horaFiltroAplicado.value) {
    const [hIni, mIni] = filtroHoraInicio.value.split(":").map(Number);
    const [hFin, mFin] = filtroHoraFin.value.split(":").map(Number);
    const iniMin = hIni * 60 + mIni;
    const finMin = hFin * 60 + mFin;
    lista = lista.filter((m) => {
      const d = new Date(m.fecha);
      const mins = d.getHours() * 60 + d.getMinutes();
      return mins >= iniMin && mins <= finMin;
    });
  }
  return lista;
});

function generarBalance() {
  const totalUnidades = historialFiltrado.value.reduce(
    (sum, m) => sum + (m.cantidad || 0),
    0
  );
  mostrarMensaje(
    `Balance generado para el rango seleccionado: ${historialFiltrado.value.length} movimientos, ${totalUnidades} unidades`,
    "success"
  );
}

// Formulario de nuevo movimiento
const nuevoMovimiento = reactive({
  cantidad: 0,
  subprocesoDestino: "",
});

// Computed properties
const ordenes = computed(() => ordenStore.ordenes);
const ordenSeleccionada = computed(() =>
  ordenes.value.find((orden) => orden.id === ordenSeleccionadaId.value)
);

const subprocesosDestino = computed(() =>
  subprocesos.value.filter((s) => s.id !== subprocesoActivo.value)
);

const registrosSubprocesoActual = computed(() => {
  if (!ordenSeleccionada.value || !subprocesoActivo.value) return [];

  const key = `${ordenSeleccionada.value.id}_${subprocesoActivo.value}`;
  return registrosPorSubproceso.get(key) || [];
});

const registrosFiltrados = computed(() => {
  if (filtroEstado.value === "todos") return registrosSubprocesoActual.value;

  return registrosSubprocesoActual.value.filter((registro) => {
    switch (filtroEstado.value) {
      case "finalizado":
        return registro.estado === "finalizado";
      case "pendiente":
        return registro.estado === "pendiente";
      case "no_iniciado":
        return registro.estado === "no_iniciado";
      default:
        return true;
    }
  });
});

// Funciones de inicialización
function inicializarRegistros(ordenId, subprocesoId) {
  const key = `${ordenId}_${subprocesoId}`;

  if (!registrosPorSubproceso.has(key)) {
    const registrosIniciales = crearRegistrosIniciales(ordenId, subprocesoId);
    registrosPorSubproceso.set(key, reactive(registrosIniciales));
  }
}

function crearRegistrosIniciales(ordenId, subprocesoId) {
  const orden = ordenes.value.find((o) => o.id === ordenId);
  if (!orden) return [];

  const registros = [];

  // Crear un registro por cada detalle de la orden (color/talla)
  orden.detalles?.forEach((detalle, index) => {
    const cantidadTotal = Object.values(detalle.tallas).reduce(
      (sum, qty) => sum + (qty || 0),
      0
    );

    if (cantidadTotal > 0) {
      registros.push(
        reactive({
          id: `${subprocesoId}_${index}_${Date.now()}`,
          fechaMovimiento: new Date().toISOString(),
          cantidadTerminada: 0,
          cantidadEnviada: 0,
          subprocesoDestino: "",
          horaEnvio: null,
          subprocesoOrigen: "",
          estado: "no_iniciado",
          aplica: true,
          color: detalle.color,
          cantidadTotal: cantidadTotal,
          modificado: false,
          editando: false,
          campo: null,
          // Campos de edición temporal
          cantidadTerminadaEdit: 0,
          cantidadEnviadaEdit: 0,
          subprocesoDestinoEdit: "",
        })
      );
    }
  });

  return registros;
}

// Funciones de cálculo
function calcularTotalPedido() {
  if (!ordenSeleccionada.value || !ordenSeleccionada.value.detalles) return 0;
  return ordenSeleccionada.value.detalles.reduce(
    (sum, detalle) =>
      sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0),
    0
  );
}

function calcularDisponibleParaEnviar() {
  const registros = registrosSubprocesoActual.value;
  const totalTerminado = registros.reduce(
    (sum, r) => sum + (r.cantidadTerminada || 0),
    0
  );
  const totalEnviado = registros.reduce((sum, r) => sum + (r.cantidadEnviada || 0), 0);
  return Math.max(0, totalTerminado - totalEnviado);
}

function calcularMaximoCantidad(registro) {
  return registro.cantidadTotal || 0;
}

// Funciones de estado y clase
function getStatusBadgeClass(subprocesoId) {
  const registros =
    registrosPorSubproceso.get(`${ordenSeleccionada.value?.id}_${subprocesoId}`) || [];
  const totalRegistros = registros.length;
  const finalizados = registros.filter((r) => r.estado === "finalizado").length;

  if (finalizados === totalRegistros && totalRegistros > 0) return "badge-finalizado";
  if (finalizados > 0) return "badge-en-proceso";
  return "badge-pendiente";
}

function getStatusBadgeText(subprocesoId) {
  const registros =
    registrosPorSubproceso.get(`${ordenSeleccionada.value?.id}_${subprocesoId}`) || [];
  const totalRegistros = registros.length;
  const finalizados = registros.filter((r) => r.estado === "finalizado").length;

  if (totalRegistros === 0) return "0";
  return `${finalizados}/${totalRegistros}`;
}

function getRegistroRowClass(registro) {
  return {
    "registro-finalizado": registro.estado === "finalizado",
    "registro-pendiente": registro.estado === "pendiente",
    "registro-no-iniciado": registro.estado === "no_iniciado",
    "registro-no-aplica": !registro.aplica,
    "registro-modificado": registro.modificado,
  };
}

function getEstadoBadgeClass(estado) {
  switch (estado) {
    case "finalizado":
      return "badge-estado-finalizado";
    case "pendiente":
      return "badge-estado-pendiente";
    case "no_iniciado":
      return "badge-estado-no-iniciado";
    default:
      return "";
  }
}

function getEstadoTexto(estado) {
  switch (estado) {
    case "finalizado":
      return "Finalizado";
    case "pendiente":
      return "Pendiente";
    case "no_iniciado":
      return "No Iniciado";
    default:
      return "Desconocido";
  }
}

function getMovimientoItemClass(movimiento) {
  return {
    "movimiento-reciente": isMovimientoReciente(movimiento.fecha),
    "movimiento-finalizado": movimiento.estado === "finalizado",
  };
}

function isMovimientoReciente(fecha) {
  const ahora = new Date();
  const fechaMovimiento = new Date(fecha);
  return ahora - fechaMovimiento < 60000; // Últimos 60 segundos
}

// Funciones de utilidad
function obtenerNombreSubproceso(subprocesoId) {
  const subproceso = subprocesos.value.find((s) => s.id === subprocesoId);
  return subproceso ? subproceso.nombre : "";
}

function obtenerTipoTela(orden) {
  // Inferir tipo de tela desde referencia o datos
  return orden.referencia_por_defecto || "No especificado";
}

function obtenerColoresOrden(orden) {
  if (!orden.detalles) return "No especificado";
  const colores = orden.detalles.map((d) => d.color).filter(Boolean);
  return colores.length > 0 ? colores.join(", ") : "No especificado";
}

function formatearFecha(fechaString) {
  if (!fechaString) return "";
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString("es-ES");
}

function formatearFechaHora(fechaString) {
  if (!fechaString) return "";
  const fecha = new Date(fechaString);
  return fecha.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Funciones de edición
function iniciarEdicion(registro, campo) {
  // Cancelar cualquier edición activa
  cancelarTodasLasEdiciones();

  registro.editando = true;
  registro.campo = campo;

  // Inicializar valores de edición
  switch (campo) {
    case "cantidadTerminada":
      registro.cantidadTerminadaEdit = registro.cantidadTerminada;
      break;
    case "cantidadEnviada":
      registro.cantidadEnviadaEdit = registro.cantidadEnviada;
      break;
    case "subprocesoDestino":
      registro.subprocesoDestinoEdit = registro.subprocesoDestino;
      break;
  }

  nextTick(() => {
    const input = document.querySelector(".input-edicion, .select-edicion");
    if (input) input.focus();
  });
}

function guardarCampo(registro, campo) {
  let valor, valorAnterior;

  switch (campo) {
    case "cantidadTerminada":
      valor = registro.cantidadTerminadaEdit;
      valorAnterior = registro.cantidadTerminada;

      if (valor < 0 || valor > registro.cantidadTotal) {
        mostrarMensaje(
          "La cantidad terminada no puede ser negativa ni exceder el total",
          "error"
        );
        cancelarEdicion(registro);
        return;
      }

      registro.cantidadTerminada = valor;
      break;

    case "cantidadEnviada":
      valor = registro.cantidadEnviadaEdit;
      valorAnterior = registro.cantidadEnviada;

      if (valor < 0 || valor > registro.cantidadTerminada) {
        mostrarMensaje(
          "La cantidad enviada no puede exceder la cantidad terminada",
          "error"
        );
        cancelarEdicion(registro);
        return;
      }

      registro.cantidadEnviada = valor;
      // Si se envía, registrar fecha/hora automáticamente
      if (valor > 0 && !registro.horaEnvio) {
        registro.horaEnvio = new Date().toISOString();
      }
      break;

    case "subprocesoDestino":
      valor = registro.subprocesoDestinoEdit;
      valorAnterior = registro.subprocesoDestino;
      registro.subprocesoDestino = valor;
      break;
  }

  // Marcar como modificado si hay cambios
  if (valor !== valorAnterior) {
    registro.modificado = true;
    actualizarEstadoRegistro(registro);
  }

  cancelarEdicion(registro);
}

function cancelarEdicion(registro) {
  registro.editando = false;
  registro.campo = null;
}

function cancelarTodasLasEdiciones() {
  registrosSubprocesoActual.value.forEach((registro) => {
    registro.editando = false;
    registro.campo = null;
  });
}

function actualizarEstadoRegistro(registro) {
  // Actualizar fecha de movimiento
  registro.fechaMovimiento = new Date().toISOString();

  // Determinar estado
  if (
    registro.cantidadTerminada === registro.cantidadTotal &&
    registro.cantidadEnviada === registro.cantidadTerminada
  ) {
    registro.estado = "finalizado";
  } else if (registro.cantidadTerminada > 0 || registro.cantidadEnviada > 0) {
    registro.estado = "pendiente";
  } else {
    registro.estado = "no_iniciado";
  }
}

// Funciones de gestión de registros
function agregarNuevoRegistro() {
  if (!ordenSeleccionada.value || !subprocesoActivo.value) return;

  const nuevoRegistro = reactive({
    id: `${subprocesoActivo.value}_${Date.now()}`,
    fechaMovimiento: new Date().toISOString(),
    cantidadTerminada: 0,
    cantidadEnviada: 0,
    subprocesoDestino: "",
    horaEnvio: null,
    subprocesoOrigen: "",
    estado: "no_iniciado",
    aplica: true,
    color: "#000000",
    cantidadTotal: calcularTotalPedido(),
    modificado: false,
    editando: false,
    campo: null,
    cantidadTerminadaEdit: 0,
    cantidadEnviadaEdit: 0,
    subprocesoDestinoEdit: "",
  });

  const key = `${ordenSeleccionada.value.id}_${subprocesoActivo.value}`;
  const registros = registrosPorSubproceso.get(key) || [];
  registros.push(nuevoRegistro);
  registrosPorSubproceso.set(key, registros);
}

function guardarRegistro(registro) {
  if (!registro.modificado) return;

  // Validaciones finales
  if (registro.cantidadEnviada > registro.cantidadTerminada) {
    mostrarMensaje("La cantidad enviada no puede exceder la cantidad terminada", "error");
    return;
  }

  // Simular guardado
  registro.modificado = false;
  mostrarMensaje("Registro guardado exitosamente", "success");

  // Emitir evento para tiempo real
  emitirEventoActualizacion("registro_guardado", {
    subproceso: subprocesoActivo.value,
    registro: registro,
  });
}

function editarRegistro(registro) {
  // Entrar en modo de edición para todo el registro
  cancelarTodasLasEdiciones();
  // Implementar lógica de edición completa si es necesario
}

function cancelarCambios(registro) {
  // Restaurar valores originales (implementar según sea necesario)
  registro.modificado = false;
  cancelarEdicion(registro);
}

function actualizarAplicabilidad(registro) {
  registro.modificado = true;
  actualizarEstadoRegistro(registro);
}

// Funciones de movimiento entre subprocesos
function puedeEnviar() {
  return (
    nuevoMovimiento.cantidad > 0 &&
    nuevoMovimiento.subprocesoDestino &&
    nuevoMovimiento.cantidad <= calcularDisponibleParaEnviar()
  );
}

function enviarUnidades() {
  if (!puedeEnviar()) {
    mostrarMensaje("Verifique la cantidad y el subproceso destino", "error");
    return;
  }

  // Validar que la cantidad no exceda la disponible
  if (nuevoMovimiento.cantidad > calcularDisponibleParaEnviar()) {
    mostrarMensaje(
      `La cantidad excede la disponible. Máximo: ${calcularDisponibleParaEnviar()}`,
      "error"
    );
    return;
  }

  // Crear registro de movimiento
  const movimiento = {
    origen: subprocesoActivo.value,
    destino: nuevoMovimiento.subprocesoDestino,
    cantidad: nuevoMovimiento.cantidad,
    fecha: new Date().toISOString(),
    estado: "finalizado",
  };

  // Agregar al historial
  historialMovimientos.value.unshift(movimiento);

  // Actualizar registro en el subproceso destino
  actualizarSubprocesoDestino(movimiento);

  // Limpiar formulario
  limpiarFormularioMovimiento();

  mostrarMensaje(
    `${movimiento.cantidad} unidades enviadas a ${obtenerNombreSubproceso(
      movimiento.destino
    )}`,
    "success"
  );

  // Emitir evento para tiempo real
  emitirEventoActualizacion("movimiento_realizado", movimiento);
}

function actualizarSubprocesoDestino(movimiento) {
  // Inicializar registros del subproceso destino si no existen
  inicializarRegistros(ordenSeleccionada.value.id, movimiento.destino);

  const keyDestino = `${ordenSeleccionada.value.id}_${movimiento.destino}`;
  const registrosDestino = registrosPorSubproceso.get(keyDestino) || [];

  // Crear o actualizar registro en destino
  const registroDestino = reactive({
    id: `${movimiento.destino}_recibido_${Date.now()}`,
    fechaMovimiento: movimiento.fecha,
    cantidadTerminada: movimiento.cantidad,
    cantidadEnviada: 0,
    subprocesoDestino: "",
    horaEnvio: null,
    subprocesoOrigen: movimiento.origen,
    estado: "pendiente",
    aplica: true,
    color: "#000000",
    cantidadTotal: movimiento.cantidad,
    modificado: false,
    editando: false,
    campo: null,
    cantidadTerminadaEdit: 0,
    cantidadEnviadaEdit: 0,
    subprocesoDestinoEdit: "",
  });

  registrosDestino.push(registroDestino);
  registrosPorSubproceso.set(keyDestino, registrosDestino);
}

function limpiarFormularioMovimiento() {
  nuevoMovimiento.cantidad = 0;
  nuevoMovimiento.subprocesoDestino = "";
}

// Funciones de navegación
function cambiarOrden() {
  if (!ordenSeleccionadaId.value) {
    subprocesoActivo.value = "";
    return;
  }

  // Inicializar todos los subprocesos para la orden
  subprocesos.value.forEach((subproceso) => {
    inicializarRegistros(ordenSeleccionadaId.value, subproceso.id);
  });

  // Seleccionar primer subproceso por defecto
  if (subprocesos.value.length > 0) {
    subprocesoActivo.value = subprocesos.value[0].id;
  }

  // Cargar historial de movimientos
  cargarHistorialMovimientos();
}

function cambiarSubprocesoActivo(subprocesoId) {
  subprocesoActivo.value = subprocesoId;
  filtroEstado.value = "todos";
  limpiarFormularioMovimiento();
  cancelarTodasLasEdiciones();
}

function cambiarFiltroEstado(nuevoFiltro) {
  filtroEstado.value = nuevoFiltro;
}

// Funciones de mensajería
function mostrarMensaje(mensaje, tipo = "info") {
  mensajeValidacion.value = mensaje;
  tipoMensaje.value = tipo;

  setTimeout(() => {
    mensajeValidacion.value = "";
  }, 5000);
}

// Funciones de eventos en tiempo real
function emitirEventoActualizacion(tipo, datos) {
  window.dispatchEvent(
    new CustomEvent("subprocesoActualizado", {
      detail: {
        tipo,
        datos,
        timestamp: new Date(),
        orden: ordenSeleccionada.value?.id,
        subproceso: subprocesoActivo.value,
      },
    })
  );
}

function cargarHistorialMovimientos() {
  // Cargar historial desde localStorage o API
  const key = `historial_movimientos_${ordenSeleccionada.value?.id}`;
  const historialGuardado = localStorage.getItem(key);

  if (historialGuardado) {
    try {
      historialMovimientos.value = JSON.parse(historialGuardado);
    } catch (e) {
      console.error("Error al cargar historial:", e);
      historialMovimientos.value = [];
    }
  } else {
    historialMovimientos.value = [];
  }
}

function guardarHistorialMovimientos() {
  if (!ordenSeleccionada.value) return;

  const key = `historial_movimientos_${ordenSeleccionada.value.id}`;
  localStorage.setItem(key, JSON.stringify(historialMovimientos.value));
}

// Watchers
watch(
  () => historialMovimientos.value,
  () => {
    guardarHistorialMovimientos();
  },
  { deep: true }
);

watch(
  () => ordenSeleccionadaId.value,
  () => {
    if (ordenSeleccionadaId.value) {
      cambiarOrden();
    }
  }
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

  // Configurar listeners para eventos en tiempo real
  window.addEventListener("subprocesoActualizado", (event) => {
    console.log("Evento de subproceso recibido:", event.detail);
    // Manejar actualizaciones en tiempo real de otros componentes
  });
});
</script>

<style scoped>
.subprocesos-planta-view {
  padding: var(--spacing-lg);
  max-width: 1600px;
  margin: 0 auto;
  background-color: var(--bg-primary);
  min-height: 100vh;
}

.titulo-principal {
  text-align: center;
  color: var(--primary-blue-dark);
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-xl);
  font-weight: 700;
}

/* Selector de orden con datos */
.selector-orden-completo {
  background: linear-gradient(135deg, var(--primary-blue-bg), var(--bg-secondary));
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--primary-blue);
}

.selector-orden {
  margin-bottom: var(--spacing-lg);
}

.label-selector {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-lg);
}

.select-orden {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.select-orden:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Datos de orden de producción */
.datos-orden-produccion {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--spacing-lg);
  align-items: start;
}

.orden-imagen {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 2px dashed var(--border-color);
  padding: var(--spacing-md);
}

.imagen-placeholder {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.imagen-orden img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius);
}

.sin-imagen {
  color: var(--text-secondary);
  text-align: center;
  font-size: var(--font-size-lg);
}

.orden-detalles-completos h2 {
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-2xl);
}

.detalles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.detalle-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detalle-label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.detalle-valor {
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.total-unidades {
  font-weight: 700;
  color: var(--primary-blue);
  font-size: var(--font-size-lg);
}

/* Navegación de subprocesos */
.navegacion-subprocesos {
  margin-bottom: var(--spacing-xl);
}

.tabs-subprocesos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.tab-subproceso {
  flex: 1 1 calc(25% - var(--spacing-xs));
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
  font-weight: 500;
}

.tab-subproceso:hover {
  background-color: var(--primary-blue-bg);
}

.tab-subproceso.active {
  background-color: var(--primary-blue);
  color: white;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .tab-subproceso {
    flex: 1 1 calc(33.333% - var(--spacing-xs));
  }
}

@media (max-width: 768px) {
  .tab-subproceso {
    flex: 1 1 calc(50% - var(--spacing-xs));
  }
}

@media (max-width: 480px) {
  .tab-subproceso {
    flex: 1 1 100%;
  }
}

.tab-badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.badge-finalizado {
  background-color: var(--success);
  color: white;
}

.badge-en-proceso {
  background-color: var(--warning);
  color: white;
}

.badge-pendiente {
  background-color: var(--danger);
  color: white;
}

/* Vista de subproceso individual */
.vista-subproceso-individual {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* Filtros por estado */
.filtros-estado {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.filtros-estado h3 {
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-lg);
}

.filtros-botones {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.btn-filtro {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 500;
}

.btn-filtro:hover {
  border-color: var(--primary-blue);
}

.btn-filtro.active {
  background-color: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.btn-finalizado.active {
  background-color: var(--success);
  border-color: var(--success);
}

.btn-pendiente.active {
  background-color: var(--warning);
  border-color: var(--warning);
}

.btn-no-iniciado.active {
  background-color: var(--danger);
  border-color: var(--danger);
}

/* Tabla Excel-like */
.tabla-subproceso-excel {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.tabla-subproceso-excel h3 {
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.tabla-container {
  overflow-x: auto;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.tabla-excel {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
  min-width: 1200px;
}

.tabla-excel th {
  background-color: var(--primary-blue-dark);
  color: white;
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  font-size: var(--font-size-sm);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  white-space: nowrap;
}

.tabla-excel td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  vertical-align: middle;
}

.tabla-excel tbody tr:hover {
  background-color: var(--gray-50);
}

/* Estados de registro */
.registro-finalizado {
  background-color: var(--success-bg);
}

.registro-pendiente {
  background-color: var(--warning-bg);
}

.registro-no-iniciado {
  background-color: var(--danger-bg);
}

.registro-no-aplica {
  background-color: var(--gray-100);
  opacity: 0.7;
}

.registro-modificado {
  box-shadow: inset 0 0 0 2px var(--info);
}

/* Celdas específicas */
.celda-fecha {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  min-width: 150px;
}

.celda-cantidad {
  text-align: center;
  font-weight: 600;
  min-width: 120px;
}

.celda-subproceso {
  min-width: 150px;
}

.celda-estado {
  text-align: center;
  min-width: 100px;
}

.celda-aplica {
  text-align: center;
  min-width: 120px;
}

.celda-acciones {
  text-align: center;
  min-width: 120px;
}

/* Edición de celdas */
.celda-editable {
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius);
  transition: background-color var(--transition-fast);
}

.celda-editable:hover {
  background-color: var(--primary-blue-bg);
}

.celda-edicion {
  width: 100%;
}

.input-edicion,
.select-edicion {
  width: 100%;
  padding: var(--spacing-xs);
  border: 2px solid var(--primary-blue);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background-color: var(--bg-primary);
}

.input-edicion:focus,
.select-edicion:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

/* Estados y badges */
.badge-estado {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.badge-estado-finalizado {
  background-color: var(--success);
  color: white;
}

.badge-estado-pendiente {
  background-color: var(--warning);
  color: white;
}

.badge-estado-no-iniciado {
  background-color: var(--danger);
  color: white;
}

/* Toggle aplica */
.toggle-aplica {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
}

.toggle-aplica input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-blue);
}

.toggle-text {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

/* Botones de acción */
.botones-accion {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
}

.btn-guardar,
.btn-editar,
.btn-cancelar {
  padding: var(--spacing-xs);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-guardar {
  background-color: var(--success);
  color: white;
}

.btn-guardar:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
}

.btn-editar {
  background-color: var(--info);
  color: white;
}

.btn-cancelar {
  background-color: var(--danger);
  color: white;
}

.btn-cancelar:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
}

/* Fila nuevo registro */
.fila-nuevo-registro {
  background-color: var(--info-bg);
}

.btn-agregar-registro {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px dashed var(--info);
  border-radius: var(--border-radius);
  background-color: transparent;
  color: var(--info);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-agregar-registro:hover {
  background-color: var(--info-bg);
}

/* Movimiento entre subprocesos */
.movimiento-subprocesos {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.movimiento-subprocesos h3 {
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.formulario-movimiento {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--spacing-md);
  align-items: end;
}

.campo-movimiento {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.campo-movimiento label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.input-movimiento,
.select-movimiento {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
}

.input-movimiento:focus,
.select-movimiento:focus {
  border-color: var(--primary-blue);
  outline: none;
}

.botones-movimiento {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-enviar,
.btn-limpiar {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-enviar {
  background-color: var(--success);
  color: white;
}

.btn-enviar:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
}

.btn-limpiar {
  background-color: var(--gray-600);
  color: white;
}

.btn-enviar:hover:not(:disabled) {
  background-color: var(--success-dark);
}

.btn-limpiar:hover {
  background-color: var(--gray-700);
}

/* Mensajes de validación */
.mensaje-validacion {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  font-weight: 500;
}

.mensaje-validacion.success {
  background-color: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.mensaje-validacion.error {
  background-color: var(--danger-bg);
  color: var(--danger-text);
  border: 1px solid var(--danger-border);
}

.mensaje-validacion.info {
  background-color: var(--info-bg);
  color: var(--info-text);
  border: 1px solid var(--info-border);
}

/* Historial de movimientos */
.historial-movimientos {
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.historial-movimientos h3 {
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
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

.input-tiempo {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-primary);
}

.btn-generar-balance {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  background-color: var(--success);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-generar-balance:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
}

.movimientos-lista {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 300px;
  overflow-y: auto;
}

.movimiento-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  align-items: center;
}

.movimiento-reciente {
  border-color: var(--success);
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
}

.movimiento-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.movimiento-origen,
.movimiento-destino {
  font-weight: 600;
  color: var(--text-primary);
}

.movimiento-flecha {
  color: var(--primary-blue);
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.movimiento-cantidad {
  font-weight: 600;
  color: var(--success);
}

.movimiento-fecha {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Sin orden */
.sin-orden {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40vh;
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
  font-size: var(--font-size-xl);
}

.mensaje-sin-orden p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 1200px) {
  .formulario-movimiento {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .datos-orden-produccion {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .detalles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .tabs-subprocesos {
    flex-direction: column;
  }

  .filtros-botones {
    flex-direction: column;
  }

  .detalles-grid {
    grid-template-columns: 1fr;
  }

  .movimiento-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .botones-accion {
    flex-direction: column;
  }
}
</style>
