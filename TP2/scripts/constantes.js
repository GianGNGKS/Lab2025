export const DISCIPLINAS = Object.freeze({
    FUTBOL: {
        key: 'FUTBOL',
        valorJSON: 'futbol',
        nombreDisplay: 'Fútbol'
    },
    COUNTER_STRIKE: {
        key: 'COUNTER_STRIKE',
        valorJSON: 'counter_strike_2',
        nombreDisplay: 'Counter-Strike 2'
    },
    VOLLEY: {
        key: 'VOLLEY',
        valorJSON: 'volley',
        nombreDisplay: 'Volley'
    },
    LEAGUE_OF_LEGENDS: {
        key: 'LEAGUE_OF_LEGENDS',
        valorJSON: 'league_of_legends',
        nombreDisplay: 'League of Legends'
    },
    BASKET: {
        key: 'BASKET',
        valorJSON: 'basket',
        nombreDisplay: 'Basket'
    }
});

export function encontrarDisciplinaJSON(valorJSON) {
    return Object.values(DISCIPLINAS).find(d => d.valorJSON === valorJSON);
}

export const ESTADO_TORNEO = Object.freeze({
    NOT_STARTED: {
        valorJSON: 0,
        nombreDisplay: 'Sin comenzar',
        className: 'estado-sin-comenzar'
    },
    IN_PROGRESS: {
        valorJSON: 1,
        nombreDisplay: 'En curso',
        className: 'estado-en-curso'
    },
    FINISHED: {
        valorJSON: 2,
        nombreDisplay: 'Finalizado',
        className: 'estado-finalizado'
    }
});

export function encontrarEstadoJSON(valorJSON) {
    return Object.values(ESTADO_TORNEO).find(s => s.valorJSON === valorJSON);
}