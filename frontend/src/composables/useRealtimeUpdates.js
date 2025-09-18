import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useOrdenStore } from '../stores/ordenStore'

export function useRealtimeUpdates(options = {}) {
  const {
    interval: initialInterval = 5000, // 5 segundos por defecto
    autoStart = true,
    onUpdate = null,
    onError = null
  } = options

  let intervalMs = initialInterval

  const ordenStore = useOrdenStore()
  const isActive = ref(false)
  const lastUpdate = ref(null)
  const updateCount = ref(0)
  const errors = ref([])
  const isUpdating = ref(false)
  let intervalId = null
  let retryCount = 0
  const maxRetries = 3

  // Función para actualizar datos
  async function actualizarDatos() {
    if (isUpdating.value) {
      console.log('[RealtimeUpdates] Actualización ya en progreso, saltando...')
      return
    }

    isUpdating.value = true

    try {
      await ordenStore.cargarOrdenes()
      lastUpdate.value = new Date()
      updateCount.value++
      retryCount = 0 // Reset retry count on success

      if (onUpdate) {
        onUpdate(lastUpdate.value)
      }

      // Emitir evento global para notificar a otros componentes
      await nextTick() // Ensure DOM updates are processed
      window.dispatchEvent(new CustomEvent('realtimeUpdate', {
        detail: {
          timestamp: lastUpdate.value,
          updateCount: updateCount.value,
          success: true
        }
      }))

      console.log(`[RealtimeUpdates] Datos actualizados exitosamente - ${lastUpdate.value.toLocaleTimeString()}`)
    } catch (error) {
      console.error('[RealtimeUpdates] Error al actualizar datos:', error)
      retryCount++

      errors.value.push({
        timestamp: new Date(),
        error: error.message,
        retryCount
      })

      // Si hay muchos errores, pausar las actualizaciones temporalmente
      if (retryCount >= maxRetries) {
        console.warn(`[RealtimeUpdates] Demasiados errores (${retryCount}), pausando temporalmente...`)
        detener()
        setTimeout(() => {
          if (autoStart) {
            console.log('[RealtimeUpdates] Reintentando después de pausa...')
            retryCount = 0
            iniciar()
          }
        }, intervalMs * 2) // Wait double the interval before retrying
      }

      if (onError) {
        onError(error)
      }
    } finally {
      isUpdating.value = false
    }
  }

  // Iniciar actualizaciones automáticas
  function iniciar() {
    if (isActive.value) return

    isActive.value = true
    intervalId = setInterval(actualizarDatos, intervalMs)
    console.log(`[RealtimeUpdates] Iniciado con intervalo de ${intervalMs}ms`)
  }

  // Detener actualizaciones automáticas
  function detener() {
    if (!isActive.value) return

    isActive.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    console.log('[RealtimeUpdates] Detenido')
  }

  // Forzar una actualización inmediata
  async function forzarActualizacion() {
    console.log('[RealtimeUpdates] Forzando actualización...')
    if (isUpdating.value) {
      console.log('[RealtimeUpdates] Actualización ya en progreso, esperando...')
      // Wait for current update to finish
      while (isUpdating.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    await actualizarDatos()
  }

  // Limpiar errores
  function limpiarErrores() {
    errors.value = []
  }

  // Cambiar intervalo dinámicamente
  function cambiarIntervalo(nuevoIntervalo) {
    const estabaActivo = isActive.value
    if (estabaActivo) {
      detener()
    }

    intervalMs = nuevoIntervalo

    if (estabaActivo) {
      iniciar()
    }
  }

  // Watcher para documentos ocultos (pausar cuando no está visible)
  watch(() => document.hidden, (isHidden) => {
    if (isHidden && isActive.value) {
      console.log('[RealtimeUpdates] Documento oculto, pausando actualizaciones')
      detener()
    } else if (!isHidden && autoStart) {
      console.log('[RealtimeUpdates] Documento visible, reanudando actualizaciones')
      iniciar()
    }
  })

  // Lifecycle hooks
  onMounted(() => {
    if (autoStart) {
      iniciar()
      // Hacer una actualización inicial inmediata
      actualizarDatos()
    }
  })

  onUnmounted(() => {
    detener()
  })

  return {
    // Estados
    isActive,
    lastUpdate,
    updateCount,
    errors,
    isUpdating,

    // Métodos
    iniciar,
    detener,
    forzarActualizacion,
    limpiarErrores,
    cambiarIntervalo,
    actualizarDatos
  }
}

// Composable específico para procesos de planta
export function usePlantaRealtimeUpdates(procesoTipo) {
  const updates = useRealtimeUpdates({
    interval: 2000, // Más frecuente para procesos activos (2 segundos)
    onUpdate: (timestamp) => {
      console.log(`[PlantaUpdates:${procesoTipo}] Actualizado a las ${timestamp.toLocaleTimeString()}`)

      // Emitir evento específico para este tipo de proceso
      window.dispatchEvent(new CustomEvent('plantaProcesoTypeUpdate', {
        detail: {
          procesoTipo,
          timestamp,
          source: 'realtimeUpdate'
        }
      }))
    },
    onError: (error) => {
      console.error(`[PlantaUpdates:${procesoTipo}] Error:`, error)
    }
  })

  // Función específica para actualizar estado de planta
  async function actualizarEstadoPlanta(ordenId, estadoParcial) {
    const ordenStore = useOrdenStore()

    try {
      await ordenStore.actualizarEstadoPlanta(ordenId, estadoParcial)

      // Forzar actualización después de cambios
      await updates.forzarActualizacion()

      // Emitir evento específico para procesos de planta
      window.dispatchEvent(new CustomEvent('plantaProcesoUpdate', {
        detail: {
          procesoTipo,
          ordenId,
          estadoParcial,
          timestamp: new Date()
        }
      }))

    } catch (error) {
      console.error(`[PlantaUpdates:${procesoTipo}] Error al actualizar estado:`, error)
      throw error
    }
  }

  return {
    ...updates,
    actualizarEstadoPlanta
  }
}

// Utilidad para sincronización entre pestañas/ventanas
export function useCrossBrowserSync() {
  const syncKey = 'protex-realtime-sync'

  // Escuchar cambios de otros tabs
  function iniciarSincronizacion() {
    const handleStorageChange = (event) => {
      if (event.key === syncKey && event.newValue) {
        try {
          const data = JSON.parse(event.newValue)

          // Emitir evento local basado en el cambio externo
          window.dispatchEvent(new CustomEvent('crossBrowserSync', {
            detail: data
          }))

          console.log('[CrossBrowserSync] Sincronización recibida:', data)
        } catch (error) {
          console.error('[CrossBrowserSync] Error al procesar sincronización:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }

  // Notificar cambios a otros tabs
  function notificarCambio(tipo, datos) {
    const mensaje = {
      tipo,
      datos,
      timestamp: new Date().toISOString(),
      tab: window.location.pathname
    }

    localStorage.setItem(syncKey, JSON.stringify(mensaje))

    // Limpiar después de un breve momento
    setTimeout(() => {
      localStorage.removeItem(syncKey)
    }, 1000)
  }

  return {
    iniciarSincronizacion,
    notificarCambio
  }
}
