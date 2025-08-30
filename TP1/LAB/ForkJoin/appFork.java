package TP1.LAB.ForkJoin;

import java.util.concurrent.ForkJoinPool;

public class appFork {
    public static void main(String[] args) {
        try {
            int cantidadSectores = 100; // Número de sectores en el planeta

            float[] puntajesSectores = new float[cantidadSectores];
            for (int i = 0; i < cantidadSectores; i++) {
                puntajesSectores[i] = (float) (Math.random() * 100); // Asignar puntajes aleatorios entre 0 y 100
            }

            Planeta planeta = new Planeta("Tierra", puntajesSectores, 0, puntajesSectores.length);
            System.out.println(
                    "Puntajes finales de los sectores del planeta sin normalizar " + planeta.getNombre() + ":");
            imprimirPuntajes(puntajesSectores);
            System.out.println("----------------------------------------\n");

            // Usar ForkJoinPool para procesar los sectores del planeta
            try (ForkJoinPool pool = new ForkJoinPool()) {
                pool.invoke(planeta);
            }

            System.out.println("\n----------------------------------------");
            System.out.println("Puntajes finales de los sectores del planeta " + planeta.getNombre() + ":");
            imprimirPuntajes(planeta.getPuntajeSectores());
        } catch (Exception e) {
            System.out.println("Ocurrió un error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    static void imprimirPuntajes(float[] puntajes) {
        // Imprimir los puntajes de los sectores
        for (float d : puntajes) {
            System.out.print(d + "\t");
        }
        System.out.println();
    }
}
