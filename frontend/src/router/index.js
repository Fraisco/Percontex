import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabaseClient';
// Importaciones directas de tus vistas y componentes
import LoginView from '../views/LoginView.vue'
import OrdenProduccionView from '../views/OrdenProduccionView.vue'
import VistaCorteview from '../views/VistaCorte.vue'
import procesoCorte from '../components/procesoCorte.vue'
import ExtenderTela from '../views/ExtenderTela.vue'
import OrdenCorte from '../views/OrdenCorte.vue' // Sigue importando el componente
import Numeracion from '../views/Numeracion.vue'
import procesoPlanta from '../components/procesoPlanta.vue'
import LavanderiaView from '../views/Lavanderia.vue'
import InformesBalanceView from '../views/InformesBalanceView.vue'

// Función auxiliar para decodificar un JWT y verificar su expiración
// (Nota: Esto no verifica la firma del token, solo su estructura y tiempo de expiración.
// La verificación completa de la validez del token debe hacerse en el backend.)
function decodeJwtAndCheckExpiration(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decodedToken = JSON.parse(jsonPayload);

    // Verifica si el token tiene una fecha de expiración y si ya ha expirado
    if (decodedToken.exp) {
      const currentTime = Date.now() / 1000; // Tiempo actual en segundos
      return decodedToken.exp > currentTime; // Retorna true si no ha expirado
    }
    return false; // Si no hay 'exp' o es inválido
  } catch (e) {
    console.error("Error al decodificar o verificar el token:", e);
    return false; // El token es inválido o corrupto
  }
}

// Configuración de rutas
const routes = [
  {
    path: '/',
    redirect: '/login' // Redirige la ruta raíz a la página de login
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
    // No se añade 'meta: { requiresAuth: true }' porque esta es la página de login
  },
  {
    path: '/OrdenProduccion',
    name: 'OrdenProduccion',
    component: OrdenProduccionView,
    meta: { requiresAuth: true } // ¡Esta ruta requiere autenticación!
  },
  {
    path: '/VistaCorte',
    name: 'VistaCorte',
    component: VistaCorteview,
    meta: { requiresAuth: true } // ¡Esta ruta requiere autenticación!
  },
  {
    path: '/procesoCorte',
    name: 'procesoCorte',
    component: procesoCorte,
    meta: { requiresAuth: true }, // La ruta padre requiere autenticación
    children: [
      {
        path: 'OrdenCorte', // Esto hace que la ruta completa sea /procesoCorte/OrdenCorte
        name: 'procesoCorte-OrdenCorte', // Un nombre único para la ruta hija
        component: OrdenCorte, // El componente OrdenCorte
        meta: { requiresAuth: true } // La ruta hija también requiere autenticación explícitamente
      }
    ]
  },
  // La ruta /OrdenCorte de nivel superior se ha movido como hija de /procesoCorte
  // Si necesitas que /OrdenCorte también exista como una ruta de nivel superior independiente,
  // puedes volver a añadirla aquí, pero asegúrate de que tenga un nombre diferente
  // y que su lógica de componente sea adecuada para un acceso directo.

  {
    path: '/procesoPlanta',
    name: 'procesoPlanta',
    component: procesoPlanta,
    meta: { requiresAuth: true } // ¡Esta ruta requiere autenticación!
  },
  {
    path: '/ExtenderTela',
    name: 'ExtenderTela',
    component: ExtenderTela,
    meta: { requiresAuth: true } // ¡Esta ruta requiere autenticación!
  },
  // Si OrdenCorte ya no es una ruta de nivel superior, puedes comentar o eliminar esta:
  // {
  //   path: '/OrdenCorte',
  //   name: 'OrdenCorte',
  //   component: OrdenCorte,
  //   meta: { requiresAuth: true }
  // },
  {
    path: '/Numeracion',
    name: 'Numeracion',
    component: Numeracion,
    meta: { requiresAuth: true } // ¡Esta ruta requiere autenticación!
  },
  {
    path: '/lavanderia',
    name: 'Lavanderia',
    component: LavanderiaView,
    meta: { requiresAuth: true } // ¡Esta ruta requiere autenticación!
  },
  {
    path: '/informes',
    redirect: '/informes/dashboard',
    meta: { requiresAuth: true }
  },
  {
    path: '/informes/:seccion',
    name: 'Informes',
    component: InformesBalanceView,
    meta: { requiresAuth: true }
  },
]

// Crear el router
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
router.beforeEach(async (to, from, next) => {
  // Obtener la sesión actual
  const { data: { session } } = await supabase.auth.getSession()
  if (to.meta.requiresAuth && !session) {
    next('/login')
  } else {
    next()
  }
})

export default router
