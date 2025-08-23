package TP1.LAB.ForkJoin;

import java.util.Scanner;
import java.util.concurrent.ForkJoinPool;

public class appFork {
    public static void main(String[] args) {
        try {
            Scanner scanner = new Scanner(System.in);
            System.out.print("Ingrese cantidad de sectores del planeta: ");
            //int cantidadSectores = scanner.nextInt();
            int cantidadSectores = 10;
            scanner.close();

            float[] puntajesSectores = new float[cantidadSectores];
            for (int i = 0; i < cantidadSectores; i++) {
                puntajesSectores[i] = (float) (Math.random() * 100); // Asignar puntajes aleatorios entre 0 y 100
            }

            Planeta planeta = new Planeta("Tierra", puntajesSectores, 0, puntajesSectores.length);
            System.out.println(
                    "Puntajes finales de los sectores del planeta sin normalizar " + planeta.getNombre() + ":");
            imprimirPuntajes(puntajesSectores);

            try (ForkJoinPool pool = new ForkJoinPool()) {
                pool.invoke(planeta);
            }

            System.out.println("Puntajes finales de los sectores del planeta " + planeta.getNombre() + ":");
            imprimirPuntajes(planeta.getPuntajeSectores());
        } catch (Exception e) {
            System.out.println("Ocurrió un error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    static void imprimirPuntajes(float[] puntajes) {
        for (float d : puntajes) {
            System.out.print(d + "\t");
        }
        System.out.println();
    }
}
