<script setup>
import { ref, computed, onMounted, watch, reactive } from "vue";
import { useOrdenStore } from "../stores/ordenStore";
import { useRouter, useRoute } from "vue-router";
import { supabase } from "@/lib/supabaseClient";

// Mapeo manual de colores a nombres amigables
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

const router = useRouter();
const route = useRoute();
const ordenStore = useOrdenStore();

const ordenesSeleccionadas = ref([]);
const buscarOrdenId = ref("");
const mostrarListaOrdenes = ref(false);
const ordenSeleccionadaVista = ref(null);
const modoTrabajo = ref("individual"); // 'individual' o 'multiple'

const ordenesFiltradasBusqueda = computed(() => {
  if (!buscarOrdenId.value || !ordenStore.ordenes) return [];
  const terminoBusqueda = buscarOrdenId.value.toLowerCase().trim();
  return ordenStore.ordenes.filter((orden) => {
    const ordenIdTrimmed = orden.id.toLowerCase().trim();
    const ordenConsecutivoTrimmed = orden.consecutivo.toLowerCase().trim();
    const referenciaMatch =
      orden.referenciaPorDefecto &&
      orden.referenciaPorDefecto.toLowerCase().includes(terminoBusqueda);
    return (
      ordenIdTrimmed.includes(terminoBusqueda) ||
      ordenConsecutivoTrimmed.includes(terminoBusqueda) ||
      referenciaMatch
    );
  });
});

function seleccionarOrdenBusqueda(orden) {
  if (modoTrabajo.value === "individual") {
    // En modo individual, reemplaza la selección
    ordenesSeleccionadas.value = [orden];
    ordenSeleccionadaVista.value = orden;
    buscarOrdenId.value = `${orden.consecutivo} - ${orden.referenciaPorDefecto}`;
    mostrarListaOrdenes.value = false;
  } else {
    // En modo múltiple, agrega/quita de la lista
    const index = ordenesSeleccionadas.value.findIndex((o) => o.id === orden.id);
    if (index !== -1) {
      ordenesSeleccionadas.value.splice(index, 1);
    } else {
      ordenesSeleccionadas.value.push(orden);
    }
    ordenSeleccionadaVista.value = orden;
  }
  colorParaEditar.value = null;
  tallaParaEditar.value = null;
  nuevaCantidadCortada.value = 0;
}

function cambiarModoTrabajo(nuevoModo) {
  modoTrabajo.value = nuevoModo;
  if (nuevoModo === "individual" && ordenesSeleccionadas.value.length > 1) {
    // Si cambia a individual y hay múltiples órdenes, mantener solo la primera
    ordenesSeleccionadas.value = ordenesSeleccionadas.value.slice(0, 1);
    ordenSeleccionadaVista.value = ordenesSeleccionadas.value[0] || null;
  }
  buscarOrdenId.value = "";
  mostrarListaOrdenes.value = false;
}

function seleccionarOrdenVista(orden) {
  ordenSeleccionadaVista.value = orden;
}

const detallesCorteTodasOrdenes = ref({});
const colorParaEditar = ref(null);
const nuevaCantidadCortada = ref(0);

// Estados para tiempo y unidades en proceso de corte
const tiemposCorte = reactive({
  fechaInicio: "",
  fechaFin: "",
  unidadesProcesadas: 0,
});

// Estados para transferencias entre procesos
const transferenciaActual = reactive({
  procesoOrigen: "corte",
  procesoDestino: "",
  cantidadTransferida: 0,
  fechaTransferencia: "",
});

const historialTransferencias = ref([]);
const errorValidacion = ref("");

// Estados para Editor Rápido
const editorRapidoActivo = ref(false);
const busquedaRapida = ref("");
const ordenRapida = ref(null);
const mostrarResultadosRapidos = ref(false);
const cargandoOrdenRapida = ref(false);
// (No redeclaration of detallesCorteTodasOrdenes here)

const totalCortadoPorColor = computed(() => {
  const resumen = {};
  Object.values(detallesCorteTodasOrdenes.value).forEach((detalles) => {
    detalles.forEach((item) => {
      if (!resumen[item.color]) resumen[item.color] = 0;
      resumen[item.color] += item.cantidadCortada;
    });
  });
  return resumen;
});

const totalCortadoOrden = computed(() => {
  return Object.values(detallesCorteTodasOrdenes.value)
    .flat()
    .reduce((sum, item) => sum + item.cantidadCortada, 0);
});

const totalPedidoOrden = computed(() => {
  return Object.values(detallesCorteTodasOrdenes.value)
    .flat()
    .reduce((sum, item) => sum + item.cantidadTotal, 0);
});

const faltantePorColor = computed(() => {
  return Object.values(detallesCorteTodasOrdenes.value).flat();
});

const totalPendienteOrden = computed(() => {
  return faltantePorColor.value.reduce((sum, item) => sum + item.Faltante, 0);
});

const progresoCorte = computed(() => {
  return totalPedidoOrden.value > 0
    ? (totalCortadoOrden.value / totalPedidoOrden.value) * 100
    : 0;
});

function cargarDetallesCorte() {
  detallesCorteTodasOrdenes.value = {};

  ordenesSeleccionadas.value.forEach((orden) => {
    const detallesPorColor = {};

    // Usar directamente unidadesCortadas en lugar de detalles
    if (
      orden?.estadoCorte?.unidadesFusionadas &&
      orden.estadoCorte.unidadesFusionadas.length > 0
    ) {
      orden.estadoCorte.unidadesFusionadas.forEach((unidad) => {
        const color = unidad.color;
        const total = unidad.total_cantidad;
        const faltante = unidad.unidades_faltantes;
        const cortadas = unidad.total_fusionadas;

        if (total > 0) {
          if (!detallesPorColor[color]) {
            detallesPorColor[color] = {
              color: color,
              cantidadTotal: 0,
              cantidadCortada: 0,
              Faltante: 0,
            };
          }

          // Sumar las cantidades si hay múltiples entradas del mismo color
          detallesPorColor[color].cantidadTotal += total;
          detallesPorColor[color].cantidadCortada += cortadas;
          detallesPorColor[color].Faltante += faltante;
        }
      });
    }

    // Convertir a array
    detallesCorteTodasOrdenes.value[orden.id] = Object.values(detallesPorColor);
  });
}

onMounted(() => {
  // Inicializar fecha y hora actual para fecha de inicio
  const fechaActual = new Date().toISOString().slice(0, 16);
  if (!tiemposCorte.fechaInicio) {
    tiemposCorte.fechaInicio = fechaActual;
  }
  if (!transferenciaActual.fechaTransferencia) {
    transferenciaActual.fechaTransferencia = fechaActual;
  }

  if (props.orden) {
    // Si se pasa una orden como prop, úsala
    ordenesSeleccionadas.value = [props.orden];
    ordenSeleccionadaVista.value = props.orden;
    cargarDetallesCorte();
    cargarDatosGuardados();
  } else if (route.params.id) {
    // Si hay un ID en la ruta, búscala
    ordenStore.obtenerOrdenPorId(route.params.id).then((orden) => {
      if (orden) {
        ordenesSeleccionadas.value = [orden];
        ordenSeleccionadaVista.value = orden;
      }
      cargarDetallesCorte();
      cargarDatosGuardados();
    });
  } else {
    cargarDetallesCorte();
  }
});

function cargarDatosGuardados() {
  if (ordenSeleccionadaVista.value) {
    // Cargar datos de tiempo y unidades si existen
    const estadoCorte = ordenSeleccionadaVista.value.estadoCorte?.tiemposCorte;
    if (estadoCorte) {
      tiemposCorte.fechaInicio = estadoCorte.fechaInicio || "";
      tiemposCorte.fechaFin = estadoCorte.fechaFin || "";
      tiemposCorte.unidadesProcesadas = estadoCorte.unidadesProcesadas || 0;
    }

    // Cargar historial de transferencias si existe
    const transferenciasGuardadas =
      ordenSeleccionadaVista.value.estadoCorte?.transferenciasCorte;
    if (transferenciasGuardadas && Array.isArray(transferenciasGuardadas)) {
      historialTransferencias.value = [...transferenciasGuardadas];
    }
  }
}

watch(
  () => ordenesSeleccionadas.value,
  () => {
    cargarDetallesCorte();
    if (ordenesSeleccionadas.value.length === 1) {
      ordenSeleccionadaVista.value = ordenesSeleccionadas.value[0];
    } else {
      ordenSeleccionadaVista.value = null;
    }
  },
  { deep: true }
);

function editarCantidadCortada(color) {
  colorParaEditar.value = color;
  const allDetalles = Object.values(detallesCorteTodasOrdenes.value).flat();
  const item = allDetalles.find((i) => i.color === color);
  nuevaCantidadCortada.value = item ? item.cantidadCortada : 0;
}

function confirmarCantidadCortada() {
  if (colorParaEditar.value) {
    Object.values(detallesCorteTodasOrdenes.value).forEach((lista) => {
      const item = lista.find((i) => i.color === colorParaEditar.value);
      if (item) {
        item.cantidadCortada = Math.max(
          0,
          Math.min(nuevaCantidadCortada.value, item.cantidadTotal)
        );
        item.Faltante = item.cantidadTotal - item.cantidadCortada;
      }
    });
    cancelarEdicionCantidadCortada();
  }
}

function cancelarEdicionCantidadCortada() {
  colorParaEditar.value = null;
  nuevaCantidadCortada.value = 0;
}

async function guardarEstadoCorte() {
  for (const orden of ordenesSeleccionadas.value) {
    const detalles = detallesCorteTodasOrdenes.value[orden.id];
    if (detalles) {
      const unidadesCortadasParaGuardar = detalles.map((item) => ({
        color: item.color,
        unidades_faltantes: item.Faltante,
        total_fusionadas: item.cantidadCortada,
      }));
      try {
        // Llamar función SQL directamente
        const { data, error } = await supabase.rpc("actualizar_tela_fusionada", {
          unidades_data: unidadesCortadasParaGuardar,
        });

        if (error) {
          console.error("❌ Error de Supabase:", error);
          return;
        }

        console.log("✅ Unidades fusionadas actualizadas:", data);
        alert("Tela fusionada actualizada");
      } catch (error) {
        console.error("❌ Error al guardar estado de unidades numeradas", error);
      }
    }
  }
}

function mostrarOrdenesBusqueda() {
  mostrarListaOrdenes.value = true;
}

function ocultarOrdenesBusqueda() {
  setTimeout(() => {
    mostrarListaOrdenes.value = false;
  }, 200);
}

function esColorOscuro(color) {
  if (!color || typeof color !== "string" || !color.startsWith("#")) return false;
  const hex = color.slice(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  return brightness < 128;
}

// Computed para validaciones de tiempo
const tiempoTranscurrido = computed(() => {
  if (tiemposCorte.fechaInicio && tiemposCorte.fechaFin) {
    const inicio = new Date(tiemposCorte.fechaInicio);
    const fin = new Date(tiemposCorte.fechaFin);
    const diff = fin - inicio;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  }
  return null;
});

const puedeTransferir = computed(() => {
  return (
    transferenciaActual.procesoOrigen &&
    transferenciaActual.procesoDestino &&
    transferenciaActual.cantidadTransferida > 0 &&
    transferenciaActual.cantidadTransferida <= tiemposCorte.unidadesProcesadas &&
    transferenciaActual.fechaTransferencia
  );
});

// Funciones de validación
function validarFechas() {
  errorValidacion.value = "";

  if (tiemposCorte.fechaInicio && tiemposCorte.fechaFin) {
    const inicio = new Date(tiemposCorte.fechaInicio);
    const fin = new Date(tiemposCorte.fechaFin);

    if (fin <= inicio) {
      errorValidacion.value = "La fecha de fin debe ser posterior a la fecha de inicio";
      return;
    }
  }

  if (tiemposCorte.unidadesProcesadas < 0) {
    errorValidacion.value = "Las unidades procesadas no pueden ser negativas";
    return;
  }

  if (tiemposCorte.unidadesProcesadas > totalPedidoOrden.value) {
    errorValidacion.value = `Las unidades procesadas no pueden exceder el total pedido (${totalPedidoOrden.value})`;
    return;
  }
}

// Funciones para transferencias
function registrarTransferencia() {
  if (!puedeTransferir.value) {
    alert("Por favor completa todos los campos de transferencia correctamente.");
    return;
  }

  if (transferenciaActual.procesoOrigen === transferenciaActual.procesoDestino) {
    alert("El proceso origen y destino no pueden ser el mismo.");
    return;
  }

  const nuevaTransferencia = {
    procesoOrigen: transferenciaActual.procesoOrigen,
    procesoDestino: transferenciaActual.procesoDestino,
    cantidadTransferida: transferenciaActual.cantidadTransferida,
    fechaTransferencia: transferenciaActual.fechaTransferencia,
  };

  historialTransferencias.value.push(nuevaTransferencia);
  limpiarTransferencia();
  alert("Transferencia registrada exitosamente.");
}

function limpiarTransferencia() {
  transferenciaActual.procesoOrigen = "corte";
  transferenciaActual.procesoDestino = "";
  transferenciaActual.cantidadTransferida = 0;
  transferenciaActual.fechaTransferencia = "";
}

function eliminarTransferencia(index) {
  if (confirm("¿Estás seguro de que deseas eliminar esta transferencia?")) {
    historialTransferencias.value.splice(index, 1);
  }
}

function formatearFecha(fechaString) {
  if (!fechaString) return "";
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function iniciarProcesoConSeleccionadas() {
  if (ordenesSeleccionadas.value.length > 0) {
    if (
      ordenStore.seleccionarOrdenes &&
      typeof ordenStore.seleccionarOrdenes === "function"
    ) {
      ordenStore.seleccionarOrdenes(ordenesSeleccionadas.value);
      router.push({ name: "CortarMultiple" });
    } else {
      console.error("La función seleccionarOrdenes no está definida en el store.");
      alert("Error: La función seleccionarOrdenes no está disponible.");
    }
  } else {
    alert("Por favor, selecciona al menos una orden.");
  }
}

function iniciarProcesoIndividual(orden) {
  // Cambiar a modo individual y seleccionar solo esta orden
  modoTrabajo.value = "individual";
  ordenesSeleccionadas.value = [orden];
  ordenSeleccionadaVista.value = orden;
  cargarDetallesCorte();
  buscarOrdenId.value = `${orden.consecutivo} - ${orden.referenciaPorDefecto}`;
  mostrarListaOrdenes.value = false;
}

// Búsqueda rápida para editor
const ordenesRapidasFiltradas = computed(() => {
  if (!busquedaRapida.value || busquedaRapida.value.length < 2) {
    return [];
  }
  const filtro = busquedaRapida.value.toLowerCase();
  return ordenStore.ordenes
    .filter(
      (orden) =>
        orden.id.toLowerCase().includes(filtro) ||
        orden.consecutivo.toLowerCase().includes(filtro) ||
        (orden.referenciaPorDefecto &&
          orden.referenciaPorDefecto.toLowerCase().includes(filtro))
    )
    .slice(0, 5);
});

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
  detallesCorteTodasOrdenes.value = [];
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

  cargarDatosCorteRapida(orden);
  cargandoOrdenRapida.value = false;
}

function cargarDatosCorteRapida(orden) {
  const detalles = [];
  const unidades = orden?.estadoCorte?.unidadesFusionadas || [];

  // Construir SOLO desde unidadesCortadas, respetando su orden y sin usar talla
  for (const u of unidades) {
    if (!u?.color) continue;

    detalles.push({
      color: u.color,
      cantidadTotal: Number(u.total_cantidad ?? 0),
      cantidadCortada: Number(u.total_fusionadas ?? 0),
      // Si necesitas faltantes en UI, descomenta la siguiente línea:
      unidadesFaltantes: Number(u.unidades_faltantes),
    });
  }

  detallesCorteTodasOrdenes.value = detalles;
}
function actualizarCantidadCortadaRapida(color, talla, nuevaCantidad) {
  const item = detallesCorteTodasOrdenes.value.find((d) => d.color === color);
  if (item) {
    item.cantidadCortada = Math.max(0, Math.min(nuevaCantidad, item.cantidadTotal));
  }
}

function guardarCambiosRapidos() {
  if (!ordenRapida.value) {
    alert("No hay orden seleccionada para guardar.");
    return;
  }

  const unidadesCortadasParaGuardar = detallesCorteTodasOrdenes.value.map((item) => ({
    color: item.color,
    total: item.cantidadTotal,
    cortadas: item.cantidadCortada,
  }));

  ordenStore.actualizarEstadoCorte(ordenRapida.value.id, {
    ...ordenRapida.value.estadoCorte,
    unidadesCortadas: unidadesCortadasParaGuardar,
  });

  alert(`Cambios guardados para la orden ${ordenRapida.value.consecutivo}`);
  cerrarEditorRapido();
}

// Inicializar con la orden pasada como prop si está disponible
if (props.orden) {
  ordenesSeleccionadas.value = [props.orden];
  ordenSeleccionadaVista.value = props.orden;
}
</script>

<template>
  <div class="proceso-corte-multiple-horizontal">
    <h2 class="titulo-seccion">Proceso de Fusion</h2>

    <!-- Selector de Modo de Trabajo -->
    <div class="modo-trabajo">
      <label class="modo-label">Modo de Trabajo:</label>
      <div class="modo-botones">
        <button @click="cambiarModoTrabajo('individual')" :class="{ activo: modoTrabajo === 'individual' }"
          class="btn-modo">
          Individual
        </button>
        <button @click="cambiarModoTrabajo('multiple')" :class="{ activo: modoTrabajo === 'multiple' }"
          class="btn-modo">
          Múltiple
        </button>
      </div>
    </div>

    <div class="buscar-orden">
      <label for="buscarOrdenId" class="label-buscar-orden">
        Buscar Orden
        {{
          modoTrabajo === "individual"
            ? "(reemplazará selección)"
            : "(agregar/quitar de lista)"
        }}:
      </label>
      <input type="text" id="buscarOrdenId" v-model="buscarOrdenId" placeholder="Ingrese ID o Consecutivo"
        class="input-buscar-orden" @focus="mostrarOrdenesBusqueda" @blur="ocultarOrdenesBusqueda" />
      <ul v-if="mostrarListaOrdenes && ordenesFiltradasBusqueda.length > 0" class="lista-ordenes-busqueda">
        <li v-for="orden in ordenesFiltradasBusqueda" :key="orden.id" class="item-orden-busqueda-container"
          :class="{ seleccionada: ordenesSeleccionadas.some((o) => o.id === orden.id) }">
          <div @click="seleccionarOrdenBusqueda(orden)" class="item-orden-busqueda">
            {{ orden.consecutivo }} - {{ orden.referenciaPorDefecto }}
          </div>
          <button @click="iniciarProcesoIndividual(orden)" class="btn-proceso-individual">
            Procesar Solo Esta
          </button>
        </li>
      </ul>
    </div>

    <div v-if="ordenesSeleccionadas.length > 0" class="acciones-proceso">
      <div class="info-seleccion">
        <span v-if="modoTrabajo === 'individual'" class="texto-modo">
          Trabajando en modo individual con:
          <strong>{{ ordenesSeleccionadas[0]?.consecutivo }}</strong>
        </span>
        <span v-else class="texto-modo">
          Trabajando en modo múltiple con {{ ordenesSeleccionadas.length }} órdenes
          seleccionadas
        </span>
      </div>
      <button @click="iniciarProcesoConSeleccionadas" class="boton-iniciar-seleccionadas">
        {{
          modoTrabajo === "individual"
            ? "Continuar con Esta Orden"
            : `Procesar ${ordenesSeleccionadas.length} Órdenes`
        }}
      </button>
    </div>

    <div v-if="ordenesSeleccionadas.length > 0">
      <div class="resumen-corte">
        <h3>
          {{
            modoTrabajo === "individual"
              ? "Resumen de Corte para Orden Seleccionada"
              : "Resumen de Corte para Órdenes Seleccionadas"
          }}
        </h3>
        <p><strong>Progreso General:</strong> {{ progresoCorte.toFixed(2) }}%</p>
        <p><strong>Total Pedido:</strong> {{ totalPedidoOrden }} unidades</p>
        <p><strong>Total Fusionado:</strong> {{ totalCortadoOrden }} unidades</p>
        <p><strong>Total Pendiente:</strong> {{ totalPendienteOrden }} unidades</p>
        <div v-if="Object.keys(totalCortadoPorColor).length > 0">
          <h4>Cortado por Color (Total):</h4>
          <ul>
            <li v-for="(cantidad, color) in totalCortadoPorColor" :key="color">
              {{ getFriendlyColorName(color) }}: {{ cantidad }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Campos de Tiempo y Unidades -->
      <div class="campos-tiempo-unidades">
        <h4 class="subtitulo-tiempo">Control de Tiempo y Unidades - Proceso de Fusion</h4>
        <div class="formulario-tiempo">
          <div class="campo-tiempo">
            <label for="fecha_inicio_corte">Fecha y Hora de Inicio:</label>
            <input type="datetime-local" id="fecha_inicio_corte" v-model="tiemposCorte.fechaInicio"
              class="input-datetime" @change="validarFechas" />
          </div>
          <div class="campo-tiempo">
            <label for="fecha_fin_corte">Fecha y Hora de Fin:</label>
            <input type="datetime-local" id="fecha_fin_corte" v-model="tiemposCorte.fechaFin" class="input-datetime"
              :min="tiemposCorte.fechaInicio" @change="validarFechas" />
          </div>
          <div class="campo-tiempo">
            <label for="unidades_procesadas_corte">Unidades Procesadas:</label>
            <input type="number" id="unidades_procesadas_corte" v-model.number="tiemposCorte.unidadesProcesadas"
              class="input-unidades" min="0" :max="totalPedidoOrden" placeholder="Cantidad procesada"
              @input="validarFechas" />
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
              class="input-cantidad-transferencia" min="1" :max="tiemposCorte.unidadesProcesadas"
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

      <div class="detalle-corte-horizontal">
        <h3>
          {{
            modoTrabajo === "individual"
              ? "Detalle de Corte por Color y Talla"
              : "Detalle de Corte por Color y (Órdenes Seleccionadas)"
          }}
        </h3>
        <div v-for="orden in ordenesSeleccionadas" :key="orden.id" class="orden-detalle-horizontal">
          <h4>Orden ID: {{ orden.id }}</h4>
          <table class="tabla-detalle-horizontal">
            <thead>
              <tr>
                <th>Color</th>
                <th>Cantidad Total</th>
                <th>Cantidad Fusionada</th>
                <th>Cantidad Pendiente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in detallesCorteTodasOrdenes[orden.id]" :key="index">
                <td>
                  <div class="color-valor">
                    <div class="color-preview" :style="{ backgroundColor: item.color }"></div>
                    {{ getFriendlyColorName(item.color) }}
                  </div>
                </td>
                <td>{{ item.cantidadTotal }}</td>
                <td>
                  <span v-if="colorParaEditar !== item.color">{{
                    item.cantidadCortada
                    }}</span>
                  <input v-else type="number" v-model.number="nuevaCantidadCortada"
                    class="input-cantidad-editar-horizontal" min="0" :max="item.cantidadTotal" />
                </td>
                <td>{{ item.Faltante }}</td>
                <td>
                  <button v-if="colorParaEditar !== item.color" @click="editarCantidadCortada(item.color)"
                    class="boton-accion-horizontal">
                    Editar
                  </button>
                  <div v-else class="edicion-inline-horizontal">
                    <button @click="confirmarCantidadCortada" class="boton-confirmar-inline-horizontal">
                      Guardar
                    </button>
                    <button @click="cancelarEdicionCantidadCortada" class="boton-cancelar-inline-horizontal">
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot class="tabla-pie-horizontal">
              <tr class="totales-row-horizontal">
                <td colspan="1"><strong>Totales:</strong></td>
                <td>
                  <strong>{{ totalPedidoOrden }}</strong>
                </td>
                <td>
                  <strong>{{ totalCortadoOrden }}</strong>
                </td>
                <td>
                  <strong>{{ totalPendienteOrden }}</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="botones-principales">
        <button @click="guardarEstadoCorte" class="boton-guardar">
          {{
            modoTrabajo === "individual"
              ? "Guardar Estado de Fusion"
              : "Guardar Estado de Fusion para Seleccionadas"
          }}
        </button>
        <button @click="abrirEditorRapido" class="boton-editor-rapido">
          Editor Rápido
        </button>
      </div>
    </div>
    <div v-else class="mensaje-info">
      No se han seleccionado órdenes para el proceso de corte.
    </div>
  </div>

  <!-- EDITOR RÁPIDO -->
  <div v-if="editorRapidoActivo" class="editor-rapido-overlay">
    <div class="editor-rapido-modal">
      <div class="editor-rapido-header">
        <h3>Editor Rápido - Proceso de Fusion</h3>
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
                {{ orden.referenciaPorDefecto }}
                <span class="orden-id">ID: {{ orden.id }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Datos de la orden seleccionada -->
        <div v-if="ordenRapida && !cargandoOrdenRapida" class="datos-orden-rapida">
          <div class="info-orden-rapida">
            <h4>
              {{ ordenRapida.consecutivo }} - {{ ordenRapida.referenciaPorDefecto }}
            </h4>
            <p><strong>Encargado:</strong> {{ ordenRapida.encargado }}</p>
            <p><strong>Proveedor:</strong> {{ ordenRapida.proveedor }}</p>
          </div>

          <!-- Tabla de corte -->
          <div v-if="detallesCorteTodasOrdenes.length > 0" class="tabla-corte-rapida">
            <h5>Cantidades Cortadas por Color y Talla:</h5>
            <table class="tabla-edicion-rapida">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Talla</th>
                  <th>Total</th>
                  <th>Cortadas</th>
                  <th>Pendientes</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detallesCorteTodasOrdenes" :key="`${item.color}-${item.talla}`">
                  <td>
                    <div class="color-info">
                      <div class="color-preview" :style="{ backgroundColor: item.color }"></div>
                      {{ item.color }}
                    </div>
                  </td>
                  <td>{{ item.talla }}</td>
                  <td>{{ item.cantidadTotal }}</td>
                  <td>
                    <input type="number" :value="item.cantidadCortada" @input="
                      actualizarCantidadCortadaRapida(
                        item.color,
                        item.talla,
                        $event.target.value
                      )
                      " :max="item.cantidadTotal" min="0" class="input-cantidad-rapida" />
                  </td>
                  <td>{{ item.cantidadTotal - item.cantidadCortada }}</td>
                  <td>
                    <button @click="
                      actualizarCantidadCortadaRapida(
                        item.color,
                        item.talla,
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
          <p>Busca y selecciona una orden para editar sus datos de fusion.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Los estilos principales están definidos en global-styles.css y main.css */
.proceso-corte-multiple-horizontal {
  font-family: var(--font-family);
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.titulo-seccion {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  color: var(--primary-blue-dark);
  font-weight: 700;
}

.mensaje-info {
  padding: 15px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 5px;
  margin-top: 20px;
  text-align: center;
}

/* ==========================================================================
  Estilos para el Selector de Modo de Trabajo
  ========================================================================== */
.modo-trabajo {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.modo-label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.modo-botones {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-modo {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 2px solid var(--primary-blue);
  border-radius: var(--border-radius);
  background-color: transparent;
  color: var(--primary-blue);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-modo:hover {
  background-color: var(--primary-blue-bg);
}

.btn-modo.activo {
  background-color: var(--primary-blue);
  color: white;
}

/* ==========================================================================
  Estilos para Acciones de Proceso
  ========================================================================== */
.acciones-proceso {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.info-seleccion {
  text-align: center;
}

.texto-modo {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* ==========================================================================
  Estilos para la Búsqueda de Órdenes (Horizontal) - Adaptados para Corte
  ========================================================================== */
.buscar-orden {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  position: relative;
}

.label-buscar-orden {
  font-weight: 600;
  color: var(--text-primary);
}

.input-buscar-orden {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.input-buscar-orden:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.lista-ordenes-busqueda {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  z-index: 10;
  max-height: 150px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  box-shadow: var(--shadow-md);
}

.item-orden-busqueda-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs);
  border-bottom: 1px solid var(--border-color);
}

.item-orden-busqueda-container:last-child {
  border-bottom: none;
}

.item-orden-busqueda-container.seleccionada {
  background-color: var(--primary-blue-bg);
}

.item-orden-busqueda {
  flex: 1;
  padding: var(--spacing-sm);
  cursor: pointer;
  color: var(--text-primary);
  transition: background-color var(--transition-fast);
}

.item-orden-busqueda:hover {
  background-color: var(--gray-50);
}

.btn-proceso-individual {
  background-color: var(--success);
  color: white;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.btn-proceso-individual:hover {
  background-color: var(--success-dark);
  transform: translateY(-1px);
}

/* ==========================================================================
  Estilos para el Botón de Iniciar con Seleccionadas (Horizontal) - Adaptados para Corte
  ========================================================================== */
.boton-iniciar-seleccionadas {
  background-color: #00c853;
  color: white;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  margin-bottom: 20px;
}

.boton-iniciar-seleccionadas:hover {
  background-color: #00a543;
}

/* ==========================================================================
  Estilos para el Resumen de Corte (Horizontal) - Adaptados para Corte
  ========================================================================== */
.resumen-corte {
  background-color: #f0f0f0;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.resumen-corte h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: blue;
  text-align: left;
}

.resumen-corte p {
  margin-bottom: 8px;
}

.resumen-corte ul {
  list-style: none;
  padding-left: 20px;
  margin-top: 8px;
}

.resumen-corte li {
  margin-bottom: 5px;
}

/* ==========================================================================
  Estilos para el Detalle de Corte (Horizontal - Tabla) - Adaptados para Corte
  ========================================================================== */
.detalle-corte-horizontal {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.detalle-corte-horizontal h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: blue;
  text-align: left;
}

.orden-detalle-horizontal {
  margin-bottom: 15px;
  border: 1px solid #eee;
  border-radius: 3px;
  padding: 10px;
}

.orden-detalle-horizontal h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1rem;
  color: blue;
}

.tabla-detalle-horizontal {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.tabla-detalle-horizontal th,
.tabla-detalle-horizontal td {
  padding: 8px;
  border: 1px solid #ccc;
  text-align: left;
}

.tabla-detalle-horizontal th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.color-valor {
  display: flex;
  align-items: center;
  gap: 5px;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #ccc;
}

.input-cantidad-editar-horizontal {
  width: 60px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.edicion-inline-horizontal {
  display: flex;
  gap: 5px;
  align-items: center;
}

.boton-accion-horizontal,
.boton-confirmar-inline-horizontal,
.boton-cancelar-inline-horizontal {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  border: none;
}

.boton-accion-horizontal {
  background-color: #28a745;
  color: white;
}

.boton-accion-horizontal:hover {
  background-color: #1e7e34;
}

.boton-confirmar-inline-horizontal {
  background-color: #007bff;
  color: white;
}

.boton-confirmar-inline-horizontal:hover {
  background-color: #0056b3;
}

.boton-cancelar-inline-horizontal {
  background-color: #dc3545;
  color: white;
}

.boton-cancelar-inline-horizontal:hover {
  background-color: #c82333;
}

/* ==========================================================================
  Estilos para el Pie de Tabla (Horizontal) - Adaptados para Corte
  ========================================================================== */
.tabla-pie-horizontal {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
}

.totales-row-horizontal td {
  padding: 8px;
  text-align: left;
  border-top: 2px solid #ccc;
}

.totales-row-horizontal td:first-child {
  font-weight: bold;
}

/* ==========================================================================
  Estilos para el Botón de Guardar (Horizontal) - Adaptados para Corte
  ========================================================================== */
.boton-guardar {
  background-color: var(--primary-blue);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-top: var(--spacing-lg);
  align-self: center;
  transition: all var(--transition-fast);
}

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
  max-width: 900px;
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

.tabla-corte-rapida h5 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--primary-blue-dark);
}

.tabla-edicion-rapida {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.tabla-edicion-rapida th {
  background-color: var(--primary-blue);
  color: white;
  padding: var(--spacing-sm);
  text-align: left;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.tabla-edicion-rapida td {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.color-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  display: inline-block;
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

.cargando-orden,
.sin-orden-seleccionada {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--text-secondary);
  font-style: italic;
}

/* === ESTILOS PARA CAMPOS DE TIEMPO Y UNIDADES === */
.campos-tiempo-unidades {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.subtitulo-tiempo {
  color: var(--primary-blue-dark);
  font-size: var(--font-size-lg);
  margin: 0 0 var(--spacing-md) 0;
  font-weight: 600;
}

.formulario-tiempo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.campo-tiempo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.campo-tiempo label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.input-datetime,
.input-unidades {
  padding: var(--spacing-sm);
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
  background-color: var(--error-bg, #fee);
  color: var(--error, #d32f2f);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--error, #d32f2f);
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-top: var(--spacing-xs);
}

.tiempo-transcurrido {
  background-color: var(--success-bg, #e8f5e8);
  color: var(--success-dark, #2e7d32);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--success, #4caf50);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

/* === ESTILOS PARA FLUJO ENTRE SUBPROCESOS === */
.flujo-subprocesos {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.subtitulo-flujo {
  color: var(--primary-blue-dark);
  font-size: var(--font-size-lg);
  margin: 0 0 var(--spacing-md) 0;
  font-weight: 600;
}

.formulario-transferencia {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.campo-transferencia {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.campo-transferencia label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.select-proceso,
.input-cantidad-transferencia {
  padding: var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.select-proceso:focus,
.input-cantidad-transferencia:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.botones-transferencia {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-start;
  flex-wrap: wrap;
}

.btn-transferir,
.btn-limpiar-transferencia {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.btn-transferir {
  background-color: var(--success);
  color: white;
}

.btn-transferir:hover:not(:disabled) {
  background-color: var(--success-dark);
  transform: translateY(-1px);
}

.btn-transferir:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-limpiar-transferencia {
  background-color: var(--gray-500);
  color: white;
}

.btn-limpiar-transferencia:hover {
  background-color: var(--gray-600);
  transform: translateY(-1px);
}

/* === ESTILOS PARA HISTORIAL DE TRANSFERENCIAS === */
.historial-transferencias {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.subtitulo-historial {
  color: var(--primary-blue-dark);
  font-size: var(--font-size-lg);
  margin: 0 0 var(--spacing-md) 0;
  font-weight: 600;
}

.lista-transferencias {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.item-transferencia {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all var(--transition-fast);
}

.item-transferencia:hover {
  box-shadow: var(--shadow-sm);
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
  background-color: var(--error);
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--font-size-lg);
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  margin-left: var(--spacing-md);
}

.btn-eliminar-transferencia:hover {
  background-color: var(--error-dark);
  transform: scale(1.1);
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 768px) {

  .formulario-tiempo,
  .formulario-transferencia {
    grid-template-columns: 1fr;
  }

  .botones-transferencia {
    justify-content: center;
  }

  .item-transferencia {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .btn-eliminar-transferencia {
    align-self: flex-end;
    margin-left: 0;
  }
}
</style>
