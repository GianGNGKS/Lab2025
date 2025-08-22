package TP1.LAB;

public class ColoniaCientifica extends Colonia {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.DESCUBRIMIENTO) {
            System.out.println("¡La colonia " + getId() + " científica festeja un nuevo descubrimiento!");
        }
    }
}