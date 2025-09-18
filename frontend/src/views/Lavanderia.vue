<template>
  <div class="lavanderia-view">
    <h1 class="titulo-principal">🧺 Gestión de Lavandería</h1>

    <!-- Componente de múltiples órdenes -->
    <MultiOrdenManager proceso="Lavandería" @orden-seleccionada="manejarOrdenSeleccionada"
      @ordenes-actualizadas="manejarOrdenesActualizadas" ref="multiOrdenManager">
      <template #default="{ orden, actualizar }">
        <div v-if="orden" class="proceso-lavanderia-container">
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

          <!-- Resumen de estado de lavandería -->
          <div class="resumen-lavanderia">
            <div class="card-resumen entrada">
              <div class="icono-card">📥</div>
              <div class="contenido-card">
                <h3>Entrada a Lavandería</h3>
                <div class="cantidad-grande">{{ calcularTotalEntrada(orden) }}</div>
                <p>unidades enviadas</p>
              </div>
            </div>

            <div class="card-resumen proceso">
              <div class="icono-card">🔄</div>
              <div class="contenido-card">
                <h3>En Proceso</h3>
                <div class="cantidad-grande">{{ calcularEnProceso(orden) }}</div>
                <p>unidades en lavado</p>
              </div>
            </div>

            <div class="card-resumen salida">
              <div class="icono-card">📤</div>
              <div class="contenido-card">
                <h3>Salida de Lavandería</h3>
                <div class="cantidad-grande">{{ calcularTotalSalida(orden) }}</div>
                <p>unidades recibidas</p>
              </div>
            </div>

            <div class="card-resumen pendiente">
              <div class="icono-card">⏳</div>
              <div class="contenido-card">
                <h3>Pendiente</h3>
                <div class="cantidad-grande">{{ calcularPendiente(orden) }}</div>
                <p>unidades por procesar</p>
              </div>
            </div>
          </div>

          <!-- Filtros y controles -->
          <div class="controles-lavanderia">
            <div class="filtros-controles">
              <input type="text" v-model="filtroColor" placeholder="Buscar color..." class="input-filtro" />
              <select v-model="filtroEstado" class="select-filtro">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="enviado">Enviado a Lavandería</option>
                <option value="proceso">En Proceso</option>
                <option value="recibido">Recibido</option>
                <option value="completo">Completado</option>
              </select>
            </div>

            <div class="acciones-rapidas">
              <button @click="enviarTodosPendientes" class="btn-accion-rapida entrada">
                📥 Enviar Todos Pendientes
              </button>
              <button @click="recibirTodosListos" class="btn-accion-rapida salida">
                📤 Recibir Todos Listos
              </button>
            </div>
          </div>

          <!-- Tabla de gestión por color -->
          <div class="tabla-lavanderia-container">
            <table class="tabla-lavanderia">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Total Requerido</th>
                  <th>Enviado</th>
                  <th>En Proceso</th>
                  <th>Recibido</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="Object.keys(coloresFiltrados).length === 0">
                  <tr>
                    <td colspan="8" class="celda-vacia">
                      No hay colores disponibles o que coincidan con el filtro.
                    </td>
                  </tr>
                </template>
                <template v-for="(datos, color) in coloresFiltrados" :key="color">
                  <tr :class="getClassesFila(datos)">
                    <td class="celda-color">
                      <div class="color-info">
                        <span class="muestra-color" :style="{
                          backgroundColor: color,
                          border: color === '#FFFFFF' ? '1px solid #ccc' : 'none',
                        }" :title="getFriendlyColorName(color)"></span>
                        <span class="nombre-color">{{ getFriendlyColorName(color) }}</span>
                      </div>
                    </td>
                    <td class="celda-total">{{ datos.total }}</td>
                    <td class="celda-enviado">
                      <span class="cantidad-estado">{{ datos.enviado }}</span>
                      <button v-if="datos.total - datos.enviado > 0" @click="iniciarEdicion(color, 'enviado')"
                        class="btn-mini">
                        +
                      </button>
                    </td>
                    <td class="celda-proceso">
                      <span class="cantidad-estado">{{ datos.proceso }}</span>
                      <div class="controles-proceso">
                        <button v-if="datos.enviado - datos.proceso > 0" @click="moverAProceso(color)"
                          class="btn-mini proceso">
                          🔄
                        </button>
                      </div>
                    </td>
                    <td class="celda-recibido">
                      <span class="cantidad-estado">{{ datos.recibido }}</span>
                      <button v-if="datos.proceso - datos.recibido > 0" @click="iniciarEdicion(color, 'recibido')"
                        class="btn-mini">
                        +
                      </button>
                    </td>
                    <td class="celda-pendiente">{{ datos.total - datos.enviado }}</td>
                    <td class="celda-estado">
                      <span class="badge" :class="getEstadoBadgeClass(datos)">
                        {{ getEstadoTexto(datos) }}
                      </span>
                    </td>
                    <td class="celda-acciones">
                      <!-- Modo edición -->
                      <div v-if="edicionActiva.color === color && edicionActiva.tipo" class="modo-edicion">
                        <input type="number" v-model.number="cantidadEdicion" @keyup.enter="confirmarEdicion"
                          @blur="confirmarEdicion" :ref="(el) => setInputRef(el, color)" class="input-cantidad" :min="1"
                          :max="getMaximoCantidad(datos, edicionActiva.tipo)" />
                        <div class="botones-edicion">
                          <button @click="confirmarEdicion" class="btn-confirmar">
                            ✓
                          </button>
                          <button @click="cancelarEdicion" class="btn-cancelar-edicion">
                            ✗
                          </button>
                        </div>
                      </div>

                      <!-- Botones normales -->
                      <div v-else class="botones-accion">
                        <button v-if="datos.total - datos.enviado > 0"
                          @click="enviarRapido(color, datos.total - datos.enviado)" class="btn-accion-tabla entrada"
                          title="Enviar todo pendiente">
                          📥
                        </button>
                        <button v-if="datos.proceso - datos.recibido > 0"
                          @click="recibirRapido(color, datos.proceso - datos.recibido)" class="btn-accion-tabla salida"
                          title="Recibir todo listo">
                          📤
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Botones de guardar/cancelar -->
          <GuardarCancelarDialog :orden-actual="orden" proceso-nombre="Lavandería"
            :cambios-realizados="cambiosRealizados" :puede-guardar="hayCambiosPendientes"
            :puede-cancelar="hayCambiosPendientes" @guardar="guardarCambios" @cancelar="cancelarCambios"
            ref="guardarCancelarDialog" />
        </div>
      </template>
    </MultiOrdenManager>
  </div>
</template>

<script setup>
import { ref, computed, reactive, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useOrdenStore } from '../stores/ordenStore'
import MultiOrdenManager from '../components/MultiOrdenManager.vue'
import GuardarCancelarDialog from '../components/GuardarCancelarDialog.vue'
import { usePlantaRealtimeUpdates, useCrossBrowserSync } from '../composables/useRealtimeUpdates'

const ordenStore = useOrdenStore()

// Referencias
const multiOrdenManager = ref(null)
const guardarCancelarDialog = ref(null)

// Sistema de tiempo real
const plantaUpdates = usePlantaRealtimeUpdates('lavanderia')
const crossBrowserSync = useCrossBrowserSync()

// Estados del proceso
const ordenActual = ref(null)
const estadosLavanderia = reactive(new Map())
const estadoOriginal = reactive(new Map())
const cambiosRealizados = ref([])

// Estados de edición
const edicionActiva = ref({ color: null, tipo: null })
const cantidadEdicion = ref(0)
const inputRefs = reactive(new Map())

// Filtros
const filtroColor = ref('')
const filtroEstado = ref('')

// Mapeo de colores (reutilizando del delantero)
const colorMapping = ref({
  '#F0F8FF': 'Azul Alicia', '#FAEBD7': 'Blanco Antiguo', '#00FFFF': 'Aqua', '#7FFFD4': 'Aguamarina',
  '#F0FFFF': 'Azure', '#F5F5DC': 'Beige', '#FFE4C4': 'Bisque', '#000000': 'Negro',
  '#FFEBCD': 'Almendra Blanqueada', '#0000FF': 'Azul', '#8A2BE2': 'Azul Violeta', '#A52A2A': 'Marrón',
  '#DEB887': 'Madera Clara', '#5F9EA0': 'Azul Cadete', '#7FFF00': 'Verde Chartreuse', '#D2691E': 'Chocolate',
  '#FF7F50': 'Coral', '#6495ED': 'Azul Aciano', '#FFF8DC': 'Seda de Maíz', '#DC143C': 'Carmesí',
  '#00008B': 'Azul Marino', '#008B8B': 'Cian Oscuro', '#B8860B': 'Vara de Oro Oscura', '#A9A9A9': 'Gris Oscuro',
  '#006400': 'Verde Oscuro', '#BDB76B': 'Caqui Oscuro', '#8B008B': 'Magenta Oscuro', '#556B2F': 'Verde Oliva Oscuro',
  '#FF8C00': 'Naranja Oscuro', '#9932CC': 'Orquídea Oscura', '#8B0000': 'Rojo Oscuro', '#E9967A': 'Salmón Oscuro',
  '#8FBC8F': 'Verde Mar Oscuro', '#483D8B': 'Pizarra Azul Oscuro', '#2F4F4F': 'Gris Pizarra Oscuro',
  '#00CED1': 'Turquesa Oscuro', '#9400D3': 'Violeta Oscuro', '#FF1493': 'Rosa Intenso', '#00BFFF': 'Azul Cielo Profundo',
  '#696969': 'Gris Tenue', '#1E90FF': 'Azul Profundo', '#B22222': 'Rojo Ladrillo', '#FFFAF0': 'Blanco Floral',
  '#228B22': 'Verde Bosque', '#FF00FF': 'Fucsia', '#DCDCDC': 'Gainsboro', '#F8F8FF': 'Blanco Fantasma',
  '#FFD700': 'Dorado', '#DAA520': 'Vara de Oro', '#808080': 'Gris', '#008000': 'Verde',
  '#ADFF2F': 'Verde Amarillo', '#F0FFF0': 'Rocío de Miel', '#FF69B4': 'Rosa Fuerte', '#CD5C5C': 'Rojo Indio',
  '#4B0082': 'Índigo', '#FFFFF0': 'Marfil', '#F0E68C': 'Caqui', '#E6E6FA': 'Lavanda',
  '#FFF0F5': 'Blanco Lavanda', '#7CFC00': 'Verde Césped', '#FFFACD': 'Amarillo Limón Gasa',
  '#ADD8E6': 'Azul Claro', '#F08080': 'Coral Claro', '#E0FFFF': 'Cian Claro', '#FAFAD2': 'Vara de Oro Claro',
  '#D3D3D3': 'Gris Claro', '#90EE90': 'Verde Claro', '#FFB6C1': 'Rosa Claro', '#FFA07A': 'Salmón Claro',
  '#20B2AA': 'Verde Mar Claro', '#87CEFA': 'Azul Cielo Claro', '#778899': 'Gris Pizarra Claro',
  '#B0C4DE': 'Azul Acero Claro', '#FFFFE0': 'Amarillo Claro', '#00FF00': 'Lima', '#32CD32': 'Verde Lima',
  '#FAF0E6': 'Lino', '#800000': 'Granate', '#66CDAA': 'Aguamarina Medio', '#0000CD': 'Azul Medio',
  '#BA55D3': 'Orquídea Medio', '#9370DB': 'Púrpura Medio', '#3CB371': 'Verde Mar Medio',
  '#7B68EE': 'Pizarra Azul Medio', '#00FA9A': 'Verde Primavera Medio', '#48D1CC': 'Turquesa Medio',
  '#C71585': 'Violeta Rojo Medio', '#191970': 'Azul Medianoche', '#F5FFFA': 'Crema de Menta',
  '#FFE4E1': 'Rosa Neblinoso', '#FFE4B5': 'Mocasín', '#FFDEAD': 'Navajo Blanco', '#000080': 'Naval',
  '#FDF5E6': 'Encaje Viejo', '#808000': 'Oliva', '#6B8E23': 'Verde Oliva', '#FFA500': 'Naranja',
  '#FF4500': 'Rojo Naranja', '#DA70D6': 'Orquídea', '#EEE8AA': 'Vara de Oro Pálido', '#98FB98': 'Verde Pálido',
  '#AFEEEE': 'Turquesa Pálido', '#DB7093': 'Violeta Rojo Pálido', '#FFEFD5': 'Blanco Papaya',
  '#FFDAB9': 'Melocotón', '#CD853F': 'Perú', '#FFC0CB': 'Rosa', '#DDA0DD': 'Ciruela',
  '#B0E0E6': 'Azul Polvo', '#800080': 'Púrpura', '#FF0000': 'Rojo', '#BC8F8F': 'Rosa Marrón',
  '#4169E1': 'Azul Real', '#8B4513': 'Marrón Silla', '#FA8072': 'Salmón', '#F4A460': 'Marrón Arenoso',
  '#2E8B57': 'Verde Mar', '#FFF5EE': 'Concha Marina', '#A0522D': 'Siena', '#C0C0C0': 'Plata',
  '#87CEEB': 'Azul Cielo', '#6A5ACD': 'Pizarra Azul', '#708090': 'Gris Pizarra', '#FFFAFA': 'Nieve',
  '#00FF7F': 'Verde Primavera', '#4682B4': 'Azul Acero', '#D2B48C': 'Tan', '#008080': 'Verde Azulado',
  '#D8BFD8': 'Cardo', '#FF6347': 'Tomate', '#40E0D0': 'Turquesa', '#EE82EE': 'Violeta',
  '#F5DEB3': 'Trigo', '#FFFFFF': 'Blanco', '#F5F5F5': 'Humo Blanco', '#FFFF00': 'Amarillo',
  '#9ACD32': 'Verde Amarillento'
})

// Clase para encapsular estado de lavandería por color
class EstadoLavanderiaColor {
  constructor(total = 0, enviado = 0, proceso = 0, recibido = 0) {
    this.total = total
    this.enviado = enviado
    this.proceso = proceso
    this.recibido = recibido
  }

  clone() {
    return new EstadoLavanderiaColor(this.total, this.enviado, this.proceso, this.recibido)
  }
}

// Computed
const estadosOrdenActual = computed(() => {
  if (!ordenActual.value?.id) return {}
  return estadosLavanderia.get(ordenActual.value.id) || {}
})

const coloresFiltrados = computed(() => {
  const estados = estadosOrdenActual.value
  const filtered = {}

  for (const color in estados) {
    const datos = estados[color]

    // Filtro por color
    const colorMatch = getFriendlyColorName(color)
      .toLowerCase()
      .includes(filtroColor.value.toLowerCase())

    if (!colorMatch) continue

    // Filtro por estado
    let estadoMatch = true
    if (filtroEstado.value) {
      const estadoActual = getEstadoTexto(datos).toLowerCase()
      estadoMatch = estadoActual.includes(filtroEstado.value.toLowerCase())
    }

    if (estadoMatch) {
      filtered[color] = datos
    }
  }

  return filtered
})

const hayCambiosPendientes = computed(() => {
  if (!ordenActual.value?.id) return false

  const estadoOriginalOrden = estadoOriginal.get(ordenActual.value.id)
  const estadoActualOrden = estadosLavanderia.get(ordenActual.value.id)

  if (!estadoOriginalOrden || !estadoActualOrden) return false

  return JSON.stringify(estadoOriginalOrden) !== JSON.stringify(estadoActualOrden)
})

// Funciones principales
function manejarOrdenSeleccionada(orden) {
  ordenActual.value = orden
  if (orden) {
    inicializarEstadosParaOrden(orden.id, orden.detalles)
    guardarEstadoOriginal(orden.id)
  }
}

function manejarOrdenesActualizadas(ordenes) {
  actualizarCambiosRealizados()
}

function inicializarEstadosParaOrden(ordenId, detallesOrden) {
  let estadosOrden = estadosLavanderia.get(ordenId)
  if (!estadosOrden) {
    estadosOrden = reactive({})
    estadosLavanderia.set(ordenId, estadosOrden)
  }

  // Cargar estado existente desde localStorage
  const estadoGuardado = cargarEstadoLocal(ordenId)

  // Calcular totales por color
  const totalesPorColor = {}
  if (detallesOrden) {
    detallesOrden.forEach((detalle) => {
      const cantidadTotalDetalle = Object.values(detalle.tallas).reduce(
        (acc, val) => acc + (parseInt(val) || 0), 0
      )
      if (cantidadTotalDetalle > 0) {
        totalesPorColor[detalle.color] = (totalesPorColor[detalle.color] || 0) + cantidadTotalDetalle
      }
    })
  }

  // Crear o actualizar estados por color
  for (const color in totalesPorColor) {
    const estadoExistente = estadoGuardado[color]

    estadosOrden[color] = reactive(new EstadoLavanderiaColor(
      totalesPorColor[color],
      estadoExistente?.enviado || 0,
      estadoExistente?.proceso || 0,
      estadoExistente?.recibido || 0
    ))
  }

  // Limpiar colores que ya no existen
  for (const color in estadosOrden) {
    if (!totalesPorColor[color]) {
      delete estadosOrden[color]
    }
  }
}

function guardarEstadoOriginal(ordenId) {
  const estadoActual = estadosLavanderia.get(ordenId)
  if (estadoActual) {
    const estadoClonado = {}
    for (const color in estadoActual) {
      estadoClonado[color] = estadoActual[color].clone()
    }
    estadoOriginal.set(ordenId, estadoClonado)
  }
}

// Funciones de color
function getFriendlyColorName(hexColor) {
  if (!hexColor) return 'Color desconocido'

  let normalizedHex = hexColor.toUpperCase()
  if (normalizedHex.length === 4) {
    normalizedHex = '#' + normalizedHex[1] + normalizedHex[1] +
      normalizedHex[2] + normalizedHex[2] +
      normalizedHex[3] + normalizedHex[3]
  }

  return colorMapping.value[normalizedHex] || normalizedHex
}

// Funciones de cálculo
function calcularTotalPedido(orden) {
  return orden.detalles?.reduce((sum, detalle) =>
    sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0), 0) || 0
}

function calcularProgresoOrden(orden) {
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

  return procesos.length > 0 ? procesos.reduce((a, b) => a + b, 0) / procesos.length : 0
}

function calcularTotalEntrada(orden) {
  if (!ordenActual.value?.id) return 0
  const estados = estadosLavanderia.get(ordenActual.value.id) || {}
  return Object.values(estados).reduce((sum, estado) => sum + (estado.enviado || 0), 0)
}

function calcularEnProceso(orden) {
  if (!ordenActual.value?.id) return 0
  const estados = estadosLavanderia.get(ordenActual.value.id) || {}
  return Object.values(estados).reduce((sum, estado) => sum + (estado.proceso || 0), 0)
}

function calcularTotalSalida(orden) {
  if (!ordenActual.value?.id) return 0
  const estados = estadosLavanderia.get(ordenActual.value.id) || {}
  return Object.values(estados).reduce((sum, estado) => sum + (estado.recibido || 0), 0)
}

function calcularPendiente(orden) {
  if (!ordenActual.value?.id) return 0
  const estados = estadosLavanderia.get(ordenActual.value.id) || {}
  return Object.values(estados).reduce((sum, estado) => sum + (estado.total - estado.enviado), 0)
}

// Funciones de estado
function getEstadoTexto(datos) {
  if (datos.recibido >= datos.total) return 'Completo'
  if (datos.proceso > 0) return 'En Proceso'
  if (datos.enviado > 0) return 'Enviado'
  return 'Pendiente'
}

function getEstadoBadgeClass(datos) {
  const estado = getEstadoTexto(datos)
  switch (estado) {
    case 'Completo': return 'badge-success'
    case 'En Proceso': return 'badge-warning'
    case 'Enviado': return 'badge-info'
    default: return 'badge-secondary'
  }
}

function getClassesFila(datos) {
  const estado = getEstadoTexto(datos)
  return {
    'fila-completa': estado === 'Completo',
    'fila-proceso': estado === 'En Proceso',
    'fila-enviado': estado === 'Enviado',
    'fila-pendiente': estado === 'Pendiente'
  }
}

// Funciones de edición
function iniciarEdicion(color, tipo) {
  edicionActiva.value = { color, tipo }
  cantidadEdicion.value = 1

  nextTick(() => {
    const inputElement = inputRefs.get(color)
    if (inputElement) {
      inputElement.focus()
      inputElement.select()
    }
  })
}

function confirmarEdicion() {
  const { color, tipo } = edicionActiva.value
  const cantidad = parseInt(cantidadEdicion.value)

  if (!color || !tipo || isNaN(cantidad) || cantidad <= 0) {
    cancelarEdicion()
    return
  }

  const estado = estadosOrdenActual.value[color]
  if (!estado) return

  const maximo = getMaximoCantidad(estado, tipo)
  if (cantidad > maximo) {
    alert(`La cantidad excede el límite. Máximo permitido: ${maximo}`)
    return
  }

  // Actualizar el estado
  if (tipo === 'enviado') {
    estado.enviado += cantidad
  } else if (tipo === 'recibido') {
    estado.recibido += cantidad
  }

  // Registrar el cambio
  registrarCambio(`${getFriendlyColorName(color)}: +${cantidad} ${tipo === 'enviado' ? 'enviado a' : 'recibido de'} lavandería`)

  cancelarEdicion()
}

function cancelarEdicion() {
  edicionActiva.value = { color: null, tipo: null }
  cantidadEdicion.value = 0
}

function setInputRef(el, color) {
  if (el) {
    inputRefs.set(color, el)
  } else {
    inputRefs.delete(color)
  }
}

function getMaximoCantidad(datos, tipo) {
  if (tipo === 'enviado') {
    return datos.total - datos.enviado
  } else if (tipo === 'recibido') {
    return datos.proceso - datos.recibido
  }
  return 0
}

// Funciones de acciones rápidas
function enviarRapido(color, cantidad) {
  const estado = estadosOrdenActual.value[color]
  if (!estado || cantidad <= 0) return

  estado.enviado += cantidad
  registrarCambio(`${getFriendlyColorName(color)}: +${cantidad} enviado a lavandería`)
}

function recibirRapido(color, cantidad) {
  const estado = estadosOrdenActual.value[color]
  if (!estado || cantidad <= 0) return

  estado.recibido += cantidad
  registrarCambio(`${getFriendlyColorName(color)}: +${cantidad} recibido de lavandería`)
}

function moverAProceso(color) {
  const estado = estadosOrdenActual.value[color]
  if (!estado) return

  const disponible = estado.enviado - estado.proceso
  if (disponible > 0) {
    estado.proceso += disponible
    registrarCambio(`${getFriendlyColorName(color)}: ${disponible} movido a proceso`)
  }
}

function enviarTodosPendientes() {
  let totalEnviado = 0
  for (const color in estadosOrdenActual.value) {
    const estado = estadosOrdenActual.value[color]
    const pendiente = estado.total - estado.enviado
    if (pendiente > 0) {
      estado.enviado += pendiente
      totalEnviado += pendiente
    }
  }

  if (totalEnviado > 0) {
    registrarCambio(`Enviado a lavandería: ${totalEnviado} unidades pendientes`)
  }
}

function recibirTodosListos() {
  let totalRecibido = 0
  for (const color in estadosOrdenActual.value) {
    const estado = estadosOrdenActual.value[color]
    const listo = estado.proceso - estado.recibido
    if (listo > 0) {
      estado.recibido += listo
      totalRecibido += listo
    }
  }

  if (totalRecibido > 0) {
    registrarCambio(`Recibido de lavandería: ${totalRecibido} unidades listas`)
  }
}

// Funciones de persistencia
function guardarEstadoLocal(ordenId) {
  const estadoOrden = estadosLavanderia.get(ordenId)
  if (!estadoOrden) return

  const raw = {}
  for (const color in estadoOrden) {
    const estado = estadoOrden[color]
    raw[color] = {
      total: estado.total,
      enviado: estado.enviado,
      proceso: estado.proceso,
      recibido: estado.recibido
    }
  }

  localStorage.setItem(`estadosLavanderia_${ordenId}`, JSON.stringify(raw))
}

function cargarEstadoLocal(ordenId) {
  const raw = JSON.parse(localStorage.getItem(`estadosLavanderia_${ordenId}`) || '{}')
  return raw
}

// Funciones de cambios
function registrarCambio(descripcion) {
  cambiosRealizados.value.push(descripcion)
}

function actualizarCambiosRealizados() {
  if (!ordenActual.value?.id) {
    cambiosRealizados.value = []
    return
  }

  const estadoOriginalOrden = estadoOriginal.get(ordenActual.value.id)
  const estadoActualOrden = estadosLavanderia.get(ordenActual.value.id)

  if (!estadoOriginalOrden || !estadoActualOrden) {
    cambiosRealizados.value = []
    return
  }

  const cambios = []
  for (const color in estadoActualOrden) {
    const estadoActual = estadoActualOrden[color]
    const estadoOriginalColor = estadoOriginalOrden[color]

    if (!estadoOriginalColor) continue

    if (estadoActual.enviado !== estadoOriginalColor.enviado) {
      const diferencia = estadoActual.enviado - estadoOriginalColor.enviado
      cambios.push(`${getFriendlyColorName(color)} enviado: ${diferencia > 0 ? '+' : ''}${diferencia}`)
    }

    if (estadoActual.proceso !== estadoOriginalColor.proceso) {
      const diferencia = estadoActual.proceso - estadoOriginalColor.proceso
      cambios.push(`${getFriendlyColorName(color)} en proceso: ${diferencia > 0 ? '+' : ''}${diferencia}`)
    }

    if (estadoActual.recibido !== estadoOriginalColor.recibido) {
      const diferencia = estadoActual.recibido - estadoOriginalColor.recibido
      cambios.push(`${getFriendlyColorName(color)} recibido: ${diferencia > 0 ? '+' : ''}${diferencia}`)
    }
  }

  cambiosRealizados.value = cambios
}

// Funciones del dialog
async function guardarCambios() {
  if (!ordenActual.value?.id) return

  try {
    guardarEstadoLocal(ordenActual.value.id)
    guardarEstadoOriginal(ordenActual.value.id)
    cambiosRealizados.value = []

    crossBrowserSync.notificarCambio('proceso_actualizado', {
      proceso: 'lavanderia',
      ordenId: ordenActual.value.id,
      timestamp: new Date()
    })

    window.dispatchEvent(new CustomEvent('plantaProcesoUpdate', {
      detail: {
        procesoTipo: 'lavanderia',
        ordenId: ordenActual.value.id,
        cambios: cambiosRealizados.value,
        timestamp: new Date()
      }
    }))

    if (multiOrdenManager.value) {
      multiOrdenManager.value.actualizarEstado()
    }

    console.log('Cambios de lavandería guardados exitosamente')
  } catch (error) {
    console.error('Error al guardar cambios de lavandería:', error)
    throw error
  }
}

async function cancelarCambios() {
  if (!ordenActual.value?.id) return

  try {
    const estadoOriginalOrden = estadoOriginal.get(ordenActual.value.id)
    if (estadoOriginalOrden) {
      const estadoRestaurado = {}
      for (const color in estadoOriginalOrden) {
        estadoRestaurado[color] = estadoOriginalOrden[color].clone()
      }
      estadosLavanderia.set(ordenActual.value.id, reactive(estadoRestaurado))
    }

    cambiosRealizados.value = []
    cancelarEdicion()

    console.log('Cambios de lavandería cancelados exitosamente')
  } catch (error) {
    console.error('Error al cancelar cambios de lavandería:', error)
    throw error
  }
}

// Watchers
watch(() => hayCambiosPendientes.value, () => {
  actualizarCambiosRealizados()
})

// Listener para limpiar estado cuando se cambia de vista
const handleVistaCambiando = (event) => {
  if (event.detail.vistaAnterior === 'Lavanderia') {
    cancelarEdicion()
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('vistaPlantaCambiando', handleVistaCambiando)

  const handlePlantaUpdate = (event) => {
    if (event.detail.procesoTipo === 'lavanderia') {
      console.log('[Lavandería] Actualización de proceso recibida:', event.detail)
      nextTick(() => {
        if (multiOrdenManager.value) {
          multiOrdenManager.value.actualizarEstado()
        }
      })
    }
  }

  const handleRealtimeUpdate = (event) => {
    console.log('[Lavandería] Actualización en tiempo real:', event.detail)
    actualizarCambiosRealizados()
  }

  const handleCrossBrowserSync = (event) => {
    if (event.detail.tipo === 'proceso_actualizado' && event.detail.datos.proceso === 'lavanderia') {
      console.log('[Lavandería] Sincronización entre ventanas:', event.detail)
      setTimeout(() => {
        if (ordenActual.value?.id) {
          inicializarEstadosParaOrden(ordenActual.value.id, ordenActual.value.detalles)
        }
      }, 200)
    }
  }

  window.addEventListener('plantaProcesoUpdate', handlePlantaUpdate)
  window.addEventListener('realtimeUpdate', handleRealtimeUpdate)
  window.addEventListener('crossBrowserSync', handleCrossBrowserSync)
})

// onUnmounted(() => {
//   window.removeEventListener('vistaPlantaCambiando', handleVistaCambiando)
//   window.removeEventListener('plantaProcesoUpdate', handlePlantaUpdate)
//   window.removeEventListener('realtimeUpdate', handleRealtimeUpdate)
//   window.removeEventListener('crossBrowserSync', handleCrossBrowserSync)
// })
</script>

<style scoped>
.lavanderia-view {
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

.proceso-lavanderia-container {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.orden-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #6B46C1, #8B5CF6);
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

/* Resumen de lavandería */
.resumen-lavanderia {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #F8FAFC, #E2E8F0);
  border-bottom: 1px solid var(--border-color);
}

.card-resumen {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  transition: all var(--transition-fast);
}

.card-resumen:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-resumen.entrada {
  border-left-color: #3B82F6;
}

.card-resumen.proceso {
  border-left-color: #F59E0B;
}

.card-resumen.salida {
  border-left-color: #10B981;
}

.card-resumen.pendiente {
  border-left-color: #EF4444;
}

.icono-card {
  font-size: 2.5rem;
  opacity: 0.8;
}

.contenido-card h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.cantidad-grande {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--primary-blue-dark);
  line-height: 1;
  margin-bottom: var(--spacing-xs);
}

.contenido-card p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Controles de lavandería */
.controles-lavanderia {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.filtros-controles {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
}

.input-filtro {
  flex: 1;
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
}

.input-filtro:focus {
  border-color: var(--primary-blue);
  outline: none;
}

.select-filtro {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
}

.acciones-rapidas {
  display: flex;
  gap: var(--spacing-md);
}

.btn-accion-rapida {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  color: white;
}

.btn-accion-rapida.entrada {
  background: linear-gradient(135deg, #3B82F6, #1D4ED8);
}

.btn-accion-rapida.salida {
  background: linear-gradient(135deg, #10B981, #059669);
}

.btn-accion-rapida:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* Tabla de lavandería */
.tabla-lavanderia-container {
  overflow-x: auto;
}

.tabla-lavanderia {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
}

.tabla-lavanderia th {
  background: linear-gradient(135deg, #6B46C1, #8B5CF6);
  color: white;
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.tabla-lavanderia td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.fila-completa {
  background-color: var(--success-bg);
}

.fila-proceso {
  background-color: var(--warning-bg);
}

.fila-enviado {
  background-color: var(--info-bg);
}

.fila-pendiente {
  background-color: var(--gray-50);
}

.celda-vacia {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
  font-style: italic;
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
  font-weight: 500;
}

.celda-total {
  font-weight: 600;
  color: var(--text-primary);
}

.celda-enviado .cantidad-estado {
  font-weight: 600;
  color: #3B82F6;
}

.celda-proceso .cantidad-estado {
  font-weight: 600;
  color: #F59E0B;
}

.celda-recibido .cantidad-estado {
  font-weight: 600;
  color: #10B981;
}

.celda-pendiente {
  font-weight: 600;
  color: #EF4444;
}

.controles-proceso {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

/* Badges de estado */
.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 12px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success {
  background-color: var(--success);
  color: white;
}

.badge-warning {
  background-color: var(--warning);
  color: white;
}

.badge-info {
  background-color: var(--info);
  color: white;
}

.badge-secondary {
  background-color: var(--gray-500);
  color: white;
}

/* Botones de acción */
.btn-mini {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background-color: var(--primary-blue);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  margin-left: var(--spacing-xs);
  transition: all var(--transition-fast);
}

.btn-mini:hover {
  background-color: var(--primary-blue-dark);
  transform: scale(1.1);
}

.btn-mini.proceso {
  background-color: var(--warning);
}

.btn-mini.proceso:hover {
  background-color: var(--warning-dark);
}

.botones-accion {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.btn-accion-tabla {
  padding: var(--spacing-xs);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.btn-accion-tabla.entrada {
  background-color: #3B82F6;
  color: white;
}

.btn-accion-tabla.salida {
  background-color: #10B981;
  color: white;
}

.btn-accion-tabla:hover {
  transform: scale(1.05);
}

/* Modo edición */
.modo-edicion {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
}

.input-cantidad {
  width: 80px;
  padding: var(--spacing-xs);
  border: 2px solid var(--primary-blue);
  border-radius: var(--border-radius);
  text-align: center;
  font-size: var(--font-size-sm);
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

@media (max-width: 768px) {
  .orden-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .orden-resumen {
    align-items: flex-start;
  }

  .resumen-lavanderia {
    grid-template-columns: repeat(2, 1fr);
  }

  .controles-lavanderia {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .acciones-rapidas {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .resumen-lavanderia {
    grid-template-columns: 1fr;
  }
}
</style>
