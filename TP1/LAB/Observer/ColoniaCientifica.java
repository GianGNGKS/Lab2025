package TP1.LAB.Observer;

public class ColoniaCientifica implements IntegranteBase {
    // ColoniaCientifica (suiscriber) - reacciona solo al evento DESCUBRIMIENTO
    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.DESCUBRIMIENTO) {
            System.out.println("¡La colonia científica festeja un nuevo descubrimiento!");
        }
    }
}
