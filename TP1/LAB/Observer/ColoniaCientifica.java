package TP1.LAB.Observer;

public class ColoniaCientifica implements IntegranteBase {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.DESCUBRIMIENTO) {
            System.out.println("¡La colonia científica festeja un nuevo descubrimiento!");
        }
    }
}