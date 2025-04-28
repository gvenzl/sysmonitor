/*
 * Since: March 2025
 * Author: gvenzl
 * Name: SysMonitor.java
 * Description: The main class
 *
 * Copyright 2025 Gerald Venzl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.gvenzl;

import com.gvenzl.config.Config;
import com.gvenzl.connect.Connection;
import com.gvenzl.log.SysLogger;
import com.gvenzl.system.Systems;
import com.gvenzl.system.ui.MonitoredSystem;
import com.gvenzl.system.ui.NewSystem;
import com.gvenzl.system.ui.Record;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.MenuItem;
import javafx.scene.image.Image;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.Objects;

public class SysMonitor extends Application {

    private static final String VERSION = "1.0.0";
    public static final double MONITORED_SYSTEM_HEIGHT = 530;
    private static Stage newSystemDialog = null;
    private static Stage preferencesDialog = null;
    private static Alert aboutDialog = null;
    @FXML
    public MenuItem stopRecordMenu;

    public static void main(String[] args) {
        Application.launch(args);
    }

    @Override
    public void start(Stage stage) throws Exception {

        stage.setTitle("SysMonitor");
        stage.getIcons().add(
                new Image(
                        Objects.requireNonNull(
                                getClass().getResourceAsStream("/logos/SysMonitor.png")
                        )
                )
        );

        Parent root = FXMLLoader.load(
                Objects.requireNonNull(
                        getClass().getClassLoader().getResource("SysMonitor.fxml")
                )
        );

        Scene scene = new Scene(root);
        scene.getStylesheets().add("layout.css");
        stage.setScene(scene);
        stage.show();

        // If no systems are found in the config yet (brand-new invocation), open "Add system" window)
        if (Objects.requireNonNull(Config.getInstance()).getSystems().isEmpty()) {
            openAddSystemWindow();
        }
        // Systems are present, open them
        else {
            // Add previously stored systems to the scene
            for (Map.Entry<String, Connection> system : Objects.requireNonNull(Config.getInstance()).getSystems().entrySet()) {
                addMonitoredSystemNode(system.getValue());
            }
        }
    }

    /**
     * Adds a new {@link MonitoredSystem} to the window.
     * @param conn the {@link Connection} to the system.
     * @throws IOException any IO error that may occur
     */
    private void addMonitoredSystemNode(Connection conn) throws IOException {
        FXMLLoader loader = new FXMLLoader(Objects.requireNonNull(
                                    getClass().getClassLoader().getResource("MonitoredSystem.fxml")));
        Node monitoredSystem = loader.load();
        monitoredSystem.setId(conn.getName());
        MonitoredSystem monitoredSystemController = loader.getController();
        monitoredSystemController.setConnection(conn);
        monitoredSystemController.start();
        Systems.getInstance().addSystem(monitoredSystemController);

        // Get mainPane from parent
        AnchorPane mainPane = (AnchorPane) Stage.getWindows().getFirst().getScene().lookup("#mainPane");

        AnchorPane.setTopAnchor(monitoredSystem, ((mainPane.getChildren().size()) * MONITORED_SYSTEM_HEIGHT)); // for each system add its height
        AnchorPane.setLeftAnchor(monitoredSystem, 0.0);
        AnchorPane.setRightAnchor(monitoredSystem, 0.0);
        mainPane.getChildren().add(monitoredSystem);
    }

    @FXML
    public void openAddSystemWindow() {

        // Check if dialog is already open
        if (null != newSystemDialog && newSystemDialog.isShowing()) {
            // Bring the existing dialog to the foreground
            newSystemDialog.requestFocus();
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getClassLoader().getResource("NewSystem.fxml"));
            Parent root = loader.load();
            NewSystem system = loader.getController();
            newSystemDialog = new Stage();
            newSystemDialog.setTitle("New System");
            newSystemDialog.setScene(new Scene(root));

            newSystemDialog.getScene().addEventHandler(KeyEvent.KEY_PRESSED, event -> {
                if (event.getCode() == KeyCode.ESCAPE) {
                    system.cancelDialog();
                }
            });
            // Clear the reference when the dialog is closed
            newSystemDialog.setOnCloseRequest(event -> newSystemDialog = null);

            newSystemDialog.showAndWait();

            // User may have clicked abort
            if (null != system && !system.isAbort() && !system.getName().isEmpty()) {
                // Add system to root
                try {
                    addMonitoredSystemNode(Config.getInstance().getSystem(system.getName()));
                }
                catch (IOException e) {
                    new Alert(Alert.AlertType.ERROR,
                            String.format("Cannot add system to window: %s", e.getMessage()))
                            .show();
                }
            }
        }
        catch (IOException e) {
            new Alert(Alert.AlertType.ERROR,
                    String.format("Cannot open window: %s", e.getMessage()))
                    .show();
        }
    }

    @Override
    public void stop() {
        try {
            for (Map.Entry<String, MonitoredSystem> sys : Systems.getInstance().getSystems().entrySet()) {
                SysLogger.getInstance().log("SysMonitor: Sending stop signal to: %s".formatted(sys.getKey()));
                sys.getValue().terminate();
                sys.getValue().join(Config.getInstance().getRefreshCycle()+2);
            }
            Config.getInstance().store();
            super.stop();
        }
        catch (Exception e) {
            new Alert(Alert.AlertType.ERROR, e.getMessage(), ButtonType.OK).show();
        }
    }

    public void quitApp() {
        Platform.exit();
    }

    public void openAbout() {
        if (null != aboutDialog && aboutDialog.getDialogPane().getScene().getWindow().isShowing()) {
            // Bring the existing dialog to the foreground
            aboutDialog.getDialogPane().getScene().getWindow().requestFocus();
            return;
        }

        aboutDialog = new Alert(Alert.AlertType.INFORMATION, "", ButtonType.OK);
        aboutDialog.setTitle("SysMonitor");
        aboutDialog.setHeaderText("About");
        aboutDialog.setContentText("SysMonitor %s (c) Gerald Venzl %s".formatted(VERSION, (new SimpleDateFormat("yyyy").format(new Date()))));

        // Close dialog on ESC key
        aboutDialog.getDialogPane().setOnKeyPressed(event -> {
            if (event.getCode() == KeyCode.ESCAPE) {
                aboutDialog.close();
            }
        });

        // Clear the reference when the dialog is closed
        aboutDialog.setOnCloseRequest(event -> aboutDialog = null);

        aboutDialog.show();
    }

    @FXML
    public void openPreferencesWindow() {
        // Check if dialog is already open
        if (null != preferencesDialog && preferencesDialog.isShowing()) {
            // Bring the existing dialog to the foreground
            preferencesDialog.requestFocus();
            return;
        }

        try {
            preferencesDialog = new Stage();
            preferencesDialog.setTitle("Preferences");
            preferencesDialog.setScene(new Scene(new FXMLLoader(getClass().getClassLoader().getResource("Preferences.fxml")).load()));

            preferencesDialog.getScene().addEventHandler(KeyEvent.KEY_PRESSED, event -> {
                if (event.getCode() == KeyCode.ESCAPE) {
                    preferencesDialog.close(); // Close the stage
                }
            });
            // Clear the reference when the dialog is closed
            preferencesDialog.setOnCloseRequest(event -> preferencesDialog = null);

            preferencesDialog.show();
        }
        catch (IOException e) {
            new Alert(Alert.AlertType.ERROR,
                    String.format("Cannot open window: %s", e.getMessage()))
                    .show();
        }
    }

    public void record() {
        try {
            for (Map.Entry<String, MonitoredSystem> system : Systems.getInstance().getSystems().entrySet()) {
                system.getValue().startRecording();
            }
            stopRecordMenu.setDisable(false);
        }
        catch (IOException e) {
            new Alert(Alert.AlertType.ERROR, "Cannot start recording due to: %s".formatted(e.getMessage()), ButtonType.OK).show();
        }
    }

    public void recordWithPathAndPrefix() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getClassLoader().getResource("Record.fxml"));
            Parent root = loader.load();
            Record record = loader.getController();
            Stage newWindow = new Stage();
            newWindow.setTitle("Record");
            newWindow.setScene(new Scene(root));
            newWindow.showAndWait();

            // User may have clicked abort
            if (null != record && !record.isAbort()) {
                // Tell threads to start recording
                try {
                    for (Map.Entry<String, MonitoredSystem> system : Systems.getInstance().getSystems().entrySet()) {
                        system.getValue().startRecording(record.path.getText(), record.prefix.getText());
                    }
                    stopRecordMenu.setDisable(false);
                }
                catch (IOException e) {
                    new Alert(Alert.AlertType.ERROR, "Cannot start recording due to: %s".formatted(e.getMessage()), ButtonType.OK).show();
                }
            }
        }
        catch (IOException e) {
            new Alert(Alert.AlertType.ERROR,
                    "Cannot open window: %s".formatted(e.getMessage()))
                    .show();
        }
    }

    public void stopRecord() {
        try {
            for (Map.Entry<String, MonitoredSystem> system : Systems.getInstance().getSystems().entrySet()) {
                system.getValue().stopRecording();
            }
            stopRecordMenu.setDisable(true);
        }
        catch (IOException e) {
            new Alert(Alert.AlertType.ERROR, "Cannot stop recording due to: %s".formatted(e.getMessage()), ButtonType.OK).show();
        }
    }
}
