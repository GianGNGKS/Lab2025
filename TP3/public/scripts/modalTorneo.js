import {
    DISCIPLINAS, ESTADO_TORNEO, mostrarClaveAdministrador, mostrarError, mostrarExito,
    mostrarToast
} from '/scripts/utilities.js';

/**
 * @file Módulo para gestionar el modal de creación/edición de torneos
 */
let modoActual = 'crear';
let torneoActualId = null;
let modalCargado = false;

/**
 * Carga el HTML del modal en la página.
 */
export async function cargarModal() {
    // 1. Verifica si ya se cargó el modal
    if (modalCargado) return;

    // 2. Carga el HTML del modal
    try {
        const response = await fetch('/components/modalTorneo.html');
        if (!response.ok) throw new Error('No se pudo cargar el modal de torneos.');

        const html = await response.text();

        if (!document.getElementById('modal-torneo')) {
            document.body.insertAdjacentHTML('beforeend', html);

            await new Promise(resolve => setTimeout(resolve, 50));

            poblarSelectDisciplinas();
            poblarSelectEstados();

            inicializarEventListeners();
            modalCargado = true;
        }
    } catch (error) {
        await mostrarToast({
            icon: 'error',
            message: `Error al cargar el modal de torneos: ${error.message}`
        });
    }
}

/**
 * Pobla el select de disciplinas con las opciones de DISCIPLINAS.
 */
function poblarSelectDisciplinas() {
    const select = document.getElementById('modal-disciplina');

    // 1. Verifica si el select existe
    if (!select) return;

    // 2. Limpia opciones existentes
    select.innerHTML = '';

    // 3. Agrega opciones dinámicamente
    Object.values(DISCIPLINAS).forEach((disciplina, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = disciplina.nombreDisplay;
        option.dataset.valorJson = disciplina.valorJSON;
        select.appendChild(option);
    });
}

/**
 * Pobla el select de estados con las opciones de ESTADO_TORNEO.
 */
function poblarSelectEstados() {
    const select = document.getElementById('modal-estado');

    // 1. Verifica si el select existe
    if (!select) return;

    // 2. Limpia opciones existentes
    select.innerHTML = '';

    // 3. Agrega opciones dinámicamente
    Object.values(ESTADO_TORNEO).forEach((estado) => {
        const option = document.createElement('option');
        option.value = estado.valorJSON;
        option.textContent = estado.nombreDisplay;
        option.dataset.className = estado.className;
        select.appendChild(option);
    });
}

/**
 * Inicializa los event listeners del modal.
 */
function inicializarEventListeners() {
    // 1. Objetos del DOM
    const modal = document.getElementById('modal-torneo');
    const overlay = modal?.querySelector('.modal-overlay');
    const btnCancelar = modal?.querySelector('.boton_cancel');
    const form = document.getElementById('form-torneo');

    if (!form) {
        throw new Error('Formulario no encontrado.');
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
 * Abre el modal en modo CREAR.
 */
export function abrirModalCrear() {
    modoActual = 'crear';
    torneoActualId = null;

    // 1. Objetos del DOM
    const modal = document.getElementById('modal-torneo');
    const titulo = document.getElementById('modal-titulo');
    const btnTexto = document.getElementById('btn-texto');
    const form = document.getElementById('form-torneo');

    titulo.textContent = 'Crear nuevo torneo';
    btnTexto.textContent = 'Crear Torneo';
    form.reset();

    // 2. Establece los valores por defecto
    document.getElementById('modal-disciplina').value = '0';
    document.getElementById('modal-estado').value = '0';
    document.getElementById('modal-nro-participantes').value = '8';
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('modal-fecha-inicio').value = hoy;
    document.getElementById('modal-fecha-fin').value = hoy;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Abre el modal en modo EDITAR con datos precargados.
 * @param {Object} datosTorneo - Datos del torneo a editar
 */
export async function abrirModalEditar(datosTorneo) {
    modoActual = 'editar';
    torneoActualId = datosTorneo.torneo_id;

    // 1. Objetos del DOM
    const modal = document.getElementById('modal-torneo');
    const titulo = document.getElementById('modal-titulo');
    const btnTexto = document.getElementById('btn-texto');

    titulo.textContent = `Editar torneo: ${datosTorneo.nombre}`;
    btnTexto.textContent = 'Guardar Cambios';

    // 2. Carga los datos en el formulario
    document.getElementById('modal-nombre').value = datosTorneo.nombre || '';
    const disciplinaIndex = Object.values(DISCIPLINAS).findIndex(
        d => d.valorJSON === datosTorneo.disciplina
    );
    document.getElementById('modal-disciplina').value = disciplinaIndex >= 0 ? disciplinaIndex : 0;
    document.getElementById('modal-formato').value = datosTorneo.formato || 'Liga';
    document.getElementById('modal-estado').value = datosTorneo.estado ?? 0;
    document.getElementById('modal-nro-participantes').value = datosTorneo.nro_participantes || 8;
    document.getElementById('modal-organizador').value = datosTorneo.organizador || '';
    document.getElementById('modal-premio').value = datosTorneo.premio || '';
    document.getElementById('modal-fecha-inicio').value = datosTorneo.fecha_inicio?.split('T')[0] || '';
    document.getElementById('modal-fecha-fin').value = datosTorneo.fecha_fin?.split('T')[0] || '';
    document.getElementById('modal-tags').value = datosTorneo.tags?.join(', ') || '';
    document.getElementById('modal-descripcion').value = datosTorneo.descripcion || '';

    //3. Muestra el modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal.
 */
export function cerrarModal() {
    // 1. Objetos del DOM
    const modal = document.getElementById('modal-torneo');
    const form = document.getElementById('form-torneo');

    // 2. Cierra el modal
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    form.reset();
}

/**
 * Maneja el envío del formulario (crear o editar).
 */
async function manejarEnvio(event) {
    // 1. Previene el comportamiento por defecto
    event.preventDefault();

    // 2. Obtiene los datos del formulario
    const form = event.target;
    const formData = new FormData(form);
    const btnSubmit = form.querySelector('button[type="submit"]');
    const btnTexto = document.getElementById('btn-texto');
    const textoOriginal = btnTexto.textContent;

    btnSubmit.disabled = true;
    btnTexto.textContent = '⏳ Procesando...';

    try {
        const disciplinaIndex = parseInt(formData.get('disciplina'));
        const disciplinaSeleccionada = Object.values(DISCIPLINAS)[disciplinaIndex];

        // 3. Valida la disciplina seleccionada
        if (!disciplinaSeleccionada) {
            throw new Error('Disciplina no válida.');
        }

        // 4. Extrae imagen de portada
        const archivoImagen = formData.get('imagen');
        const existeImagen = archivoImagen && archivoImagen.size > 0;

        // 5. Prepara los datos para enviar
        const datos = {
            nombre: formData.get('nombre'),
            disciplina: disciplinaSeleccionada.valorJSON,
            formato: formData.get('formato'),
            estado: parseInt(formData.get('estado')),
            nro_participantes: parseInt(formData.get('nro_participantes')),
            organizador: formData.get('organizador'),
            premio: formData.get('premio') || 'Por definir',
            fecha_inicio: formData.get('fecha_inicio') || null,
            fecha_fin: formData.get('fecha_fin') || null,
            descripcion: formData.get('descripcion') || '',
            tags: formData.get('tags')
                ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag)
                : []
        };

        let response;

        // 6. Realiza la solicitud según el modo
        if (modoActual === 'crear') {
            // 6.1 CREAR torneo
            response = await fetch('/api/torneos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear el torneo.');
            }

            const resultado = await response.json();
            const torneoId = resultado.torneo_id;

            // 5.1.2. Si hay imagen, la sube
            if (existeImagen) {
                try {
                    const imagenFormData = new FormData();
                    imagenFormData.append('imagen', archivoImagen);

                    const responseImagen = await fetch(`/api/torneos/${torneoId}/portada`, {
                        method: 'POST',
                        body: imagenFormData
                    });

                    if (!responseImagen.ok) {
                        const errorImagen = await responseImagen.json();
                        await mostrarToast({
                            icon: 'warning',
                            message: `Torneo creado pero falló al subir imagen: ${errorImagen.error}.`
                        });
                    }
                } catch (error) {
                    console.warn('Error al subir imagen:', error,'.');
                }
            }

            // 6.1 Mostrar clave y redirigir
            cerrarModal();
            await mostrarClaveAdministrador(datos.nombre, resultado.admin_key);
            window.location.href = `/torneoView?id=${torneoId}`;

        } else {
            // 5.2 EDITAR torneo
            const token = sessionStorage.getItem(`torneo_${torneoActualId}_token`);

            if (!token) {
                throw new Error(
                    'No tenés autorización para editar este torneo.' +
                    'Tenés que autenticarte primero haciendo click en "🔐 Opciones Torneo".'
                );
            }

            response = await fetch(`/api/torneos/${torneoActualId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al editar el torneo.');
            }

            // 5.2.5. Si hay imagen, la sube
            if (existeImagen) {
                try {
                    const imagenFormData = new FormData();
                    imagenFormData.append('imagen', archivoImagen);

                    const responseImagen = await fetch(`/api/torneos/${torneoActualId}/portada`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: imagenFormData
                    });

                    if (!responseImagen.ok) {
                        const errorImagen = await responseImagen.json();
                        await mostrarToast({
                            icon: 'warning',
                            message: `Torneo editado pero falló al subir imagen: ${errorImagen.error}.`
                        });
                    }
                } catch (error) {
                    console.warn('Error al subir imagen:', error,'.');
                }
            }

            await mostrarExito(`✅ Torneo actualizado con éxito.`);
            cerrarModal();
            window.location.reload();
        }

    } catch (error) {
        cerrarModal();
        console.error('Error:', error);
        await mostrarError(`❌ Error: ${error.message}`);

        btnSubmit.disabled = false;
        btnTexto.textContent = textoOriginal;
    }
}