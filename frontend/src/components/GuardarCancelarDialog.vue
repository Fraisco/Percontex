<template>
  <!-- Overlay del modal -->
  <div v-if="mostrarModal" class="modal-overlay" @click="cerrarModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-titulo">{{ tituloModal }}</h3>
        <button @click="cerrarModal" class="btn-cerrar-modal">×</button>
      </div>
      
      <div class="modal-content">
        <div class="modal-icono">
          <span v-if="tipoAccion === 'guardar'">💾</span>
          <span v-else-if="tipoAccion === 'cancelar'">❌</span>
          <span v-else>❓</span>
        </div>
        
        <p class="modal-mensaje">{{ mensajeModal }}</p>
        
        <div v-if="mostrarDetalles" class="modal-detalles">
          <div class="detalle-orden">
            <strong>Orden:</strong> {{ ordenActual?.consecutivo }} - {{ ordenActual?.referenciaPorDefecto }}
          </div>
          <div v-if="cambiosRealizados.length > 0" class="cambios-realizados">
            <strong>Cambios realizados:</strong>
            <ul>
              <li v-for="cambio in cambiosRealizados" :key="cambio">{{ cambio }}</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="modal-acciones">
        <button
          @click="confirmarAccion"
          class="btn-confirmar"
          :class="{ 'btn-guardar': tipoAccion === 'guardar', 'btn-cancelar': tipoAccion === 'cancelar' }"
          :disabled="procesando"
        >
          <span v-if="procesando" class="spinner"></span>
          {{ textoBotonConfirmar }}
        </button>
        <button
          @click="cerrarModal"
          class="btn-rechazar"
          :disabled="procesando"
        >
          {{ textoBotonRechazar }}
        </button>
      </div>
    </div>
  </div>

  <!-- Botones principales -->
  <div class="contenedor-botones">
    <button
      @click="iniciarGuardar"
      class="btn-accion btn-guardar-principal"
      :class="{ 'has-changes': puedeGuardar && cambiosRealizados.length > 0, 'no-changes': !puedeGuardar }"
      :disabled="!puedeGuardar || procesando"
      :title="tituloBotonGuardar"
    >
      <span v-if="procesando && tipoAccion === 'guardar'" class="spinner"></span>
      <span v-else class="icono-guardar">💾</span>
      Guardar Cambios
    </button>
    
    <button
      @click="iniciarCancelar"
      class="btn-accion btn-cancelar-principal"
      :class="{ 'has-changes': puedeCancelar && cambiosRealizados.length > 0, 'no-changes': !puedeCancelar }"
      :disabled="!puedeCancelar || procesando"
      :title="tituloBotonCancelar"
    >
      <span v-if="procesando && tipoAccion === 'cancelar'" class="spinner"></span>
      <span v-else class="icono-cancelar">❌</span>
      Cancelar Cambios
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  ordenActual: {
    type: Object,
    default: null
  },
  procesoNombre: {
    type: String,
    required: true
  },
  cambiosRealizados: {
    type: Array,
    default: () => []
  },
  puedeGuardar: {
    type: Boolean,
    default: true
  },
  puedeCancelar: {
    type: Boolean,
    default: true
  },
  mostrarDetalles: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['guardar', 'cancelar', 'cerrar-modal'])

// Estados reactivos
const mostrarModal = ref(false)
const tipoAccion = ref('') // 'guardar' o 'cancelar'
const procesando = ref(false)

// Computed properties
const tituloModal = computed(() => {
  if (tipoAccion.value === 'guardar') {
    return `Confirmar Guardado - ${props.procesoNombre}`
  } else if (tipoAccion.value === 'cancelar') {
    return `Confirmar Cancelación - ${props.procesoNombre}`
  }
  return 'Confirmar Acción'
})

const mensajeModal = computed(() => {
  if (tipoAccion.value === 'guardar') {
    return '¿Está seguro de que desea guardar todos los cambios realizados? Esta acción actualizará permanentemente el estado del proceso.'
  } else if (tipoAccion.value === 'cancelar') {
    return '¿Está seguro de que desea cancelar los cambios? Se perderán todas las modificaciones no guardadas.'
  }
  return ''
})

const textoBotonConfirmar = computed(() => {
  if (procesando.value) {
    return tipoAccion.value === 'guardar' ? 'Guardando...' : 'Cancelando...'
  }
  return tipoAccion.value === 'guardar' ? 'Sí, Guardar' : 'Sí, Cancelar'
})

const textoBotonRechazar = computed(() => {
  return tipoAccion.value === 'guardar' ? 'No Guardar' : 'No Cancelar'
})

const tituloBotonGuardar = computed(() => {
  if (!props.puedeGuardar) {
    return 'No hay cambios para guardar'
  }
  if (props.cambiosRealizados.length > 0) {
    return `Guardar ${props.cambiosRealizados.length} cambio(s) realizados`
  }
  return 'Guardar cambios del proceso'
})

const tituloBotonCancelar = computed(() => {
  if (!props.puedeCancelar) {
    return 'No hay cambios para cancelar'
  }
  return 'Descartar todos los cambios no guardados'
})

// Funciones
function iniciarGuardar() {
  if (!props.puedeGuardar || procesando.value) return
  
  tipoAccion.value = 'guardar'
  mostrarModal.value = true
}

function iniciarCancelar() {
  if (!props.puedeCancelar || procesando.value) return
  
  tipoAccion.value = 'cancelar'
  mostrarModal.value = true
}

async function confirmarAccion() {
  if (procesando.value) return
  
  procesando.value = true
  
  try {
    if (tipoAccion.value === 'guardar') {
      await emit('guardar')
    } else if (tipoAccion.value === 'cancelar') {
      await emit('cancelar')
    }
    
    // Pequeña pausa para mostrar el feedback visual
    await new Promise(resolve => setTimeout(resolve, 500))
    
    cerrarModal()
  } catch (error) {
    console.error('Error al procesar acción:', error)
    // Mantener el modal abierto para mostrar el error
  } finally {
    procesando.value = false
  }
}

function cerrarModal() {
  mostrarModal.value = false
  tipoAccion.value = ''
  procesando.value = false
  emit('cerrar-modal')
}

// Exponer funciones para uso externo
defineExpose({
  iniciarGuardar,
  iniciarCancelar,
  cerrarModal
})
</script>

<style scoped>
/* Contenedor de botones */
.contenedor-botones {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1));
  backdrop-filter: blur(8px);
  border-top: 2px solid var(--border-color);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  margin-top: var(--spacing-xl);
}

.btn-accion {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-lg);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 180px;
  min-height: 48px;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-accion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  filter: grayscale(0.7);
}

.btn-guardar-principal {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  color: white;
  border: 2px solid var(--success);
  position: relative;
  overflow: hidden;
}

.btn-guardar-principal:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--success-dark), #1e7e34);
  border-color: var(--success-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(40, 167, 69, 0.4);
}

.btn-guardar-principal::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-guardar-principal:hover::before {
  left: 100%;
}

.btn-cancelar-principal {
  background: linear-gradient(135deg, var(--warning), var(--warning-dark));
  color: white;
  border: 2px solid var(--warning);
  position: relative;
  overflow: hidden;
}

.btn-cancelar-principal:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--warning-dark), #e0a800);
  border-color: var(--warning-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 193, 7, 0.4);
}

.btn-cancelar-principal::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-cancelar-principal:hover::before {
  left: 100%;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.modal-titulo {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.btn-cerrar-modal {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: var(--spacing-xs);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-cerrar-modal:hover {
  background-color: var(--danger-bg);
  color: var(--danger);
}

.modal-content {
  padding: var(--spacing-lg);
  text-align: center;
}

.modal-icono {
  font-size: 3rem;
  margin-bottom: var(--spacing-lg);
}

.modal-mensaje {
  color: var(--text-primary);
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
}

.modal-detalles {
  background-color: var(--bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  text-align: left;
  margin-top: var(--spacing-md);
}

.detalle-orden {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.cambios-realizados {
  color: var(--text-primary);
}

.cambios-realizados ul {
  margin: var(--spacing-sm) 0 0 var(--spacing-md);
  color: var(--text-secondary);
}

.cambios-realizados li {
  margin-bottom: var(--spacing-xs);
}

.modal-acciones {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.btn-confirmar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-confirmar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-confirmar.btn-guardar {
  background-color: var(--success);
  color: white;
}

.btn-confirmar.btn-guardar:hover:not(:disabled) {
  background-color: var(--success-dark);
}

.btn-confirmar.btn-cancelar {
  background-color: var(--danger);
  color: white;
}

.btn-confirmar.btn-cancelar:hover:not(:disabled) {
  background-color: var(--danger-dark);
}

.btn-rechazar {
  flex: 1;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-rechazar:hover:not(:disabled) {
  background-color: var(--gray-50);
  border-color: var(--gray-400);
}

.btn-rechazar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Iconos */
.icono-guardar,
.icono-cancelar {
  font-size: var(--font-size-lg);
}

/* Animación para indicar cambios pendientes */
@keyframes pulse-button {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.btn-accion.has-changes {
  animation: pulse-button 2s infinite;
}

.btn-accion.no-changes {
  opacity: 0.6;
  transform: scale(0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .contenedor-botones {
    flex-direction: column;
    padding: var(--spacing-md);
  }

  .btn-accion {
    width: 100%;
    min-width: unset;
    min-height: 52px;
    font-size: var(--font-size-base);
  }

  .modal-container {
    margin: var(--spacing-md);
    width: calc(100% - 2 * var(--spacing-md));
  }

  .modal-acciones {
    flex-direction: column;
  }

  .contenedor-botones {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
  }
}
</style>
