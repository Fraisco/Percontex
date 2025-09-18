<template>
  <div class="page-container">
    <div class="factura-box">
      <h1 class="title">PERCONTEX S.A.S</h1>
      <h2 class="subtitle">ORDEN DE PRODUCCIÓN</h2>

      <div class="info-general-container">
        <div class="campo-grupo">
          <label for="fecha">Fecha Actual</label>
          <input v-model="orden.fecha" type="date" id="fecha" />
        </div>
        <div class="campo-grupo campo-hora-creacion">
          <label for="hora_creacion">Hora de Creación</label>
          <input v-model="orden.horaCreacion" type="datetime-local" id="hora_creacion" readonly
            class="input-readonly" />
        </div>
        <div class="campo-grupo">
          <label for="encargado">Nombre del Encargado</label>
          <input v-model="orden.encargado" type="text" id="encargado" placeholder="Nombre del encargado" />
        </div>
        <div class="campo-grupo">
          <label for="consecutivo">Consecutivo</label>
          <input v-model="orden.consecutivo" type="text" id="consecutivo" placeholder="Consecutivo" />
        </div>
        <div class="campo-grupo">
          <label for="proveedor">Proveedor</label>
          <input v-model="orden.proveedor" type="text" id="proveedor" placeholder="Nombre del proveedor" />
        </div>
        <div class="campo-grupo">
          <label for="referencia_default">Referencia</label>
          <input v-model="referenciaPorDefecto" type="text" id="referencia_default" placeholder="Ingresar referencia" />
        </div>
        <div class="campo-grupo campo-imagen-diseno">
          <label for="imagen_diseno">Imagen de Diseño</label>
          <input type="file" id="imagen_diseno" @change="manejarImagenDiseno" accept=".jpg,.jpeg,.png"
            class="input-imagen" />
          <div v-if="orden.imagenDiseno" class="vista-previa-imagen">
            <img :src="orden.imagenDiseno" alt="Vista previa del diseño" class="imagen-preview" />
            <button @click="eliminarImagenDiseno" class="btn-eliminar-imagen">✗</button>
          </div>
        </div>
        <div class="campo-grupo total-box-basico">
          <strong>La cantidad total del pedido es de:</strong>
          {{ totalCantidad }} pantalones
        </div>
      </div>

      <h3 class="subtitle">Detalles de Producción</h3>
      <div class="table-wrapper">
        <table class="table detalles-table">
          <thead>
            <tr>
              <th>Referencia</th>
              <th v-for="(talla, index) in columnasTallas" :key="index">
                <input type="text" v-model="columnasTallas[index]" placeholder="Talla" class="input-talla-header" />
              </th>
              <th>Total</th>
              <th>Color / Tipo de Tela</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(detalle, index) in orden.detalles" :key="index">
              <td>{{ generarReferenciaDetalle }}</td>
              <td v-for="(t, idx) in columnasTallas" :key="idx">
                <input type="number" min="0" v-model.number="detalle.tallas[t]" class="input-table input-talla" />
              </td>
              <td>{{ totalPorFila(detalle) }}</td>
              <td class="celda-color-y-tela">
                <div class="color-info">
                  <input type="color" v-model="detalle.color" class="input-color" />
                  <span class="color-box-small" :style="{
                    backgroundColor: detalle.color,
                    border: detalle.color === '#FFFFFF' ? '1px solid #ccc' : 'none',
                  }" :title="getFriendlyColorName(detalle.color)"></span>
                  <span class="color-name">{{
                    getFriendlyColorName(detalle.color)
                    }}</span>
                </div>
                <div class="tela-info">
                  <select v-model="detalle.tipoTela" class="input-tipo-tela">
                    <option value="">Seleccionar tela</option>
                    <option value="Algodón">Algodón</option>
                    <option value="Lino">Lino</option>
                    <option value="Poliéster">Poliéster</option>
                    <option value="Seda">Seda</option>
                    <option value="Lana">Lana</option>
                    <option value="Mezclilla">Mezclilla</option>
                    <option value="Satén">Satén</option>
                    <option value="Gabardina">Gabardina</option>
                    <option value="Franela">Franela</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <input v-if="detalle.tipoTela === 'Otro'" v-model="detalle.TelaCustom" type="text"
                    placeholder="Especificar tipo" class="input-tela-custom" />
                </div>
              </td>
              <td>
                <button @click="eliminarDetalle(index)" class="delete-btn">X</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total por Talla</strong></td>
              <td v-for="talla in columnasTallas" :key="talla">
                <span>{{ totalPorColumna(talla) }}</span>
              </td>
              <td>
                <strong>{{ totalCantidad }}</strong>
              </td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="actions">
        <button @click="agregarDetalle" class="btn btn-blue">Agregar Detalle</button>
      </div>

      <div class="actions button-actions mt-8">
        <button @click="guardarOrdenYIrAProcesoTrasero" class="btn btn-green">
          Guardar Orden e Ir a Proceso Trasero
        </button>
        <button @click="limpiarTodo" class="btn btn-red">Limpiar Formulario</button>
      </div>

      <div v-if="ordenGuardada" class="invoice-preview">
        <h3 class="subtitle">Resumen de la Orden</h3>
        <p class="order-number"><strong>Orden No.:</strong> {{ orden.consecutivo }}</p>
        <p class="order-reference">
          <strong>Referencia:</strong> {{ generarReferenciaDetalle }}
        </p>
        <p><strong>Proveedor:</strong> {{ orden.proveedor }}</p>
        <p><strong>Fecha:</strong> {{ orden.fecha }}</p>
        <p><strong>Encargado:</strong> {{ orden.encargado }}</p>
        <p class="total-production">
          <strong>Total de Producción:</strong> {{ totalCantidad }} pantalones
        </p>
      </div>

      <div class="firmas">
        <div><strong>Preparación</strong> __________________</div>
        <div><strong>Despachador</strong> __________________</div>
        <div><strong>Revisión</strong> __________________</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { supabase } from "../lib/supabaseClient";

const procesosTrasero = ref([
  { id: "pinza", nombre: "Pinza" },
  { id: "pespunte_pinza", nombre: "Pespunte Pinza" },
  { id: "falso_trasero", nombre: "Falso Trasero" },
  { id: "ribetear", nombre: "Ribetear" },
  { id: "hacer_primero", nombre: "Hacer Primero" },
  { id: "ojal", nombre: "Ojal" },
  { id: "hacer_segundo", nombre: "Hacer Segundo" },
  { id: "trasero_presillar", nombre: "Trasero Presillar" },
  { id: "entalegar", nombre: "Entalegar" },
  { id: "ensamblar_trasero", nombre: "Ensamblar Trasero" },
  { id: "cerrar_tiro", nombre: "Cerrar Tiro" },
  { id: "pespunte_tiro", nombre: "Pespunte Tiro" },
  { id: "parchar", nombre: "Parchar" },
]);

const toast = useToast();
const columnasTallas = ref([
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
]);
const ordenGuardada = ref(false);
const formdata = new FormData();
const orden = reactive({
  consecutivo: "",
  fecha: "",
  horaCreacion: "",
  encargado: "",
  proveedor: "",
  imagenDiseno: null,
  detalles: [],
  cantidadesPorProceso: {},
  estadoCorte: {
    telaExtendida: false,
    aplicaExtension: false,
    unidadesCortadas: [],
    unidadesNumeradas: [],
    unidadesFusionadas: [],
    unidadesExtendidasPorColor: [],
  },
});

const referenciaPorDefecto = ref("");

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
const generarReferenciaDetalle = computed(() => {
  return orden.consecutivo && referenciaPorDefecto.value
    ? `${orden.consecutivo}-${referenciaPorDefecto.value}`
    : "";
});

function agregarDetalle() {
  const initialTallas = {};
  columnasTallas.value.forEach((t) => {
    initialTallas[t] = 0;
  });

  const nuevaFila = {
    referencia: referenciaPorDefecto.value,
    color: "#000000", // Color inicial por defecto (negro)
    tipoTela: "",
    TelaCustom: "",
    tallas: reactive(initialTallas),
  };
  orden.detalles.push(nuevaFila);
}

function eliminarDetalle(index) {
  orden.detalles.splice(index, 1);
}

function totalPorFila(detalle) {
  if (!detalle || !detalle.tallas || typeof detalle.tallas !== "object") {
    return 0;
  }
  return Object.values(detalle.tallas).reduce(
    (acc, val) => acc + (parseInt(val) || 0),
    0
  );
}

const totalCantidad = computed(() =>
  orden.detalles.reduce((total, item) => total + totalPorFila(item), 0)
);

function totalPorColumna(talla) {
  return orden.detalles.reduce(
    (total, detalle) => total + (parseInt(detalle.tallas[talla]) || 0),
    0
  );
}

async function guardarOrdenYIrAProcesoTrasero() {
  // Toast de carga persistente con spinner
  const loadingToastId = toast.info("Guardando orden...", {
    timeout: false,
    closeOnClick: false,
    pauseOnFocusLoss: false,
    pauseOnHover: false,
    draggable: false,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: "fas fa-spinner fa-spin",
    position: "top-center",
    rtl: false,
  });

  const nuevaOrdenId = `${orden.consecutivo}-${referenciaPorDefecto.value}`;

  // Empaquetar los detalles y tallas
  const detalles = orden.detalles.map((detalle) => ({
    referencia: referenciaPorDefecto.value,
    color: detalle.color,
    tipo_tela: detalle.tipoTela === "Otro" ? "" : detalle.tipoTela,
    tela_custom: detalle.tipoTela === "Otro" ? detalle.TelaCustom : "",
    total_color: totalPorFila(detalle),
    tallas: detalle.tallas,
  }));

  // Inicializar arrays de unidades
  const traseroProcesos = {};
  const unidadesCortadas = [];
  const unidadesNumeradas = [];
  const unidadesFusionadas = [];
  const unidadesExtendidas = [];

  const totalesPorColor = {};
  detalles.forEach((detalle) => {
    if (detalle.total_color > 0) {
      totalesPorColor[detalle.color] = detalle.total_color;
    }
  });

  procesosTrasero.value.forEach((proceso) => {
    traseroProcesos[proceso.id] = {
      totalPorColor: { ...totalesPorColor },
      hechosPorColor: Object.fromEntries(
        Object.keys(totalesPorColor).map((color) => [color, 0])
      ),
      nombreProceso: proceso.nombre,
    };
  });

  detalles.forEach((detalle) => {
    const totalColor = totalPorFila(detalle);
    if (totalColor > 0) {
      const unidadBase = {
        referencia: orden.consecutivo,
        color: detalle.color,
        cantidadTotal: totalColor,
        cortadas: 0,
        faltan: totalColor,
      };
      unidadesExtendidas.push({
        ...unidadBase,
        extendidas: 0,
        faltan: totalColor,
      });
      unidadesCortadas.push({ ...unidadBase });
      unidadesNumeradas.push({
        ...unidadBase,
        numeradas: 0,
        faltan: totalColor,
      });
      unidadesFusionadas.push({
        ...unidadBase,
        fusionadas: 0,
        faltan: totalColor,
        aplica: true,
      });
    }
  });

  const nuevaOrdenCompleta = {
    id: nuevaOrdenId,
    consecutivo: orden.consecutivo,
    fecha: orden.fecha,
    hora: orden.horaCreacion,
    encargado: orden.encargado,
    proveedor: orden.proveedor,
    imagen_diseno: orden.imagenDiseno,
    telaExtendida: false,
    telaCortada: false,
    referencia_por_defecto: referenciaPorDefecto.value,
    totalCantidad: totalCantidad.value,
    detalles,
    trasero: traseroProcesos,
    unidadesExtendidas,
    unidadesCortadas,
    unidadesNumeradas,
    unidadesFusionadas,
  };

  try {
    console.log("📦 Datos a enviar:", nuevaOrdenCompleta);
    if (
      !nuevaOrdenCompleta.id ||
      !Array.isArray(nuevaOrdenCompleta.detalles) ||
      nuevaOrdenCompleta.detalles.length === 0
    ) {
      throw new Error("Payload inválido: falta id o detalles vacíos.");
    }

    // RPC con timeout y reintentos
    const attemptRpc = async (attempt = 1) => {
      const controller = new AbortController();
      const timeoutMs = 15_000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const { data, error } = await supabase.rpc(
          "crear_orden_completa",
          { data: nuevaOrdenCompleta },
          { signal: controller.signal }
        );
        console.log("📨 Respuesta RPC:", { data, error });

        if (error) {
          if (attempt < 3 && (error.status >= 500 || error.code === "ECONNABORTED")) {
            console.warn(`Reintentando RPC (intento ${attempt + 1})...`);
            return attemptRpc(attempt + 1);
          }
          throw error;
        }
        return data;
      } finally {
        clearTimeout(timeout);
      }
    };

    const result = await attemptRpc();

    // Cerrar el toast de carga antes de mostrar éxito
    toast.dismiss(loadingToastId);

    // Toast de éxito
    toast.success(`¡Orden registrada con éxito! ID: ${nuevaOrdenId}`, {
      timeout: 5000,
      position: "top-center",
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnFocusLoss: false,
      pauseOnHover: true,
      draggable: true,
      showCloseButtonOnHover: false,
      closeButton: "button",
      icon: true,
      rtl: false,
    });

    // Opcional: navegar automáticamente al proceso trasero
    // if (router) router.push({ name: "ProcesoTrasero", params: { id: nuevaOrdenId } });
  } catch (error) {
    // Cerrar el toast de carga antes de mostrar el error
    toast.dismiss(loadingToastId);

    // Construir mensaje de error robusto
    const msg =
      error?.message ||
      error?.statusText ||
      (typeof error === "string" ? error : "Error desconocido");

    toast.error(`❌ Error al guardar la orden: ${msg}`, {
      timeout: 10000,
      position: "top-center",
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnFocusLoss: false,
      pauseOnHover: true,
      draggable: true,
      showCloseButtonOnHover: true,
      closeButton: "button",
      icon: true,
      rtl: false,
    });
  } finally {
    // Seguridad: si aún estuviera abierto, asegúrate de cerrarlo
    toast.dismiss(loadingToastId);
  }
}
function limpiarTodo() {
  Object.assign(orden, {
    consecutivo: "",
    fecha: "",
    horaCreacion: "",
    fechaInicio: "",
    fechaEstimada: "",
    encargado: "",
    proveedor: "",
    imagenDiseno: null,
    detalles: [],
    cantidadesPorProceso: {},
    estadoCorte: {
      telaExtendida: false,
      aplicaExtension: false,
      unidadesCortadas: [],
      unidadesNumeradas: [],
      unidadesFusionadas: [],
      unidadesExtendidasPorColor: [],
    },
  });
  referenciaPorDefecto.value = "";
  ordenGuardada.value = false;

  // Limpiar input de imagen
  const inputFile = document.getElementById("imagen_diseno");
  if (inputFile) {
    inputFile.value = "";
  }

  console.log("Formulario limpiado.");
}

// Función para manejar la imagen de diseño
function manejarImagenDiseno(event) {
  const archivo = event.target.files[0];
  console.log(archivo);
  if (!archivo) return;

  // Validar tipo de archivo
  const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png"];
  if (!tiposPermitidos.includes(archivo.type)) {
    alert("Por favor, selecciona un archivo de imagen válido (.jpg, .jpeg, .png)");
    event.target.value = "";
    return;
  }

  // Validar tamaño (5MB máximo)
  const tamañoMaximo = 5 * 1024 * 1024; // 5MB en bytes
  if (archivo.size > tamañoMaximo) {
    alert("El archivo es demasiado grande. El tamaño máximo permitido es 5MB.");
    event.target.value = "";
    return;
  }

  // Crear vista previa
  const reader = new FileReader();
  reader.onload = (e) => {
    orden.imagenDiseno = e.target.result;
  };
  reader.readAsDataURL(archivo);
}

function eliminarImagenDiseno() {
  orden.imagenDiseno = null;
  // Limpiar el input file
  const inputFile = document.getElementById("imagen_diseno");
  if (inputFile) {
    inputFile.value = "";
  }
}

onMounted(() => {
  limpiarTodo();
  const ahora = new Date();
  if (!orden.fecha) {
    orden.fecha = ahora.toISOString().split("T")[0];
  }
  // Establecer hora de creación automáticamente
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
  orden.horaCreacion = localDatetime;
});
</script>

<style scoped>
/* Estilos generales de la página y contenedor */
.page-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
  background-color: #f3f4f6;
  /* Fondo gris claro */
  min-height: 100vh;
}

.factura-box {
  background-color: #ffffff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  /* Ancho máximo para el contenedor principal */
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1a202c;
  /* Gris oscuro */
  text-align: center;
  margin-bottom: 0.5rem;
  border-bottom: 2px solid #edf2f7;
  /* Borde inferior ligero */
  padding-bottom: 1rem;
}

.subtitle {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2d3748;
  /* Gris medio */
  text-align: center;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

/* Información General */
.info-general-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.campo-grupo {
  display: flex;
  flex-direction: column;
}

.campo-grupo label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5568;
  /* Gris oscuro */
  margin-bottom: 0.5rem;
}

.campo-grupo input[type="text"],
.campo-grupo input[type="date"] {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e0;
  /* Borde gris */
  border-radius: 6px;
  font-size: 1rem;
  color: #2d3748;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.campo-grupo input[type="text"]:focus,
.campo-grupo input[type="date"]:focus {
  border-color: #3b82f6;
  /* Azul al enfocar */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  outline: none;
}

.total-box-basico {
  grid-column: span 2;
  /* Ocupa dos columnas */
  text-align: center;
  padding: 1rem;
  background-color: #e0f2fe;
  /* Azul claro */
  border-radius: 8px;
  font-size: 1.1rem;
  color: #1e40af;
  /* Azul oscuro */
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Tablas generales */
.table-wrapper {
  overflow-x: auto;
  /* Permite desplazamiento horizontal si la tabla es demasiado ancha */
  margin-bottom: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  /* Bordes de celdas colapsados */
}

.table thead th {
  background-color: #edf2f7;
  /* Gris muy claro para encabezados */
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 700;
  color: #4a5568;
  /* Gris oscuro */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  /* Evita que el texto de las tallas se rompa */
}

.table tbody td {
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.95rem;
  color: #2d3748;
  white-space: nowrap;
  /* Evita que el contenido de las celdas se rompa */
}

.table tbody tr:hover {
  background-color: #f7fafc;
  /* Color de fondo al pasar el mouse */
}

.table tfoot td {
  padding: 1rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a202c;
  background-color: #e2e8f0;
  /* Fondo para el pie de tabla */
  border-top: 2px solid #cbd5e0;
}

/* Estilos específicos para la tabla de detalles */
.detalles-table .input-talla-header {
  width: 60px;
  /* Ancho fijo para inputs de talla en el header */
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.85rem;
}

.detalles-table .input-table {
  width: 70px;
  /* Ancho para inputs en la tabla */
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.detalles-table .input-color {
  width: 40px;
  /* Tamaño más pequeño para el input de color */
  height: 40px;
  padding: 0;
  border: none;
  cursor: pointer;
  background: none;
  border-radius: 4px;
  overflow: hidden;
  vertical-align: middle;
}

/* Nuevo estilo para el pequeño cuadro de color al lado del nombre */
.color-box-small {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  vertical-align: middle;
  flex-shrink: 0;
}

.delete-btn {
  background-color: #ef4444;
  /* Rojo */
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.2s ease;
}

.delete-btn:hover {
  background-color: #dc2626;
  /* Rojo más oscuro al pasar el mouse */
}

/* Estilos de botones generales */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-blue {
  background-color: #3b82f6;
  /* Azul */
  color: white;
}

.btn-blue:hover {
  background-color: #2563eb;
  /* Azul más oscuro */
  transform: translateY(-1px);
}

.btn-blue:active {
  transform: translateY(0);
}

.actions {
  display: flex;
  justify-content: flex-start;
  /* Alinea a la izquierda por defecto */
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  /* Permite que los botones se envuelvan en pantallas pequeñas */
}

/* Nuevos estilos para la tabla de procesos (tipo Excel) */
.procesos-table-wrapper {
  margin-top: 1.5rem;
}

.procesos-table th:first-child {
  min-width: 120px;
  /* Ancho mínimo para la columna de proceso */
}

.procesos-table td {
  text-align: center;
  vertical-align: middle;
}

.input-cantidad-proceso-excel {
  width: 80px;
  /* Ancho fijo para los inputs de cantidad en la tabla de procesos */
  padding: 0.5rem 0.25rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.input-cantidad-proceso-excel:focus {
  border-color: #3b82f6;
  /* Azul al enfocar */
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  outline: none;
}

/* Estilos para la sección de auto-relleno */
.auto-fill-actions {
  flex-direction: column;
  /* Apila los elementos verticalmente */
  align-items: flex-start;
  /* Alinea los elementos a la izquierda */
  padding: 1rem;
  background-color: #f0f9ff;
  /* Azul muy claro */
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.auto-fill-actions h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 1rem;
}

.auto-fill-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #dbeafe;
  width: 100%;
}

.auto-fill-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  border-radius: 6px;
}

.btn-fill-color {
  background-color: #93c5fd;
  /* Azul claro */
  color: #1e40af;
}

.btn-fill-color:hover {
  background-color: #60a5fa;
  /* Azul un poco más oscuro */
}

/* Estilos para los botones de abajo (acciones finales) */
.button-actions {
  justify-content: center;
  /* Centra los botones */
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.btn-green {
  background-color: #22c55e;
  /* Verde */
  color: white;
}

.btn-green:hover {
  background-color: #16a34a;
  /* Verde más oscuro */
  transform: translateY(-1px);
}

.btn-green:active {
  transform: translateY(0);
}

.btn-red {
  background-color: #ef4444;
  /* Rojo */
  color: white;
}

.btn-red:hover {
  background-color: #dc2626;
  /* Rojo más oscuro */
  transform: translateY(-1px);
}

.btn-red:active {
  transform: translateY(0);
}

/* Resumen de la Orden (invoice-preview) */
.invoice-preview {
  margin-top: 3rem;
  padding: 2rem;
  background-color: #f0fdf4;
  /* Verde muy claro */
  border: 1px solid #dcfce7;
  border-radius: 8px;
  color: #14532d;
  font-size: 1.05rem;
  line-height: 1.6;
}

.invoice-preview p {
  margin-bottom: 0.5rem;
}

.invoice-preview .order-number,
.invoice-preview .order-reference,
.invoice-preview .total-production {
  font-size: 1.15rem;
  font-weight: 700;
  color: #047857;
  /* Verde oscuro */
  margin-bottom: 1rem;
}

/* Firmas */
.firmas {
  display: flex;
  justify-content: space-around;
  margin-top: 3rem;
  font-size: 1rem;
  font-weight: 600;
  color: #4a5568;
}

.firmas div {
  text-align: center;
  margin: 0 1rem;
}

.page-container {
  background: #f4f4f9;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.factura-box {
  background: #fff;
  padding: 30px;
  border-radius: 10px;
  width: 95%;
  max-width: 1200px;
  color: #333;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 2.2rem;
  text-align: center;
  color: #003366;
  margin-bottom: 15px;
}

.subtitle {
  font-size: 1.5rem;
  color: #003366;
  margin: 20px 0 10px;
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
}

.info-general-container {
  display: flex;
  flex-wrap: wrap;
  /* Permite que los elementos pasen a la siguiente línea en pantallas pequeñas */
  gap: 10px;
  /* Espacio entre los elementos */
  margin-bottom: 20px;
  /* Espacio debajo de esta sección */
}

.campo-grupo {
  display: flex;
  flex-direction: column;
  /* Etiquetas encima de los inputs por defecto */
  margin-bottom: 10px;
  /* Espacio entre grupos de campos */
  flex-basis: calc(50% - 5px);
  /* Ocupa la mitad del ancho (con un pequeño ajuste para el gap) */
}

/* Para asegurar que los elementos individuales ocupen todo el ancho en pantallas pequeñas */
@media (max-width: 767px) {
  .campo-grupo {
    flex-basis: 100%;
  }
}

.campo-grupo label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #555;
  display: block;
  /* Asegura que la etiqueta ocupe su propio espacio */
}

.campo-grupo input[type="text"],
.campo-grupo input[type="date"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  /* Ocupa todo el ancho del contenedor */
  box-sizing: border-box;
  /* Incluye padding y border en el ancho */
}

.total-box-basico {
  margin-top: 10px;
}

/* Estilos básicos para la tabla */
.detalles-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 0.9rem;
}

.detalles-table th,
.detalles-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.detalles-table th {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
}

.detalles-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.detalles-table tfoot td {
  font-weight: bold;
}

/* Asegurar que las columnas tengan un ancho similar */
.detalles-table th,
.detalles-table td {
  width: auto;
  /* Dejar que el contenido determine el ancho inicial */
}

/* Forzar un ancho mínimo para todas las celdas de datos */
.detalles-table td:not(:first-child):not(:nth-last-child(3)):not(:nth-last-child(2)):not(:last-child) {
  min-width: 80px;
  /* Ajusta según el ancho del input y el contenido */
}

/* Estilos para el input en el encabezado de la talla */
.input-talla-header {
  width: 100%;
  /* Ocupar todo el ancho de la celda del encabezado */
  padding: 6px;
  text-align: center;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 0.9rem;
  margin-bottom: 0;
  /* Eliminar el margen inferior para que esté pegado al borde */
}

.input-talla-header:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 3px rgba(0, 123, 255, 0.5);
}

/* Estilos para el input dentro de la tabla */
.input-table {
  width: 100%;
  padding: 6px;
  text-align: center;
  box-sizing: border-box;
  border: 1px solid #eee;
  border-radius: 3px;
  font-size: 0.9rem;
}

.input-table:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 3px rgba(0, 123, 255, 0.5);
}

/* Estilos para la columna de color */
.input-color {
  height: 30px;
  width: 40px;
  border: none;
  cursor: pointer;
}

/* Estilos para el botón de eliminar */
.delete-btn {
  background: none;
  color: red;
  font-weight: bold;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 5px;
}

.delete-btn:hover {
  color: darkred;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 20px;
  border-radius: 6px;
  margin: 10px 10px 0 0;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.btn-blue {
  background: #1e3a8a;
}

.btn-blue:hover {
  background: #152c6e;
}

.btn-green {
  background: #059669;
}

.btn-green:hover {
  background: #047857;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

.invoice-preview {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.invoice-preview h3 {
  font-size: 1.8rem;
  color: #0056b3;
  margin-bottom: 15px;
  text-align: center;
}

.invoice-preview p {
  font-size: 1.1rem;
  margin-bottom: 10px;
}

.order-number {
  font-size: 2.5rem;
  color: #28a745;
  margin-bottom: 10px;
  text-align: center;
}

.order-reference {
  font-size: 1.8rem;
  color: #007bff;
  margin-bottom: 15px;
  text-align: center;
}

.total-production {
  font-size: 1.3rem;
  font-weight: bold;
  color: #dc3545;
  margin-top: 20px;
  text-align: center;
}

.firmas {
  margin-top: 30px;
  display: flex;
  justify-content: space-around;
  font-size: 1.1rem;
  color: #777;
}

.firmas div {
  text-align: center;
}

/* Estilos para campos nuevos */
.campo-hora-creacion .input-readonly {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.campo-imagen-diseno {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-imagen {
  padding: var(--spacing-sm);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-soft);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.input-imagen:hover {
  border-color: var(--primary-blue);
  background-color: var(--primary-blue-bg);
}

.vista-previa-imagen {
  position: relative;
  display: inline-block;
  max-width: 200px;
}

.imagen-preview {
  width: 100%;
  max-width: 200px;
  height: auto;
  max-height: 150px;
  object-fit: cover;
  border-radius: var(--border-radius);
  border: 2px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-eliminar-imagen {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--danger);
  color: white;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all var(--transition-fast);
}

.btn-eliminar-imagen:hover {
  background-color: var(--danger-dark);
  transform: scale(1.1);
}

/* Estilos para celda de color y tela */
.celda-color-y-tela {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
}

.color-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.color-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.tela-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-tipo-tela {
  width: 100%;
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background-color: var(--bg-primary);
}

.input-tipo-tela:focus {
  border-color: var(--primary-blue);
  outline: none;
}

.input-tela-custom {
  width: 100%;
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background-color: #fff8dc;
}

.input-tela-custom:focus {
  border-color: var(--primary-blue);
  outline: none;
}

/* Responsivo para nuevos campos */
@media (max-width: 768px) {
  .celda-color-y-tela {
    min-width: 150px;
  }

  .color-info {
    flex-wrap: wrap;
  }

  .vista-previa-imagen {
    max-width: 150px;
  }

  .imagen-preview {
    max-width: 150px;
    max-height: 100px;
  }
}
</style>
