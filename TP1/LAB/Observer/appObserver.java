package TP1.LAB.Observer;

public class appObserver {
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

        System.out.println("Generador manual de eventos aleatorios. Escriba '.' para terminar.");
        while (true) {
            System.out.print("\nPresione Enter para generar un evento aleatorio ('.' para terminar): ");
            String input = scanner.nextLine();
            if (input.equals(".")) {
                break;
            }
            Evento eventoAleatorio = eventos[random.nextInt(eventos.length)];
            base.notifySuscribers(eventoAleatorio);
        }
        scanner.close();
        System.out.println("Fin de la simulación.");
    }
}
