<template>
  <div class="fullscreen-wrapper">
    <div class="login-container">
      <div class="company-header">
        <span class="company-name">PERCONTEX S.A.S</span>
        <span class="company-slogan">Comprometidos con la calidad</span>
      </div>
      <h1>Iniciar Sesión</h1>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="email">Correo</label>
          <input v-model="email" type="email" id="email" required placeholder="Ingresa tu correo" />
        </div>

        <div class="form-group password-group">
          <label for="password">Contraseña</label>
          <div class="password-wrapper">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" id="password" required
              placeholder="Ingresa tu contraseña" />
            <span class="toggle-password" @click="togglePassword">
              {{ showPassword ? "🙈" : "👁️" }}
            </span>
          </div>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "Ingresando..." : "Ingresar" }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabaseClient.js"; // Asegúrate de que la ruta sea correcta
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const error = ref("");
const showPassword = ref(false);
const loading = ref(false);
const router = useRouter();

onMounted(() => {
  // Si un token existe, redirige a OrdenProduccion, previniendo el acceso directo al login
  const token = localStorage.getItem("token");
  if (token) {
    router.push("/OrdenProduccion"); // Redirige a OrdenProduccion
  }
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const login = async () => {
  error.value = "";
  loading.value = true;

  try {
    // 1. Autenticación con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    // Verificar errores de autenticación
    if (authError) {
      throw new Error(authError.message || "Error en credenciales");
    }

    // Verificar si se recibieron datos válidos
    if (!authData || !authData.user) {
      throw new Error("No se recibió información del usuario");
    }

    // 2. Guardar datos en localStorage
    localStorage.setItem("sb-access-token", authData.session.access_token);
    localStorage.setItem("sb-refresh-token", authData.session.refresh_token);
    localStorage.setItem("usuario", JSON.stringify(authData.user));

    // 3. Redirigir a OrdenProduccion
    router.push("/OrdenProduccion");
  } catch (err) {
    error.value = err.message || "Error al iniciar sesión";
    console.error("Login error:", err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@import "../assets/base.css";
@import "../assets/main";
@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Roboto:wght@400;500&display=swap");

/* Ajustes generales */
* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  /* Elimina márgenes */
  padding: 0;
  /* Elimina padding */
  font-family: "Roboto", sans-serif;
  /* Fuente base más legible */
  overflow: hidden;
  /* Elimina desplazamiento horizontal y vertical */
}

/* Contenedor principal */
.fullscreen-wrapper {
  width: 100vw;
  /* Asegura que el wrapper ocupe el 100% del ancho */
  height: 100vh;
  /* Asegura que el wrapper ocupe el 100% de la altura */
  display: flex;
  justify-content: center;
  /* Centra el contenido horizontalmente */
  align-items: center;
  /* Centra el contenido verticalmente */
  background-color: #f2f2f2;
  /* Color de fondo general */
  margin: 0;
  padding: 0;
  /* Elimina cualquier padding externo */
}

/* Contenedor del formulario */
.login-container {
  width: 100%;
  max-width: 480px;
  /* Asegura un ancho máximo */
  padding: 2.5rem;
  /* Espaciado dentro del formulario */
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  /* Asegura que el padding no afecte el tamaño */
  display: flex;
  flex-direction: column;
  /* Alinea el encabezado de la empresa arriba */
  align-items: center;
  /* Centra el encabezado de la empresa */
}

.company-header {
  text-align: center;
  /* Centra el texto dentro del header */
  margin-bottom: 1.5rem;
  /* Reducido el margen inferior */
  display: flex;
  /* Ya no es necesario como flex container */
  flex-direction: column;
  /* Apila el nombre y el eslogan verticalmente */
  align-items: center;
  /* Centra horizontalmente el nombre y el eslogan */
}

.company-name {
  font-family: "Montserrat", sans-serif;
  /* Fuente más impactante */
  font-size: 2rem;
  color: #2c3e50;
  /* Un color serio y profesional */
  font-weight: bold;
  letter-spacing: 0.5px;
}

.company-slogan {
  font-size: 0.9rem;
  color: #555;
  font-style: italic;
  margin-top: 0.5rem;
}

/* Formulario */
h1 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
  width: 100%;
  /* Asegura que los elementos del formulario ocupen el ancho */
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #444;
}

input {
  width: 100%;
  /* Asegura que el input ocupe todo el ancho */
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  transition: border 0.3s;
}

input:focus {
  border-color: #409eff;
  outline: none;
}

.password-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 1.2rem;
  user-select: none;
}

/* Botón */
button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background-color: #2c3e50;
  /* Un color más comprometido */
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background-color: #1a2530;
}

button:disabled {
  background-color: #a7b1b8;
  cursor: not-allowed;
}

/* Mensaje de error */
.error {
  color: #e63946;
  margin-top: 1rem;
  text-align: center;
}
</style>
