package TP1.LAB.Observer;

public class CruceroEspacial implements IntegranteBase {
    // CruceroEspacial (subscriber) - reacciona a AGUJERO_NEGRO y METEORITOS
    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.AGUJERO_NEGRO || nuevoEvento == Evento.METEORITOS) {
            System.out.println("¡El crucero espacial está bajo amenaza! " + nuevoEvento + ".");
        }
    }
}