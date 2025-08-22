package TP1.LAB;

public class app {
    public static void main(String[] args) {
        BaseCentral base = new BaseCentral();

        base.addSuscriber(new ColoniaCientifica());
        base.addSuscriber(new ColoniaMilitar());
        base.addSuscriber(new ColoniaResidencial());
        base.addSuscriber(new CruceroEspacial());

        //Simulación de eventos
        System.out.println("Inicio de simulación.");
        try {
            Thread.sleep(2000);
            base.notifySuscribers(Evento.AGUJERO_NEGRO);
            Thread.sleep(2000);
            base.notifySuscribers(Evento.DESCUBRIMIENTO);
            Thread.sleep(2000);
            base.notifySuscribers(Evento.ESCASEZ_SUMINISTROS);
            Thread.sleep(2000);
            base.notifySuscribers(Evento.INVASION);
            Thread.sleep(2000);
            base.notifySuscribers(Evento.METEORITOS);
        } catch (Exception e) {
            System.err.println(e.getMessage());
        }
        System.out.println("Simulación terminada");
    }
}
