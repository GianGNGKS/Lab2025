import { DISCIPLINAS, ESTADO_TORNEO } from '/scripts/utilities.js'; 
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
    if (modalCargado) {
        console.log('Modal ya cargado, saltando...');
        return;
    }

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
            console.log(' Modal cargado correctamente');
        }
    } catch (error) {
        console.error('Error al cargar el modal de torneos:', error);
    }
}

/**
 * Pobla el select de disciplinas con las opciones de DISCIPLINAS.
 */
function poblarSelectDisciplinas() {
    const select = document.getElementById('modal-disciplina');

    if (!select) {
        console.error('Select de disciplina no encontrado');
        return;
    }

    // Limpiar opciones existentes
    select.innerHTML = '';

    // Agregar opciones dinámicamente
    Object.values(DISCIPLINAS).forEach((disciplina, index) => {
        const option = document.createElement('option');
        option.value = index; // El índice será el valor (0, 1, 2, 3, 4)
        option.textContent = disciplina.nombreDisplay;
        option.dataset.valorJson = disciplina.valorJSON; // Para referencia
        select.appendChild(option);
    });
}

/**
 * Pobla el select de estados con las opciones de ESTADO_TORNEO.
 */
function poblarSelectEstados() {
    const select = document.getElementById('modal-estado');

    if (!select) {
        console.error('Select de estado no encontrado');
        return;
    }

    // Limpiar opciones existentes
    select.innerHTML = '';

    // Agregar opciones dinámicamente
    Object.values(ESTADO_TORNEO).forEach((estado) => {
        const option = document.createElement('option');
        option.value = estado.valorJSON;
        option.textContent = estado.nombreDisplay;
        option.dataset.className = estado.className; // Para referencia
        select.appendChild(option);
    });
}

/**
 * Inicializa los event listeners del modal.
 */
function inicializarEventListeners() {
    const modal = document.getElementById('modal-torneo');
    const overlay = modal?.querySelector('.modal-overlay');
    const btnCancelar = modal?.querySelector('.boton_cancel');
    const form = document.getElementById('form-torneo');

    if (!form) {
        console.error('Formulario no encontrado!');
        return;
    }

    // Cerrar modal
    overlay?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click', cerrarModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.style.display === 'flex') {
            cerrarModal();
        }
    });

    // Envío del formulario
    form.addEventListener('submit', async (e) => {
        console.log('Submit event capturado!');
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

    const modal = document.getElementById('modal-torneo');
    const titulo = document.getElementById('modal-titulo');
    const btnTexto = document.getElementById('btn-texto');
    const form = document.getElementById('form-torneo');

    titulo.textContent = 'Crear nuevo torneo';
    btnTexto.textContent = 'Crear Torneo';
    form.reset();

    // Establecer valores por defecto
    document.getElementById('modal-disciplina').value = '0'; // Primera disciplina
    document.getElementById('modal-estado').value = '0'; // Sin comenzar
    document.getElementById('modal-nro-participantes').value = '8';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Abre el modal en modo EDITAR con datos precargados.
 * @param {Object} datosTorneo - Datos del torneo a editar
 */
export function abrirModalEditar(datosTorneo) {
    modoActual = 'editar';
    torneoActualId = datosTorneo.torneo_id;

    const modal = document.getElementById('modal-torneo');
    const titulo = document.getElementById('modal-titulo');
    const btnTexto = document.getElementById('btn-texto');

    titulo.textContent = `Editar torneo: ${datosTorneo.nombre}`;
    btnTexto.textContent = 'Guardar Cambios';

    // Cargar datos en el formulario
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

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal.
 */
export function cerrarModal() {
    const modal = document.getElementById('modal-torneo');
    const form = document.getElementById('form-torneo');

    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    form.reset();
}

/**
 * Maneja el envío del formulario (crear o editar).
 */
async function manejarEnvio(event) {
    const form = event.target;
    const formData = new FormData(form);
    const btnSubmit = form.querySelector('button[type="submit"]');
    const btnTexto = document.getElementById('btn-texto');
    const textoOriginal = btnTexto.textContent;

    btnSubmit.disabled = true;

    try {
        //  Obtener el valorJSON de la disciplina seleccionada
        const disciplinaIndex = parseInt(formData.get('disciplina'));
        const disciplinaValorJSON = Object.values(DISCIPLINAS)[disciplinaIndex]?.valorJSON;

        if (!disciplinaValorJSON) {
            throw new Error('Disciplina no válida');
        }

        const datos = {
            nombre: formData.get('nombre'),
            portadaURL: '/imagenes/Banner-Fondo.png',
            disciplina: disciplinaValorJSON, // ← Usar valorJSON en lugar del índice
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

        console.log('Enviando datos:', datos);

        let response;

        if (modoActual === 'crear') {
            response = await fetch('/api/torneos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        } else {
            response = await fetch(`/api/torneos/${torneoActualId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        }

        console.log('Response status:', response.status);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al procesar la solicitud');
        }

        const resultado = await response.json();

        const mensaje = modoActual === 'crear'
            ? `Torneo "${datos.nombre}" creado exitosamente`
            : `Torneo actualizado exitosamente`;

        alert(mensaje);
        cerrarModal();

        if (modoActual === 'crear') {
            window.location.href = `/torneoView?id=${resultado.torneo_id}`;
        } else {
            window.location.reload();
        }

    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);

        btnSubmit.disabled = false;
        btnTexto.textContent = textoOriginal;
    }
}