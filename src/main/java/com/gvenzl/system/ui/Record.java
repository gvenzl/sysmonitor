/*
 * Since: March 2025
 * Author: gvenzl
 * Name: Record.java
 * Description: The Record controller
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

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TextField;
import javafx.stage.DirectoryChooser;
import javafx.stage.Stage;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Record {

    @FXML
    public TextField path;
    @FXML
    public TextField prefix;
    private boolean abort = false;

    @FXML
    public void openDirectoryChooser(ActionEvent actionEvent) {

        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("Save in...");
        Node node = (Node) actionEvent.getSource();
        File selectedDirectory = directoryChooser.showDialog(node.getScene().getWindow());

        if (null != selectedDirectory && selectedDirectory.isDirectory()) {
            try {
                path.setText(selectedDirectory.getCanonicalPath());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    @FXML
    public void cancelDialog() {
        abort = true;
        Stage stage = (Stage) prefix.getScene().getWindow();
        stage.close();
        abort = true;
    }

    public boolean isAbort() {
        return abort;
    }

    public boolean validateRecordAndClose(ActionEvent actionEvent) {

        Path dirPath = Path.of(path.getText());
        // If file is not a directory (shouldn't occur)
        if (!Files.isDirectory(dirPath)) {
            new Alert(Alert.AlertType.ERROR, String.format("Directory '%s' is not a directory.", path.getText()), ButtonType.OK).show();
            return false;
        }
        // Directory is not writable
        if (Files.isDirectory(dirPath) && !Files.isWritable(dirPath)) {
            new Alert(Alert.AlertType.ERROR, String.format("Directory '%s' is not writable.", path.getText()), ButtonType.OK).show();
            return false;
        }

        Node okButton = (Node) actionEvent.getSource();
        Stage stage = (Stage) okButton.getScene().getWindow();
        stage.close();

        return true;
    }
}
