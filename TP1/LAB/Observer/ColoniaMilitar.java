package TP1.LAB.Observer;

public class ColoniaMilitar extends Colonia {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.INVASION) {
            System.out.println("¡La colonia militar " + getId() + " se prepara para frenar la invasión!");
        }
    }
}