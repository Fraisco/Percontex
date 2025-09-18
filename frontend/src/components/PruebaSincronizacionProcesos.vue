<template>
  <div class="prueba-procesos">
    <h2 class="titulo-prueba">🔧 Verificación de Procesos Individuales</h2>
    
    <div class="panel-orden">
      <h3>Orden de Prueba</h3>
      <div class="orden-info">
        <p><strong>ID:</strong> {{ ordenPrueba?.id }}</p>
        <p><strong>Consecutivo:</strong> {{ ordenPrueba?.consecutivo }}</p>
        <p><strong>Total:</strong> {{ calcularTotalPedido(ordenPrueba) }} unidades</p>
      </div>
      
      <div class="progreso-actual" v-if="ordenPrueba">
        <h4>Estado Actual:</h4>
        <div class="estado-item">
          <span>Extensión:</span>
          <span :class="{ 'completo': ordenPrueba.estadoCorte?.telaExtendida }">
            {{ ordenPrueba.estadoCorte?.telaExtendida ? 'Completa' : 'Pendiente' }}
          </span>
        </div>
        <div class="estado-item">
          <span>Corte:</span>
          <span>{{ calcularUnidadesCortadas(ordenPrueba) }} / {{ calcularTotalPedido(ordenPrueba) }} ({{ calcularPorcentajeCorte(ordenPrueba).toFixed(1) }}%)</span>
        </div>
        <div class="estado-item">
          <span>Numeración:</span>
          <span>{{ calcularUnidadesNumeradas(ordenPrueba) }} / {{ calcularTotalPedido(ordenPrueba) }} ({{ calcularPorcentajeNumeracion(ordenPrueba).toFixed(1) }}%)</span>
        </div>
        <div class="estado-item">
          <span>Fusión:</span>
          <span>{{ calcularUnidadesFusionadas(ordenPrueba) }} / {{ calcularTotalFusionAplicable(ordenPrueba) }} ({{ calcularPorcentajeFusion(ordenPrueba).toFixed(1) }}%)</span>
        </div>
      </div>
    </div>

    <div class="panel-pruebas">
      <h3>Pruebas de Actualización</h3>
      
      <!-- Prueba Extensión -->
      <div class="prueba-seccion">
        <h4>🧵 Prueba ExtenderTela</h4>
        <div class="prueba-controles">
          <label>
            <input type="checkbox" v-model="aplicaExtension" @change="actualizarExtension" />
            ¿Aplica extensión?
          </label>
          <label>
            <input type="checkbox" v-model="telaExtendida" @change="actualizarExtension" :disabled="!aplicaExtension" />
            ¿Tela extendida?
          </label>
          <button @click="probarExtension" class="btn-probar">Probar Actualización</button>
        </div>
      </div>

      <!-- Prueba Corte -->
      <div class="prueba-seccion">
        <h4>✂️ Prueba Corte</h4>
        <div class="prueba-controles">
          <div v-if="ordenPrueba?.detalles" class="controles-corte">
            <div v-for="detalle in ordenPrueba.detalles" :key="detalle.color" class="detalle-color">
              <h5>Color: {{ detalle.color }}</h5>
              <div v-for="(cantidad, talla) in detalle.tallas" :key="talla" class="control-talla">
                <label>{{ talla }}:</label>
                <input 
                  type="number" 
                  :value="obtenerCantidadCortada(detalle.color, talla)"
                  @input="actualizarCortada(detalle.color, talla, $event.target.value)"
                  :max="cantidad"
                  min="0"
                  class="input-cantidad"
                />
                <span>/ {{ cantidad }}</span>
              </div>
            </div>
          </div>
          <button @click="guardarCorte" class="btn-guardar">Guardar Corte</button>
        </div>
      </div>

      <!-- Prueba Numeración -->
      <div class="prueba-seccion">
        <h4>🔢 Prueba Numeración</h4>
        <div class="prueba-controles">
          <div v-if="ordenPrueba?.detalles" class="controles-numeracion">
            <div v-for="detalle in ordenPrueba.detalles" :key="detalle.color" class="detalle-color">
              <h5>Color: {{ detalle.color }}</h5>
              <div v-for="(cantidad, talla) in detalle.tallas" :key="talla" class="control-talla">
                <label>{{ talla }}:</label>
                <input 
                  type="number" 
                  :value="obtenerCantidadNumerada(detalle.color, talla)"
                  @input="actualizarNumerada(detalle.color, talla, $event.target.value)"
                  :max="cantidad"
                  min="0"
                  class="input-cantidad"
                />
                <span>/ {{ cantidad }}</span>
              </div>
            </div>
          </div>
          <button @click="guardarNumeracion" class="btn-guardar">Guardar Numeración</button>
        </div>
      </div>

      <!-- Prueba Fusión -->
      <div class="prueba-seccion">
        <h4>🔗 Prueba Fusión</h4>
        <div class="prueba-controles">
          <div v-if="ordenPrueba?.detalles" class="controles-fusion">
            <div v-for="detalle in ordenPrueba.detalles" :key="detalle.color" class="detalle-color">
              <h5>Color: {{ detalle.color }}</h5>
              <div v-for="(cantidad, talla) in detalle.tallas" :key="talla" class="control-talla">
                <label>
                  <input 
                    type="checkbox" 
                    :checked="obtenerAplicaFusion(detalle.color, talla)"
                    @change="actualizarAplicaFusion(detalle.color, talla, $event.target.checked)"
                  />
                  {{ talla }} - Aplica fusión
                </label>
                <input 
                  type="number" 
                  :value="obtenerCantidadFusionada(detalle.color, talla)"
                  @input="actualizarFusionada(detalle.color, talla, $event.target.value)"
                  :max="cantidad"
                  min="0"
                  :disabled="!obtenerAplicaFusion(detalle.color, talla)"
                  class="input-cantidad"
                />
                <span>/ {{ cantidad }}</span>
              </div>
            </div>
          </div>
          <button @click="guardarFusion" class="btn-guardar">Guardar Fusión</button>
        </div>
      </div>
    </div>

    <div class="resultados" v-if="resultados.length > 0">
      <h3>📊 Resultados de Pruebas</h3>
      <div class="lista-resultados">
        <div v-for="(resultado, index) in resultados" :key="index" 
             class="resultado-item"
             :class="{ 'exitoso': resultado.exitoso, 'fallido': !resultado.exitoso }">
          <div class="resultado-header">
            <span class="icono">{{ resultado.exitoso ? '✅' : '❌' }}</span>
            <span class="titulo">{{ resultado.titulo }}</span>
            <span class="tiempo">{{ resultado.tiempo }}</span>
          </div>
          <div class="resultado-detalle" v-if="resultado.detalle">
            {{ resultado.detalle }}
          </div>
        </div>
      </div>
      <button @click="limpiarResultados" class="btn-limpiar">Limpiar Resultados</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useOrdenStore } from '../stores/ordenStore';

const ordenStore = useOrdenStore();

// Estados reactivos
const ordenPrueba = ref(null);
const aplicaExtension = ref(false);
const telaExtendida = ref(false);
const resultados = ref([]);

// Estados temporales para las modificaciones
const datosCorteTemporal = ref({});
const datosNumeracionTemporal = ref({});
const datosFusionTemporal = ref({});

// Computed properties
const ordenReactiva = computed(() => {
  if (!ordenPrueba.value?.id) return null;
  return ordenStore.ordenes.find(o => o.id === ordenPrueba.value.id);
});

// Funciones de cálculo
function calcularTotalPedido(orden) {
  if (!orden?.detalles) return 0;
  return orden.detalles.reduce((sum, detalle) =>
    sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0), 0);
}

function calcularUnidadesCortadas(orden) {
  if (!orden?.estadoCorte?.unidadesCortadas) return 0;
  return orden.estadoCorte.unidadesCortadas.reduce((sum, item) =>
    sum + (parseInt(item.cortadas) || 0), 0);
}

function calcularPorcentajeCorte(orden) {
  const total = calcularTotalPedido(orden);
  const cortadas = calcularUnidadesCortadas(orden);
  return total > 0 ? (cortadas / total) * 100 : 0;
}

function calcularUnidadesNumeradas(orden) {
  if (!orden?.estadoCorte?.unidadesNumeradas) return 0;
  return orden.estadoCorte.unidadesNumeradas.reduce((sum, item) =>
    sum + (parseInt(item.numeradas) || 0), 0);
}

function calcularPorcentajeNumeracion(orden) {
  const total = calcularTotalPedido(orden);
  const numeradas = calcularUnidadesNumeradas(orden);
  return total > 0 ? (numeradas / total) * 100 : 0;
}

function calcularUnidadesFusionadas(orden) {
  if (!orden?.estadoCorte?.unidadesFusionadas) return 0;
  const unidadesConAplicacion = orden.estadoCorte.unidadesFusionadas.filter(item => item.aplica);
  return unidadesConAplicacion.reduce((sum, item) =>
    sum + (parseInt(item.fusionadas) || 0), 0);
}

function calcularTotalFusionAplicable(orden) {
  if (!orden?.estadoCorte?.unidadesFusionadas) return 0;
  const unidadesConAplicacion = orden.estadoCorte.unidadesFusionadas.filter(item => item.aplica);
  return unidadesConAplicacion.reduce((sum, item) => sum + (item.total || 0), 0);
}

function calcularPorcentajeFusion(orden) {
  const totalAplicable = calcularTotalFusionAplicable(orden);
  const fusionadas = calcularUnidadesFusionadas(orden);
  return totalAplicable > 0 ? (fusionadas / totalAplicable) * 100 : 0;
}

// Funciones para obtener cantidades específicas
function obtenerCantidadCortada(color, talla) {
  const key = `${color}-${talla}`;
  if (key in datosCorteTemporal.value) {
    return datosCorteTemporal.value[key];
  }
  
  const item = ordenReactiva.value?.estadoCorte?.unidadesCortadas?.find(
    u => u.color === color && u.talla === talla
  );
  return item?.cortadas || 0;
}

function obtenerCantidadNumerada(color, talla) {
  const key = `${color}-${talla}`;
  if (key in datosNumeracionTemporal.value) {
    return datosNumeracionTemporal.value[key];
  }
  
  const item = ordenReactiva.value?.estadoCorte?.unidadesNumeradas?.find(
    u => u.color === color && u.talla === talla
  );
  return item?.numeradas || 0;
}

function obtenerCantidadFusionada(color, talla) {
  const key = `${color}-${talla}`;
  if (key in datosFusionTemporal.value) {
    return datosFusionTemporal.value[key].fusionadas;
  }
  
  const item = ordenReactiva.value?.estadoCorte?.unidadesFusionadas?.find(
    u => u.color === color && u.talla === talla
  );
  return item?.fusionadas || 0;
}

function obtenerAplicaFusion(color, talla) {
  const key = `${color}-${talla}`;
  if (key in datosFusionTemporal.value) {
    return datosFusionTemporal.value[key].aplica;
  }
  
  const item = ordenReactiva.value?.estadoCorte?.unidadesFusionadas?.find(
    u => u.color === color && u.talla === talla
  );
  return item?.aplica !== undefined ? item.aplica : true;
}

// Funciones para actualizar cantidades temporales
function actualizarCortada(color, talla, valor) {
  const key = `${color}-${talla}`;
  datosCorteTemporal.value[key] = parseInt(valor) || 0;
}

function actualizarNumerada(color, talla, valor) {
  const key = `${color}-${talla}`;
  datosNumeracionTemporal.value[key] = parseInt(valor) || 0;
}

function actualizarFusionada(color, talla, valor) {
  const key = `${color}-${talla}`;
  if (!(key in datosFusionTemporal.value)) {
    datosFusionTemporal.value[key] = { fusionadas: 0, aplica: true };
  }
  datosFusionTemporal.value[key].fusionadas = parseInt(valor) || 0;
}

function actualizarAplicaFusion(color, talla, aplica) {
  const key = `${color}-${talla}`;
  if (!(key in datosFusionTemporal.value)) {
    datosFusionTemporal.value[key] = { fusionadas: 0, aplica: true };
  }
  datosFusionTemporal.value[key].aplica = aplica;
  if (!aplica) {
    datosFusionTemporal.value[key].fusionadas = 0;
  }
}

// Funciones de guardado
async function actualizarExtension() {
  try {
    await ordenStore.actualizarEstadoCorte(ordenPrueba.value.id, {
      ...ordenReactiva.value.estadoCorte,
      aplicaExtension: aplicaExtension.value,
      telaExtendida: telaExtendida.value && aplicaExtension.value
    });
    
    agregarResultado('Extensión actualizada', true, 
      `Aplica: ${aplicaExtension.value}, Extendida: ${telaExtendida.value && aplicaExtension.value}`);
  } catch (error) {
    agregarResultado('Error en extensión', false, error.message);
  }
}

async function probarExtension() {
  aplicaExtension.value = true;
  telaExtendida.value = !telaExtendida.value;
  await actualizarExtension();
}

async function guardarCorte() {
  try {
    const unidadesCortadas = [];
    
    ordenPrueba.value.detalles.forEach(detalle => {
      Object.keys(detalle.tallas).forEach(talla => {
        if (detalle.tallas[talla] > 0) {
          const cantidadCortada = obtenerCantidadCortada(detalle.color, talla);
          unidadesCortadas.push({
            color: detalle.color,
            talla: talla,
            total: detalle.tallas[talla],
            cortadas: cantidadCortada
          });
        }
      });
    });
    
    await ordenStore.actualizarEstadoCorte(ordenPrueba.value.id, {
      ...ordenReactiva.value.estadoCorte,
      unidadesCortadas: unidadesCortadas
    });
    
    // Limpiar datos temporales
    datosCorteTemporal.value = {};
    
    agregarResultado('Corte guardado', true, 
      `Total cortado: ${unidadesCortadas.reduce((sum, u) => sum + u.cortadas, 0)} unidades`);
  } catch (error) {
    agregarResultado('Error en corte', false, error.message);
  }
}

async function guardarNumeracion() {
  try {
    const unidadesNumeradas = [];
    
    ordenPrueba.value.detalles.forEach(detalle => {
      Object.keys(detalle.tallas).forEach(talla => {
        if (detalle.tallas[talla] > 0) {
          const cantidadNumerada = obtenerCantidadNumerada(detalle.color, talla);
          unidadesNumeradas.push({
            color: detalle.color,
            talla: talla,
            total: detalle.tallas[talla],
            numeradas: cantidadNumerada
          });
        }
      });
    });
    
    await ordenStore.actualizarEstadoCorte(ordenPrueba.value.id, {
      ...ordenReactiva.value.estadoCorte,
      unidadesNumeradas: unidadesNumeradas
    });
    
    // Limpiar datos temporales
    datosNumeracionTemporal.value = {};
    
    agregarResultado('Numeración guardada', true, 
      `Total numerado: ${unidadesNumeradas.reduce((sum, u) => sum + u.numeradas, 0)} unidades`);
  } catch (error) {
    agregarResultado('Error en numeración', false, error.message);
  }
}

async function guardarFusion() {
  try {
    const unidadesFusionadas = [];
    
    ordenPrueba.value.detalles.forEach(detalle => {
      Object.keys(detalle.tallas).forEach(talla => {
        if (detalle.tallas[talla] > 0) {
          const cantidadFusionada = obtenerCantidadFusionada(detalle.color, talla);
          const aplicaFusion = obtenerAplicaFusion(detalle.color, talla);
          
          unidadesFusionadas.push({
            color: detalle.color,
            talla: talla,
            total: detalle.tallas[talla],
            fusionadas: aplicaFusion ? cantidadFusionada : 0,
            aplica: aplicaFusion
          });
        }
      });
    });
    
    await ordenStore.actualizarEstadoCorte(ordenPrueba.value.id, {
      ...ordenReactiva.value.estadoCorte,
      unidadesFusionadas: unidadesFusionadas
    });
    
    // Limpiar datos temporales
    datosFusionTemporal.value = {};
    
    const totalFusionado = unidadesFusionadas
      .filter(u => u.aplica)
      .reduce((sum, u) => sum + u.fusionadas, 0);
    
    agregarResultado('Fusión guardada', true, 
      `Total fusionado: ${totalFusionado} unidades`);
  } catch (error) {
    agregarResultado('Error en fusión', false, error.message);
  }
}

function agregarResultado(titulo, exitoso, detalle = '') {
  resultados.value.push({
    titulo,
    exitoso,
    detalle,
    tiempo: new Date().toLocaleTimeString()
  });
}

function limpiarResultados() {
  resultados.value = [];
}

// Observar cambios en la orden para verificar sincronización
watch(ordenReactiva, (nuevaOrden, ordenAnterior) => {
  if (ordenAnterior && nuevaOrden && JSON.stringify(nuevaOrden.estadoCorte) !== JSON.stringify(ordenAnterior.estadoCorte)) {
    agregarResultado('Sincronización detectada', true, 'La orden se actualizó automáticamente');
  }
}, { deep: true });

onMounted(() => {
  // Usar la primera orden disponible para pruebas
  if (ordenStore.ordenes.length > 0) {
    ordenPrueba.value = ordenStore.ordenes[0];
    aplicaExtension.value = ordenPrueba.value.estadoCorte?.aplicaExtension || false;
    telaExtendida.value = ordenPrueba.value.estadoCorte?.telaExtendida || false;
    
    agregarResultado('Componente iniciado', true, 
      `Orden de prueba: ${ordenPrueba.value.consecutivo}`);
  } else {
    agregarResultado('Sin órdenes', false, 'No hay órdenes disponibles para pruebas');
  }
});
</script>

<style scoped>
.prueba-procesos {
  padding: 20px;
  font-family: var(--font-family);
  background-color: var(--bg-primary);
}

.titulo-prueba {
  color: var(--primary-blue-dark);
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
  font-weight: 700;
}

.panel-orden {
  background-color: var(--bg-secondary);
  padding: 20px;
  border-radius: var(--border-radius);
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
}

.orden-info p {
  margin: 5px 0;
  color: var(--text-primary);
}

.progreso-actual {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
}

.estado-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 5px 0;
}

.estado-item .completo {
  color: var(--success);
  font-weight: 600;
}

.panel-pruebas {
  background-color: var(--bg-secondary);
  padding: 20px;
  border-radius: var(--border-radius);
  margin-bottom: 20px;
}

.prueba-seccion {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-primary);
}

.prueba-seccion h4 {
  color: var(--primary-blue-dark);
  margin-bottom: 15px;
}

.prueba-controles {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.controles-corte,
.controles-numeracion,
.controles-fusion {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detalle-color {
  border: 1px solid var(--border-color);
  padding: 10px;
  border-radius: var(--border-radius);
  background-color: var(--bg-secondary);
}

.detalle-color h5 {
  margin: 0 0 10px 0;
  color: var(--primary-blue-dark);
}

.control-talla {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.input-cantidad {
  width: 80px;
  padding: 5px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  text-align: center;
}

.btn-probar,
.btn-guardar {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
  margin-top: 10px;
}

.btn-probar:hover,
.btn-guardar:hover {
  background-color: var(--primary-blue-dark);
  transform: translateY(-1px);
}

.resultados {
  background-color: var(--bg-secondary);
  padding: 20px;
  border-radius: var(--border-radius);
}

.lista-resultados {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.resultado-item {
  padding: 10px;
  margin-bottom: 8px;
  border-radius: var(--border-radius);
  border-left: 4px solid;
}

.resultado-item.exitoso {
  background-color: #d4edda;
  border-left-color: #28a745;
}

.resultado-item.fallido {
  background-color: #f8d7da;
  border-left-color: #dc3545;
}

.resultado-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.resultado-detalle {
  margin-top: 5px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.tiempo {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.btn-limpiar {
  background-color: var(--gray-600);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-limpiar:hover {
  background-color: var(--gray-700);
}

@media (max-width: 768px) {
  .control-talla {
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
  }
  
  .input-cantidad {
    width: 100%;
  }
}
</style>
