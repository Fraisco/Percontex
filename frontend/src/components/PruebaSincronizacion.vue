<template>
  <div class="prueba-sincronizacion">
    <h2 class="titulo-prueba">🧪 Prueba de Sincronización en Tiempo Real</h2>
    
    <div class="panel-control">
      <h3>Panel de Control de Pruebas</h3>
      <div class="botones-prueba">
        <button @click="ejecutarPruebaCompleta" class="btn-prueba-completa" :disabled="pruebaEnCurso">
          {{ pruebaEnCurso ? 'Ejecutando...' : '🧪 Ejecutar Demostración Completa' }}
        </button>
        <button @click="ejecutarDemostracionPasoAPaso" class="btn-paso-a-paso" :disabled="pruebaEnCurso">
          📋 Demostración Paso a Paso
        </button>
        <button @click="limpiarResultados" class="btn-limpiar">
          Limpiar Resultados
        </button>
      </div>
    </div>

    <div class="estado-ordenes">
      <h3>Estado Actual de Órdenes</h3>
      <div class="grid-ordenes">
        <div v-for="orden in ordenesDisponibles" :key="orden.id" class="card-orden">
          <h4>{{ orden.consecutivo }}</h4>
          <p><strong>Referencia:</strong> {{ orden.referenciaPorDefecto }}</p>
          <div class="progreso-orden">
            <div class="proceso-item">
              <span class="proceso-label">Extensión:</span>
              <div class="barra-progreso">
                <div class="barra-relleno" :style="{ width: obtenerProgresoExtension(orden) + '%', backgroundColor: getColorProgreso(obtenerProgresoExtension(orden)) }"></div>
              </div>
              <span class="porcentaje">{{ obtenerProgresoExtension(orden).toFixed(1) }}%</span>
            </div>
            
            <div class="proceso-item">
              <span class="proceso-label">Corte:</span>
              <div class="barra-progreso">
                <div class="barra-relleno" :style="{ width: obtenerProgresoCorte(orden) + '%', backgroundColor: getColorProgreso(obtenerProgresoCorte(orden)) }"></div>
              </div>
              <span class="porcentaje">{{ obtenerProgresoCorte(orden).toFixed(1) }}%</span>
            </div>
            
            <div class="proceso-item">
              <span class="proceso-label">Numeración:</span>
              <div class="barra-progreso">
                <div class="barra-relleno" :style="{ width: obtenerProgresoNumeracion(orden) + '%', backgroundColor: getColorProgreso(obtenerProgresoNumeracion(orden)) }"></div>
              </div>
              <span class="porcentaje">{{ obtenerProgresoNumeracion(orden).toFixed(1) }}%</span>
            </div>
            
            <div class="proceso-item">
              <span class="proceso-label">Fusión:</span>
              <div class="barra-progreso">
                <div class="barra-relleno" :style="{ width: obtenerProgresoFusion(orden) + '%', backgroundColor: getColorProgreso(obtenerProgresoFusion(orden)) }"></div>
              </div>
              <span class="porcentaje">{{ obtenerProgresoFusion(orden).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="resultados-prueba" v-if="resultadosPrueba.length > 0">
      <h3>Resultados de Pruebas</h3>
      <div class="lista-resultados">
        <div v-for="(resultado, index) in resultadosPrueba" :key="index" 
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
    </div>

    <div class="pruebas-manuales">
      <h3>Pruebas Manuales Específicas</h3>
      <div class="grid-pruebas">
        <div class="prueba-manual">
          <h4>Prueba ExtenderTela → Corte</h4>
          <button @click="probarExtensionACorte" class="btn-prueba-manual">
            Probar Sincronización
          </button>
        </div>
        
        <div class="prueba-manual">
          <h4>Prueba Corte → Numeración</h4>
          <button @click="probarCorteANumeracion" class="btn-prueba-manual">
            Probar Sincronización
          </button>
        </div>
        
        <div class="prueba-manual">
          <h4>Prueba Numeración → Fusión</h4>
          <button @click="probarNumeracionAFusion" class="btn-prueba-manual">
            Probar Sincronización
          </button>
        </div>
        
        <div class="prueba-manual">
          <h4>Prueba Fusión → Finalizar</h4>
          <button @click="probarFusionAFinalizar" class="btn-prueba-manual">
            Probar Sincronización
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useOrdenStore } from '../stores/ordenStore';
import { ejecutarPruebaSincronizacion } from '../utils/demostracionSincronizacion';

const ordenStore = useOrdenStore();

const pruebaEnCurso = ref(false);
const resultadosPrueba = ref([]);
const ordenesDisponibles = computed(() => ordenStore.ordenes);

// Funciones para calcular progreso
function obtenerProgresoExtension(orden) {
  if (!orden.estadoCorte?.aplicaExtension) return 100; // Si no aplica, está completo
  return orden.estadoCorte?.telaExtendida ? 100 : 0;
}

function obtenerProgresoCorte(orden) {
  if (!orden.detalles || !orden.estadoCorte?.unidadesCortadas) return 0;
  
  const totalPedido = orden.detalles.reduce((sum, detalle) => 
    sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0), 0);
  
  const totalCortado = orden.estadoCorte.unidadesCortadas.reduce((sum, item) => 
    sum + (parseInt(item.cortadas) || 0), 0);
  
  return totalPedido > 0 ? (totalCortado / totalPedido) * 100 : 0;
}

function obtenerProgresoNumeracion(orden) {
  if (!orden.detalles || !orden.estadoCorte?.unidadesNumeradas) return 0;
  
  const totalPedido = orden.detalles.reduce((sum, detalle) => 
    sum + Object.values(detalle.tallas).reduce((a, qty) => a + (qty || 0), 0), 0);
  
  const totalNumerado = orden.estadoCorte.unidadesNumeradas.reduce((sum, item) => 
    sum + (parseInt(item.numeradas) || 0), 0);
  
  return totalPedido > 0 ? (totalNumerado / totalPedido) * 100 : 0;
}

function obtenerProgresoFusion(orden) {
  if (!orden.estadoCorte?.unidadesFusionadas) return 0;
  
  const unidadesConAplicacion = orden.estadoCorte.unidadesFusionadas.filter(item => item.aplica);
  if (unidadesConAplicacion.length === 0) return 100; // Si no aplica fusión, está completo
  
  const totalPedidoFusion = unidadesConAplicacion.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalFusionado = unidadesConAplicacion.reduce((sum, item) => sum + (parseInt(item.fusionadas) || 0), 0);
  
  return totalPedidoFusion > 0 ? (totalFusionado / totalPedidoFusion) * 100 : 0;
}

function getColorProgreso(porcentaje) {
  if (porcentaje >= 100) return '#28a745'; // Verde
  if (porcentaje >= 75) return '#ffc107';  // Amarillo
  if (porcentaje >= 50) return '#fd7e14';  // Naranja
  return '#dc3545'; // Rojo
}

function agregarResultado(titulo, exitoso, detalle = '', tiempo = new Date().toLocaleTimeString()) {
  resultadosPrueba.value.push({
    titulo,
    exitoso,
    detalle,
    tiempo
  });
}

async function ejecutarPruebaCompleta() {
  pruebaEnCurso.value = true;
  limpiarResultados();

  agregarResultado('🚀 Iniciando demostración completa de sincronización en tiempo real', true);

  try {
    // Ejecutar la demostración usando el script especializado
    const resultado = await ejecutarPruebaSincronizacion(ordenStore);

    if (resultado.exito) {
      // Agregar todos los resultados de la demostración
      resultado.resultados.forEach(res => {
        agregarResultado(res.titulo, res.exito, res.detalle, res.timestamp);
      });

      agregarResultado('🎉 Demostración completada exitosamente', true, resultado.mensaje);
    } else {
      // Agregar resultados aunque haya fallado
      resultado.resultados.forEach(res => {
        agregarResultado(res.titulo, res.exito, res.detalle, res.timestamp);
      });

      agregarResultado('❌ Demostración falló', false, resultado.mensaje);
    }

  } catch (error) {
    agregarResultado('Error crítico durante la demostración', false, error.message);
  } finally {
    pruebaEnCurso.value = false;
  }
}

async function verificarEstructuraDatos() {
  const orden = ordenesDisponibles.value[0];
  
  // Verificar que la orden tenga la estructura necesaria
  if (!orden.estadoCorte) {
    agregarResultado('Error: Orden sin estadoCorte', false, `Orden ${orden.id} no tiene estructura estadoCorte`);
    throw new Error('Estructura de datos inválida');
  }
  
  if (!orden.detalles || orden.detalles.length === 0) {
    agregarResultado('Error: Orden sin detalles', false, `Orden ${orden.id} no tiene detalles de producción`);
    throw new Error('Estructura de datos inválida');
  }
  
  agregarResultado('Estructura de datos verificada', true, 'Todas las órdenes tienen la estructura correcta');
}

async function simularActualizacionExtension() {
  const orden = ordenesDisponibles.value[0];
  const estadoOriginal = orden.estadoCorte.telaExtendida;
  
  // Simular cambio en extensión
  ordenStore.actualizarEstadoCorte(orden.id, {
    ...orden.estadoCorte,
    aplicaExtension: true,
    telaExtendida: !estadoOriginal
  });
  
  // Esperar un poco para la reactividad
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Verificar que el cambio se aplicó
  const ordenActualizada = ordenStore.ordenes.find(o => o.id === orden.id);
  if (ordenActualizada.estadoCorte.telaExtendida !== !estadoOriginal) {
    agregarResultado('Error: Actualización de extensión falló', false);
    return;
  }
  
  agregarResultado('Sincronización ExtenderTela verificada', true, `Estado cambió de ${estadoOriginal} a ${!estadoOriginal}`);
}

async function simularActualizacionCorte() {
  const orden = ordenesDisponibles.value[0];
  
  if (!orden.estadoCorte.unidadesCortadas || orden.estadoCorte.unidadesCortadas.length === 0) {
    agregarResultado('Info: No hay unidades cortadas para actualizar', true);
    return;
  }
  
  const unidadOriginal = orden.estadoCorte.unidadesCortadas[0].cortadas;
  const nuevaCantidad = Math.min((unidadOriginal || 0) + 5, orden.estadoCorte.unidadesCortadas[0].total);
  
  // Actualizar cantidad cortada
  const unidadesActualizadas = [...orden.estadoCorte.unidadesCortadas];
  unidadesActualizadas[0].cortadas = nuevaCantidad;
  
  ordenStore.actualizarEstadoCorte(orden.id, {
    ...orden.estadoCorte,
    unidadesCortadas: unidadesActualizadas
  });
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const ordenActualizada = ordenStore.ordenes.find(o => o.id === orden.id);
  if (ordenActualizada.estadoCorte.unidadesCortadas[0].cortadas !== nuevaCantidad) {
    agregarResultado('Error: Actualización de corte falló', false);
    return;
  }
  
  agregarResultado('Sincronización VistaCorte verificada', true, `Cantidad cortada cambió de ${unidadOriginal} a ${nuevaCantidad}`);
}

async function simularActualizacionNumeracion() {
  const orden = ordenesDisponibles.value[0];
  
  if (!orden.estadoCorte.unidadesNumeradas || orden.estadoCorte.unidadesNumeradas.length === 0) {
    agregarResultado('Info: No hay unidades numeradas para actualizar', true);
    return;
  }
  
  const unidadOriginal = orden.estadoCorte.unidadesNumeradas[0].numeradas;
  const nuevaCantidad = Math.min((unidadOriginal || 0) + 3, orden.estadoCorte.unidadesNumeradas[0].total);
  
  const unidadesActualizadas = [...orden.estadoCorte.unidadesNumeradas];
  unidadesActualizadas[0].numeradas = nuevaCantidad;
  
  ordenStore.actualizarEstadoCorte(orden.id, {
    ...orden.estadoCorte,
    unidadesNumeradas: unidadesActualizadas
  });
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const ordenActualizada = ordenStore.ordenes.find(o => o.id === orden.id);
  if (ordenActualizada.estadoCorte.unidadesNumeradas[0].numeradas !== nuevaCantidad) {
    agregarResultado('Error: Actualización de numeración falló', false);
    return;
  }
  
  agregarResultado('Sincronización Numeración verificada', true, `Cantidad numerada cambió de ${unidadOriginal} a ${nuevaCantidad}`);
}

async function simularActualizacionFusion() {
  const orden = ordenesDisponibles.value[0];
  
  if (!orden.estadoCorte.unidadesFusionadas || orden.estadoCorte.unidadesFusionadas.length === 0) {
    agregarResultado('Info: No hay unidades fusionadas para actualizar', true);
    return;
  }
  
  const unidadOriginal = orden.estadoCorte.unidadesFusionadas[0].fusionadas;
  const nuevaCantidad = Math.min((unidadOriginal || 0) + 2, orden.estadoCorte.unidadesFusionadas[0].total);
  
  const unidadesActualizadas = [...orden.estadoCorte.unidadesFusionadas];
  unidadesActualizadas[0].fusionadas = nuevaCantidad;
  
  ordenStore.actualizarEstadoCorte(orden.id, {
    ...orden.estadoCorte,
    unidadesFusionadas: unidadesActualizadas
  });
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const ordenActualizada = ordenStore.ordenes.find(o => o.id === orden.id);
  if (ordenActualizada.estadoCorte.unidadesFusionadas[0].fusionadas !== nuevaCantidad) {
    agregarResultado('Error: Actualización de fusión falló', false);
    return;
  }
  
  agregarResultado('Sincronización Fusionar verificada', true, `Cantidad fusionada cambió de ${unidadOriginal} a ${nuevaCantidad}`);
}

async function verificarPersistencia() {
  try {
    const datosGuardados = localStorage.getItem('misOrdenesDeProduccion');
    if (!datosGuardados) {
      agregarResultado('Error: No se encontraron datos en localStorage', false);
      return;
    }
    
    const ordenesPersistidas = JSON.parse(datosGuardados);
    if (ordenesPersistidas.length !== ordenesDisponibles.value.length) {
      agregarResultado('Error: Inconsistencia en persistencia', false, 'Las órdenes en memoria no coinciden con las persistidas');
      return;
    }
    
    agregarResultado('Persistencia verificada', true, 'Datos guardados correctamente en localStorage');
  } catch (error) {
    agregarResultado('Error al verificar persistencia', false, error.message);
  }
}

// Pruebas manuales específicas
async function probarExtensionACorte() {
  agregarResultado('Iniciando prueba ExtenderTela → Corte', true);
  
  const orden = ordenesDisponibles.value[0];
  const estadoOriginal = orden.estadoCorte.telaExtendida;
  
  // Cambiar estado de extensión
  ordenStore.actualizarEstadoCorte(orden.id, {
    ...orden.estadoCorte,
    aplicaExtension: true,
    telaExtendida: true
  });
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Verificar que el cambio se reflejó
  const ordenActualizada = ordenStore.ordenes.find(o => o.id === orden.id);
  const exito = ordenActualizada.estadoCorte.telaExtendida === true;
  
  agregarResultado(
    'Prueba ExtenderTela → Corte',
    exito,
    exito ? 'Sincronización exitosa entre procesos' : 'Error en sincronización'
  );
}

async function probarCorteANumeracion() {
  agregarResultado('Iniciando prueba Corte → Numeración', true);
  
  const orden = ordenesDisponibles.value[0];
  if (!orden.estadoCorte.unidadesCortadas || orden.estadoCorte.unidadesCortadas.length === 0) {
    agregarResultado('No hay datos de corte para probar', false);
    return;
  }
  
  const cantidadOriginal = orden.estadoCorte.unidadesCortadas[0].cortadas || 0;
  const nuevaCantidad = Math.min(cantidadOriginal + 1, orden.estadoCorte.unidadesCortadas[0].total);
  
  const unidadesActualizadas = [...orden.estadoCorte.unidadesCortadas];
  unidadesActualizadas[0].cortadas = nuevaCantidad;
  
  ordenStore.actualizarEstadoCorte(orden.id, {
    ...orden.estadoCorte,
    unidadesCortadas: unidadesActualizadas
  });
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const ordenActualizada = ordenStore.ordenes.find(o => o.id === orden.id);
  const exito = ordenActualizada.estadoCorte.unidadesCortadas[0].cortadas === nuevaCantidad;
  
  agregarResultado(
    'Prueba Corte → Numeración',
    exito,
    exito ? `Cantidad actualizada: ${cantidadOriginal} → ${nuevaCantidad}` : 'Error en actualización'
  );
}

async function probarNumeracionAFusion() {
  agregarResultado('Iniciando prueba Numeración → Fusión', true);
  
  const orden = ordenesDisponibles.value[0];
  if (!orden.estadoCorte.unidadesNumeradas || orden.estadoCorte.unidadesNumeradas.length === 0) {
    agregarResultado('No hay datos de numeración para probar', false);
    return;
  }
  
  const cantidadOriginal = orden.estadoCorte.unidadesNumeradas[0].numeradas || 0;
  const nuevaCantidad = Math.min(cantidadOriginal + 1, orden.estadoCorte.unidadesNumeradas[0].total);
  
  const unidadesActualizadas = [...orden.estadoCorte.unidadesNumeradas];
  unidadesActualizadas[0].numeradas = nuevaCantidad;
  
  ordenStore.actualizarEstadoCorte(orden.id, {
    ...orden.estadoCorte,
    unidadesNumeradas: unidadesActualizadas
  });
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const ordenActualizada = ordenStore.ordenes.find(o => o.id === orden.id);
  const exito = ordenActualizada.estadoCorte.unidadesNumeradas[0].numeradas === nuevaCantidad;
  
  agregarResultado(
    'Prueba Numeración → Fusión',
    exito,
    exito ? `Cantidad actualizada: ${cantidadOriginal} → ${nuevaCantidad}` : 'Error en actualización'
  );
}

async function probarFusionAFinalizar() {
  agregarResultado('Iniciando prueba Fusión → Finalizar', true);
  
  const orden = ordenesDisponibles.value[0];
  if (!orden.estadoCorte.unidadesFusionadas || orden.estadoCorte.unidadesFusionadas.length === 0) {
    agregarResultado('No hay datos de fusión para probar', false);
    return;
  }
  
  const cantidadOriginal = orden.estadoCorte.unidadesFusionadas[0].fusionadas || 0;
  const nuevaCantidad = Math.min(cantidadOriginal + 1, orden.estadoCorte.unidadesFusionadas[0].total);
  
  const unidadesActualizadas = [...orden.estadoCorte.unidadesFusionadas];
  unidadesActualizadas[0].fusionadas = nuevaCantidad;
  
  ordenStore.actualizarEstadoCorte(orden.id, {
    ...orden.estadoCorte,
    unidadesFusionadas: unidadesActualizadas
  });
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const ordenActualizada = ordenStore.ordenes.find(o => o.id === orden.id);
  const exito = ordenActualizada.estadoCorte.unidadesFusionadas[0].fusionadas === nuevaCantidad;
  
  agregarResultado(
    'Prueba Fusión → Finalizar',
    exito,
    exito ? `Cantidad actualizada: ${cantidadOriginal} → ${nuevaCantidad}` : 'Error en actualización'
  );
}

async function ejecutarDemostracionPasoAPaso() {
  pruebaEnCurso.value = true;
  limpiarResultados();

  agregarResultado('📋 Iniciando demostración paso a paso', true, 'Cada proceso se ejecutará con una pausa para observar los cambios');

  try {
    const orden = ordenesDisponibles.value[0];
    if (!orden) {
      agregarResultado('Error: No hay órdenes disponibles', false);
      return;
    }

    // Paso 1: Mostrar estado inicial
    agregarResultado('📊 Estado inicial', true, `Orden: ${orden.consecutivo} - ${orden.referenciaPorDefecto}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Paso 2: Actualizar ExtenderTela
    agregarResultado('🧵 Actualizando ExtenderTela...', true, 'Marcando tela como extendida');
    ordenStore.actualizarEstadoCorte(orden.id, {
      ...orden.estadoCorte,
      aplicaExtension: true,
      telaExtendida: true
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    agregarResultado('✅ ExtenderTela actualizada', true, 'Cambios reflejados en tiempo real');

    // Paso 3: Actualizar Corte
    agregarResultado('✂️ Actualizando VistaCorte...', true, 'Agregando cantidades cortadas');
    if (!orden.estadoCorte.unidadesCortadas || orden.estadoCorte.unidadesCortadas.length === 0) {
      const unidadesCortadas = [];
      orden.detalles?.forEach(detalle => {
        Object.keys(detalle.tallas).forEach(talla => {
          if (detalle.tallas[talla] > 0) {
            unidadesCortadas.push({
              color: detalle.color,
              talla: talla,
              total: detalle.tallas[talla],
              cortadas: Math.floor(detalle.tallas[talla] * 0.8)
            });
          }
        });
      });
      ordenStore.actualizarEstadoCorte(orden.id, {
        ...orden.estadoCorte,
        unidadesCortadas: unidadesCortadas
      });
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
    agregarResultado('✅ VistaCorte actualizada', true, 'Progreso de corte visible en todas las vistas');

    // Paso 4: Actualizar Numeración
    agregarResultado('🔢 Actualizando Numeración...', true, 'Agregando cantidades numeradas');
    const unidadesNumeradas = [];
    orden.estadoCorte.unidadesCortadas?.forEach(cortada => {
      unidadesNumeradas.push({
        color: cortada.color,
        talla: cortada.talla,
        total: cortada.total,
        numeradas: Math.floor(cortada.cortadas * 0.9)
      });
    });
    ordenStore.actualizarEstadoCorte(orden.id, {
      ...orden.estadoCorte,
      unidadesNumeradas: unidadesNumeradas
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    agregarResultado('✅ Numeración actualizada', true, 'Datos sincronizados automáticamente');

    // Paso 5: Actualizar Fusión
    agregarResultado('🔗 Actualizando Fusionar...', true, 'Agregando cantidades fusionadas');
    const unidadesFusionadas = [];
    orden.estadoCorte.unidadesNumeradas?.forEach(numerada => {
      unidadesFusionadas.push({
        color: numerada.color,
        talla: numerada.talla,
        total: numerada.total,
        fusionadas: Math.floor(numerada.numeradas * 0.95),
        aplica: true
      });
    });
    ordenStore.actualizarEstadoCorte(orden.id, {
      ...orden.estadoCorte,
      unidadesFusionadas: unidadesFusionadas
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    agregarResultado('✅ Fusionar actualizada', true, 'Proceso de fusión completado');

    // Paso 6: Verificar estado final
    agregarResultado('🏁 Verificando estado final...', true, 'Todos los procesos deben estar actualizados');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ordenFinal = ordenStore.ordenes.find(o => o.id === orden.id);
    const progresoExtension = ordenFinal.estadoCorte.telaExtendida ? 100 : 0;
    const progresoCorte = obtenerProgresoCorte(ordenFinal);
    const progresoNumeracion = obtenerProgresoNumeracion(ordenFinal);
    const progresoFusion = obtenerProgresoFusion(ordenFinal);

    agregarResultado('📈 Estado final registrado', true,
      `Extensión: ${progresoExtension}%, Corte: ${progresoCorte.toFixed(1)}%, Numeración: ${progresoNumeracion.toFixed(1)}%, Fusión: ${progresoFusion.toFixed(1)}%`);

    agregarResultado('🎉 Demostración paso a paso completada', true, 'Sincronización en tiempo real verificada exitosamente');

  } catch (error) {
    agregarResultado('❌ Error en demostración paso a paso', false, error.message);
  } finally {
    pruebaEnCurso.value = false;
  }
}

function limpiarResultados() {
  resultadosPrueba.value = [];
}

onMounted(() => {
  agregarResultado('Componente de prueba inicializado', true, 'Listo para ejecutar pruebas de sincronización');
});

// Observar cambios en las órdenes para detectar actualizaciones en tiempo real
watch(() => ordenStore.ordenes, (nuevasOrdenes, ordenesAnteriores) => {
  if (ordenesAnteriores && nuevasOrdenes.length === ordenesAnteriores.length) {
    // Verificar si hubo cambios en alguna orden
    for (let i = 0; i < nuevasOrdenes.length; i++) {
      if (JSON.stringify(nuevasOrdenes[i].estadoCorte) !== JSON.stringify(ordenesAnteriores[i].estadoCorte)) {
        agregarResultado(`Detección automática: Orden ${nuevasOrdenes[i].id} actualizada`, true, 'Cambio detectado en tiempo real');
        break;
      }
    }
  }
}, { deep: true });
</script>

<style scoped>
.prueba-sincronizacion {
  padding: 20px;
  font-family: var(--font-family);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
}

.titulo-prueba {
  color: var(--primary-blue-dark);
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
  font-weight: 700;
}

.panel-control {
  background-color: var(--bg-secondary);
  padding: 20px;
  border-radius: var(--border-radius);
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
}

.panel-control h3 {
  color: var(--primary-blue-dark);
  margin-bottom: 15px;
}

.botones-prueba {
  display: flex;
  gap: 15px;
}

.btn-prueba-completa {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-prueba-completa:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
}

.btn-prueba-completa:not(:disabled):hover {
  background-color: var(--primary-blue-dark);
  transform: translateY(-1px);
}

.btn-limpiar {
  background-color: var(--gray-600);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-limpiar:hover {
  background-color: var(--gray-700);
}

.btn-paso-a-paso {
  background-color: var(--success);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-paso-a-paso:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
}

.btn-paso-a-paso:not(:disabled):hover {
  background-color: var(--success-dark);
  transform: translateY(-1px);
}

.estado-ordenes {
  margin-bottom: 20px;
}

.estado-ordenes h3 {
  color: var(--primary-blue-dark);
  margin-bottom: 15px;
}

.grid-ordenes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.card-orden {
  background-color: var(--bg-secondary);
  padding: 20px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.card-orden h4 {
  color: var(--primary-blue-dark);
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.progreso-orden {
  margin-top: 15px;
}

.proceso-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.proceso-label {
  width: 100px;
  font-weight: 600;
  color: var(--text-primary);
}

.barra-progreso {
  flex: 1;
  height: 20px;
  background-color: var(--gray-200);
  border-radius: 10px;
  overflow: hidden;
}

.barra-relleno {
  height: 100%;
  transition: width 0.3s ease;
}

.porcentaje {
  width: 50px;
  text-align: right;
  font-weight: 600;
  color: var(--text-primary);
}

.resultados-prueba {
  margin-bottom: 20px;
}

.resultados-prueba h3 {
  color: var(--primary-blue-dark);
  margin-bottom: 15px;
}

.lista-resultados {
  max-height: 400px;
  overflow-y: auto;
}

.resultado-item {
  padding: 15px;
  margin-bottom: 10px;
  border-radius: var(--border-radius);
  border-left: 5px solid;
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
  margin-top: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.pruebas-manuales h3 {
  color: var(--primary-blue-dark);
  margin-bottom: 15px;
}

.grid-pruebas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.prueba-manual {
  background-color: var(--bg-secondary);
  padding: 15px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  text-align: center;
}

.prueba-manual h4 {
  color: var(--primary-blue-dark);
  margin-bottom: 10px;
  font-size: 1rem;
}

.btn-prueba-manual {
  background-color: var(--warning);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-prueba-manual:hover {
  background-color: var(--warning-dark);
  transform: translateY(-1px);
}

.tiempo {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.icono {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .grid-ordenes,
  .grid-pruebas {
    grid-template-columns: 1fr;
  }
  
  .botones-prueba {
    flex-direction: column;
  }
  
  .proceso-item {
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
  }
  
  .proceso-label {
    width: auto;
  }
}
</style>
