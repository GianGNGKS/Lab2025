import { mostrarError, mostrarExito, mostrarToast } from "/scripts/utilities.js";

/**
 * @file modalPartido.js
 * Archivo encargado de manejar la lógica del modal de edición de partidos.
 */

let modoActual = 'crear';
let torneoIdActual = null;
let partidoIdActual = null;
let modalCargado = false;
let participantesDisponibles = [];

export async function cargarModalPartido() {
    // Evita recargar el modal si ya fue cargado
    if (modalCargado) return;

    try {
        // 1. Carga el HTML del modal
        const response = await fetch('/components/modalPartido.html');
        if (!response.ok) throw new Error('No se pudo cargar el modal de partidos.');

        const html = await response.text();

        // 2. Inserta el HTML en el body si no existe ya
        if (!document.getElementById('modal-partido')) {
            document.body.insertAdjacentHTML('beforeend', html);

            await new Promise(resolve => setTimeout(resolve, 50));

            // 3. Inicializa los event listeners
            inicializarEventListeners();
            modalCargado = true;
        }
    } catch (error) {
        await mostrarToast({
            icon: 'error',
            title: `Error al cargar el modal de partido: ${error.message}`
        })
    }
}


/**
 * Inicializa los event listeners del modal.
 */
function inicializarEventListeners() {
    // 1. Objetos del DOM
    const modal = document.getElementById('modal-partido');
    const overlay = modal?.querySelector('.modal-overlay');
    const btnCancelar = modal?.querySelector('.boton_cancel');
    const form = document.getElementById('form-partido');

    if (!form) {
        throw new Error('Formulario de partido no encontrado');
    }

    // 2. Añade los event listeners
    overlay?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click', cerrarModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.style.display === 'flex') {
            cerrarModal();
        }
    });

    // 3. Maneja el envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await manejarEnvio(e);
    });
}

/**
 * Pobla los selects de participantes con la lista de participantes disponibles.
 */
function poblarSelectParticipantes() {
    // 1. Objetos del DOM
    const selectParticipante1 = document.getElementById('modal-participante1');
    const selectParticipante2 = document.getElementById('modal-participante2');

    if (!selectParticipante1 || !selectParticipante2) return;


    selectParticipante1.innerHTML = '<option value="">Seleccionar participante 1...</option>';
    selectParticipante2.innerHTML = '<option value="">Seleccionar participante 2...</option>';

    // 2. Llena los selects, habilitda uno y clona las opciones al otro
    participantesDisponibles.forEach(p => {
        const option1 = document.createElement('option');
        option1.value = p.id;
        option1.textContent = p.nombre;
        selectParticipante1.appendChild(option1);

        const option2 = option1.cloneNode(true);
        selectParticipante2.appendChild(option2);
    });
}

/**
 * Abre el modal en modo CREAR.
 * @param {string} torneoId - ID del torneo
 * @param {Array} participantes - Lista de participantes del torneo
 */
export async function abrirModalCrearPartido(torneoId, participantes) {
    // 1. Valida que haya al menos 2 participantes
    if (!participantes || participantes.length < 2) {
        await mostrarError(
            'No hay suficientes participantes. Se necesitan al menos 2 participantes para crear un partido.'
        );
        return;
    }

    modoActual = 'crear';
    torneoIdActual = torneoId;
    partidoIdActual = null;
    participantesDisponibles = participantes;

    // 2. Objetos del DOM
    const modal = document.getElementById('modal-partido');
    const titulo = document.getElementById('modal-partido-titulo');
    const btnTexto = document.getElementById('btn-partido-texto');
    const form = document.getElementById('form-partido');

    // 3. Configura título y botón
    titulo.textContent = 'Crear nuevo partido';
    btnTexto.textContent = 'Crear Partido';
    form.reset();

    // 4. Llena selects de participantes
    poblarSelectParticipantes();

    // 5. Establece fecha por defecto (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('modal-fecha').value = hoy;

    // 6. Muestra el modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Abre el modal en modo EDITAR con datos precargados.
 * @param {string} torneoId - ID del torneo
 * @param {Object} partido - Datos del partido a editar
 * @param {Array} participantes - Lista de participantes del torneo
 */
export function abrirModalEditarPartido(torneoId, partido, participantes) {
    modoActual = 'editar';
    torneoIdActual = torneoId;
    partidoIdActual = partido.partido_id;
    participantesDisponibles = participantes;

    // 1. Objetos del DOM
    const modal = document.getElementById('modal-partido');
    const titulo = document.getElementById('modal-partido-titulo');
    const btnTexto = document.getElementById('btn-partido-texto');

    // 2. Configura título y botón
    titulo.textContent = 'Editar partido';
    btnTexto.textContent = 'Guardar Cambios';

    // 4. Modifica selects y selecciona los participantes del partido
    poblarSelectParticipantes();
    document.getElementById('modal-participante1').value = partido.participante1_id;
    document.getElementById('modal-participante2').value = partido.participante2_id;
    document.getElementById('modal-participante1').disabled = true;
    document.getElementById('modal-participante2').disabled = true;
    document.getElementById('modal-resultado1').value = partido.resultado1 || 0;
    document.getElementById('modal-resultado2').value = partido.resultado2 || 0;
    document.getElementById('modal-fecha').value = partido.fecha || '';
    document.getElementById('modal-jugado_en').value = partido.jugado_en || '';
    document.getElementById('modal-fecha').disabled = true;

    // 5. Muestra el modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal y resetea el formulario.
 */
export function cerrarModal() {
    // 1. Objetos del DOM
    const modal = document.getElementById('modal-partido');
    const form = document.getElementById('form-partido');

    // 2. Cierra el modal
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    form.reset();

    // 3. Resetea variables de estado
    modoActual = 'crear';
    torneoIdActual = null;
    partidoIdActual = null;
    participantesDisponibles = [];
}

/**
 * Maneja el envío del formulario.
 */
async function manejarEnvio(event) {
    // 1. Previene el comportamiento por defecto
    event.preventDefault();

    // 2. Obtiene los datos del formulario
    const form = event.target;
    const formData = new FormData(form);
    const btnSubmit = form.querySelector('button[type="submit"]');
    const btnTexto = document.getElementById('btn-partido-texto');
    const textoOriginal = btnTexto.textContent;

    btnSubmit.disabled = true;
    btnTexto.textContent = '⏳ Procesando...';

    try {
        // 3. Obtiene token de autenticación
        const token = sessionStorage.getItem(`torneo_${torneoIdActual}_token`);

        if (!token) {
            throw new Error(
                'No tenés autorización para gestionar partidos en este torneo.' +
                ' Tenés que autenticarte primero haciendo click en "🔐 Opciones Torneo".'
            );
        }

        let response;

        // 4. Realiza la solicitud según el modo
        if (modoActual === 'crear') {
            const participante1_id = formData.get('participante1');
            const participante2_id = formData.get('participante2');
            const fecha = formData.get('fecha');
            const jugado_en = formData.get('jugado_en') || '';

            const resultado1 = formData.get('resultado1');
            const resultado2 = formData.get('resultado2');

            // 4.1.1 Validaciones básicas
            if (!participante1_id || !participante2_id) {
                throw new Error('Debés seleccionar ambos participantes.');
            }

            if (participante1_id === participante2_id) {
                throw new Error('Los participantes deben ser diferentes.');
            }

            if (!fecha) {
                throw new Error('La fecha es obligatoria.');
            }

            // 4.1.2 Procesa resultados
            let res1 = 0;
            let res2 = 0;

            if (resultado1 !== null && resultado1 !== '') {
                res1 = parseInt(resultado1);
                if (isNaN(res1) || res1 < 0) {
                    throw new Error('El resultado del participante 1 debe ser un número válido positivo.');
                }
            }

            if (resultado2 !== null && resultado2 !== '') {
                res2 = parseInt(resultado2);
                if (isNaN(res2) || res2 < 0) {
                    throw new Error('El resultado del participante 2 debe ser un número válido positivo.');
                }
            }

            // 4.1.3 Prepara datos para el backend
            const datos = {
                participante1_id,
                participante2_id,
                fecha,
                jugado_en,
                resultado1: res1,
                resultado2: res2
            };

            response = await fetch(`/api/torneos/${torneoIdActual}/partidos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear el partido.');
            }

            await mostrarExito('✅ Partido creado con éxito.');
            cerrarModal();
            window.location.reload();
        } else {
            // 4.2 EDITAR partido
            const resultado1 = formData.get('resultado1');
            const resultado2 = formData.get('resultado2');
            const jugado_en = formData.get('jugado_en') || '';

            // 4.2.1 Validaciones básicas
            if (resultado1 === null || resultado1 === '' || resultado2 === null || resultado2 === '') {
                throw new Error('Ambos resultados son obligatorios.');
            }

            const res1Int = parseInt(resultado1);
            const res2Int = parseInt(resultado2);

            if (isNaN(res1Int) || isNaN(res2Int)) {
                throw new Error('Los resultados deben ser números válidos.');
            }

            if (res1Int < 0 || res2Int < 0) {
                throw new Error('Los resultados no pueden ser negativos.');
            }

            // 4.2.2 Prepara datos para el backend
            const datos = {
                resultado1: res1Int,
                resultado2: res2Int,
                jugado_en
            };

            response = await fetch(`/api/torneos/${torneoIdActual}/partidos/${partidoIdActual}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al editar el partido.');
            }

            await mostrarExito('✅ Partido actualizado con éxito.');
            cerrarModal();
            window.location.reload();
        }

    } catch (error) {
        console.error('Error:', error);
        cerrarModal();
        await mostrarError(`❌ Error: ${error.message}`);

        btnSubmit.disabled = false;
        btnTexto.textContent = textoOriginal;
    }
}