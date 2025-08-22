package TP1.LAB;

public class CruceroEspacial extends Colonia {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.AGUJERO_NEGRO || nuevoEvento == Evento.METEORITOS) {
            System.out.println("¡El crucero espacial " + getId() + " está bajo amenaza! " + nuevoEvento);
        }
    }
}