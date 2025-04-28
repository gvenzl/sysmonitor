module com.gvenzl.sysmonitor {

    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.graphics;
    requires java.xml;
    requires com.hierynomus.sshj;
    requires java.desktop;

    exports com.gvenzl;
    exports com.gvenzl.connect;
    exports com.gvenzl.system;
    exports com.gvenzl.system.ui;
    opens com.gvenzl;
    exports com.gvenzl.config;
    opens com.gvenzl.config;
}
