package TP1.LAB.Observer;

public class CruceroEspacial implements IntegranteBase {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.AGUJERO_NEGRO || nuevoEvento == Evento.METEORITOS) {
            System.out.println("¡El crucero espacial está bajo amenaza! " + nuevoEvento + ".");
        }
    }
}