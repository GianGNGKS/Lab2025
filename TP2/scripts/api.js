export async function getTorneos() {
    const cacheKey = 'torneos';

    try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        const response = await fetch('../data/torneos.json');

        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: ${response.statusText}`);
        }

        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));

        return data;

    } catch (error) {
        console.error("No se pudieron obtener los torneos:", error);
        return null;
    }
}
