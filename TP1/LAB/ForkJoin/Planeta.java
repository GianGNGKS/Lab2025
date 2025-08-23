package TP1.LAB.ForkJoin;

import java.util.concurrent.RecursiveAction;

public class Planeta extends RecursiveAction {

    private String nombre;
    private float[] puntajeSectores;
    final static int UMBRAL = 5; // Umbral para dividir la tarea
    private int inicio, fin;

    Planeta(String nombre, float[] puntajeSectores, int inicio, int fin) {
        this.nombre = nombre;
        this.puntajeSectores = puntajeSectores;
        this.inicio = inicio;
        this.fin = fin;
    }

    @Override
    protected void compute() {
        int longitud = fin - inicio;
        if ((longitud) < UMBRAL) {
            for (int i = inicio; i < fin; i++) {
                puntajeSectores[i] /= 100;
            }
        } else {
            int mid = (inicio + fin) / 2;
            Planeta p1 = new Planeta(nombre + " 1", puntajeSectores, inicio, mid);
            Planeta p2 = new Planeta(nombre + " 2", puntajeSectores, mid, fin);

            p1.fork();
            p2.compute();
            p1.join();
        }
    }

    public String getNombre() {
        return nombre;
    }

    public float[] getPuntajeSectores() {
        return puntajeSectores;
    }

}
