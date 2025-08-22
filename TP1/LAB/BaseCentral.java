package TP1.LAB;

import java.util.ArrayList;
import java.util.List;

public class BaseCentral {
    private final List<Colonia> colonias = new ArrayList<>();

    public void addSuscriber(Colonia nuevaColonia){
        colonias.add(nuevaColonia);
    }

    public void removeSuscriber(Colonia colonia){
        colonias.remove(colonia);
    }

    public void notifySuscribers(Evento evento) {
        System.out.println("¡Nuevo evento detectado! "+ evento);
        for (Colonia colonia : colonias) {
            colonia.update(evento);
        }
    }
}
