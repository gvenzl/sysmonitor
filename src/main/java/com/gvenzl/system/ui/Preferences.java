/*
 * Since: March 2025
 * Author: gvenzl
 * Name: Preferences.java
 * Description: The preferences controller
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

package com.gvenzl.system.ui;

import com.gvenzl.config.Config;
import com.gvenzl.log.SysLogger;
import com.gvenzl.system.Systems;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Spinner;
import javafx.scene.control.TextField;
import javafx.stage.DirectoryChooser;
import javafx.stage.Stage;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import java.io.File;
import java.io.IOException;
import java.util.Map;

public class Preferences {

    @FXML
    public Spinner<Integer> refreshCycle;
    @FXML
    public Spinner<Integer> reconnectRetries;
    @FXML
    public Spinner<Integer> dataPoints;
    @FXML
    public Spinner<Integer> connectTimeout;
    @FXML
    public TextField logFilePath;

    @FXML
    public void initialize() {
        try {
            Config config = Config.getInstance();
            refreshCycle.getValueFactory().setValue(config.getRefreshCycle());
            reconnectRetries.getValueFactory().setValue(config.getReconnectRetries());
            dataPoints.getValueFactory().setValue(config.getDataPoints());
            connectTimeout.getValueFactory().setValue(config.getConnectTimeoutSeconds());
            logFilePath.setText(Config.getInstance().getLogFilePath());
        }
        catch (IOException e) {
            new Alert(Alert.AlertType.ERROR, "Cannot read configuration due to: %s".formatted(e.getMessage()), ButtonType.OK).show();
        }
    }

    @FXML
    public void openFileChooser(ActionEvent actionEvent) {

        DirectoryChooser directoryChooserChooser = new DirectoryChooser();
        directoryChooserChooser.setTitle("Log File");
        Node node = (Node) actionEvent.getSource();
        File selectedFile = directoryChooserChooser.showDialog(node.getScene().getWindow());

        if (selectedFile != null) {
            try {
                logFilePath.setText(selectedFile.getCanonicalPath());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    @FXML
    public void validateSaveAndClose(ActionEvent actionEvent) {

        Node okButton = (Node) actionEvent.getSource();
        Scene scene = okButton.getScene();

        // Validate all inputs and only then do something
        if (validateInput()) {

            boolean configSaved = false;

            // Check whether configuration can be opened.
            // If not, still try to set the log path
            try {
                Config config = Config.getInstance();
                // Try to update/store the configuration threads
                try {
                    updateConfig(config);
                    configSaved = true;
                }
                catch (IOException | ParserConfigurationException | TransformerException e) {
                    new Alert(Alert.AlertType.ERROR, "Cannot update configuration due to :%s\n".formatted(e.getMessage()), ButtonType.OK).show();
                }
                // Try to update threads regardless.
                try {
                    updateSystems();
                }
                catch (IOException e) {
                    String errorMessage = "Cannot update connection settings due to :%s";
                    if (configSaved) {
                        errorMessage += "\nSettings have been saved, please restart SysMonitor.";
                    }
                    new Alert(Alert.AlertType.ERROR, errorMessage.formatted(e.getMessage()), ButtonType.OK).show();
                }
            }
            catch (IOException e) {
                new Alert(Alert.AlertType.ERROR, "Cannot retrieve configuration due to :%s".formatted(e.getMessage()), ButtonType.OK).show();
            }

            // Set new log path (even if config save and thread update (independent) didn't succeed)
            try {
                SysLogger.getInstance().setLogFilePath(logFilePath.getText());
            }
            catch (IOException e) {
                new Alert(Alert.AlertType.ERROR, "Cannot set log path due to: %s".formatted(e.getMessage()), ButtonType.OK).show();
            }
        }

        Stage stage = (Stage) scene.getWindow();
        stage.close();
    }

    private boolean validateInput() {

        if (refreshCycle.getValue() < 1) {
            new Alert(Alert.AlertType.ERROR, "Refresh cycle cannot be lower than 1 second.", ButtonType.OK).show();
            return false;
        }

        if (reconnectRetries.getValue() < 1) {
            new Alert(Alert.AlertType.ERROR, "Reconnect retries cannot be lower than 1.", ButtonType.OK).show();
            return false;
        }

        if (dataPoints.getValue() < 5) {
            new Alert(Alert.AlertType.ERROR, "Data Points cannot be lower than 5.", ButtonType.OK).show();
            return false;
        }

        if (connectTimeout.getValue() < 1) {
            new Alert(Alert.AlertType.ERROR, "Connect timeout cannot be lower than 1.", ButtonType.OK).show();
            return false;
        }

        return true;
    }

    private void updateConfig(Config config)
            throws ParserConfigurationException, TransformerException, IOException {
        config.setRefreshCycle(refreshCycle.getValue());
        config.setReconnectRetries(reconnectRetries.getValue());
        config.setDataPoints(dataPoints.getValue());
        config.setConnectTimeoutSeconds(connectTimeout.getValue());
        config.setLogFilePath(logFilePath.getText());
        config.store();
    }

    private void updateSystems() throws IOException {

        for (Map.Entry<String, MonitoredSystem> sys : Systems.getInstance().getSystems().entrySet()) {
            sys.getValue().resetRefreshCycle(refreshCycle.getValue());
            sys.getValue().setReconnectRetries(reconnectRetries.getValue());
            sys.getValue().setDataPoints(dataPoints.getValue());
            sys.getValue().setConnectTimeoutSeconds(connectTimeout.getValue());
        }
    }

    @FXML
    public void cancelDialog() {
        Stage stage = (Stage) logFilePath.getScene().getWindow();
        stage.close();
    }
}
