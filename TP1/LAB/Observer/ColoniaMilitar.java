package TP1.LAB.Observer;

public class ColoniaMilitar implements IntegranteBase {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.INVASION) {
            System.out.println("¡La colonia militar se prepara para frenar la invasión!");
        }
    }
}