package TP1.LAB.Observer;

public enum Evento {
    METEORITOS("Meteoritos"),
    DESCUBRIMIENTO("Descubrimiento"),
    INVASION("Invasión"), 
    ESCASEZ_SUMINISTROS("Escasez de suministros"), 
    AGUJERO_NEGRO("Agujero negro");

    private final String displayName;

    Evento(String displayName){
        this.displayName = displayName;
    }

    @Override
    public String toString(){
        return displayName;
    }

}
