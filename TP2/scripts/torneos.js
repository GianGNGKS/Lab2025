import { encontrarDisciplinaJSON, ESTADO_TORNEO, encontrarEstadoJSON } from "./constantes.js";

export async function renderizarTablaTorneos(idContainer, dataTorneos) {
    const container = document.getElementById(idContainer);
    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    }

    const respuesta = await fetch('../components/tablaTorneos.html');
    if (!respuesta.ok) {
        console.error(`No se pudo cargar el componente de la tabla.`);
        return;
    }

    const tablaHTML = await respuesta.text();
    container.innerHTML = tablaHTML;

    const tbody = container.querySelector('tbody');
    if (dataTorneos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No hay torneos para mostrar.</td></tr>';
        return;
    }

    dataTorneos.forEach(torneo => {
        const infoDisciplina = encontrarDisciplinaJSON(torneo.disciplina);
        const nombreDisciplina = infoDisciplina ? infoDisciplina.nombreDisplay : torneo.disciplina;

        const infoEstado = encontrarEstadoJSON(torneo.estado);
        const datosEstado = infoEstado ?
            { text: infoEstado.nombreDisplay, className: infoEstado.className } :
            { text: 'Desconocido', className: '' }


        const row = document.createElement('tr');
        row.innerHTML =
            `<tr>
            <td><img src="https://picsum.photos/80/80?random=1" alt="'Portada miniatura del torneo.'" class="tabla_portada"></td>
            <td><span class="tabla_texto">${torneo.nombre}</span></td>
            <td><span class="tabla_texto">${nombreDisciplina}</span></td>
            <td><span class="tabla_texto">${torneo.nro_participantes}</span></td>
            <td>
                <ul class="tabla_tags_lista">
                    ${torneo.tags.map(tag => `<li class="tabla_tag">${tag}</li>`).join('')}
                </ul>
            </td>
            <td><span class="tabla_texto">${torneo.formato}</span></td>
            <td><span class="tabla_estado ${datosEstado.className}">${datosEstado.text}</span></td>
            <td><a class="tabla_btn_explorar" href="torneoView.html?id=${torneo.torneo_id}">Ver más</a></td>
        </tr>`
        tbody.appendChild(row);
    });
}

export async function renderizarTorneo(idContainer, dataTorneo) {
    const container = document.getElementById(idContainer);
    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    } else {
        const infoDisciplina = encontrarDisciplinaJSON(dataTorneo.disciplina);
        const nombreDisciplina = infoDisciplina ? infoDisciplina.nombreDisplay : dataTorneo.disciplina;

        const infoEstado = encontrarEstadoJSON(dataTorneo.estado);
        const datosEstado = infoEstado ?
            { text: infoEstado.nombreDisplay, className: infoEstado.className } :
            { text: 'Desconocido', className: '' }

        const displayTorneo = document.createElement('div');
        displayTorneo.classList.add('info_grid');
        displayTorneo.innerHTML =
            `
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Disciplina</h2>
                <p class="info_torneo_detalles">${nombreDisciplina}</p>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Formato</h2>
                <p class="info_torneo_detalles">${dataTorneo.formato}</p>
                    </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Estado</h2>
                <p class="info_torneo_detalles"><span class="tabla_estado ${datosEstado.className}">${datosEstado.text}</span></p>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Nro. Participantes</h2>
                <p class="info_torneo_detalles">${dataTorneo.nro_participantes}</p>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Organizador</h2>
                <p class="info_torneo_detalles">${dataTorneo.organizador}</p>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Premio</h2>
                <p class="info_torneo_detalles">${dataTorneo.premio}</p>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Fechas</h2>
                <p class="info_torneo_detalles">${dataTorneo.fecha_inicio}<br>${dataTorneo.fecha_fin}</p>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Tags</h2>
                <ul class="tabla_tags_lista">
                    ${dataTorneo.tags.map(tag => `<li class="tabla_tag">${tag}</li>`).join('')}
                </ul>
            </div>
        `;
        container.replaceWith(displayTorneo);
    }
}

