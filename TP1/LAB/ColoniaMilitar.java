package TP1.LAB;

public class ColoniaMilitar implements Colonia {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.INVASION) {
            System.out.println("La colonia militar se prepara para frenar la invasión.");
        }
    }
}