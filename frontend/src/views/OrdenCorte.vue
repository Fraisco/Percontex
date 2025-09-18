<script>
import { ref, computed, onMounted, watch } from "vue";
import { useOrdenStore } from "../stores/ordenStore";
import { useRouter, useRoute } from "vue-router";
import { supabase } from "@/lib/supabaseClient";
export default {
  setup() {
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
          return g > 150 && b > 150
            ? "Rosa Claro"
            : g > 100
              ? "Naranja Claro"
              : "Rojo Claro";
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
          return r > 100 && g > 100
            ? "Gris Azulado"
            : g > 50
              ? "Azul Verde"
              : "Azul Oscuro";
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
    const router = useRouter();
    const route = useRoute();
    const ordenStore = useOrdenStore();

    const ordenesSeleccionadas = ref([]);
    const buscarOrdenId = ref("");
    const mostrarListaOrdenes = ref(false);
    const ordenSeleccionadaVista = ref(null);

    const ordenesFiltradasBusqueda = computed(() => {
      if (!buscarOrdenId.value || !ordenStore.ordenes) return [];
      const terminoBusqueda = buscarOrdenId.value.toLowerCase().trim(); // Elimina espacios
      return ordenStore.ordenes.filter((orden) => {
        const ordenIdTrimmed = orden.id.toLowerCase().trim();
        const ordenConsecutivoTrimmed = orden.consecutivo.toLowerCase().trim();
        return (
          ordenIdTrimmed === terminoBusqueda ||
          ordenConsecutivoTrimmed === terminoBusqueda
        );
      });
    });

    function seleccionarOrdenBusqueda(orden) {
      const index = ordenesSeleccionadas.value.findIndex((o) => o.id === orden.id);
      if (index !== -1) {
        ordenesSeleccionadas.value.splice(index, 1);
      } else {
        ordenesSeleccionadas.value.push(orden);
      }
      ordenSeleccionadaVista.value = orden;
      // Resetea el estado de edición al seleccionar una nueva orden
      colorParaEditar.value = null;
      tallaParaEditar.value = null;
      nuevaCantidadCortada.value = 0;
    }

    function seleccionarOrdenVista(orden) {
      ordenSeleccionadaVista.value = orden;
    }

    const detallesCorteTodasOrdenes = ref({});
    const colorParaEditar = ref(null);
    const tallaParaEditar = ref(null);
    const nuevaCantidadCortada = ref(0);

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

    const totalFaltanteOrden = computed(() => {
      return faltantePorColor.value.reduce((sum, item) => sum + item.cantidadFaltante, 0);
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
        if (orden?.unidadesCortadas && orden.unidadesCortadas.length > 0) {
          orden.unidadesCortadas.forEach((unidad) => {
            const color = unidad.color;
            const total = unidad.total_cantidad;
            const faltante = unidad.unidades_faltantes;
            const cortadas = unidad.total_cortadas;

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
      if (route.params.id) {
        ordenStore.obtenerOrdenPorId(route.params.id).then((orden) => {
          if (orden) {
            ordenesSeleccionadas.value = [orden];
            ordenSeleccionadaVista.value = orden;
          }
          cargarDetallesCorte();
        });
      } else {
        cargarDetallesCorte();
      }
    });

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

    function editarCantidadCortada(color, talla) {
      colorParaEditar.value = color;
      const allDetalles = Object.values(detallesCorteTodasOrdenes.value).flat();
      const item = allDetalles.find((i) => i.color === color && i.talla === talla);
      nuevaCantidadCortada.value = item ? item.cantidadCortada : 0;
    }

    function confirmarCantidadCortada() {
      if (colorParaEditar.value && tallaParaEditar.value) {
        Object.values(detallesCorteTodasOrdenes.value).forEach((lista) => {
          const item = lista.find(
            (i) => i.color === colorParaEditar.value && i.talla === tallaParaEditar.value
          );
          if (item) {
            item.cantidadCortada = Math.max(
              0,
              Math.min(nuevaCantidadCortada.value, item.cantidadTotal)
            );
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
            faltante: item.Faltante,
            cortadas: item.cantidadCortada,
          }));
          try {
            // Llamar función SQL directamente
            const { data, error } = await supabase.rpc("actualizar_tela_cortada", {
              unidades_data: unidadesCortadasParaGuardar,
            });

            if (error) {
              console.error("❌ Error de Supabase:", error);
              return;
            }

            console.log("✅ Unidades extendidas actualizadas:", data);
            alert("Tela actualizada");
          } catch (error) {
            console.error("❌ Error al guardar estado de unidades extendidas", error);
          }
        }
      }
      alert("Unidades cortadas guardadas para todas las órdenes.");
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

    function iniciarProcesoConSeleccionadas() {
      if (ordenesSeleccionadas.value.length > 0) {
        if (
          ordenStore.seleccionarOrden &&
          typeof ordenStore.seleccionarOrden === "function"
        ) {
          ordenStore.seleccionarOrden(ordenesSeleccionadas.value);
          router.push({ name: "ExtenderTelaMultiple" });
        } else {
          console.error("La función seleccionarOrdenes no está definida en el store.");
          alert("Error: La función seleccionarOrdenes no está disponible.");
        }
      } else {
        alert("Por favor, selecciona al menos una orden.");
      }
    }
    onMounted(() => {
      if (route.params.id) {
        ordenStore.obtenerOrdenPorId(route.params.id).then((orden) => {
          if (orden) {
            ordenesSeleccionadas.value = [orden];
            ordenSeleccionadaVista.value = orden;
          }
          cargarDetallesCorte();
        });
      } else {
        cargarDetallesCorte();
      }
    });

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
    return {
      buscarOrdenId,
      mostrarListaOrdenes,
      ordenesFiltradasBusqueda,
      seleccionarOrdenBusqueda,
      ordenesSeleccionadas,
      detallesCorteTodasOrdenes,
      colorParaEditar,
      tallaParaEditar,
      nuevaCantidadCortada,
      totalCortadoPorColor,
      totalCortadoOrden,
      totalPedidoOrden,
      faltantePorColor,
      totalFaltanteOrden,
      progresoCorte,
      editarCantidadCortada,
      confirmarCantidadCortada,
      cancelarEdicionCantidadCortada,
      guardarEstadoCorte,
      mostrarOrdenesBusqueda,
      ocultarOrdenesBusqueda,
      esColorOscuro,
      getFriendlyColorName,
      iniciarProcesoConSeleccionadas,
      ordenSeleccionadaVista,
      seleccionarOrdenVista,
    };
  },
};
</script>
<template>
  <div class="proceso-corte-multiple-horizontal">
    <h2 class="titulo-seccion">Proceso de Corte Múltiple</h2>

    <div class="buscar-orden">
      <label for="buscarOrdenId" class="label-buscar-orden">Buscar Orden:</label>
      <input type="text" id="buscarOrdenId" v-model="buscarOrdenId" placeholder="Ingrese ID o Consecutivo"
        class="input-buscar-orden" @focus="mostrarOrdenesBusqueda" @blur="ocultarOrdenesBusqueda" />
      <ul v-if="mostrarListaOrdenes && ordenesFiltradasBusqueda.length > 0" class="lista-ordenes-busqueda">
        <li v-for="orden in ordenesFiltradasBusqueda" :key="orden.id" @click="seleccionarOrdenBusqueda(orden)"
          class="item-orden-busqueda" :class="{ seleccionada: ordenesSeleccionadas.some((o) => o.id === orden.id) }">
          {{ orden.id }} - {{ orden.consecutivo }}
        </li>
      </ul>
    </div>

    <button v-if="ordenesSeleccionadas.length > 0" @click="iniciarProcesoConSeleccionadas"
      class="boton-iniciar-seleccionadas">
      Iniciar Proceso con Seleccionadas ({{ ordenesSeleccionadas.length }})
    </button>

    <div v-if="ordenesSeleccionadas.length > 0">
      <div class="resumen-corte">
        <h3>Resumen del Corte para Órdenes Seleccionadas</h3>
        <p><strong>Progreso General:</strong> {{ progresoCorte.toFixed(2) }}%</p>
        <p><strong>Total Pedido:</strong> {{ totalPedidoOrden }} unidades</p>
        <p><strong>Total Cortado:</strong> {{ totalCortadoOrden }} unidades</p>
        <p><strong>Total Faltante:</strong> {{ totalFaltanteOrden }} unidades</p>
        <div v-if="Object.keys(totalCortadoPorColor).length > 0">
          <h4>Cortado por Color (Total):</h4>
          <ul>
            <li v-for="(cantidad, color) in totalCortadoPorColor" :key="color">
              {{ getFriendlyColorName(color) }}: {{ cantidad }}
            </li>
          </ul>
        </div>
      </div>

      <div class="detalle-corte-horizontal">
        <h3>Detalle de Corte por Color (Órdenes Seleccionadas)</h3>
        <div v-for="orden in ordenesSeleccionadas" :key="orden.id" class="orden-detalle-horizontal">
          <h4>Orden ID: {{ orden.id }}</h4>
          <table class="tabla-detalle-horizontal">
            <thead>
              <tr>
                <th>Color</th>
                <th>Cantidad Total</th>
                <th>Cantidad Cortada</th>
                <th>Cantidad Faltante</th>
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
                  <span v-if="
                    colorParaEditar !== item.color || tallaParaEditar !== item.talla
                  ">
                    {{ item.cantidadCortada }}
                  </span>
                  <input v-else type="number" v-model.number="nuevaCantidadCortada"
                    class="input-cantidad-editar-horizontal" min="0" :max="item.cantidadTotal" />
                </td>
                <td>{{ item.cantidadFaltante }}</td>
                <td>
                  <button v-if="
                    colorParaEditar !== item.color || tallaParaEditar !== item.talla
                  " @click="editarCantidadCortada(item.color, item.talla)" class="boton-accion-horizontal">
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
                <td colspan="2"><strong>Totales:</strong></td>
                <td>
                  <strong>{{ totalPedidoOrden }}</strong>
                </td>
                <td>
                  <strong>{{ totalCortadoOrden }}</strong>
                </td>
                <td>
                  <strong>{{ totalFaltanteOrden }}</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <button @click="guardarEstadoCorte" class="boton-guardar">
        Guardar Estado de Corte para Seleccionadas
      </button>
    </div>
    <div v-else class="mensaje-info">
      No se han seleccionado órdenes para el proceso de corte.
    </div>
  </div>
</template>
<style scoped>
/* ==========================================================================
  Estilos Generales del Componente (Horizontal - Tabla)
  ========================================================================== */
.proceso-corte-multiple-horizontal {
  padding: 20px;
  background-color: white;
  /* Fondo blanco */
  color: black;
  /* Letras negras */
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.titulo-seccion {
  font-size: 2rem;
  margin-bottom: 20px;
  text-align: center;
  color: blue;
  /* Títulos en azul */
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
  Estilos para la Búsqueda de Órdenes (Horizontal)
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
  font-weight: bold;
}

.input-buscar-orden {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.lista-ordenes-busqueda {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  z-index: 10;
  max-height: 150px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
}

.item-orden-busqueda {
  padding: 8px 12px;
  cursor: pointer;
  color: black;
}

.item-orden-busqueda:hover {
  background-color: #f0f0f0;
}

.item-orden-busqueda.seleccionada {
  background-color: #cce5ff;
  font-weight: bold;
}

/* ==========================================================================
  Estilos para el Botón de Iniciar con Seleccionadas (Horizontal)
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
  Estilos para el Resumen del Corte (Horizontal)
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
  /* Subtítulos en azul */
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
  Estilos para el Detalle de Corte (Horizontal - Tabla)
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
  /* Subtítulos en azul */
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
  /* Subtítulos en azul */
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
  Estilos para el Pie de Tabla (Horizontal)
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
  Estilos para el Botón de Guardar (Horizontal)
  ========================================================================== */
.boton-guardar {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 20px;
  align-self: center;
}

.boton-guardar:hover {
  background-color: #0056b3;
}
</style>
