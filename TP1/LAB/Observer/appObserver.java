package TP1.LAB.Observer;

public class appObserver {
    public static void main(String[] args) {
        BaseCentral base = new BaseCentral();

        // Creación de colonias
        base.addSuscriber(new ColoniaCientifica());
        base.addSuscriber(new ColoniaMilitar());
        base.addSuscriber(new ColoniaResidencial());
        base.addSuscriber(new CruceroEspacial());

        // Generación de eventos aleatorios
        try {
            generarEventoAleatorio(base);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("\nFin de la simulación.");
    }

    static void generarEventoAleatorio(BaseCentral base) throws InterruptedException {
        // Método de generación de eventos aleatorios
        final int delay = 2500; // 2.5 segundos de delay entre eventos

        System.out.println("--- Iniciando simulación de eventos ---\n");

        System.out.println("Generando invasión...");
        base.recibirEvento(Evento.INVASION);
        Thread.sleep(delay);
        System.out.println("--------------------------------\n");
        System.out.println("Generando descubrimiento...");
        base.recibirEvento(Evento.DESCUBRIMIENTO);
        Thread.sleep(delay);
        System.out.println("--------------------------------\n");
        System.out.println("Generando escasez de suministros...");
        base.recibirEvento(Evento.ESCASEZ_SUMINISTROS);
        Thread.sleep(delay);
        System.out.println("--------------------------------\n");
        System.out.println("Generando meteoritos...");
        base.recibirEvento(Evento.METEORITOS);
        Thread.sleep(delay);
        System.out.println("--------------------------------\n");
        System.out.println("Generando agujero negro...");
        base.recibirEvento(Evento.AGUJERO_NEGRO);
        Thread.sleep(delay);

        // Agrego nueva colonia durante ejecución
        System.out.println("--------------------------------\n");
        System.out.println("--- Se agrega una nueva colonia científica ---\n");
        base.addSuscriber(new ColoniaCientifica());
        System.out.println("Generando nuevo descubrimiento...");
        base.recibirEvento(Evento.DESCUBRIMIENTO);
        Thread.sleep(delay);

    }
}
