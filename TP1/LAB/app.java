package TP1.LAB;

public class app {
    public static void main(String[] args) {
        BaseCentral base = new BaseCentral();

        // Creación de colonias
        base.addSuscriber(new ColoniaCientifica());
        base.addSuscriber(new ColoniaMilitar());
        base.addSuscriber(new ColoniaResidencial());
        base.addSuscriber(new ColoniaResidencial());
        base.addSuscriber(new CruceroEspacial());

        // Método manual de generación de eventos aleatorios
        java.util.Scanner scanner = new java.util.Scanner(System.in);
        java.util.Random random = new java.util.Random();
        Evento[] eventos = Evento.values();

        System.out.println("Generador manual de eventos aleatorios. Escriba 'salir' para terminar.");
        while (true) {
            System.out.print("\nPresione Enter para generar un evento aleatorio ('salir' para terminar): ");
            String input = scanner.nextLine();
            if (input.equalsIgnoreCase("salir")) {
                break;
            }
            Evento eventoAleatorio = eventos[random.nextInt(eventos.length)];
            System.out.println("Evento generado: " + eventoAleatorio);
            base.notifySuscribers(eventoAleatorio);
        }
        scanner.close();
        System.out.println("Fin de la simulación.");
    }
}
