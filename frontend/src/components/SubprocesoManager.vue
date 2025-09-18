<template>
  <div class="subproceso-manager">
    <!-- Navegación de subprocesos -->
    <div class="nav-subprocesos" v-if="subprocesos && subprocesos.length">
      <button
        v-for="sp in subprocesos"
        :key="sp.id"
        class="btn-subproceso"
        :class="{ active: subprocesoActivo === sp.id }"
        @click="cambiarSubproceso(sp.id)"
      >
        <span class="nombre-sp">{{ sp.nombre }}</span>
        <span class="badge-sp" :class="badgeClase(sp.id)">{{ badgeTexto(sp.id) }}</span>
      </button>
    </div>

    <!-- Contenido del subproceso activo -->
    <div v-if="orden && subprocesoActivo" class="contenido-subproceso">
      <!-- Tabla estilo Excel -->
      <div class="tabla-wrapper">
        <h3 class="titulo-tabla">{{ nombreSubproceso(subprocesoActivo) }}</h3>
        <div class="tabla-scroll">
          <table class="tabla-excel">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Terminadas</th>
                <th>Enviadas</th>
                <th>Destino</th>
                <th>Hora Envío</th>
                <th>Origen</th>
                <th>Estado</th>
                <th>Aplica</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reg in registrosActuales" :key="reg.id" :class="filaClase(reg)">
                <td class="celda-fecha">{{ fFechaHora(reg.fechaMovimiento) }}</td>
                <td class="celda-num">
                  <div v-if="reg.editando && reg.campo==='terminadas'" class="celda-edicion">
                    <input type="number" class="input-edicion" v-model.number="reg.terminadasEdit"
                      min="0" :max="reg.cantidadTotal" @blur="guardarCampo(reg,'terminadas')" @keyup.enter="guardarCampo(reg,'terminadas')" @keyup.esc="cancelarEdicion(reg)" />
                  </div>
                  <div v-else class="celda-editable" @click="iniciarEdicion(reg,'terminadas')">{{ reg.terminadas || 0 }}</div>
                </td>
                <td class="celda-num">
                  <div v-if="reg.editando && reg.campo==='enviadas'" class="celda-edicion">
                    <input type="number" class="input-edicion" v-model.number="reg.enviadasEdit"
                      min="0" :max="reg.terminadas" @blur="guardarCampo(reg,'enviadas')" @keyup.enter="guardarCampo(reg,'enviadas')" @keyup.esc="cancelarEdicion(reg)" />
                  </div>
                  <div v-else class="celda-editable" @click="iniciarEdicion(reg,'enviadas')">{{ reg.enviadas || 0 }}</div>
                </td>
                <td>
                  <div v-if="reg.editando && reg.campo==='destino'" class="celda-edicion">
                    <select class="select-edicion" v-model="reg.destinoEdit" @change="guardarCampo(reg,'destino')" @blur="guardarCampo(reg,'destino')">
                      <option value="">Seleccionar</option>
                      <option v-for="sp in subprocesosDestino" :key="sp.id" :value="sp.id" :disabled="sp.id===subprocesoActivo">
                        {{ sp.nombre }}
                      </option>
                    </select>
                  </div>
                  <div v-else class="celda-editable" @click="iniciarEdicion(reg,'destino')">{{ nombreSubproceso(reg.destino) || '-' }}</div>
                </td>
                <td class="celda-fecha">{{ reg.horaEnvio ? fFechaHora(reg.horaEnvio) : '-' }}</td>
                <td>{{ nombreSubproceso(reg.origen) || '-' }}</td>
                <td>
                  <span class="badge-estado" :class="estadoClase(reg.estado)">{{ estadoTexto(reg.estado) }}</span>
                </td>
                <td class="celda-aplica">
                  <label class="toggle-aplica">
                    <input type="checkbox" v-model="reg.aplica" @change="marcarModificado(reg)" />
                    <span class="toggle-text">{{ reg.aplica ? 'Aplica' : 'No Aplica' }}</span>
                  </label>
                </td>
                <td class="celda-acciones">
                  <div class="acciones">
                    <button class="btn-accion guardar" :disabled="!reg.modificado" @click="guardarRegistro(reg)">💾</button>
                    <button class="btn-accion editar" @click="editarRegistro(reg)">✏️</button>
                    <button class="btn-accion cancelar" :disabled="!reg.modificado" @click="cancelarCambios(reg)">❌</button>
                  </div>
                </td>
              </tr>
              <tr class="fila-nueva">
                <td colspan="9">
                  <button class="btn-agregar" @click="agregarRegistro()">➕ Agregar Registro</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Movimiento entre subprocesos -->
      <div class="movimiento-box">
        <h3>🔄 Movimiento entre Subprocesos</h3>
        <div class="movimiento-form">
          <div class="campo">
            <label>Cantidad a Enviar</label>
            <input type="number" class="input" v-model.number="mov.cantidad" min="1" :max="disponibleParaEnviar" placeholder="0" />
          </div>
          <div class="campo">
            <label>Destino</label>
            <select class="input" v-model="mov.destino">
              <option value="">Seleccionar destino</option>
              <option v-for="sp in subprocesosDestino" :key="sp.id" :value="sp.id" :disabled="sp.id===subprocesoActivo">
                {{ sp.nombre }}
              </option>
            </select>
          </div>
          <div class="acciones-form">
            <button class="btn enviar" :disabled="!puedeEnviar" @click="enviar()">📤 Enviar / Guardar</button>
            <button class="btn limpiar" @click="limpiarMovimiento()">🧹 Limpiar</button>
          </div>
        </div>
        <div v-if="msg" class="mensaje" :class="msgTipo">{{ msg }}</div>
      </div>

      <!-- Historial + Filtros por hora -->
      <div class="historial-box">
        <h3>📊 Historial de Movimientos</h3>
        <div class="filtros-tiempo">
          <div class="campo-tiempo">
            <label>Fecha</label>
            <input type="date" class="input" v-model="filtroFecha" />
          </div>
          <div class="campo-tiempo">
            <label>Hora inicio</label>
            <input type="time" class="input" v-model="filtroHoraInicio" />
          </div>
          <div class="campo-tiempo">
            <label>Hora fin</label>
            <input type="time" class="input" v-model="filtroHoraFin" />
          </div>
          <button class="btn balance" :disabled="!horaRangoValido" @click="generarBalance">⚖️ Generar Balance</button>
        </div>
        <div class="lista-historial">
          <div v-for="(h, i) in historialFiltrado" :key="i" class="item-historial" :class="{ reciente: esReciente(h.fecha) }">
            <div class="info-hist">
              <span class="origen">{{ nombreSubproceso(h.origen) }}</span>
              <span class="flecha">→</span>
              <span class="destino">{{ nombreSubproceso(h.destino) }}</span>
            </div>
            <div class="cantidad">{{ h.cantidad }} unidades</div>
            <div class="fecha">{{ fFechaHora(h.fecha) }}</div>
            <div class="estado"><span class="badge-estado" :class="estadoClase(h.estado)">{{ estadoTexto(h.estado) }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="sin-datos">Seleccione un subproceso para comenzar.</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'

const props = defineProps({
  orden: { type: Object, required: true },
  subprocesos: { type: Array, required: true },
  namespace: { type: String, required: true }
})

const subprocesoActivo = ref('')
const registrosMap = reactive(new Map())
const historial = ref([])

const mov = reactive({ cantidad: 0, destino: '' })
const msg = ref('')
const msgTipo = ref('info')

const filtroFecha = ref('')
const filtroHoraInicio = ref('')
const filtroHoraFin = ref('')

const registrosActuales = computed(() => {
  if (!props.orden?.id || !subprocesoActivo.value) return []
  const key = mapKey(props.orden.id, subprocesoActivo.value)
  return registrosMap.get(key) || []
})

const subprocesosDestino = computed(() => props.subprocesos.filter(sp => sp.id !== subprocesoActivo.value))

const disponibleParaEnviar = computed(() => {
  const regs = registrosActuales.value
  const terminadas = regs.reduce((s, r) => s + (r.terminadas || 0), 0)
  const enviadas = regs.reduce((s, r) => s + (r.enviadas || 0), 0)
  return Math.max(0, terminadas - enviadas)
})

const puedeEnviar = computed(() => mov.cantidad > 0 && mov.destino && mov.cantidad <= disponibleParaEnviar.value)

const horaRangoValido = computed(() => !!(filtroHoraInicio.value && filtroHoraFin.value))

const historialFiltrado = computed(() => {
  let list = historial.value
  if (filtroFecha.value) {
    const d = new Date(filtroFecha.value).toDateString()
    list = list.filter(x => new Date(x.fecha).toDateString() === d)
  }
  if (horaRangoValido.value) {
    const [h1, m1] = filtroHoraInicio.value.split(':').map(Number)
    const [h2, m2] = filtroHoraFin.value.split(':').map(Number)
    const min1 = h1 * 60 + m1
    const min2 = h2 * 60 + m2
    list = list.filter(x => {
      const d = new Date(x.fecha)
      const mins = d.getHours() * 60 + d.getMinutes()
      return mins >= min1 && mins <= min2
    })
  }
  return list
})

function cambiarSubproceso(id) {
  subprocesoActivo.value = id
  initRegistros(props.orden.id, id)
}

function initRegistros(ordenId, spId) {
  const key = mapKey(ordenId, spId)
  if (!registrosMap.has(key)) {
    const regs = crearRegistrosIniciales(ordenId)
    registrosMap.set(key, regs)
  }
}

function crearRegistrosIniciales(ordenId) {
  const regs = []
  const o = props.orden
  o?.detalles?.forEach((det, idx) => {
    const total = Object.values(det.tallas || {}).reduce((a, q) => a + (q || 0), 0)
    if (total > 0) {
      regs.push(reactive({
        id: `${subprocesoActivo.value}_${idx}_${Date.now()}`,
        fechaMovimiento: new Date().toISOString(),
        terminadas: 0,
        enviadas: 0,
        destino: '',
        horaEnvio: null,
        origen: '',
        estado: 'no_iniciado',
        aplica: true,
        color: det.color,
        cantidadTotal: total,
        modificado: false,
        editando: false,
        campo: null,
        terminadasEdit: 0,
        enviadasEdit: 0,
        destinoEdit: ''
      }))
    }
  })
  return regs
}

function iniciarEdicion(reg, campo) { reg.editando = true; reg.campo = campo; if (campo==='terminadas') reg.terminadasEdit = reg.terminadas; if (campo==='enviadas') reg.enviadasEdit = reg.enviadas; if (campo==='destino') reg.destinoEdit = reg.destino }
function guardarCampo(reg, campo) {
  let val, prev
  if (campo==='terminadas') { val = reg.terminadasEdit; prev = reg.terminadas; if (val<0 || val>reg.cantidadTotal) return cancelarEdicion(reg); reg.terminadas = val }
  if (campo==='enviadas') { val = reg.enviadasEdit; prev = reg.enviadas; if (val<0 || val>reg.terminadas) return cancelarEdicion(reg); reg.enviadas = val; if (val>0 && !reg.horaEnvio) reg.horaEnvio = new Date().toISOString() }
  if (campo==='destino') { val = reg.destinoEdit; prev = reg.destino; reg.destino = val }
  if (val !== prev) { reg.modificado = true; actualizarEstado(reg) }
  cancelarEdicion(reg)
}
function cancelarEdicion(reg){ reg.editando=false; reg.campo=null }
function actualizarEstado(reg){ reg.fechaMovimiento = new Date().toISOString(); reg.estado = (reg.terminadas===reg.cantidadTotal && reg.enviadas===reg.terminadas) ? 'finalizado' : (reg.terminadas>0 || reg.enviadas>0 ? 'pendiente' : 'no_iniciado') }
function editarRegistro(){ /* opcional, ya soportado por celdas */ }
function cancelarCambios(reg){ reg.modificado=false; cancelarEdicion(reg) }
function marcarModificado(reg){ reg.modificado=true; actualizarEstado(reg) }
function guardarRegistro(reg){ reg.modificado=false; persistir() }

function enviar(){ if(!puedeEnviar.value){ setMsg('Verifique cantidad y destino','error'); return } const movObj={ origen: subprocesoActivo.value, destino: mov.destino, cantidad: mov.cantidad, fecha: new Date().toISOString(), estado:'finalizado'}; historial.value.unshift(movObj); // actualizar destino
  const keyDestino = mapKey(props.orden.id, mov.destino)
  if (!registrosMap.has(keyDestino)) registrosMap.set(keyDestino, crearRegistrosIniciales(props.orden.id))
  const r = reactive({ id:`${mov.destino}_rec_${Date.now()}`, fechaMovimiento: movObj.fecha, terminadas: mov.cantidad, enviadas:0, destino:'', horaEnvio:null, origen: mov.origen, estado:'pendiente', aplica:true, color:'#000000', cantidadTotal: mov.cantidad, modificado:false, editando:false, campo:null, terminadasEdit:0, enviadasEdit:0, destinoEdit:'' })
  registrosMap.get(keyDestino).push(r)
  limpiarMovimiento(); setMsg(`Enviadas ${movObj.cantidad} unidades a ${nombreSubproceso(movObj.destino)}`,'success'); persistir() }

function limpiarMovimiento(){ mov.cantidad=0; mov.destino='' }

function generarBalance(){ const total = historialFiltrado.value.reduce((s,x)=>s+(x.cantidad||0),0); setMsg(`Balance: ${historialFiltrado.value.length} mov. / ${total} unidades`,'success') }

function setMsg(t, tipo='info'){ msg.value=t; msgTipo.value=tipo; setTimeout(()=>{msg.value=''},4000) }

function badgeClase(spId){ const regs = registros(spId); const fin = regs.filter(r=>r.estado==='finalizado').length; const tot = regs.length; if (tot>0 && fin===tot) return 'finalizado'; if (fin>0) return 'en-proceso'; return 'pendiente' }
function badgeTexto(spId){ const regs = registros(spId); const fin = regs.filter(r=>r.estado==='finalizado').length; const tot = regs.length; return tot===0 ? '0' : `${fin}/${tot}` }
function filaClase(r){ return { 'reg-finalizado': r.estado==='finalizado', 'reg-pendiente': r.estado==='pendiente', 'reg-no': r.estado==='no_iniciado', 'reg-no-aplica': !r.aplica, 'reg-mod': r.modificado } }
function estadoClase(e){ return { 'badge-finalizado': e==='finalizado', 'badge-pendiente': e==='pendiente', 'badge-no': e==='no_iniciado' } }
function estadoTexto(e){ return e==='finalizado'?'Finalizado':e==='pendiente'?'Pendiente':'No Iniciado' }
function nombreSubproceso(id){ const s=props.subprocesos.find(x=>x.id===id); return s? s.nombre : '' }
function registros(spId){ const key = mapKey(props.orden.id, spId); return registrosMap.get(key) || [] }
function mapKey(ordenId, spId){ return `${props.namespace}_${ordenId}_${spId}` }
function fFechaHora(s){ if(!s) return ''; const d=new Date(s); return d.toLocaleString('es-ES',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) }
function esReciente(s){ return (new Date()-new Date(s))<60000 }

function persistir(){ // guardar registros y historial por orden
  const all = {}
  registrosMap.forEach((v,k)=>{ all[k]=v })
  localStorage.setItem(`subproc_${props.namespace}_${props.orden.id}_registros`, JSON.stringify(all))
  localStorage.setItem(`subproc_${props.namespace}_${props.orden.id}_historial`, JSON.stringify(historial.value))
}
function cargar(){ const rawR = localStorage.getItem(`subproc_${props.namespace}_${props.orden.id}_registros`); if(rawR){ try{ const parsed = JSON.parse(rawR); Object.keys(parsed).forEach(k=>{ registrosMap.set(k, parsed[k].map(x=>reactive(x)) ) }) }catch(e){}}
  const rawH = localStorage.getItem(`subproc_${props.namespace}_${props.orden.id}_historial`); if(rawH){ try{ historial.value = JSON.parse(rawH) }catch(e){}}
}

watch([registrosMap, historial], ()=>persistir(), { deep: true })

onMounted(()=>{
  if (props.subprocesos.length>0) {
    subprocesoActivo.value = props.subprocesos[0].id
  }
  cargar();
  initRegistros(props.orden.id, subprocesoActivo.value)
})
</script>

<style scoped>
.subproceso-manager { display: flex; flex-direction: column; gap: var(--spacing-xl); }

.nav-subprocesos { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: var(--spacing-sm); }
.btn-subproceso { flex: 1 1 calc(25% - var(--spacing-xs)); padding: var(--spacing-sm) var(--spacing-md); border: none; border-radius: var(--border-radius); background: var(--bg-primary); color: var(--text-primary); display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-xs); cursor: pointer; font-weight: 600; transition: all var(--transition-fast); }
.btn-subproceso:hover { background: var(--primary-blue-bg); }
.btn-subproceso.active { background: var(--primary-blue); color: #fff; }
.nombre-sp { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge-sp { padding: 2px 6px; border-radius: 10px; font-size: var(--font-size-xs); font-weight: 700; }
.badge-sp.finalizado { background: var(--success); color:#fff; }
.badge-sp.en-proceso { background: var(--warning); color:#fff; }
.badge-sp.pendiente { background: var(--danger); color:#fff; }

@media (max-width: 1024px){ .btn-subproceso{ flex: 1 1 calc(33.333% - var(--spacing-xs)); } }
@media (max-width: 768px){ .btn-subproceso{ flex: 1 1 calc(50% - var(--spacing-xs)); } }
@media (max-width: 480px){ .btn-subproceso{ flex: 1 1 100%; } }

.contenido-subproceso { display: flex; flex-direction: column; gap: var(--spacing-xl); }

.tabla-wrapper { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: var(--spacing-lg); }
.titulo-tabla { color: var(--primary-blue-dark); margin-bottom: var(--spacing-md); font-size: var(--font-size-xl); }
.tabla-scroll { overflow-x: auto; border-radius: var(--border-radius); border: 1px solid var(--border-color); }
.tabla-excel { width: 100%; border-collapse: collapse; min-width: 1000px; background: var(--bg-primary); }
.tabla-excel th { background: var(--primary-blue-dark); color: #fff; padding: var(--spacing-md); text-align: left; font-weight: 700; font-size: var(--font-size-sm); }
.tabla-excel td { padding: var(--spacing-sm) var(--spacing-md); border-bottom: 1px solid var(--border-color); }
.celda-fecha { font-size: var(--font-size-sm); color: var(--text-secondary); white-space: nowrap; }
.celda-num { text-align: center; min-width: 120px; font-weight: 600; }
.celda-editable { cursor: pointer; padding: var(--spacing-xs); border-radius: var(--border-radius); }
.celda-editable:hover { background: var(--primary-blue-bg); }
.celda-edicion .input-edicion, .select-edicion { width: 100%; padding: var(--spacing-xs); border: 2px solid var(--primary-blue); border-radius: var(--border-radius); background: var(--bg-primary); }

.badge-estado { padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--border-radius); font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; }
.badge-finalizado { background: var(--success); color: #fff; }
.badge-pendiente { background: var(--warning); color: #fff; }
.badge-no { background: var(--danger); color: #fff; }

.toggle-aplica { display: flex; align-items: center; gap: var(--spacing-xs); }
.toggle-text { font-size: var(--font-size-sm); font-weight: 500; }

.acciones { display: flex; gap: var(--spacing-xs); justify-content: center; }
.btn-accion { width: 30px; height: 30px; border: none; border-radius: var(--border-radius); cursor: pointer; font-size: var(--font-size-sm); display: flex; align-items: center; justify-content: center; }
.btn-accion.guardar { background: var(--success); color: #fff; }
.btn-accion.editar { background: var(--info); color: #fff; }
.btn-accion.cancelar { background: var(--danger); color: #fff; }
.btn-accion:disabled { background: var(--gray-400); cursor: not-allowed; }

.fila-nueva { background: var(--info-bg); }
.btn-agregar { width: 100%; padding: var(--spacing-md); border: 2px dashed var(--info); color: var(--info); background: transparent; border-radius: var(--border-radius); font-weight: 700; cursor: pointer; }
.btn-agregar:hover { background: var(--info-bg); }

.movimiento-box { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: var(--spacing-lg); }
.movimiento-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: var(--spacing-md); align-items: end; }
.campo { display:flex; flex-direction: column; gap: var(--spacing-xs); }
.input { padding: var(--spacing-sm); border: 2px solid var(--border-color); border-radius: var(--border-radius); background: var(--bg-primary); }
.acciones-form { display:flex; gap: var(--spacing-sm); }
.btn { padding: var(--spacing-sm) var(--spacing-md); border: none; border-radius: var(--border-radius); font-weight: 700; cursor: pointer; }
.btn.enviar { background: var(--success); color: #fff; }
.btn.enviar:disabled { background: var(--gray-400); cursor: not-allowed; }
.btn.limpiar { background: var(--gray-600); color: #fff; }
.mensaje { margin-top: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--border-radius); font-weight: 600; }
.mensaje.success { background: var(--success-bg); color: var(--success-text); border: 1px solid var(--success-border); }
.mensaje.error { background: var(--danger-bg); color: var(--danger-text); border: 1px solid var(--danger-border); }

.historial-box { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: var(--spacing-lg); }
.filtros-tiempo { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); align-items: end; margin-bottom: var(--spacing-md); }
.campo-tiempo { display:flex; flex-direction: column; gap: var(--spacing-xs); }
.btn.balance { background: var(--success); color: #fff; }
.lista-historial { display:flex; flex-direction: column; gap: var(--spacing-sm); max-height: 300px; overflow-y: auto; }
.item-historial { display:grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--border-radius); align-items: center; }
.item-historial .flecha { color: var(--primary-blue); font-weight: 700; }
.item-historial .cantidad { font-weight: 700; color: var(--success); }
.item-historial .fecha { font-size: var(--font-size-sm); color: var(--text-secondary); }
.item-historial.reciente { border-color: var(--success); box-shadow: 0 0 10px rgba(40,167,69,.3); }

@media (max-width: 1200px){ .movimiento-form{ grid-template-columns: 1fr; } .item-historial{ grid-template-columns: 1fr; text-align: center } }

.sin-datos { padding: var(--spacing-lg); color: var(--text-secondary); text-align: center; }
</style>
