package TP1.LAB.Observer;

public class ColoniaResidencial implements IntegranteBase {
    // ColoniaResidencial (subscriber) - reacciona a ESCASEZ_SUMINISTROS, INVASION y METEORITOS
    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.ESCASEZ_SUMINISTROS || nuevoEvento == Evento.INVASION
                || nuevoEvento == Evento.METEORITOS) {
            System.out
                    .println("¡La colonia residencial enfrenta una nueva crisis! " + nuevoEvento + ".");
        }
    }
}