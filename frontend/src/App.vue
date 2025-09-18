<template>
  <div class="app-container">
    <aside v-if="!hideSidebarRoutes.includes(route.path)" class="sidebar">
      <div class="sidebar-logo">
        <h1 class="logo">🧵 PERCONTEX</h1>
        <p class="subtitle">Seguimiento de producción</p>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li>
            <RouterLink to="/OrdenProduccion" class="nav-link">Orden Producción</RouterLink>
          </li>
          <li>
            <RouterLink to="/procesoCorte" class="nav-link">Corte</RouterLink>
          </li>
          <li>
            <RouterLink to="/procesoPlanta" class="nav-link">Planta</RouterLink>
          </li>
          <li>
            <RouterLink to="/lavanderia" class="nav-link">Lavandería</RouterLink>
          </li>
          <li>
            <RouterLink to="/informes" class="nav-link">Informes</RouterLink>
          </li>
        </ul>
        
        <button @click="logout" class="logout-button">Salir</button>
      </nav>
    </aside>

    <main
      class="main-content"
      :class="{ 'no-sidebar': hideSidebarRoutes.includes(route.path) }"
    >
      <div class="content-wrapper">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// Rutas donde no se debe mostrar la sidebar
const hideSidebarRoutes = ['/login'];

// Función de logout
const logout = () => {
  localStorage.clear(); // Limpia todo el localStorage
  router.push('/login');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600&display=swap');

/* Sobreescrituras específicas para App.vue */
.logo {
  font-size: var(--font-size-xl);
  color: var(--primary-blue);
  margin: 0;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
  margin-bottom: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-md);
  color: var(--sidebar-text);
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
  background: none;
  border: none;
  font-family: inherit;
  font-size: var(--font-size-base);
  cursor: pointer;
}

.nav-link:hover {
  background-color: var(--sidebar-hover);
  transform: translateX(4px);
}

.nav-link.router-link-exact-active {
  background-color: var(--sidebar-active);
  color: white;
  font-weight: 600;
}

.logout-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-md);
  color: var(--secondary-red);
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
  background: none;
  border: none;
  font-family: inherit;
  font-size: var(--font-size-base);
  cursor: pointer;
  margin-top: auto;
}

.logout-button:hover {
  background-color: var(--secondary-red);
  color: white;
}

/* Ajustes para cuando no hay sidebar */
.main-content.no-sidebar {
  margin-left: 0;
  padding: var(--spacing-xl);
}

.main-content.no-sidebar .content-wrapper {
  margin: 0;
  padding: 0;
  box-shadow: none;
  background: transparent;
  min-height: auto;
}

/* Responsive específico para App */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .sidebar-logo {
    margin-bottom: 0;
    text-align: left;
    padding-bottom: 0;
    border-bottom: none;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .sidebar-nav ul {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-sm);
  }

  .logout-button {
    margin-top: 0;
    width: auto;
  }

  .main-content {
    padding: var(--spacing-md);
    margin-left: 0;
  }

  .content-wrapper {
    padding: var(--spacing-md);
  }
}
</style>
