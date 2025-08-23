package TP1.LAB.Observer;

public class ColoniaResidencial extends Colonia {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.ESCASEZ_SUMINISTROS || nuevoEvento == Evento.INVASION
                || nuevoEvento == Evento.METEORITOS) {
            System.out
                    .println("¡La colonia residencial " + getId() + " enfrenta una nueva crisis! " + nuevoEvento + ".");
        }
    }
}