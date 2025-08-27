package TP1.LAB.Observer;

import java.util.ArrayList;
import java.util.List;

public class BaseCentral {
    private final List<IntegranteBase> colonias = new ArrayList<>();
    private Evento eventoActual;

    public void addSuscriber(IntegranteBase nuevaColonia){
        colonias.add(nuevaColonia);
    }

    public void removeSuscriber(IntegranteBase colonia){
        colonias.remove(colonia);
    }

    public void recibirEvento(Evento evento){
        this.eventoActual = evento;
        notifySuscribers(evento);
    }

    public void notifySuscribers(Evento evento) {
        System.out.println("¡Nuevo evento detectado! "+ evento);
        for (IntegranteBase colonia : colonias) {
            colonia.update(evento);
        }
    }
}
