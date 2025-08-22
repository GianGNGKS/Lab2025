package TP1.LAB;

public class ColoniaResidencial implements Colonia {

    @Override
    public void update(Evento nuevoEvento) {
        if (nuevoEvento == Evento.ESCASEZ_SUMINISTROS || nuevoEvento == Evento.INVASION || nuevoEvento == Evento.METEORITOS) {
            System.out.println("¡La colonia residencial enfrenta una nueva crisis! "+ nuevoEvento);
        }
    }
}