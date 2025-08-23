package TP1.LAB.Observer;

public abstract class Colonia implements IntegranteBase {
    private static int contador = 0; // Contador estático para asignar ID únicos
    private int id; // ID único de la colonia

    public Colonia() {
        this.id = ++contador; // Incrementa el contador y asigna el ID
    }

    public int getId() {
        return id; // Devuelve el ID de la colonia
    }
}
