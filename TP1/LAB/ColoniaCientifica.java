package TP1.LAB;

public class ColoniaCientifica implements Colonia {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.DESCUBRIMIENTO) {
            System.out.println("¡La colonia científica festeja un nuevo descubrimiento!");
        }
    }
}