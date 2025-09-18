<template>
  <div class="visualizacion-orden-produccion">
    <div v-if="orden" class="orden-visualization-container">
      <!-- Header de la orden con imagen -->
      <div class="orden-header-visual">
        <div class="orden-imagen-section">
          <div class="imagen-container">
            <div v-if="orden.imagen || orden.imagenDiseno" class="imagen-orden">
              <img
                :src="orden.imagen || orden.imagenDiseno"
                :alt="`Orden ${orden.consecutivo}`"
                @error="manejarErrorImagen"
                class="imagen-principal"
              />
              <div class="imagen-overlay">
                <button @click="ampliarImagen" class="btn-ampliar">
                  🔍 Ampliar
                </button>
                <button @click="cambiarImagen" class="btn-cambiar">
                  📷 Cambiar
                </button>
              </div>
            </div>
            <div v-else class="sin-imagen">
              <div class="placeholder-imagen">
                <div class="placeholder-icono">📷</div>
                <div class="placeholder-texto">
                  <h4>Sin imagen</h4>
                  <p>Haz clic para agregar una imagen de la orden</p>
                </div>
                <button @click="subirImagen" class="btn-subir-imagen">
                  ➕ Agregar Imagen
                </button>
              </div>
            </div>
          </div>
          
          <!-- Miniaturas adicionales -->
          <div v-if="orden.imagenesAdicionales && orden.imagenesAdicionales.length > 0" class="miniaturas-adicionales">
            <h5>Imágenes adicionales:</h5>
            <div class="miniaturas-grid">
              <div 
                v-for="(imagen, index) in orden.imagenesAdicionales" 
                :key="index"
                class="miniatura-item"
                @click="seleccionarImagenPrincipal(imagen)"
              >
                <img :src="imagen.url" :alt="imagen.descripcion" class="miniatura" />
                <span class="miniatura-descripcion">{{ imagen.descripcion }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="orden-datos-principales">
          <div class="datos-header">
            <h2 class="orden-titulo">{{ orden.consecutivo }}</h2>
            <div class="estado-orden-badge" :class="getEstadoOrdenClass()">
              {{ getEstadoOrdenTexto() }}
            </div>
          </div>

          <!-- Información básica en grid -->
          <div class="info-grid-principal">
            <div class="info-card codigo">
              <div class="info-label">Código</div>
              <div class="info-valor">{{ orden.consecutivo }}</div>
              <div class="info-extra">ID: {{ orden.id }}</div>
            </div>

            <div class="info-card referencia">
              <div class="info-label">Referencia</div>
              <div class="info-valor">{{ orden.referenciaPorDefecto }}</div>
              <div class="info-extra">{{ obtenerTipoProducto() }}</div>
            </div>

            <div class="info-card tela">
              <div class="info-label">Tipo de Tela</div>
              <div class="info-valor">{{ obtenerTipoTela() }}</div>
              <div class="info-extra">{{ obtenerComposicionTela() }}</div>
            </div>

            <div class="info-card colores">
              <div class="info-label">Colores</div>
              <div class="info-valor">
                <div class="colores-visual">
                  <div 
                    v-for="color in obtenerColoresOrden()" 
                    :key="color.hex"
                    class="color-muestra"
                    :style="{ backgroundColor: color.hex }"
                    :title="color.nombre"
                  ></div>
                </div>
              </div>
              <div class="info-extra">{{ obtenerColoresOrden().length }} color(es)</div>
            </div>

            <div class="info-card cliente">
              <div class="info-label">Cliente/Proveedor</div>
              <div class="info-valor">{{ orden.proveedor || 'No especificado' }}</div>
              <div class="info-extra">{{ obtenerTipoCliente() }}</div>
            </div>

            <div class="info-card fechas">
              <div class="info-label">Fechas</div>
              <div class="info-valor">{{ formatearFecha(orden.fecha) }}</div>
              <div class="info-extra">
                Creado: {{ formatearFechaHora(orden.fecha) }}
                <br>
                Estimado: {{ formatearFecha(orden.fechaEstimada) }}
              </div>
            </div>
          </div>

          <!-- Métricas de la orden -->
          <div class="metricas-orden">
            <div class="metrica-item total-unidades">
              <div class="metrica-icono">📦</div>
              <div class="metrica-info">
                <div class="metrica-numero">{{ calcularTotalUnidades() }}</div>
                <div class="metrica-label">Total Unidades</div>
              </div>
            </div>

            <div class="metrica-item progreso-general">
              <div class="metrica-icono">📊</div>
              <div class="metrica-info">
                <div class="metrica-numero">{{ calcularProgresoGeneral().toFixed(1) }}%</div>
                <div class="metrica-label">Progreso General</div>
              </div>
            </div>

            <div class="metrica-item tiempo-estimado">
              <div class="metrica-icono">⏱️</div>
              <div class="metrica-info">
                <div class="metrica-numero">{{ calcularTiempoEstimado() }}</div>
                <div class="metrica-label">Tiempo Estimado</div>
              </div>
            </div>

            <div class="metrica-item valor-orden">
              <div class="metrica-icono">💰</div>
              <div class="metrica-info">
                <div class="metrica-numero">${{ calcularValorEstimado() }}</div>
                <div class="metrica-label">Valor Estimado</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detalles expandidos de la orden -->
      <div class="orden-detalles-expandidos">
        <div class="tabs-detalles">
          <button 
            @click="tabActivo = 'tallas'"
            :class="{ active: tabActivo === 'tallas' }"
            class="tab-detalle"
          >
            📏 Tallas y Cantidades
          </button>
          <button 
            @click="tabActivo = 'especificaciones'"
            :class="{ active: tabActivo === 'especificaciones' }"
            class="tab-detalle"
          >
            📋 Especificaciones
          </button>
          <button 
            @click="tabActivo = 'materiales'"
            :class="{ active: tabActivo === 'materiales' }"
            class="tab-detalle"
          >
            🧵 Materiales
          </button>
          <button 
            @click="tabActivo = 'historial'"
            :class="{ active: tabActivo === 'historial' }"
            class="tab-detalle"
          >
            📚 Historial
          </button>
        </div>

        <!-- Contenido de tallas y cantidades -->
        <div v-if="tabActivo === 'tallas'" class="tab-content tallas-content">
          <h3>Distribución por Tallas y Colores</h3>
          <div class="tabla-tallas-container">
            <table class="tabla-tallas">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>S</th>
                  <th>M</th>
                  <th>L</th>
                  <th>XL</th>
                  <th>XXL</th>
                  <th>Total</th>
                  <th>Progreso</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detalle, index) in orden.detalles" :key="index" class="fila-talla">
                  <td class="celda-color">
                    <div class="color-info">
                      <div 
                        class="color-muestra-tabla" 
                        :style="{ backgroundColor: detalle.color }"
                      ></div>
                      <span class="color-nombre">{{ obtenerNombreColor(detalle.color) }}</span>
                    </div>
                  </td>
                  <td class="celda-cantidad">{{ detalle.tallas.S || 0 }}</td>
                  <td class="celda-cantidad">{{ detalle.tallas.M || 0 }}</td>
                  <td class="celda-cantidad">{{ detalle.tallas.L || 0 }}</td>
                  <td class="celda-cantidad">{{ detalle.tallas.XL || 0 }}</td>
                  <td class="celda-cantidad">{{ detalle.tallas.XXL || 0 }}</td>
                  <td class="celda-total">{{ calcularTotalDetalle(detalle) }}</td>
                  <td class="celda-progreso">
                    <div class="progreso-detalle">
                      <div class="barra-progreso-detalle">
                        <div 
                          class="barra-relleno-detalle" 
                          :style="{ width: calcularProgresoDetalle(detalle) + '%' }"
                        ></div>
                      </div>
                      <span class="porcentaje-detalle">{{ calcularProgresoDetalle(detalle).toFixed(1) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Resumen de tallas -->
          <div class="resumen-tallas">
            <h4>Resumen por Talla</h4>
            <div class="tallas-resumen-grid">
              <div v-for="talla in ['S', 'M', 'L', 'XL', 'XXL']" :key="talla" class="talla-resumen-item">
                <div class="talla-nombre">{{ talla }}</div>
                <div class="talla-cantidad">{{ calcularTotalPorTalla(talla) }}</div>
                <div class="talla-porcentaje">{{ calcularPorcentajeTalla(talla).toFixed(1) }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido de especificaciones -->
        <div v-if="tabActivo === 'especificaciones'" class="tab-content especificaciones-content">
          <h3>Especificaciones Técnicas</h3>
          <div class="especificaciones-grid">
            <div class="spec-group medidas">
              <h4>📐 Medidas</h4>
              <div class="spec-items">
                <div class="spec-item">
                  <span class="spec-label">Largo promedio:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('largo', '75 cm') }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Ancho de pecho:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('ancho', '45 cm') }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Largo de manga:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('manga', '65 cm') }}</span>
                </div>
              </div>
            </div>

            <div class="spec-group acabados">
              <h4>✨ Acabados</h4>
              <div class="spec-items">
                <div class="spec-item">
                  <span class="spec-label">Tipo de costura:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('costura', 'Overlock doble') }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Botones:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('botones', 'Metálicos 5 unidades') }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Etiquetas:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('etiquetas', 'Marca + Talla') }}</span>
                </div>
              </div>
            </div>

            <div class="spec-group calidad">
              <h4>🎯 Control de Calidad</h4>
              <div class="spec-items">
                <div class="spec-item">
                  <span class="spec-label">Tolerancia:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('tolerancia', '±2%') }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Inspección:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('inspeccion', '100% visual') }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Embalaje:</span>
                  <span class="spec-valor">{{ obtenerEspecificacion('embalaje', 'Individual en bolsa') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido de materiales -->
        <div v-if="tabActivo === 'materiales'" class="tab-content materiales-content">
          <h3>Materiales y Componentes</h3>
          <div class="materiales-lista">
            <div v-for="material in obtenerMateriales()" :key="material.id" class="material-item">
              <div class="material-info">
                <div class="material-nombre">{{ material.nombre }}</div>
                <div class="material-descripcion">{{ material.descripcion }}</div>
              </div>
              <div class="material-cantidad">
                <span class="cantidad-numero">{{ material.cantidad }}</span>
                <span class="cantidad-unidad">{{ material.unidad }}</span>
              </div>
              <div class="material-estado" :class="material.estado">
                {{ material.estadoTexto }}
              </div>
            </div>
          </div>

          <!-- Resumen de costos de materiales -->
          <div class="resumen-materiales">
            <h4>💰 Resumen de Costos</h4>
            <div class="costos-grid">
              <div class="costo-item">
                <span class="costo-label">Tela principal:</span>
                <span class="costo-valor">${{ calcularCostoTela() }}</span>
              </div>
              <div class="costo-item">
                <span class="costo-label">Accesorios:</span>
                <span class="costo-valor">${{ calcularCostoAccesorios() }}</span>
              </div>
              <div class="costo-item">
                <span class="costo-label">Mano de obra:</span>
                <span class="costo-valor">${{ calcularCostoManoObra() }}</span>
              </div>
              <div class="costo-item total">
                <span class="costo-label">Total estimado:</span>
                <span class="costo-valor">${{ calcularCostoTotal() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido de historial -->
        <div v-if="tabActivo === 'historial'" class="tab-content historial-content">
          <h3>Historial de la Orden</h3>
          <div class="timeline-historial">
            <div v-for="evento in obtenerHistorial()" :key="evento.id" class="evento-historial">
              <div class="evento-timestamp">{{ formatearFechaHora(evento.fecha) }}</div>
              <div class="evento-icono" :class="evento.tipo">{{ evento.icono }}</div>
              <div class="evento-contenido">
                <div class="evento-titulo">{{ evento.titulo }}</div>
                <div class="evento-descripcion">{{ evento.descripcion }}</div>
                <div v-if="evento.usuario" class="evento-usuario">Por: {{ evento.usuario }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="acciones-rapidas">
        <button @click="editarOrden" class="btn-accion editar">
          ✏️ Editar Orden
        </button>
        <button @click="duplicarOrden" class="btn-accion duplicar">
          📋 Duplicar
        </button>
        <button @click="exportarDatos" class="btn-accion exportar">
          📊 Exportar
        </button>
        <button @click="imprimirOrden" class="btn-accion imprimir">
          🖨️ Imprimir
        </button>
      </div>
    </div>

    <!-- Placeholder cuando no hay orden -->
    <div v-else class="sin-orden-seleccionada">
      <div class="placeholder-container">
        <div class="placeholder-icono-grande">📋</div>
        <h3>No hay orden seleccionada</h3>
        <p>Selecciona una orden de producción para ver sus detalles completos</p>
      </div>
    </div>

    <!-- Modal para ampliar imagen -->
    <div v-if="mostrarModalImagen" class="modal-imagen-overlay" @click="cerrarModalImagen">
      <div class="modal-imagen-content" @click.stop>
        <div class="modal-imagen-header">
          <h3>{{ orden?.consecutivo }} - Imagen de Orden</h3>
          <button @click="cerrarModalImagen" class="btn-cerrar-modal">×</button>
        </div>
        <div class="modal-imagen-body">
          <img :src="imagenAmpliada" :alt="`Orden ${orden?.consecutivo}`" class="imagen-ampliada" />
        </div>
        <div class="modal-imagen-footer">
          <button @click="descargarImagen" class="btn-descargar">💾 Descargar</button>
          <button @click="compartirImagen" class="btn-compartir">📤 Compartir</button>
        </div>
      </div>
    </div>

    <!-- Input oculto para subir imágenes -->
    <input
      ref="inputImagen"
      type="file"
      accept="image/*"
      multiple
      @change="procesarImagenesSubidas"
      style="display: none"
    />
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  orden: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['orden-actualizada', 'imagen-cambiada'])

// Estados reactivos
const tabActivo = ref('tallas')
const mostrarModalImagen = ref(false)
const imagenAmpliada = ref('')
const inputImagen = ref(null)

// Mapeo de colores para nombres amigables
const colorMapping = {
  '#000000': 'Negro',
  '#FFFFFF': 'Blanco',
  '#FF0000': 'Rojo',
  '#00FF00': 'Verde',
  '#0000FF': 'Azul',
  '#FFFF00': 'Amarillo',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cian',
  '#800000': 'Granate',
  '#008000': 'Verde Oscuro',
  '#000080': 'Azul Marino',
  '#808000': 'Oliva',
  '#800080': 'Púrpura',
  '#008080': 'Verde Azulado',
  '#C0C0C0': 'Plata',
  '#808080': 'Gris',
  '#8B4513': 'Café',
  '#87CEEB': 'Azul Claro'
}

// Funciones de cálculo
function calcularTotalUnidades() {
  if (!props.orden?.detalles) return 0
  return props.orden.detalles.reduce((sum, detalle) =>
    sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0), 0
  )
}

function calcularTotalDetalle(detalle) {
  return Object.values(detalle.tallas).reduce((sum, qty) => sum + (qty || 0), 0)
}

function calcularTotalPorTalla(talla) {
  if (!props.orden?.detalles) return 0
  return props.orden.detalles.reduce((sum, detalle) => 
    sum + (detalle.tallas[talla] || 0), 0
  )
}

function calcularPorcentajeTalla(talla) {
  const total = calcularTotalUnidades()
  const totalTalla = calcularTotalPorTalla(talla)
  return total > 0 ? (totalTalla / total) * 100 : 0
}

function calcularProgresoGeneral() {
  if (!props.orden) return 0
  
  // Simular cálculo de progreso basado en estados
  const progresoCorte = props.orden.estadoCorte ? 75 : 0
  const progresoPlanta = props.orden.estadoPlanta ? 60 : 0
  const progresoLavanderia = 40 // Simular
  
  return (progresoCorte + progresoPlanta + progresoLavanderia) / 3
}

function calcularProgresoDetalle(detalle) {
  // Simular progreso por detalle (en implementación real sería más específico)
  return Math.random() * 100
}

function calcularTiempoEstimado() {
  const unidades = calcularTotalUnidades()
  const horasEstimadas = Math.ceil(unidades / 50) // 50 unidades por hora
  return `${horasEstimadas}h`
}

function calcularValorEstimado() {
  const unidades = calcularTotalUnidades()
  const precioPromedio = 25 // $25 por unidad promedio
  return (unidades * precioPromedio).toLocaleString()
}

// Funciones de datos
function obtenerColoresOrden() {
  if (!props.orden?.detalles) return []
  
  return props.orden.detalles.map(detalle => ({
    hex: detalle.color,
    nombre: obtenerNombreColor(detalle.color)
  }))
}

function obtenerNombreColor(hexColor) {
  return colorMapping[hexColor?.toUpperCase()] || hexColor || 'Color desconocido'
}

function obtenerTipoTela() {
  // Inferir del nombre de la referencia o usar default
  const referencia = props.orden?.referenciaPorDefecto?.toLowerCase() || ''
  
  if (referencia.includes('jean') || referencia.includes('denim')) return 'Denim'
  if (referencia.includes('algodón') || referencia.includes('cotton')) return 'Algodón'
  if (referencia.includes('poliéster')) return 'Poliéster'
  if (referencia.includes('lana')) return 'Lana'
  
  return 'Mezcla de algodón'
}

function obtenerComposicionTela() {
  const tipoTela = obtenerTipoTela()
  
  const composiciones = {
    'Denim': '98% Algodón, 2% Elastano',
    'Algodón': '100% Algodón',
    'Poliéster': '65% Poliéster, 35% Algodón',
    'Lana': '80% Lana, 20% Poliéster',
    'Mezcla de algodón': '60% Algodón, 40% Poliéster'
  }
  
  return composiciones[tipoTela] || 'Composición no especificada'
}

function obtenerTipoProducto() {
  const referencia = props.orden?.referenciaPorDefecto?.toLowerCase() || ''
  
  if (referencia.includes('pantalón') || referencia.includes('jean')) return 'Pantalón'
  if (referencia.includes('camisa') || referencia.includes('blusa')) return 'Camisa'
  if (referencia.includes('sudadera') || referencia.includes('hoodie')) return 'Sudadera'
  if (referencia.includes('vestido')) return 'Vestido'
  
  return 'Prenda de vestir'
}

function obtenerTipoCliente() {
  const proveedor = props.orden?.proveedor?.toLowerCase() || ''
  
  if (proveedor.includes('mayorista') || proveedor.includes('wholesale')) return 'Mayorista'
  if (proveedor.includes('retail') || proveedor.includes('tienda')) return 'Retail'
  if (proveedor.includes('marca') || proveedor.includes('brand')) return 'Marca'
  
  return 'Cliente directo'
}

function obtenerEspecificacion(tipo, defaultValue) {
  // En implementación real esto vendría de la base de datos
  const especificaciones = props.orden?.especificaciones || {}
  return especificaciones[tipo] || defaultValue
}

function obtenerMateriales() {
  // Simular lista de materiales
  return [
    {
      id: 1,
      nombre: 'Tela principal',
      descripcion: `${obtenerTipoTela()} - ${obtenerComposicionTela()}`,
      cantidad: Math.ceil(calcularTotalUnidades() * 0.8),
      unidad: 'metros',
      estado: 'disponible',
      estadoTexto: 'Disponible'
    },
    {
      id: 2,
      nombre: 'Hilo de costura',
      descripcion: 'Hilo poliéster alta resistencia',
      cantidad: Math.ceil(calcularTotalUnidades() * 0.1),
      unidad: 'carretes',
      estado: 'disponible',
      estadoTexto: 'Disponible'
    },
    {
      id: 3,
      nombre: 'Botones',
      descripcion: 'Botones metálicos estándar',
      cantidad: calcularTotalUnidades() * 5,
      unidad: 'unidades',
      estado: 'pendiente',
      estadoTexto: 'Pendiente'
    },
    {
      id: 4,
      nombre: 'Cierre',
      descripcion: 'Cierre metálico YKK',
      cantidad: calcularTotalUnidades(),
      unidad: 'unidades',
      estado: 'disponible',
      estadoTexto: 'Disponible'
    },
    {
      id: 5,
      nombre: 'Etiquetas',
      descripción: 'Etiquetas de marca y talla',
      cantidad: calcularTotalUnidades() * 2,
      unidad: 'unidades',
      estado: 'disponible',
      estadoTexto: 'Disponible'
    }
  ]
}

function calcularCostoTela() {
  const metros = Math.ceil(calcularTotalUnidades() * 0.8)
  return (metros * 8.5).toFixed(2) // $8.50 por metro
}

function calcularCostoAccesorios() {
  const unidades = calcularTotalUnidades()
  return (unidades * 2.3).toFixed(2) // $2.30 por unidad en accesorios
}

function calcularCostoManoObra() {
  const unidades = calcularTotalUnidades()
  return (unidades * 12.0).toFixed(2) // $12.00 por unidad en mano de obra
}

function calcularCostoTotal() {
  const tela = parseFloat(calcularCostoTela())
  const accesorios = parseFloat(calcularCostoAccesorios())
  const manoObra = parseFloat(calcularCostoManoObra())
  return (tela + accesorios + manoObra).toFixed(2)
}

function obtenerHistorial() {
  // Simular historial de eventos
  const eventos = [
    {
      id: 1,
      fecha: props.orden?.fecha || new Date().toISOString(),
      tipo: 'creacion',
      icono: '🆕',
      titulo: 'Orden creada',
      descripcion: 'La orden de producción fue creada en el sistema',
      usuario: props.orden?.encargado || 'Sistema'
    },
    {
      id: 2,
      fecha: new Date(Date.now() - 86400000).toISOString(), // Ayer
      tipo: 'modificacion',
      icono: '✏️',
      titulo: 'Especificaciones actualizadas',
      descripcion: 'Se actualizaron las especificaciones técnicas del producto',
      usuario: 'Diseño Técnico'
    },
    {
      id: 3,
      fecha: new Date(Date.now() - 43200000).toISOString(), // 12 horas atrás
      tipo: 'proceso',
      icono: '🏭',
      titulo: 'Inicio de producción',
      descripcion: 'La orden ingresó al área de corte',
      usuario: 'Supervisor Corte'
    },
    {
      id: 4,
      fecha: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
      tipo: 'proceso',
      icono: '📊',
      titulo: 'Progreso actualizado',
      descripcion: `Progreso actual: ${calcularProgresoGeneral().toFixed(1)}%`,
      usuario: 'Sistema'
    }
  ]
  
  return eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

// Funciones de estado
function getEstadoOrdenClass() {
  const progreso = calcularProgresoGeneral()
  if (progreso >= 100) return 'completada'
  if (progreso >= 75) return 'avanzada'
  if (progreso >= 25) return 'en-proceso'
  return 'pendiente'
}

function getEstadoOrdenTexto() {
  const progreso = calcularProgresoGeneral()
  if (progreso >= 100) return 'Completada'
  if (progreso >= 75) return 'Avanzada'
  if (progreso >= 25) return 'En Proceso'
  return 'Pendiente'
}

// Funciones de utilidad
function formatearFecha(fechaString) {
  if (!fechaString) return 'No especificada'
  return new Date(fechaString).toLocaleDateString('es-ES')
}

function formatearFechaHora(fechaString) {
  if (!fechaString) return 'No especificada'
  return new Date(fechaString).toLocaleString('es-ES')
}

// Funciones de imágenes
function manejarErrorImagen() {
  console.warn('Error al cargar imagen de la orden')
  // Aquí podrías mostrar una imagen placeholder
}

function ampliarImagen() {
  imagenAmpliada.value = props.orden.imagen
  mostrarModalImagen.value = true
}

function cerrarModalImagen() {
  mostrarModalImagen.value = false
  imagenAmpliada.value = ''
}

function cambiarImagen() {
  if (inputImagen.value) {
    inputImagen.value.click()
  }
}

function subirImagen() {
  if (inputImagen.value) {
    inputImagen.value.click()
  }
}

function seleccionarImagenPrincipal(imagen) {
  emit('imagen-cambiada', imagen.url)
}

function procesarImagenesSubidas(event) {
  const archivos = Array.from(event.target.files)
  
  archivos.forEach(archivo => {
    if (archivo.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const nuevaImagen = {
          url: e.target.result,
          descripcion: archivo.name,
          fecha: new Date().toISOString()
        }
        
        // Emitir evento para actualizar la orden
        emit('imagen-cambiada', nuevaImagen.url)
      }
      reader.readAsDataURL(archivo)
    }
  })
  
  // Limpiar input
  event.target.value = ''
}

function descargarImagen() {
  const link = document.createElement('a')
  link.href = imagenAmpliada.value
  link.download = `orden_${props.orden?.consecutivo}_imagen.jpg`
  link.click()
}

function compartirImagen() {
  if (navigator.share) {
    navigator.share({
      title: `Orden ${props.orden?.consecutivo}`,
      text: 'Imagen de orden de producción',
      url: imagenAmpliada.value
    })
  } else {
    // Fallback: copiar URL al portapapeles
    navigator.clipboard.writeText(imagenAmpliada.value)
    alert('URL de imagen copiada al portapapeles')
  }
}

// Funciones de acciones
function editarOrden() {
  emit('orden-actualizada', { accion: 'editar', orden: props.orden })
}

function duplicarOrden() {
  emit('orden-actualizada', { accion: 'duplicar', orden: props.orden })
}

function exportarDatos() {
  const datos = {
    orden: props.orden,
    totalUnidades: calcularTotalUnidades(),
    progreso: calcularProgresoGeneral(),
    materiales: obtenerMateriales(),
    costos: {
      tela: calcularCostoTela(),
      accesorios: calcularCostoAccesorios(),
      manoObra: calcularCostoManoObra(),
      total: calcularCostoTotal()
    }
  }
  
  const json = JSON.stringify(datos, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `orden_${props.orden?.consecutivo}_datos.json`
  link.click()
  URL.revokeObjectURL(url)
}

function imprimirOrden() {
  window.print()
}
</script>

<style scoped>
.visualizacion-orden-produccion {
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

/* Header visual de la orden */
.orden-header-visual {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-blue-bg), var(--bg-secondary));
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-blue);
}

/* Sección de imagen */
.orden-imagen-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.imagen-container {
  position: relative;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 2px solid var(--border-color);
  background-color: var(--bg-primary);
}

.imagen-orden {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.imagen-principal {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-fast);
}

.imagen-orden:hover .imagen-principal {
  transform: scale(1.05);
}

.imagen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.imagen-orden:hover .imagen-overlay {
  opacity: 1;
}

.btn-ampliar,
.btn-cambiar {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-ampliar:hover,
.btn-cambiar:hover {
  background-color: var(--primary-blue-dark);
  transform: translateY(-1px);
}

.sin-imagen {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-imagen {
  text-align: center;
  color: var(--text-secondary);
}

.placeholder-icono {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.placeholder-texto h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
}

.placeholder-texto p {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-sm);
}

.btn-subir-imagen {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--success);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-subir-imagen:hover {
  background-color: var(--success-dark);
  transform: translateY(-1px);
}

/* Miniaturas adicionales */
.miniaturas-adicionales h5 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.miniaturas-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.miniatura-item {
  cursor: pointer;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.miniatura-item:hover {
  border-color: var(--primary-blue);
  transform: scale(1.05);
}

.miniatura {
  width: 100%;
  height: 60px;
  object-fit: cover;
}

.miniatura-descripcion {
  display: block;
  padding: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-align: center;
  background-color: var(--bg-secondary);
}

/* Datos principales */
.orden-datos-principales {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.datos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.orden-titulo {
  color: var(--primary-blue-dark);
  font-size: var(--font-size-3xl);
  margin: 0;
  font-weight: 700;
}

.estado-orden-badge {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--font-size-sm);
}

.estado-orden-badge.completada {
  background-color: var(--success);
  color: white;
}

.estado-orden-badge.avanzada {
  background-color: var(--info);
  color: white;
}

.estado-orden-badge.en-proceso {
  background-color: var(--warning);
  color: white;
}

.estado-orden-badge.pendiente {
  background-color: var(--danger);
  color: white;
}

/* Grid de información principal */
.info-grid-principal {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.info-card {
  background-color: var(--bg-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.info-card.codigo {
  border-left: 4px solid var(--primary-blue);
}

.info-card.referencia {
  border-left: 4px solid var(--success);
}

.info-card.tela {
  border-left: 4px solid var(--warning);
}

.info-card.colores {
  border-left: 4px solid var(--info);
}

.info-card.cliente {
  border-left: 4px solid var(--purple);
}

.info-card.fechas {
  border-left: 4px solid var(--gray-600);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.info-valor {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.info-extra {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: 1.4;
}

.colores-visual {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.color-muestra {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.color-muestra:hover {
  transform: scale(1.2);
}

/* Métricas de la orden */
.metricas-orden {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.metrica-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.metrica-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.metrica-icono {
  font-size: 2rem;
  opacity: 0.8;
}

.metrica-numero {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-xs);
}

.metrica-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

/* Detalles expandidos */
.orden-detalles-expandidos {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);
}

.tabs-detalles {
  display: flex;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.tab-detalle {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  background-color: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
  border-bottom: 3px solid transparent;
}

.tab-detalle:hover {
  background-color: var(--bg-soft);
}

.tab-detalle.active {
  background-color: var(--primary-blue-bg);
  color: var(--primary-blue-dark);
  border-bottom-color: var(--primary-blue);
  font-weight: 600;
}

.tab-content {
  padding: var(--spacing-lg);
}

.tab-content h3 {
  color: var(--primary-blue-dark);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-xl);
}

/* Tabla de tallas */
.tabla-tallas-container {
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
}

.tabla-tallas {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.tabla-tallas th {
  background-color: var(--primary-blue);
  color: white;
  padding: var(--spacing-md);
  text-align: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.tabla-tallas td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  text-align: center;
  vertical-align: middle;
}

.fila-talla:hover {
  background-color: var(--bg-soft);
}

.celda-color {
  text-align: left !important;
}

.color-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.color-muestra-tabla {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  flex-shrink: 0;
}

.color-nombre {
  font-weight: 500;
  color: var(--text-primary);
}

.celda-cantidad {
  font-weight: 600;
  color: var(--text-primary);
}

.celda-total {
  font-weight: 700;
  color: var(--primary-blue-dark);
  background-color: var(--primary-blue-bg);
}

.progreso-detalle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.barra-progreso-detalle {
  flex: 1;
  height: 6px;
  background-color: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
  min-width: 60px;
}

.barra-relleno-detalle {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-blue), var(--primary-blue-dark));
  transition: width 0.3s ease;
}

.porcentaje-detalle {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-primary);
  min-width: 40px;
}

/* Resumen de tallas */
.resumen-tallas h4 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
}

.tallas-resumen-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-md);
}

.talla-resumen-item {
  background-color: var(--bg-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  text-align: center;
  transition: all var(--transition-fast);
}

.talla-resumen-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.talla-nombre {
  font-weight: 700;
  color: var(--primary-blue-dark);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xs);
}

.talla-cantidad {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.talla-porcentaje {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

/* Especificaciones */
.especificaciones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.spec-group {
  background-color: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.spec-group h4 {
  color: var(--primary-blue-dark);
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.spec-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--bg-soft);
  border-radius: var(--border-radius);
}

.spec-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.spec-valor {
  color: var(--text-primary);
  font-weight: 600;
}

/* Materiales */
.materiales-lista {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.material-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  align-items: center;
}

.material-nombre {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.material-descripcion {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.material-cantidad {
  text-align: center;
}

.cantidad-numero {
  font-weight: 700;
  color: var(--primary-blue-dark);
  font-size: var(--font-size-lg);
}

.cantidad-unidad {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.material-estado {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  text-align: center;
}

.material-estado.disponible {
  background-color: var(--success);
  color: white;
}

.material-estado.pendiente {
  background-color: var(--warning);
  color: white;
}

.material-estado.agotado {
  background-color: var(--danger);
  color: white;
}

/* Resumen de costos */
.resumen-materiales h4 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
}

.costos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.costo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.costo-item.total {
  grid-column: 1 / -1;
  background-color: var(--success-bg);
  border-color: var(--success);
  font-weight: 700;
}

.costo-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.costo-valor {
  color: var(--text-primary);
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.costo-item.total .costo-valor {
  color: var(--success-dark);
  font-size: var(--font-size-xl);
}

/* Historial */
.timeline-historial {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.evento-historial {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  align-items: center;
}

.evento-timestamp {
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

.evento-icono {
  font-size: var(--font-size-lg);
  padding: var(--spacing-sm);
  border-radius: 50%;
  background-color: var(--bg-soft);
}

.evento-icono.creacion {
  background-color: var(--success-bg);
}

.evento-icono.modificacion {
  background-color: var(--warning-bg);
}

.evento-icono.proceso {
  background-color: var(--info-bg);
}

.evento-titulo {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.evento-descripcion {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.evento-usuario {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-style: italic;
}

/* Acciones rápidas */
.acciones-rapidas {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.btn-accion {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-accion.editar {
  background-color: var(--primary-blue);
  color: white;
}

.btn-accion.duplicar {
  background-color: var(--info);
  color: white;
}

.btn-accion.exportar {
  background-color: var(--success);
  color: white;
}

.btn-accion.imprimir {
  background-color: var(--gray-600);
  color: white;
}

.btn-accion:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Modal de imagen */
.modal-imagen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-imagen-content {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.modal-imagen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.modal-imagen-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.btn-cerrar-modal {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-imagen-body {
  padding: var(--spacing-lg);
  display: flex;
  justify-content: center;
  align-items: center;
}

.imagen-ampliada {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.modal-imagen-footer {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.btn-descargar,
.btn-compartir {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-descargar {
  background-color: var(--success);
  color: white;
}

.btn-compartir {
  background-color: var(--info);
  color: white;
}

.btn-descargar:hover,
.btn-compartir:hover {
  transform: translateY(-1px);
}

/* Sin orden seleccionada */
.sin-orden-seleccionada {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  text-align: center;
}

.placeholder-container {
  padding: var(--spacing-xl);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 2px dashed var(--border-color);
  max-width: 500px;
}

.placeholder-icono-grande {
  font-size: 5rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.placeholder-container h3 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-xl);
}

.placeholder-container p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 1024px) {
  .orden-header-visual {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .info-grid-principal {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .metricas-orden {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .especificaciones-grid {
    grid-template-columns: 1fr;
  }
  
  .costos-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .tabs-detalles {
    flex-direction: column;
  }
  
  .info-grid-principal {
    grid-template-columns: 1fr;
  }
  
  .metricas-orden {
    grid-template-columns: 1fr;
  }
  
  .tallas-resumen-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .material-item {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .evento-historial {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .acciones-rapidas {
    flex-direction: column;
  }
}

@media print {
  .btn-accion,
  .imagen-overlay,
  .tabs-detalles {
    display: none !important;
  }
  
  .orden-header-visual {
    grid-template-columns: 1fr;
  }
  
  .tab-content {
    display: block !important;
  }
}
</style>
