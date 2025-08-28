package TP1.LAB.Observer;

import java.util.ArrayList;
import java.util.List;

public class BaseCentral {
    // BaseCentral (Publisher) -> IntegranteBase (Subscriber)
    private final List<IntegranteBase> colonias = new ArrayList<>();
    private Evento eventoActual;

    public void addSuscriber(IntegranteBase nuevaColonia) {
        colonias.add(nuevaColonia);
    }

    public void removeSuscriber(IntegranteBase colonia) {
        colonias.remove(colonia);
    }

    public void recibirEvento(Evento evento) {
        eventoActual = evento;
        notifySuscribers();
    }

    public void notifySuscribers() {
        System.out.println("¡Nuevo evento detectado! " + eventoActual);
        System.out.println("Notificando a " + colonias.size() + " colonias...");
        for (IntegranteBase colonia : colonias) {
            colonia.update(eventoActual);
        }
    }
}
