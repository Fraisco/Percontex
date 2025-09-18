<template>
  <div class="proceso-extender-tela">
    <h2 class="titulo-seccion">Estado de Extender Tela</h2>

    <div class="selector-orden">
      <label for="ordenIdSeleccionada" class="label-selector">Buscar Orden por ID:</label>
      <input type="text" id="ordenIdSeleccionada" v-model="ordenIdSeleccionada" placeholder="Ingrese ID de la orden"
        class="input-selector" @input="buscarOrdenPorId" @focus="mostrarOrdenesGuardadas" />
      <ul v-if="mostrarListaOrdenes && ordenesGuardadasFiltradas.length > 0" class="lista-ordenes-guardadas">
        <li v-for="ordenGuardada in ordenesGuardadasFiltradas" :key="ordenGuardada.id"
          @click="seleccionarOrdenGuardada(ordenGuardada)" class="item-orden-guardada">
          {{ ordenGuardada.id }} - {{ ordenGuardada.consecutivo }}
        </li>
      </ul>
    </div>

    <div v-if="
      ordenSeleccionada &&
      ordenSeleccionada.estadoCorte.unidadesExtendidas &&
      ordenSeleccionada.estadoCorte.unidadesExtendidas.length > 0
    ">
      <!-- Visualización de Orden de Producción -->
      <div class="visualizacion-orden-section">
        <h3>📋 Visualización de Orden de Producción</h3>
        <VisualizacionOrdenProduccion :orden="ordenSeleccionada" :mostrar-detalle-completo="false"
          :compact-mode="true" />
      </div>

      <div class="info-orden-seleccionada">
        <h3>Orden Seleccionada: {{ ordenSeleccionada.id }}</h3>
        <p>Estado General: {{ obtenerEstadoGeneralOrden }}</p>
        <div v-if="ordenSeleccionada.estadoCorte?.fechaInicioExtension" class="timestamp-info">
          <p>
            <strong>Inicio Extensión:</strong>
            {{ formatearFechaHora(ordenSeleccionada.estadoCorte.fechaInicioExtension) }}
          </p>
        </div>
        <div v-if="ordenSeleccionada.estadoCorte?.fechaFinExtension" class="timestamp-info">
          <p>
            <strong>Fin Extensión:</strong>
            {{ formatearFechaHora(ordenSeleccionada.estadoCorte.fechaFinExtension) }}
          </p>
        </div>
      </div>

      <div class="opcion-aplica-extension">
        <label for="aplicaExtension" class="label-opcion">¿Aplica extensión de tela?</label>
        <select id="aplicaExtension" v-model="aplicaExtension" class="select-opcion">
          <option :value="true">Sí</option>
          <option :value="false">No</option>
        </select>
      </div>

      <div v-if="aplicaExtension">
        <div class="progreso-extension-container">
          <label class="label-progreso">Progreso de Extensión:</label>
          <div class="barra-progreso-fondo">
            <div class="barra-progreso" :style="{ width: progresoExtension + '%' }"></div>
          </div>
          <span class="porcentaje-progreso">{{ progresoExtension.toFixed(0) }}%</span>
        </div>

        <div class="tabla-container">
          <h3 class="subtitulo-tabla">Cantidad de Tela a Extender por Color</h3>
          <table class="tabla-datos">
            <thead class="tabla-cabecera">
              <tr>
                <th class="tabla-celda-cabecera">Color</th>
                <th class="tabla-celda-cabecera">Cantidad Total</th>
                <th class="tabla-celda-cabecera">Cantidad Extendida</th>
                <th class="tabla-celda-cabecera">Acciones</th>
              </tr>
            </thead>
            <tbody class="tabla-cuerpo">
              <tr v-for="(item, index) in detallesPorColor" :key="index">
                <td class="tabla-celda">
                  <span :style="{
                    backgroundColor: item.color,
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '1px solid #666',
                    marginRight: '6px',
                  }"></span>{{ getFriendlyColorName(item.color) }}
                </td>
                <td class="tabla-celda">{{ item.cantidadTotal }}</td>
                <td class="tabla-celda">{{ item.cantidadExtendida }}</td>
                <td class="tabla-celda">
                  <button @click="iniciarExtensionColor(item.color)" class="boton-accion">
                    Extender
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot class="tabla-pie">
              <tr>
                <td class="tabla-celda-pie">Total Extendida:</td>
                <td colspan="3" class="tabla-celda-pie">{{ totalExtendida }}</td>
              </tr>
              <tr>
                <td class="tabla-celda-pie">Total por Extender:</td>
                <td colspan="3" class="tabla-celda-pie">{{ totalPorExtender }}</td>
              </tr>
              <tr>
                <td class="tabla-celda-pie">Total Pedido:</td>
                <td colspan="3" class="tabla-celda-pie">{{ totalPedido }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="colorParaExtender" class="formulario-agregar-cantidad">
          <h4 class="subtitulo-formulario">
            Ingresar Cantidad Extendida para {{ getFriendlyColorName(colorParaExtender) }}
          </h4>
          <div class="campo-formulario">
            <label :for="'cantidadExtendida-' + colorParaExtender" class="label-formulario">Cantidad:</label>
            <input type="number" :id="'cantidadExtendida-' + colorParaExtender" v-model.number="nuevaCantidadExtendida"
              class="input-formulario" min="0" />
          </div>
          <div class="botones-formulario">
            <button @click="confirmarCantidadExtendida" class="boton-confirmar">
              Confirmar
            </button>
            <button @click="cancelarCantidadExtendida" class="boton-cancelar">
              Cancelar
            </button>
          </div>
        </div>
        <div v-else class="mensaje-info">
          Selecciona "Extender" para ingresar la cantidad extendida por color.
        </div>

        <div class="opcion-tela-extendida-toda">
          <label class="label-opcion">
            <input type="checkbox" class="checkbox-opcion" v-model="telaExtendidaTodaOrden"
              @change="actualizarTelaExtendidaTodaOrden" />
            <span class="texto-opcion">¿Toda la tela extendida?</span>
          </label>
        </div>

        <!-- Campos de Tiempo y Unidades -->
        <div class="campos-tiempo-unidades">
          <h4 class="subtitulo-tiempo">Control de Tiempo y Unidades</h4>
          <div class="formulario-tiempo">
            <div class="campo-tiempo">
              <label for="fecha_inicio_extender">Fecha y Hora de Inicio:</label>
              <input type="datetime-local" id="fecha_inicio_extender" v-model="tiemposExtension.fechaInicio"
                class="input-datetime" @change="validarFechas" />
            </div>
            <div class="campo-tiempo">
              <label for="fecha_fin_extender">Fecha y Hora de Fin:</label>
              <input type="datetime-local" id="fecha_fin_extender" v-model="tiemposExtension.fechaFin"
                class="input-datetime" :min="tiemposExtension.fechaInicio" @change="validarFechas" />
            </div>
            <div class="campo-tiempo">
              <label for="unidades_procesadas_extender">Unidades Procesadas:</label>
              <input type="number" id="unidades_procesadas_extender"
                v-model.number="tiemposExtension.unidadesProcesadas" class="input-unidades" min="0" :max="totalPedido"
                placeholder="Cantidad procesada" />
            </div>
          </div>
          <div v-if="errorValidacion" class="mensaje-error">
            {{ errorValidacion }}
          </div>
          <div v-if="tiempoTranscurrido" class="tiempo-transcurrido">
            <strong>Tiempo transcurrido:</strong> {{ tiempoTranscurrido }}
          </div>
        </div>

        <!-- Flujo entre Subprocesos -->
        <div class="flujo-subprocesos">
          <h4 class="subtitulo-flujo">Transferir a Siguiente Proceso</h4>
          <div class="formulario-transferencia">
            <div class="campo-transferencia">
              <label for="proceso_origen">Proceso Origen:</label>
              <select id="proceso_origen" v-model="transferenciaActual.procesoOrigen" class="select-proceso">
                <option value="">Seleccionar origen</option>
                <option value="extender_tela">Extender Tela</option>
                <option value="corte">Corte</option>
                <option value="numeracion">Numeración</option>
                <option value="fusionar">Fusionar</option>
                <option value="finalizar">Finalizar</option>
              </select>
            </div>
            <div class="campo-transferencia">
              <label for="proceso_destino">Proceso Destino:</label>
              <select id="proceso_destino" v-model="transferenciaActual.procesoDestino" class="select-proceso">
                <option value="">Seleccionar destino</option>
                <option value="extender_tela">Extender Tela</option>
                <option value="corte">Corte</option>
                <option value="numeracion">Numeración</option>
                <option value="fusionar">Fusionar</option>
                <option value="finalizar">Finalizar</option>
              </select>
            </div>
            <div class="campo-transferencia">
              <label for="cantidad_transferida">Cantidad a Transferir:</label>
              <input type="number" id="cantidad_transferida" v-model.number="transferenciaActual.cantidadTransferida"
                class="input-cantidad-transferencia" min="1" :max="tiemposExtension.unidadesProcesadas"
                placeholder="Cantidad" />
            </div>
            <div class="campo-transferencia">
              <label for="fecha_transferencia">Fecha y Hora de Transferencia:</label>
              <input type="datetime-local" id="fecha_transferencia" v-model="transferenciaActual.fechaTransferencia"
                class="input-datetime" />
            </div>
          </div>
          <div class="botones-transferencia">
            <button @click="registrarTransferencia" class="btn-transferir" :disabled="!puedeTransferir">
              Registrar Transferencia
            </button>
            <button @click="limpiarTransferencia" class="btn-limpiar-transferencia">
              Limpiar
            </button>
          </div>
        </div>

        <!-- Historial de Transferencias -->
        <div v-if="historialTransferencias.length > 0" class="historial-transferencias">
          <h4 class="subtitulo-historial">Historial de Transferencias</h4>
          <div class="lista-transferencias">
            <div v-for="(transferencia, index) in historialTransferencias" :key="index" class="item-transferencia">
              <div class="info-transferencia">
                <span class="flujo-proceso">{{ transferencia.procesoOrigen }} →
                  {{ transferencia.procesoDestino }}</span>
                <span class="cantidad-transferencia">{{ transferencia.cantidadTransferida }} unidades</span>
                <span class="fecha-transferencia">{{
                  formatearFecha(transferencia.fechaTransferencia)
                  }}</span>
              </div>
              <button @click="eliminarTransferencia(index)" class="btn-eliminar-transferencia">
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="estado-extension">
          <span class="label-estado">Estado de Extensión:</span>
          <span v-if="ordenSeleccionada.estadoCorte.telaExtendida" class="estado estado-completo">Completa</span>
          <span v-else class="estado estado-pendiente">Pendiente</span>
        </div>

        <div class="botones-principales">
          <button @click="guardarEstadoExtension" class="boton-guardar">
            Guardar Estado de Extensión
          </button>
          <button @click="abrirEditorRapido" class="boton-editor-rapido">
            Editor Rápido
          </button>
        </div>
      </div>
      <div v-else class="mensaje-no-aplica">
        La extensión de tela no aplica para esta orden.
      </div>
    </div>
    <div v-else class="mensaje-no-detalles">
      No hay detalles de producción para mostrar.
      <span v-if="ordenIdSeleccionada">Intentaste buscar la orden con ID: {{ ordenIdSeleccionada }}.</span>
      Por favor, ingresa el ID de una orden existente.
    </div>
  </div>

  <!-- EDITOR RÁPIDO -->
  <div v-if="editorRapidoActivo" class="editor-rapido-overlay">
    <div class="editor-rapido-modal">
      <div class="editor-rapido-header">
        <h3>Editor Rápido - Extensión de Tela</h3>
        <button @click="cerrarEditorRapido" class="btn-cerrar-editor">&times;</button>
      </div>

      <div class="editor-rapido-content">
        <!-- Búsqueda de orden -->
        <div class="busqueda-rapida">
          <label class="label-busqueda-rapida">Buscar Orden para Editar:</label>
          <div class="input-busqueda-container">
            <input type="text" v-model="busquedaRapida" @focus="mostrarBusquedaRapida" @blur="ocultarBusquedaRapida"
              placeholder="ID, Consecutivo o Referencia..." class="input-busqueda-rapida" />
            <ul v-if="mostrarResultadosRapidos && ordenesRapidasFiltradas.length > 0"
              class="resultados-busqueda-rapida">
              <li v-for="orden in ordenesRapidasFiltradas" :key="orden.id" @click="seleccionarOrdenRapida(orden)"
                class="resultado-busqueda-rapida">
                <strong>{{ orden.consecutivo }}</strong> -
                {{ orden.referencia_por_defecto }}
                <span class="orden-id">ID: {{ orden.id }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Datos de la orden seleccionada -->
        <div v-if="ordenRapida && !cargandoOrdenRapida" class="datos-orden-rapida">
          <div class="info-orden-rapida">
            <h4>
              {{ ordenRapida.consecutivo }} - {{ ordenRapida.referencia_por_defecto }}
            </h4>
            <p><strong>Encargado:</strong> {{ ordenRapida.encargado }}</p>
            <p><strong>Proveedor:</strong> {{ ordenRapida.proveedor }}</p>
          </div>

          <!-- Controles de extensión -->
          <div class="controles-extension-rapida">
            <div class="control-aplica-extension">
              <label>
                <input type="checkbox" v-model="aplicaExtensionRapida" />
                ¿Aplica extensión de tela?
              </label>
            </div>

            <div v-if="aplicaExtensionRapida" class="datos-extension-rapida">
              <div class="control-tela-extendida">
                <label>
                  <input type="checkbox" v-model="telaExtendidaTodaOrdenRapida" />
                  ¿Toda la tela extendida?
                </label>
              </div>

              <!-- Tabla de colores -->
              <div v-if="detallesPorColorRapida.length > 0" class="tabla-colores-rapida">
                <h5>Cantidad Extendida por Color:</h5>
                <table class="tabla-extension-rapida">
                  <thead>
                    <tr>
                      <th>Color</th>
                      <th>Total</th>
                      <th>Extendida</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in detallesPorColorRapida" :key="item.color">
                      <td>
                        <div class="color-preview" :style="{ backgroundColor: item.color }"></div>
                        {{ item.color }}
                      </td>
                      <td>{{ item.cantidadTotal }}</td>
                      <td>
                        <input type="number" :value="item.cantidadExtendida" @input="
                          actualizarCantidadExtendidaRapida(
                            item.color,
                            $event.target.value
                          )
                          " :max="item.cantidadTotal" min="0" class="input-cantidad-rapida" />
                      </td>
                      <td>
                        <button @click="
                          actualizarCantidadExtendidaRapida(
                            item.color,
                            item.cantidadTotal
                          )
                          " class="btn-completar-rapido">
                          Completar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="botones-editor-rapido">
            <button @click="guardarCambiosRapidos" class="btn-guardar-rapido">
              Guardar Cambios
            </button>
            <button @click="cerrarEditorRapido" class="btn-cancelar-rapido">
              Cancelar
            </button>
          </div>
        </div>

        <div v-else-if="cargandoOrdenRapida" class="cargando-orden">
          <p>Cargando datos de la orden...</p>
        </div>

        <div v-else class="sin-orden-seleccionada">
          <p>Busca y selecciona una orden para editar sus datos de extensión.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { ref, computed, onMounted, watch } from "vue";
import { useOrdenStore } from "../stores/ordenStore";
import { supabase } from "@/lib/supabaseClient";
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
  // Colores adicionales
  "#663399": "Púrpura Rebecca",
  "#4FD0FF": "Azul Profundo Cielo",
  "#FF6B6B": "Rojo Coral",
  "#4ECDC4": "Turquesa Claro",
  "#45B7D1": "Azul Cielo Suave",
  "#96CEB4": "Verde Menta",
  "#FFEAA7": "Amarillo Melocotón",
  "#F19CBB": "Rosa Pastel",
  "#A29BFE": "Lavanda Azul",
  "#6C5CE7": "Azul Violeta Medio",
  "#FD79A8": "Magenta Suave",
  "#E17055": "Terracota",
  "#00B894": "Verde Esmeralda",
  "#00CEC9": "Turquesa Vibrante",
  "#0984E3": "Azul Brillante",
  "#81ECEC": "Aqua Claro",
  "#74B9FF": "Azul Bebé",
  "#55A3FF": "Azul Cerúleo",
  "#FF7675": "Coral Vivo",
  "#FDCB6E": "Mostaza",
  // Colores de imágenes originales
  "#992E2E": "Rojo Ladrillo (de imágenes)",
  "#00D4F0": "Azul Cielo (de imágenes)",
  "#10EB00": "Verde Brillante (de imágenes)",
  "#C2BB00": "Mostaza Oscura (de imágenes)",
  "#B400CC": "Morado Eléctrico (de imágenes)",
  "#00FF7B": "Verde Aguamarina (de imágenes)",
  "#0048F0": "Azul Vívido (de imágenes)",
  "#F1EFEF": "Gris Claro (de imágenes)",
});

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
};

const colorDistance = (color1, color2) => {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
};

const baseColors = {
  "#FF0000": "Rojo",
  "#00FF00": "Verde Brillante",
  "#0000FF": "Azul",
  "#FFFF00": "Amarillo",
  "#FF00FF": "Magenta",
  "#00FFFF": "Cian",
  "#000000": "Negro",
  "#FFFFFF": "Blanco",
  "#808080": "Gris",
  "#800000": "Rojo Oscuro",
  "#008000": "Verde",
  "#000080": "Azul Marino",
  "#800080": "Púrpura",
  "#808000": "Verde Oliva",
  "#008080": "Verde Azulado",
  "#C0C0C0": "Plata",
  "#FFA500": "Naranja",
  "#FFC0CB": "Rosa",
  "#A52A2A": "Marrón",
  "#FFD700": "Dorado",
  "#90EE90": "Verde Claro",
  "#87CEEB": "Azul Cielo",
  "#DDA0DD": "Ciruela",
  "#F0E68C": "Caqui",
  "#E6E6FA": "Lavanda",
  "#D3D3D3": "Gris Claro",
  "#A9A9A9": "Gris Oscuro",
  "#F5F5DC": "Beige",
  "#FFFACD": "Amarillo Limón",
  "#FF6347": "Tomate",
  "#40E0D0": "Turquesa",
  "#EE82EE": "Violeta",
  "#F5DEB3": "Trigo",
  "#FF69B4": "Rosa Fuerte",
  "#CD853F": "Perú",
  "#DEB887": "Madera Clara",
  "#5F9EA0": "Azul Cadete",
  "#7FFF00": "Verde Chartreuse",
  "#D2691E": "Chocolate",
  "#FF7F50": "Coral",
  "#6495ED": "Azul Aciano",
  "#DC143C": "Carmesí",
  "#00008B": "Azul Marino Oscuro",
  "#008B8B": "Cian Oscuro",
  "#B8860B": "Vara de Oro Oscura",
  "#006400": "Verde Oscuro",
  "#FF8C00": "Naranja Oscuro",
  "#9932CC": "Orquídea Oscura",
  "#8B0000": "Rojo Oscuro",
  "#E9967A": "Salmón Oscuro",
  "#00CED1": "Turquesa Oscuro",
  "#9400D3": "Violeta Oscuro",
  "#FF1493": "Rosa Intenso",
  "#00BFFF": "Azul Cielo Profundo",
  "#32CD32": "Verde Lima",
  "#FFB6C1": "Rosa Claro",
  "#20B2AA": "Verde Mar Claro",
  "#87CEFA": "Azul Cielo Claro",
  "#98FB98": "Verde Pálido",
};

const getFriendlyColorName = (hexColor) => {
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

  if (colorMapping.value[normalizedHex]) {
    return colorMapping.value[normalizedHex];
  }
  if (baseColors[normalizedHex]) {
    return baseColors[normalizedHex];
  }

  const targetRgb = hexToRgb(normalizedHex);
  if (!targetRgb) {
    return normalizedHex;
  }

  let minDistance = Infinity;
  let closestName = "";

  for (const [hex, name] of Object.entries(baseColors)) {
    const rgb = hexToRgb(hex);
    if (rgb) {
      const distance = colorDistance(targetRgb, rgb);
      if (distance < minDistance) {
        minDistance = distance;
        closestName = name;
      }
    }
  }

  for (const [hex, name] of Object.entries(colorMapping.value)) {
    const rgb = hexToRgb(hex);
    if (rgb) {
      const distance = colorDistance(targetRgb, rgb);
      if (distance < minDistance) {
        minDistance = distance;
        closestName = name;
      }
    }
  }

  if (minDistance < 30) {
    return closestName;
  }

  const { r, g, b } = targetRgb;
  if (r > g && r > b) {
    if (r > 200) {
      return g > 150 && b > 150 ? "Rosa Claro" : g > 100 ? "Naranja Claro" : "Rojo Claro";
    } else if (r > 100) {
      return g > 100 && b > 100 ? "Gris Rojizo" : g > 50 ? "Marrón" : "Rojo Oscuro";
    } else {
      return "Rojo Muy Oscuro";
    }
  } else if (g > r && g > b) {
    if (g > 200) {
      return r > 150 && b > 150
        ? "Verde Muy Claro"
        : r > 100
          ? "Verde Amarillento"
          : "Verde Claro";
    } else if (g > 100) {
      return r > 100 && b > 100
        ? "Gris Verdoso"
        : r > 50
          ? "Verde Oliva"
          : "Verde Oscuro";
    } else {
      return "Verde Muy Oscuro";
    }
  } else if (b > r && b > g) {
    if (b > 200) {
      return r > 150 && g > 150
        ? "Azul Muy Claro"
        : r > 100
          ? "Azul Violeta"
          : "Azul Claro";
    } else if (b > 100) {
      return r > 100 && g > 100 ? "Gris Azulado" : g > 50 ? "Azul Verde" : "Azul Oscuro";
    } else {
      return "Azul Muy Oscuro";
    }
  } else {
    const avg = (r + g + b) / 3;
    if (avg > 200) {
      return "Gris Muy Claro";
    } else if (avg > 150) {
      return "Gris Claro";
    } else if (avg > 100) {
      return "Gris";
    } else if (avg > 50) {
      return "Gris Oscuro";
    } else {
      return "Gris Muy Oscuro";
    }
  }
};

const props = defineProps({ orden: Object });
const store = useOrdenStore();

// Estados reactivos y computados para la gestión de la orden seleccionada y la interfaz
const ordenSeleccionada = computed(() => props.orden || store.ordenSeleccionada);
const ordenIdSeleccionada = ref("");
const aplicaExtension = ref(false);
const telaExtendidaTodaOrden = ref(false);

// Estados para tiempo y unidades
const tiemposExtension = reactive({
  fechaInicio: "",
  fechaFin: "",
  unidadesProcesadas: 0,
});

// Estados para transferencias entre procesos
const transferenciaActual = reactive({
  procesoOrigen: "extender_tela",
  procesoDestino: "",
  cantidadTransferida: 0,
  fechaTransferencia: "",
});

const historialTransferencias = ref([]);
const errorValidacion = ref("");

// Calcula los detalles por color, incluyendo cantidad total y extendida
const detallesPorColor = computed(() => {
  if (ordenSeleccionada.value?.estadoCorte?.unidadesExtendidas) {
    console.log(ordenSeleccionada.value.estadoCorte.unidadesExtendidas);
    return ordenSeleccionada.value.estadoCorte.unidadesExtendidas.map((u) => ({
      color: u.color,
      cantidadTotal: u.total_cantidad,
      cantidadExtendida: u.total_extendidas,
      CantidadFaltante: u.unidades_faltantes,
    }));
  }
  return [];
});

const totalPedido = computed(() => {
  return detallesPorColor.value.reduce((sum, item) => sum + item.cantidadTotal, 0);
});

// Calcula el total de tela extendida sumando las cantidades extendidas por color
const totalExtendida = computed(() => {
  return detallesPorColor.value.reduce((sum, item) => sum + item.cantidadExtendida, 0);
});

// Calcula el total de tela que falta por extender
const totalPorExtender = computed(() => {
  return detallesPorColor.value.reduce((sum, item) => sum + item.CantidadFaltante, 0);
});

// Calcula el progreso de extensión en porcentaje
const progresoExtension = computed(() => {
  if (totalPedido.value <= 0 || totalExtendida.value <= 0) return 0;
  const progreso = (totalExtendida.value / totalPedido.value) * 100;
  return Math.min(Number(progreso.toFixed(1)), 100);
});

// Estados para la gestión de la extensión por color
const colorParaExtender = ref(null);
const nuevaCantidadExtendida = ref(0);

// Estados para Editor Rápido
const editorRapidoActivo = ref(false);
const busquedaRapida = ref("");
const ordenRapida = ref(null);
const mostrarResultadosRapidos = ref(false);
const cargandoOrdenRapida = ref(false);

// Datos de extensión para la orden rápida
const aplicaExtensionRapida = ref(false);
const telaExtendidaTodaOrdenRapida = ref(false);
const detallesPorColorRapida = ref([]);

// Estados para la búsqueda y selección de órdenes guardadas
const mostrarListaOrdenes = ref(false);
const ordenesGuardadasFiltradas = computed(() => {
  if (!mostrarListaOrdenes.value) {
    return [];
  }
  const filtro = ordenIdSeleccionada.value.toLowerCase();
  return store.ordenes.filter(
    (orden) =>
      orden.id.toLowerCase().includes(filtro) ||
      orden.consecutivo.toLowerCase().includes(filtro)
  );
});

// Búsqueda rápida para editor
const ordenesRapidasFiltradas = computed(() => {
  if (!busquedaRapida.value || busquedaRapida.value.length < 2) {
    return [];
  }
  const filtro = busquedaRapida.value.toLowerCase();
  return store.ordenes
    .filter(
      (orden) =>
        orden.id.toLowerCase().includes(filtro) ||
        orden.consecutivo.toLowerCase().includes(filtro) ||
        (orden.referenciaPorDefecto &&
          orden.referenciaPorDefecto.toLowerCase().includes(filtro))
    )
    .slice(0, 5); // Limitar a 5 resultados
});

// Estado general de la orden para mostrar en la interfaz
const obtenerEstadoGeneralOrden = computed(() => {
  if (!ordenSeleccionada.value?.estadoCorte) {
    return "Sin información de procesos";
  }
  const estado = ordenSeleccionada.value.estadoCorte;
  if (
    estado.telaExtendida &&
    estado.unidadesCortadas?.every((u) => u.total === u.cortadas) &&
    estado.unidadesNumeradas?.every((u) => u.total === u.numeradas) &&
    estado.unidadesFusionadas?.every((u) => u.total === u.fusionadas && u.aplica)
  ) {
    return "Proceso Completo";
  } else if (estado.telaExtendida) {
    return "Extensión Completa, otros procesos pendientes";
  } else {
    return "Extensión Pendiente";
  }
});
// Computed para validaciones
const tiempoTranscurrido = computed(() => {
  if (tiemposExtension.fechaInicio && tiemposExtension.fechaFin) {
    const inicio = new Date(tiemposExtension.fechaInicio);
    const fin = new Date(tiemposExtension.fechaFin);
    const diff = fin - inicio;

    if (diff > 0) {
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${horas}h ${minutos}m`;
    }
  }
  return null;
});

const puedeTransferir = computed(() => {
  return (
    transferenciaActual.procesoOrigen &&
    transferenciaActual.procesoDestino &&
    transferenciaActual.procesoOrigen !== transferenciaActual.procesoDestino &&
    transferenciaActual.cantidadTransferida > 0 &&
    transferenciaActual.cantidadTransferida <= tiemposExtension.unidadesProcesadas &&
    transferenciaActual.fechaTransferencia
  );
});

// Funciones para tiempo y validaciones
function validarFechas() {
  errorValidacion.value = "";

  if (tiemposExtension.fechaInicio && tiemposExtension.fechaFin) {
    const inicio = new Date(tiemposExtension.fechaInicio);
    const fin = new Date(tiemposExtension.fechaFin);

    if (fin <= inicio) {
      errorValidacion.value = "La fecha de fin debe ser posterior a la fecha de inicio";
      return false;
    }
  }

  if (tiemposExtension.unidadesProcesadas < 0) {
    errorValidacion.value = "Las unidades procesadas no pueden ser negativas";
    return false;
  }

  return true;
}

// Funciones para transferencias
function registrarTransferencia() {
  if (!puedeTransferir.value) {
    alert("Por favor, complete todos los campos de transferencia correctamente");
    return;
  }

  const nuevaTransferencia = {
    procesoOrigen: transferenciaActual.procesoOrigen,
    procesoDestino: transferenciaActual.procesoDestino,
    cantidadTransferida: transferenciaActual.cantidadTransferida,
    fechaTransferencia: transferenciaActual.fechaTransferencia,
    timestamp: new Date().toISOString(),
  };

  historialTransferencias.value.push(nuevaTransferencia);

  // Limpiar formulario de transferencia
  limpiarTransferencia();

  alert(
    `Transferencia registrada: ${nuevaTransferencia.cantidadTransferida} unidades de ${nuevaTransferencia.procesoOrigen} a ${nuevaTransferencia.procesoDestino}`
  );
}

function limpiarTransferencia() {
  transferenciaActual.procesoOrigen = "extender_tela";
  transferenciaActual.procesoDestino = "";
  transferenciaActual.cantidadTransferida = 0;
  transferenciaActual.fechaTransferencia = "";
}

function eliminarTransferencia(index) {
  historialTransferencias.value.splice(index, 1);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();
}

// Función para inicializar fecha y hora actual
function inicializarFechaActual() {
  const ahora = new Date();
  const pad = (n) => (n < 10 ? "0" + n : n);
  const localDatetime =
    ahora.getFullYear() +
    "-" +
    pad(ahora.getMonth() + 1) +
    "-" +
    pad(ahora.getDate()) +
    "T" +
    pad(ahora.getHours()) +
    ":" +
    pad(ahora.getMinutes());
  const fechaActual = localDatetime;
  if (!tiemposExtension.fechaInicio) {
    tiemposExtension.fechaInicio = fechaActual;
  }

  if (!transferenciaActual.fechaTransferencia) {
    transferenciaActual.fechaTransferencia = fechaActual;
  }
}

// Se ejecuta al montar el componente para inicializar los valores si hay una orden seleccionada
onMounted(() => {
  if (store.ordenSeleccionada) {
    ordenIdSeleccionada.value = store.ordenSeleccionada.id;
    aplicaExtension.value = store.ordenSeleccionada.estadoCorte?.aplicaExtension || false;
    telaExtendidaTodaOrden.value =
      store.ordenSeleccionada.estadoCorte?.telaExtendida || false;
    // Inicializa la cantidad extendida en detallesPorColor al montar
    if (store.ordenSeleccionada.estadoCorte?.unidadesExtendidasPorColor) {
      store.ordenSeleccionada.estadoCorte.unidadesExtendidas.forEach((extendida) => {
        const detalleColor = detallesPorColor.value.find(
          (d) => d.color === extendida.color
        );
        if (detalleColor) {
          detalleColor.cantidadExtendida = extendida.cantidadExtendida;
        }
      });
    }

    // Cargar datos de tiempo y unidades si existen
    const estadoExtension = store.ordenSeleccionada.estadoCorte?.tiemposExtension;
    if (estadoExtension) {
      tiemposExtension.fechaInicio = estadoExtension.fechaInicio || "";
      tiemposExtension.fechaFin = estadoExtension.fechaFin || "";
      tiemposExtension.unidadesProcesadas = estadoExtension.unidadesProcesadas || 0;
    }

    // Cargar historial de transferencias si existe
    const transferencias = store.ordenSeleccionada.estadoCorte?.transferenciasExtension;
    if (transferencias) {
      historialTransferencias.value = [...transferencias];
    }

    // Inicializa la cantidad extendida en detallesPorColor al montar
    if (store.ordenSeleccionada.estadoCorte?.unidadesExtendidasPorColor) {
      store.ordenSeleccionada.estadoCorte.unidadesExtendidasPorColor.forEach(
        (extendida) => {
          const detalleColor = detallesPorColor.value.find(
            (d) => d.color === extendida.color
          );
          if (detalleColor) {
            detalleColor.cantidadExtendida = extendida.cantidadExtendida;
          }
        }
      );
    }
  }

  // Inicializar fechas actuales
  inicializarFechaActual();
});

// Observa cambios en 'aplicaExtension' para actualizar el estado de corte en el store
watch(aplicaExtension, (nuevoValor) => {
  if (store.ordenSeleccionada) {
    store.actualizarEstadoCorte(store.ordenSeleccionada.id, {
      ...store.ordenSeleccionada.estadoCorte,
      aplicaExtension: nuevoValor,
      telaExtendida: nuevoValor ? telaExtendidaTodaOrden.value : false,
    });
    if (!nuevoValor) {
      telaExtendidaTodaOrden.value = false;
    }
  }
});

// Observa cambios en 'telaExtendidaTodaOrden' para actualizar el estado de corte en el store
watch(telaExtendidaTodaOrden, (nuevoValor) => {
  if (store.ordenSeleccionada && aplicaExtension.value) {
    store.actualizarEstadoCorte(store.ordenSeleccionada.id, {
      ...store.ordenSeleccionada.estadoCorte,
      telaExtendida: nuevoValor,
    });
  }
});

// Función para buscar una orden por su ID
function buscarOrdenPorId() {
  mostrarListaOrdenes.value = true;
  if (ordenIdSeleccionada.value) {
    const orden = store.obtenerOrdenPorId(ordenIdSeleccionada.value);
    if (orden) {
      store.seleccionarOrden(orden);
      mostrarListaOrdenes.value = false;
    }
  } else {
    store.limpiarOrden();
  }
}

// Función para mostrar la lista de órdenes guardadas al enfocar el input de búsqueda
function mostrarOrdenesGuardadas() {
  mostrarListaOrdenes.value = true;
}

// Función para seleccionar una orden guardada de la lista
function seleccionarOrdenGuardada(orden) {
  store.seleccionarOrden(orden);
  ordenIdSeleccionada.value = orden.id;
  mostrarListaOrdenes.value = false;
}

// Función que se llama al hacer clic en el botón "Extender" de un color
function iniciarExtensionColor(color) {
  colorParaExtender.value = color;
  nuevaCantidadExtendida.value = 0;
}

// Función para confirmar la cantidad extendida de un color
function confirmarCantidadExtendida() {
  if (!colorParaExtender.value || !ordenSeleccionada.value?.id) {
    colorParaExtender.value = null;
    nuevaCantidadExtendida.value = 0;
    return;
  }

  const estado = ordenSeleccionada.value.estadoCorte || {};
  const unidades = Array.isArray(estado.unidadesExtendidas)
    ? estado.unidadesExtendidas
    : [];
  const idx = unidades.findIndex((u) => u.color === colorParaExtender.value);
  if (idx === -1) {
    colorParaExtender.value = null;
    nuevaCantidadExtendida.value = 0;
    return;
  }

  const actual = unidades[idx];

  const total = Number(actual.total_cantidad ?? 0);
  const extendidaActual = Number(actual.total_extendidas ?? 0);
  const delta = Number(nuevaCantidadExtendida.value ?? 0);

  // Validaciones
  if (!Number.isFinite(delta)) {
    alert("Cantidad inválida");
    return;
  }
  if (delta < 0 && Math.abs(delta) > extendidaActual) {
    alert("No puedes reducir más de lo ya extendido");
    return;
  }

  // Calcular nuevo extendido (clamp 0..total)
  const nuevoExtendido = Math.max(0, Math.min(extendidaActual + delta, total));
  const nuevoFaltante = Math.max(0, total - nuevoExtendido);

  // Importante: crear un nuevo array y nuevo objeto para asegurar reactividad
  const nuevasUnidades = [...unidades];
  nuevasUnidades[idx] = {
    ...actual,
    total_extendidas: nuevoExtendido,
    unidades_faltantes: nuevoFaltante,
  };

  // Persistir en el store para disparar recomputes
  store.actualizarEstadoCorte(ordenSeleccionada.value.id, {
    ...estado,
    unidadesExtendidas: nuevasUnidades,
    // Opcional: marcar telaExtendida si todo está completo
    telaExtendida: nuevasUnidades.every(
      (u) => Number(u.total_extendidas ?? 0) >= Number(u.total_cantidad ?? 0)
    ),
  });

  // Limpiar formulario
  colorParaExtender.value = null;
  nuevaCantidadExtendida.value = 0;
}
// Función para cancelar la entrada de la cantidad extendida
function cancelarCantidadExtendida() {
  colorParaExtender.value = null;
  nuevaCantidadExtendida.value = 0;
}

// Función para actualizar el estado de tela extendida para toda la orden
function actualizarTelaExtendidaTodaOrden() {
  if (store.ordenSeleccionada && aplicaExtension.value) {
    store.actualizarEstadoCorte(store.ordenSeleccionada.id, {
      ...store.ordenSeleccionada.estadoCorte,
      telaExtendida: telaExtendidaTodaOrden.value,
    });
  }
}

// Función para guardar el estado de extensión de la orden
async function guardarEstadoExtension() {
  if (!ordenSeleccionada.value?.id) return;

  const unidadesExtendidas = detallesPorColor.value.map((detalle) => ({
    id: detalle.id_consecutivo,
    color: detalle.color,
    total_extendidas: detalle.cantidadExtendida,
    unidades_faltantes: detalle.CantidadFaltante,
  }));

  try {
    // Llamar función SQL directamente
    const { data, error } = await supabase.rpc("actualizar_tela", {
      unidades_data: unidadesExtendidas,
    });

    if (error) {
      console.error("❌ Error de Supabase:", error);
      return;
    }

    console.log("✅ Unidades extendidas actualizadas:", data);
    alert("Tela actualizada");
  } catch (error) {
    console.error("❌ Error al guardar estado de unidades extendidas", error);
  }
}

// === FUNCIONES PARA EDITOR RÁPIDO ===
function abrirEditorRapido() {
  editorRapidoActivo.value = true;
  busquedaRapida.value = "";
  ordenRapida.value = null;
}

function cerrarEditorRapido() {
  editorRapidoActivo.value = false;
  busquedaRapida.value = "";
  ordenRapida.value = null;
  mostrarResultadosRapidos.value = false;
  limpiarDatosRapidos();
}

function mostrarBusquedaRapida() {
  mostrarResultadosRapidos.value = true;
}

function ocultarBusquedaRapida() {
  setTimeout(() => {
    mostrarResultadosRapidos.value = false;
  }, 200);
}

function seleccionarOrdenRapida(orden) {
  cargandoOrdenRapida.value = true;
  ordenRapida.value = orden;
  busquedaRapida.value = `${orden.consecutivo} - ${orden.referenciaPorDefecto}`;
  mostrarResultadosRapidos.value = false;

  // Cargar datos de extensión de la orden seleccionada
  cargarDatosExtensionRapida(orden);
  cargandoOrdenRapida.value = false;
}

function cargarDatosExtensionRapida(orden) {
  aplicaExtensionRapida.value = orden.estadoCorte?.aplicaExtension || false;
  telaExtendidaTodaOrdenRapida.value = orden.estadoCorte?.telaExtendida || false;

  // Calcular detalles por color para la orden rápida
  if (orden?.detalles) {
    const colores = {};
    orden.detalles.forEach((detalle) => {
      if (!colores[detalle.color]) {
        colores[detalle.color] = {
          color: detalle.color,
          cantidadTotal: 0,
          cantidadExtendida: 0,
        };
      }
      colores[detalle.color].cantidadTotal += calcularCantidadTotalDetalle(detalle);
      // Busca si ya hay información extendida para este color
      const extendidoExistente = orden.estadoCorte?.unidadesExtendidasPorColor?.find(
        (e) => e.color === detalle.color
      );
      if (extendidoExistente) {
        colores[detalle.color].cantidadExtendida = extendidoExistente.cantidadExtendida;
      }
    });
    detallesPorColorRapida.value = Object.values(colores);
  } else {
    detallesPorColorRapida.value = [];
  }
}

function limpiarDatosRapidos() {
  aplicaExtensionRapida.value = false;
  telaExtendidaTodaOrdenRapida.value = false;
  detallesPorColorRapida.value = [];
}

function actualizarCantidadExtendidaRapida(color, nuevaCantidad) {
  const detalleIndex = detallesPorColorRapida.value.findIndex((d) => d.color === color);
  if (detalleIndex !== -1) {
    detallesPorColorRapida.value[detalleIndex].cantidadExtendida = Math.max(
      0,
      Math.min(nuevaCantidad, detallesPorColorRapida.value[detalleIndex].cantidadTotal)
    );
  }
}

function guardarCambiosRapidos() {
  if (!ordenRapida.value) {
    alert("No hay orden seleccionada para guardar.");
    return;
  }

  const unidadesExtendidasPorColorParaGuardar = detallesPorColorRapida.value.map((u) => ({
    color: u.color,
    cantidadExtendida: u.cantidadExtendida,
  }));

  // Actualizar el estado de corte en el store
  store.actualizarEstadoCorte(ordenRapida.value.id, {
    ...ordenRapida.value.estadoCorte,
    aplicaExtension: aplicaExtensionRapida.value,
    telaExtendida: telaExtendidaTodaOrdenRapida.value,
    unidadesExtendidasPorColor: unidadesExtendidasPorColorParaGuardar,
  });

  alert(`Cambios guardados para la orden ${ordenRapida.value.consecutivo}`);
  cerrarEditorRapido();
}
</script>

<style>
.proceso-extender-tela {
  font-family: var(--font-family);
  padding: var(--spacing-xl);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.titulo-proceso {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
  color: var(--primary-blue-dark);
  text-align: center;
}

.selector-orden {
  margin-bottom: var(--spacing-xl);
  background-color: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  position: relative;
}

.label-selector {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-base);
}

.select-orden-input {
  width: 100%;
  border: 2px solid var(--border-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  transition: all var(--transition-fast);
  box-sizing: border-box;
}

.lista-ordenes-guardadas {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 6px 6px;
  margin-top: 2px;
  padding: 0;
  list-style: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  /* Asegurar que esté por encima de otros elementos */
}

.item-orden-guardada {
  padding: 10px 15px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333;
  /* Letra negra */
}

.item-orden-guardada:hover {
  background-color: #f0f0f0;
}

.info-orden-seleccionada {
  margin-bottom: 25px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.info-orden-seleccionada h3 {
  margin-top: 0;
  color: #1e3a8a;
  /* Azul más intenso */
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.info-orden-seleccionada p {
  margin-bottom: 5px;
  color: #333;
  /* Letra negra */
  font-size: 1rem;
}

.opcion-aplica-extension {
  margin-bottom: 25px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.label-aplica-extension {
  display: block;
  font-weight: 500;
  color: #333;
  /* Letra negra */
  margin-bottom: 10px;
  font-size: 1.05rem;
}

.select-aplica-extension {
  width: auto;
  border: 1px solid #ccc;
  padding: 12px;
  border-radius: 6px;
  font-size: 1rem;
  color: #333;
  /* Letra negra (por defecto) */
}

.progreso-extension-container {
  margin-bottom: 30px;
}

.label-progreso {
  display: block;
  font-weight: 500;
  color: #333;
  /* Letra negra */
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.barra-progreso-fondo {
  background-color: #e0e0e0;
  border-radius: 8px;
  height: 12px;
  overflow: hidden;
}

.barra-progreso {
  background-color: #1e3a8a;
  /* Azul más intenso */
  height: 100%;
  border-radius: 8px;
  transition: width 0.4s ease-out;
}

.porcentaje-progreso {
  font-size: 1rem;
  color: #333;
  /* Letra negra */
  margin-left: 10px;
  font-weight: bold;
}

.titulo-cantidad-color {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 15px;
  color: #1e3a8a;
  /* Azul más intenso */
}

.tabla-container {
  overflow-x: auto;
  margin-bottom: 20px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tabla-datos {
  width: 100%;
  border-collapse: collapse;
}

.tabla-cabecera {
  background-color: #f0f0f0;
  color: #1e3a8a;
  /* Azul más intenso */
  font-weight: bold;
}

.tabla-celda-cabecera {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 2px solid #ccc;
  color: #333;
  /* Letra negra */
}

.tabla-cuerpo tr:nth-child(even) {
  background-color: #f9f9f9;
}

.tabla-celda {
  padding: 10px 15px;
  color: #333;
  /* Letra negra */
}

.boton-agregar {
  background-color: #4285f4;
  /* Azul Google */
  color: white;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
}

.boton-agregar:hover {
  background-color: #357ae8;
}

.tabla-pie {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
  /* Letra negra */
}

.tabla-celda-pie {
  padding: 12px 15px;
  text-align: left;
  color: #333;
  /* Letra negra */
}

.tabla-celda-pie.total-extendido {
  text-align: right;
  color: #1e3a8a;
  /* Azul más intenso */
}

.titulo-agregar-cantidad {
  font-size: 1.3rem;
  font-weight: bold;
  margin-top: 25px;
  margin-bottom: 15px;
  color: #1e3a8a;
  /* Azul más intenso */
}

.formulario-agregar-cantidad {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.label-cantidad-agregar {
  font-weight: bold;
  color: #333;
  /* Letra negra */
  margin-right: 10px;
}

.input-cantidad-agregar {
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 4px;
  font-size: 16px;
  color: #333;
  /* Letra negra */
  width: 80px;
  margin-right: 15px;
}

.boton-confirmar {
  background-color: #388e3c;
  /* Verde */
  color: white;
  font-weight: bold;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
}

.boton-confirmar:hover {
  background-color: #2e7d32;
}

.boton-cancelar {
  background-color: #e53935;
  /* Rojo */
  color: white;
  font-weight: bold;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  margin-left: 10px;
  transition: background-color 0.2s ease;
}

.boton-cancelar:hover {
  background-color: #d32f2f;
}

.mensaje-seleccionar-agregar {
  color: #333;
  /* Letra negra */
  font-style: italic;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.opcion-tela-extendida-toda {
  margin-top: 25px;
  margin-bottom: 20px;
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
}

.label-tela-extendida-toda {
  display: flex;
  align-items: center;
}

.checkbox-tela-extendida {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.texto-tela-extendida-toda {
  font-weight: bold;
  color: #333;
  /* Letra negra */
  font-size: 1.1rem;
}

.estado-extension {
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.label-estado-extension {
  font-weight: bold;
  color: #333;
  /* Letra negra */
  margin-right: 10px;
  font-size: 1.1rem;
}

.estado-extendida {
  color: #2e7d32;
  /* Verde oscuro */
  font-weight: bold;
  font-size: 1.1rem;
}

.estado-pendiente {
  color: #ffca28;
  /* Amarillo */
  font-weight: bold;
  font-size: 1.1rem;
}

.boton-guardar-estado {
  background-color: #1e3a8a;
  /* Azul más intenso */
  color: white;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  margin-top: 30px;
  transition: background-color 0.2s ease;
}

.boton-guardar-estado:hover {
  background-color: #15275e;
}

.mensaje-no-aplica-extension {
  color: #333;
  /* Letra negra */
  font-style: italic;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #eee;
  margin-top: 20px;
}

.mensaje-no-detalles {
  color: #333;
  /* Letra negra */
  background-color: #ffebee;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #ef9a9a;
  margin-top: 20px;
  font-weight: bold;
}

/* Títulos y subtítulos en azul */
.titulo-seccion,
h2,
h3,
h4,
.label-progreso,
.label-opcion,
.label-estado,
.subtitulo-tabla,
.subtitulo-formulario {
  color: #1e3a8a;
  font-weight: 600;
}

/* Texto secundario */
p,
span,
.label-selector,
.input-selector,
.checkbox-opcion,
.texto-opcion,
.tabla-celda,
.tabla-celda-pie,
.mensaje-info,
.mensaje-no-aplica,
.mensaje-no-detalles {
  color: #333;
}

/* Ajuste general para mantener buen diseño UX/UI */
.label-selector,
.label-opcion,
.label-formulario,
.label-estado {
  font-size: 1.05rem;
  margin-bottom: 5px;
  display: block;
}

.subtitulo-tabla,
.subtitulo-formulario {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

input[type="text"],
input[type="number"],
select {
  color: #333;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
}

.barra-progreso-fondo {
  background-color: #e0e0e0;
  border-radius: 4px;
  height: 16px;
  overflow: hidden;
}

.barra-progreso {
  background-color: #1e3a8a;
  height: 100%;
  transition: width 0.3s ease-in-out;
}

.porcentaje-progreso {
  font-weight: 500;
  margin-top: 5px;
  display: block;
  color: #1e3a8a;
}

.estado-completo {
  color: green;
  font-weight: 600;
}

.estado-pendiente {
  color: crimson;
  font-weight: 600;
}

.boton-accion,
.boton-confirmar,
.boton-cancelar,
.boton-guardar {
  background-color: #1e3a8a;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 5px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.boton-accion:hover,
.boton-confirmar:hover,
.boton-cancelar:hover,
.boton-guardar:hover {
  background-color: var(--primary-blue-dark);
  transform: translateY(-1px);
}

/* Botones principales */
.botones-principales {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.boton-editor-rapido {
  background-color: var(--warning);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 600;
  transition: all var(--transition-fast);
}

.boton-editor-rapido:hover {
  background-color: var(--warning-dark);
  transform: translateY(-1px);
}

/* === ESTILOS PARA EDITOR RÁPIDO === */
.editor-rapido-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.editor-rapido-modal {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.editor-rapido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--primary-blue);
  color: white;
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.editor-rapido-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
}

.btn-cerrar-editor {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-rapido-content {
  padding: var(--spacing-lg);
}

/* Búsqueda rápida */
.busqueda-rapida {
  margin-bottom: var(--spacing-lg);
}

.label-busqueda-rapida {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.input-busqueda-container {
  position: relative;
}

.input-busqueda-rapida {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.input-busqueda-rapida:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.resultados-busqueda-rapida {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  box-shadow: var(--shadow-md);
}

.resultado-busqueda-rapida {
  padding: var(--spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-fast);
}

.resultado-busqueda-rapida:hover {
  background-color: var(--gray-50);
}

.resultado-busqueda-rapida:last-child {
  border-bottom: none;
}

.orden-id {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

/* Datos de orden rápida */
.datos-orden-rapida {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
}

.info-orden-rapida {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
}

.info-orden-rapida h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--primary-blue-dark);
}

.info-orden-rapida p {
  margin: var(--spacing-xs) 0;
  color: var(--text-primary);
}

/* Controles de extensión rápida */
.controles-extension-rapida {
  margin-bottom: var(--spacing-lg);
}

.control-aplica-extension,
.control-tela-extendida {
  margin-bottom: var(--spacing-md);
}

.control-aplica-extension label,
.control-tela-extendida label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
}

.datos-extension-rapida {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

/* Tabla de colores rápida */
.tabla-colores-rapida {
  margin-top: var(--spacing-md);
}

.tabla-colores-rapida h5 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--primary-blue-dark);
}

.tabla-extension-rapida {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.tabla-extension-rapida th {
  background-color: var(--primary-blue);
  color: white;
  padding: var(--spacing-sm);
  text-align: left;
  font-weight: 600;
}

.tabla-extension-rapida td {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.input-cantidad-rapida {
  width: 80px;
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  text-align: center;
}

.btn-completar-rapido {
  background-color: var(--success);
  color: white;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.btn-completar-rapido:hover {
  background-color: var(--success-dark);
}

/* Botones del editor rápido */
.botones-editor-rapido {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.btn-guardar-rapido {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-guardar-rapido:hover {
  background-color: var(--primary-blue-dark);
  transform: translateY(-1px);
}

.btn-cancelar-rapido {
  background-color: var(--gray-600);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-cancelar-rapido:hover {
  background-color: var(--gray-700);
  transform: translateY(-1px);
}

/* Estados del editor */
.cargando-orden,
.sin-orden-seleccionada {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--text-secondary);
  font-style: italic;
}

/* Color preview en tabla rápida */
.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  display: inline-block;
  margin-right: var(--spacing-xs);
  vertical-align: middle;
}

/* Clase específica para mantener funcionalidad */
.select-opcion {
  width: 50%;
}

.controles-extension input {
  width: 120px;
}

/* Responsive para editor rápido */
/* === ESTILOS PARA CAMPOS DE TIEMPO Y UNIDADES === */
.campos-tiempo-unidades {
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #f8faff, #e8f2ff);
  border-radius: var(--border-radius);
  border: 2px solid var(--primary-blue-light);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.subtitulo-tiempo {
  font-size: var(--font-size-lg);
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
  text-align: center;
  border-bottom: 2px solid var(--primary-blue-light);
  padding-bottom: var(--spacing-sm);
}

.formulario-tiempo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.campo-tiempo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.campo-tiempo label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.input-datetime,
.input-unidades {
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.input-datetime:focus,
.input-unidades:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.mensaje-error {
  background-color: var(--danger-bg);
  color: var(--danger);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--danger-border);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.tiempo-transcurrido {
  background-color: var(--success-bg);
  color: var(--success-dark);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  border: 1px solid var(--success-border);
  text-align: center;
  font-size: var(--font-size-base);
}

/* === ESTILOS PARA FLUJO ENTRE SUBPROCESOS === */
.flujo-subprocesos {
  margin: var(--spacing-xl) 0;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #fff8f0, #fff0e6);
  border-radius: var(--border-radius);
  border: 2px solid var(--warning-light);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.subtitulo-flujo {
  font-size: var(--font-size-lg);
  color: var(--warning-dark);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
  text-align: center;
  border-bottom: 2px solid var(--warning-light);
  padding-bottom: var(--spacing-sm);
}

.formulario-transferencia {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.campo-transferencia {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.campo-transferencia label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.select-proceso,
.input-cantidad-transferencia {
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.select-proceso:focus,
.input-cantidad-transferencia:focus {
  border-color: var(--warning);
  outline: none;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.botones-transferencia {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.btn-transferir {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 600;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-transferir:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--success-dark), #047857);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

.btn-transferir:disabled {
  background: var(--gray-400);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-limpiar-transferencia {
  background: linear-gradient(135deg, var(--gray-600), var(--gray-700));
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 600;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(75, 85, 99, 0.3);
}

.btn-limpiar-transferencia:hover {
  background: linear-gradient(135deg, var(--gray-700), var(--gray-800));
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(75, 85, 99, 0.4);
}

/* === ESTILOS PARA HISTORIAL DE TRANSFERENCIAS === */
.historial-transferencias {
  margin: var(--spacing-xl) 0;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #f0fdf9, #e6fffa);
  border-radius: var(--border-radius);
  border: 2px solid var(--success-light);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
}

.subtitulo-historial {
  font-size: var(--font-size-lg);
  color: var(--success-dark);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
  text-align: center;
  border-bottom: 2px solid var(--success-light);
  padding-bottom: var(--spacing-sm);
}

.lista-transferencias {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.item-transferencia {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all var(--transition-fast);
}

.item-transferencia:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.info-transferencia {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.flujo-proceso {
  font-weight: 600;
  color: var(--primary-blue-dark);
  font-size: var(--font-size-base);
}

.cantidad-transferencia {
  color: var(--success-dark);
  font-weight: 500;
  font-size: var(--font-size-sm);
}

.fecha-transferencia {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

.btn-eliminar-transferencia {
  background-color: var(--danger);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: var(--font-size-lg);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.btn-eliminar-transferencia:hover {
  background-color: var(--danger-dark);
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 768px) {
  .editor-rapido-modal {
    width: 95%;
    margin: var(--spacing-md);
  }

  .botones-principales,
  .botones-editor-rapido {
    flex-direction: column;
  }

  .tabla-extension-rapida {
    font-size: var(--font-size-sm);
  }

  .tabla-extension-rapida th,
  .tabla-extension-rapida td {
    padding: var(--spacing-xs);
  }

  .formulario-tiempo,
  .formulario-transferencia {
    grid-template-columns: 1fr;
  }

  .botones-transferencia {
    flex-direction: column;
  }

  .item-transferencia {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .btn-eliminar-transferencia {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {

  .campos-tiempo-unidades,
  .flujo-subprocesos,
  .historial-transferencias {
    margin: var(--spacing-md) 0;
    padding: var(--spacing-md);
  }

  .subtitulo-tiempo,
  .subtitulo-flujo,
  .subtitulo-historial {
    font-size: var(--font-size-base);
  }
}
</style>
