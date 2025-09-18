<template>
  <div class="proceso-planta-container">
    <!-- NAVBAR -->
    <div class="navbar">
      <ul>
        <li @click="cambiarVista('Ordenes')" :class="{ active: vistaActiva === 'Ordenes' }">
          📋 Órdenes
        </li>
        <li @click="cambiarVista('Delantero')" :class="{ active: vistaActiva === 'Delantero' }">
          🧵 Delantero
        </li>
        <li @click="cambiarVista('Trasero')" :class="{ active: vistaActiva === 'Trasero' }">
          👖 Trasero
        </li>
        <li @click="cambiarVista('Ensamble')" :class="{ active: vistaActiva === 'Ensamble' }">
          🧩 Ensamble
        </li>
        <li @click="cambiarVista('Finalizar')" :class="{ active: vistaActiva === 'Finalizar' }">
          ✅ Finalizar
        </li>
        <li @click="cambiarVista('SeguimientoPlanta')" :class="{ active: vistaActiva === 'SeguimientoPlanta' }"
          class="seguimiento-button">
          📊 Seguimiento
        </li>
        <li @click="logout" class="logout-button">Cerrar Sesión</li>
      </ul>
    </div>

    <!-- CONTENT -->
    <div class="content-wrapper">
      <!-- Vista Órdenes -->
      <div v-if="vistaActiva === 'Ordenes'" class="ordenes-view">
        <h2>📋 Órdenes de Producción</h2>

        <div v-if="ordenes.length === 0" class="no-ordenes">
          No hay órdenes registradas en el sistema.
        </div>

        <table v-else class="tabla-ordenes">
          <thead>
            <tr>
              <th>Consecutivo</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="orden in ordenes" :key="orden.consecutivo">
              <td>{{ orden.consecutivo }}</td>
              <td>{{ orden.cliente || "N/A" }}</td>
              <td>{{ orden.fecha || "Sin fecha" }}</td>
              <td>{{ orden.estado || "Pendiente" }}</td>
              <td>
                <!-- 🔑 Seleccionamos orden -->
                <button @click="seleccionarOrden(orden)">🔍 Seleccionar</button>
                <button @click="eliminarOrden(orden.consecutivo)">🗑️ Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vista Subprocesos (menú desplegable tipo flexbox) -->
      <div v-else-if="vistaActiva === 'Subprocesos'" class="subprocesos-view">
        <h2>⚙️ Subprocesos de la orden {{ ordenSeleccionada?.consecutivo }}</h2>

        <div class="subproceso-menu">
          <div v-for="sp in subprocesos" :key="sp.nombre" class="subproceso-card" @click="cambiarVista(sp.vista)">
            <span class="emoji">{{ sp.icono }}</span>
            <p>{{ sp.nombre }}</p>
          </div>
        </div>
      </div>

      <!-- Vista Delantero -->
      <div v-else-if="vistaActiva === 'Delantero'">
        <DelanteroView />
      </div>

      <!-- Vista Trasero -->
      <div v-else-if="vistaActiva === 'Trasero'">
        <TraseroView />
      </div>

      <!-- Vista Ensamble -->
      <div v-else-if="vistaActiva === 'Ensamble'">
        <EnsambleView />
      </div>

      <!-- Vista Finalizar -->
      <div v-else-if="vistaActiva === 'Finalizar'">
        <FinalizarView />
      </div>

      <!-- Vista Seguimiento -->
      <div v-else-if="vistaActiva === 'SeguimientoPlanta'">
        <SeguimientoPlanta />
      </div>

      <!-- Vista Inicial -->
      <div v-else class="vista-inicial">
        <div class="mensaje-bienvenida">
          <h2>🏭 Sistema de Gestión de Procesos de Planta</h2>
          <p>Bienvenido al sistema integrado de gestión de procesos de planta.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useOrdenStore } from "../stores/ordenStore";
import { onMounted, computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

// Vistas
import FinalizarView from "../views/Finalizar.vue";
import SeguimientoPlanta from "../views/SeguimientoPlanta.vue";
import DelanteroView from "../views/delantero.vue";
import TraseroView from "../views/trasero.vue";
import EnsambleView from "../views/ensamble.vue";

const router = useRouter();
const ordenStore = useOrdenStore();

const vistaActiva = ref("Ordenes");

// Computed
const ordenes = computed(() => ordenStore.ordenes);
const ordenSeleccionada = computed(() => ordenStore.ordenSeleccionada);

// Lista de subprocesos para el menú flexbox
const subprocesos = [
  { nombre: "Delantero", vista: "Delantero", icono: "🧵" },
  { nombre: "Trasero", vista: "Trasero", icono: "👖" },
  { nombre: "Ensamble", vista: "Ensamble", icono: "🧩" },
  { nombre: "Finalizar", vista: "Finalizar", icono: "✅" },
  { nombre: "Seguimiento", vista: "SeguimientoPlanta", icono: "📊" },
];

// Inicialización
onMounted(() => {
  ordenStore.cargarOrdenes();
});

// Guardar vista activa en localStorage
watch(vistaActiva, (val) => {
  localStorage.setItem("vistaActivaProcesoPlanta", val);
});

// Cambiar vista
function cambiarVista(nuevaVista) {
  vistaActiva.value = nuevaVista;
}

// Seleccionar orden → ir a Subprocesos
function seleccionarOrden(orden) {
  ordenStore.seleccionarOrden(orden.consecutivo);
  console.log("📌 Orden seleccionada desde UI:", orden);
  vistaActiva.value = "Subprocesos";
}

// Eliminar orden
function eliminarOrden(consecutivo) {
  ordenStore.eliminarOrden(consecutivo);
  console.log("🗑️ Orden eliminada:", consecutivo);
}

// Cerrar sesión
function logout() {
  localStorage.clear();
  router.push("/login");
}
</script>

<style scoped>
/* --- Menú de subprocesos tipo Flexbox --- */
.subproceso-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}

.subproceso-card {
  flex: 1 1 150px;
  min-width: 150px;
  max-width: 200px;
  background: #2563eb;
  color: white;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.subproceso-card:hover {
  background: #1e40af;
  transform: scale(1.05);
}

.subproceso-card .emoji {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

/* Los estilos principales están definidos en global-styles.css y main.css */
/* Solo mantenemos ajustes específicos para este componente */

.proceso-planta-container {
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

/* Progreso de planta específico */
.progreso-planta {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--bg-soft);
  border-radius: var(--border-radius);
  border-left: 4px solid var(--primary-blue);
}

.progreso-planta h3 {
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

.btn-seleccionar:hover,
.btn-go-to-orders:hover {
  transform: translateY(-1px);
}

/* Estilos específicos para el botón de seguimiento */
.navbar .seguimiento-button {
  background-color: var(--info) !important;
  color: white !important;
  font-weight: 600;
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
}

.navbar .seguimiento-button:hover {
  background-color: var(--info-dark) !important;
  transform: scale(1.05);
}

.navbar .seguimiento-button.active {
  background-color: var(--info-dark) !important;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

/* Vista inicial moderna */
.vista-inicial {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: var(--spacing-xl);
}

.mensaje-bienvenida {
  text-align: center;
  max-width: 800px;
}

.mensaje-bienvenida h2 {
  font-size: var(--font-size-3xl);
  color: var(--primary-blue-dark);
  margin-bottom: var(--spacing-lg);
  font-weight: 700;
}

.mensaje-bienvenida p {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.opciones-sistema {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.opcion-card {
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-soft));
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.opcion-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-blue);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, var(--primary-blue-bg), var(--bg-primary));
}

.opcion-icono {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.opcion-card h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.opcion-card p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.opcion-card:hover h3 {
  color: var(--primary-blue-dark);
}

.opcion-card:hover p {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .opciones-sistema {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }

  .opcion-card {
    padding: var(--spacing-lg);
  }

  .opcion-icono {
    font-size: 2.5rem;
  }

  .mensaje-bienvenida h2 {
    font-size: var(--font-size-2xl);
  }
}

@media (max-width: 480px) {
  .opciones-sistema {
    grid-template-columns: 1fr;
  }
}

/* Estilos para sin órdenes */
.sin-ordenes {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40vh;
  padding: var(--spacing-xl);
}

.mensaje-sin-ordenes {
  text-align: center;
  max-width: 500px;
  background: linear-gradient(135deg, var(--warning-bg), var(--bg-secondary));
  padding: var(--spacing-xl);
  border-radius: var(--border-radius);
  border: 2px solid var(--warning-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mensaje-sin-ordenes h3 {
  font-size: var(--font-size-2xl);
  color: var(--warning-dark);
  margin-bottom: var(--spacing-md);
  font-weight: 700;
}

.mensaje-sin-ordenes p {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.acciones-sin-ordenes {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.btn-recargar,
.btn-crear-orden {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.btn-recargar {
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn-recargar:hover {
  background: linear-gradient(135deg, var(--primary-blue-dark), #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
}

.btn-crear-orden {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  color: white;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.btn-crear-orden:hover {
  background: linear-gradient(135deg, var(--success-dark), #1e7e34);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(40, 167, 69, 0.4);
}

@media (max-width: 768px) {
  .acciones-sin-ordenes {
    flex-direction: column;
    align-items: center;
  }

  .btn-recargar,
  .btn-crear-orden {
    width: 100%;
    max-width: 250px;
  }
}
</style>
