/*
 * Since: March 2025
 * Author: gvenzl
 * Name: NewSystem.java
 * Description: The Add New System controller
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
import com.gvenzl.connect.Connection;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import net.schmizz.sshj.userauth.UserAuthException;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import java.io.File;
import java.io.IOException;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class NewSystem {

    @FXML
    public TextField name;
    @FXML
    public TextField hostName;
    @FXML
    public TextField port;
    @FXML
    public TextField userName;
    @FXML
    public PasswordField password;
    @FXML
    public TextField sshKeyPath;
    private boolean abort = false;

    public void openFileChooser(ActionEvent actionEvent) {

        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Open SSH Key");
        Node node = (Node) actionEvent.getSource();
        File selectedFile = fileChooser.showOpenDialog(node.getScene().getWindow());

        if (selectedFile != null) {
            try {
                sshKeyPath.setText(selectedFile.getCanonicalPath());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private void storeConfig() {

        Connection conn = new Connection();
        conn.setName(name.getText());
        conn.setHostName(hostName.getText());
        conn.setPort(port.getText());
        conn.setUserName(userName.getText());
        conn.setPassWord(password.getText());

        if (! sshKeyPath.getText().isEmpty()) {
            if (!new File(sshKeyPath.getText()).canRead()) {
                new Alert(Alert.AlertType.ERROR,
                      String.format("No permission to read SSH key file: %s", sshKeyPath.getText()),
                      ButtonType.OK)
                    .show();
                return;
            }
            else {
                try {
                    conn.setSshKey(new String(Files.readAllBytes(Paths.get(sshKeyPath.getText()))));
                }
                catch (IOException e) {
                    new Alert(Alert.AlertType.ERROR,
                      String.format("Cannot read SSH key file: %s", e.getMessage()),
                      ButtonType.OK)
                    .show();
                    return;
                }
            }
        }

        try {
            Config config = Config.getInstance();
            config.addSystem(conn);
            try {
                Config.getInstance().store();
            }
            catch (IOException | ParserConfigurationException | TransformerException e) {
                new Alert(Alert.AlertType.ERROR, String.format("Cannot store config: %s", e.getMessage()), ButtonType.OK).show();
            }
        }
        catch (IOException e) {
            new Alert(Alert.AlertType.ERROR, String.format("Cannot retrieve configuration: %s", e.getMessage()), ButtonType.OK).show();
        }

    }

    public void validateSaveAndClose(ActionEvent actionEvent) {

        if (validateInputs()) {
            storeConfig();

            Node okButton = (Node) actionEvent.getSource();
            Stage stage = (Stage) okButton.getScene().getWindow();
            stage.close();
        }
    }

    private boolean validateInputs() {

        Connection conn = new Connection();

        if (isEmpty(name)) {
            new Alert(Alert.AlertType.ERROR, "Name field cannot be empty").show();
            return false;
        }

        if (isEmpty(hostName)) {
            new Alert(Alert.AlertType.ERROR, "Host Name field cannot be empty").show();
            return false;
        }
        else {
            conn.setHostName(hostName.getText());
        }

        if (isEmpty(port)) {
            new Alert(Alert.AlertType.ERROR, "Port field cannot be empty").show();
            return false;
        }
        else {
            conn.setPort(port.getText());
        }

        if (isEmpty(userName)) {
            new Alert(Alert.AlertType.ERROR, "Username field cannot be empty").show();
            return false;
        }
        else {
            conn.setUserName(userName.getText());
        }

        if (isEmpty(password) && isEmpty(sshKeyPath)) {
            new Alert(Alert.AlertType.ERROR, "You need to provide either a password or an SSH key.").show();
            return false;
        }

        if (!isEmpty(password)) {
            conn.setPassWord(password.getText());
        }

        if (!isEmpty(sshKeyPath)) {
            try {
                conn.setSshKey(new String(Files.readAllBytes(Paths.get(sshKeyPath.getText()))));
            }
            catch (IOException e) {
                new Alert(Alert.AlertType.ERROR, "Cannot read SSH Key file: %s".formatted(e.getMessage())).show();
                return false;
            }
        }

        // Try to connect to the system
        try {
            conn.connect();
            conn.close();
        }
        catch (UnknownHostException e) {
            new Alert(Alert.AlertType.ERROR, "Host name/address '%s' is unknown and probably wrong".formatted(e.getMessage())).show();
            return false;
        }
        catch (UserAuthException e) {
            new Alert(Alert.AlertType.ERROR, "Cannot authenticate user: %s.\nPlease make sure the username, password and/or SSH key are correct.".formatted(e.getMessage())).show();
            return false;
        }
        catch (IOException e) {
            new Alert(Alert.AlertType.ERROR, "Cannot connect to system: %s".formatted(e.getMessage())).show();
            return false;
        }

        return true;
    }

    private boolean isEmpty(TextField field) {
        return field == null || field.getText().trim().isEmpty();
    }

    public String getName() {
        return name.getText();
    }

    @FXML
    public void cancelDialog(ActionEvent actionEvent) {
        this.abort = true;
        Node cancelButton = (Node) actionEvent.getSource();
        Stage stage = (Stage) cancelButton.getScene().getWindow();
        stage.close();
    }

    public boolean isAbort() {
        return abort;
    }
}
