/*
 * Since: March 2025
 * Author: gvenzl
 * Name: MonitoredSystem.java
 * Description: The Monitored System controller
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

import com.gvenzl.SysMonitor;
import com.gvenzl.config.Config;
import com.gvenzl.connect.Connection;
import com.gvenzl.log.SysLogger;
import com.gvenzl.system.DataPoint;
import javafx.application.Platform;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.chart.StackedAreaChart;
import javafx.scene.chart.XYChart;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.layout.AnchorPane;
import javafx.scene.shape.Rectangle;
import javafx.scene.text.Text;
import javafx.stage.Stage;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import java.io.*;
import java.text.SimpleDateFormat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MonitoredSystem extends Thread {

    private static final String COMMAND = "vmstat -tn "; // Space at the end is needed
    private Connection conn;
    BufferedReader reader;
    private BufferedWriter recordFileWriter;
    private volatile boolean run = true;
    private Integer dataPoints = 30;
    private Integer timeInterval = 1;
    private int maxRetries = 0;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm:ss");
    private Pattern pattern;
    private String name;

    @FXML
    public AnchorPane monSystemPane;
    @FXML
    public Rectangle runQueueRunnableBar;
    @FXML
    public Text runQueueRunnableValueField;
    @FXML
    public Rectangle runQueueBlockedBar;
    @FXML
    public Text runQueueBlockedValueField;
    @FXML
    public Text systemNameField;
    @FXML
    public Text osNameField;
    @FXML
    public Text systemCPUsField;
    @FXML
    public Text systemMemoryField;
    @FXML
    public Text osArchField;
    @FXML
    public Text osVersionField;
    @FXML
    public Rectangle swapToDiskBar;
    @FXML
    public Text swapToDiskField;
    @FXML
    public Rectangle swapFromDiskBar;
    @FXML
    public Text swapFromDiskField;

    @FXML
    public StackedAreaChart<String, Number> cpuChart;
    private final XYChart.Series<String, Number> stealCPUSeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> waitCPUSeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> systemCPUSeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> userCPUSeries = new XYChart.Series<>();

    @FXML
    public StackedAreaChart<String, Number> memoryChart;
    private final XYChart.Series<String, Number> usedMemorySeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> bufferMemorySeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> cacheMemorySeries = new XYChart.Series<>();

    @FXML
    public StackedAreaChart<String, Number> diskChart;
    private final XYChart.Series<String, Number> diskReadSeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> diskWriteSeries = new XYChart.Series<>();

    @Override
    public void start() {
        this.setDaemon(true);
        super.start();
    }

    @FXML
    public void initialize() {
        monSystemPane.setVisible(false);
        runQueueRunnableBar.setWidth(1);
        runQueueBlockedBar.setWidth(1);
        swapFromDiskBar.setWidth(1);
        swapToDiskBar.setWidth(1);
        initCPUChart();
        initMemoryChart();
        initDiskChart();
    }

    public void resetRefreshCycle(int interval) throws IOException {
        if (this.timeInterval != interval) {
            this.timeInterval = interval;
            // Get new reader with updated TIME interval
            reader.close();
            reader = null;
        }
    }

    public void setDataPoints(int dataPoints) {
        if (this.dataPoints != dataPoints) {
            this.dataPoints = dataPoints;
        }
    }

    public void setReconnectRetries(int retries) {
        this.maxRetries = retries;
    }

    private void initCPUChart() {
        cpuChart.getData().addAll(stealCPUSeries, waitCPUSeries, systemCPUSeries, userCPUSeries);
        stealCPUSeries.setName("Steal");
        waitCPUSeries.setName("Wait");
        systemCPUSeries.setName("System");
        userCPUSeries.setName("User");
        stealCPUSeries.getNode().setId("steal-cpu-series");
        waitCPUSeries.getNode().setId("wait-cpu-series");
        systemCPUSeries.getNode().setId("system-cpu-series");
        userCPUSeries.getNode().setId("user-cpu-series");
    }

    private void initMemoryChart() {
        memoryChart.getData().addAll(bufferMemorySeries, cacheMemorySeries, usedMemorySeries);
        bufferMemorySeries.setName("Buffers");
        cacheMemorySeries.setName("Cache");
        usedMemorySeries.setName("Used");
        bufferMemorySeries.getNode().setId("buffer-memory-series");
        cacheMemorySeries.getNode().setId("cache-memory-series");
        usedMemorySeries.getNode().setId("used-memory-series");
    }

    private void initDiskChart() {
        diskChart.getData().addAll(diskReadSeries, diskWriteSeries);
        diskReadSeries.setName("Read");
        diskWriteSeries.setName("Write");
        diskReadSeries.getNode().setId("disk-read-series");
        diskWriteSeries.getNode().setId("disk-write-series");
    }

    public void setConnection(Connection conn) {
        this.conn = conn;
        this.name = conn.getName();
    }

    @Override
    public void run() {

        try {
            Config config = Config.getInstance();
            this.dataPoints = config.getDataPoints();
            this.timeInterval = config.getRefreshCycle();
            maxRetries = config.getReconnectRetries();
        }
        catch (IOException e) {
            // Ignore, if we cannot get it then let's just have no retries, aka 0 remains per initialization
        }

        int retries = 0;

        // if for whatever reason we get terminated, except when demanded, we reestablish the connection to N retries
        while (run && retries<maxRetries) {
            if (retries > 0) {
                SysLogger.getInstance().log(this.name + ": Connection lost, reconnecting...");
            }

            try {
                conn.connect();

                pattern = Pattern.compile(conn.getOsInfo().getVMStatPattern());

                systemNameField.setText(conn.getOsInfo().getHostName());
                this.setName("MonitoredSystem: %s".formatted(conn.getName()));
                systemCPUsField.setText(String.valueOf(conn.getOsInfo().getCpus()));
                systemMemoryField.setText(String.valueOf(
                        (float) Math.round(
                                (conn.getOsInfo().getMemoryKB() / 1000f / 1000f)
                            // Rounds to 3 digits automagically
                            * 1000f) / 1000f)
                );

                osNameField.setText(conn.getOsInfo().getOs());
                osVersionField.setText(conn.getOsInfo().getKernelVersion());
                osArchField.setText(conn.getOsInfo().getArchitecture());

                // Fields have all been initialized, make the pane visible
                if (!monSystemPane.isVisible()) {
                    monSystemPane.setVisible(true);
                }

                try {
                    while (run) {

                        // If reader is null or has been closed, get a new reader
                        if (null == reader) {
                            getNewReader();
                        }

                        String line;
                        // Reader might have been closed due to SSH disconnect, etc.
                        try {
                            line = reader.readLine();
                        }
                        catch (IOException e) {
                            // reader might have been closed, try getting a new reader
                            getNewReader();
                            // Will trigger another IO exception, if something is wrong completely wrong, breaking the loop
                            line = reader.readLine();
                        }

                        updateCharts(line);

                        try {
                            recordLine(line);
                        }
                        catch (IOException e) {
                            SysLogger.getInstance().error(this.name + ": Cannot record line due to: %s".formatted(e.getMessage()));
                        }
                    }
                    SysLogger.getInstance().log(this.name + ": Stop request, stopping thread.");
                    reader.close();
                }
                finally {
                    conn.close();
                }
            }
            // Cannot communicate with the server, abort.
            catch (IOException e) {
                SysLogger.getInstance().error(this.name + ": " + e.getMessage());
            }
            retries++;
        }
    }

    private void getNewReader() throws IOException {
        BufferedReader newReader = conn.executeCommandAndRead(COMMAND + this.timeInterval);
        // Ignore the headers (first 2 rows)
        newReader.readLine();
        newReader.readLine();
        reader = newReader;
    }

    /**
     * Tells the thread to close the connection and terminate.
     */
    public void terminate() {
        run = false;
        if (null != recordFileWriter) {
            try {
                recordFileWriter.flush();
                recordFileWriter.close();
            }
            catch (IOException e) {
                // Ignore exceptions, we are terminating
            }
            recordFileWriter = null;
        }
    }

    /**
     * Updates the charts.
     * @param values string of the output from the remote server
     */
    private void updateCharts(String values) {
        DataPoint dp = parseLine(values);
        String timeSlice = dateFormat.format(dp.getDateTime());
        updateRunQueues(dp);
        updateSwap(dp);
        updateCPUChart(timeSlice, dp);
        updateMemoryChart(timeSlice, dp);
        updateDiskChart(timeSlice, dp);
    }

    private float getPercent(int total, int portion) {
        return (float) portion / (float) total * 100f;
    }

    private void updateRunQueues(DataPoint dp) {
        Platform.runLater(() -> {
            Integer runQueueRunnableValue = dp.getRunnableProcesses();
            runQueueRunnableBar.setWidth(getBarScale(runQueueRunnableValue, 150));
            runQueueRunnableValueField.setText(runQueueRunnableValue > 0 ? runQueueRunnableValue.toString() : "");

            Integer runQueueBlockedValue = dp.getBlockedProcesses();
            runQueueBlockedBar.setWidth(getBarScale(runQueueBlockedValue, 150));
            runQueueBlockedValueField.setText(runQueueBlockedValue > 0 ? runQueueBlockedValue.toString() : "");
        });
    }

    private void updateSwap(DataPoint dp) {
        Platform.runLater(() -> {
            int swapToDiskMB = Math.round((float) dp.getSwapToDiskKB() / 1000f);
            swapToDiskBar.setWidth(getBarScale(swapToDiskMB, 150));
            swapToDiskField.setText(swapToDiskMB > 0 ? String.valueOf(swapToDiskMB) : "");

            int swapFromDiskMB = Math.round((float) dp.getSwapFromDiskKB() / 1000f);
            swapFromDiskBar.setWidth(getBarScale(swapFromDiskMB, 150));
            swapFromDiskField.setText(swapFromDiskMB > 0 ? String.valueOf(swapFromDiskMB) : "");

        });
    }

    private void updateCPUChart(String timeSlice, DataPoint dp) {

        Platform.runLater(() -> {

            userCPUSeries.getData().add(new XYChart.Data<>(timeSlice, dp.getUserCPUPercent()));
            systemCPUSeries.getData().add(new XYChart.Data<>(timeSlice, dp.getSystemCPUPercent()));
            waitCPUSeries.getData().add(new XYChart.Data<>(timeSlice, dp.getWaitCPUPercent()));
            stealCPUSeries.getData().add(new XYChart.Data<>(timeSlice, dp.getStealCPUPercent()));

            // Data points can be dynamically adjusted, make sure they get updated if user reduces them
            while (cpuChart.getData().getFirst().getData().size() > dataPoints+1) {
                userCPUSeries.getData().removeFirst();
                systemCPUSeries.getData().removeFirst();
                waitCPUSeries.getData().removeFirst();
                stealCPUSeries.getData().removeFirst();
            }
        });
    }

    private void updateMemoryChart(String timeSlice, DataPoint dp) {

        int totalMemoryMB = Math.round((float) conn.getOsInfo().getMemoryKB() / 1000f);
        int bufferMemoryMB = Math.round((float) dp.getBufferMemoryKB() / 1000f);
        int cacheMemoryMB = Math.round((float) dp.getCacheMemoryKB() / 1000f);
        int freeMemoryMB = Math.round((float) dp.getFreeMemoryKB() / 1000f);

        // Used = total memory minus the sum of buffer, cached, free, i.e.
        // Used = total - (buffer+cache+free)
        int usedMemoryMB = totalMemoryMB - (bufferMemoryMB+cacheMemoryMB+freeMemoryMB);

        float usedMemoryPercent = getPercent(totalMemoryMB, usedMemoryMB);
        float bufferMemoryPercent = getPercent(totalMemoryMB, bufferMemoryMB);
        float cacheMemoryPercent = getPercent(totalMemoryMB, cacheMemoryMB);

        Platform.runLater(() -> {
            usedMemorySeries.getData().add(new XYChart.Data<>(timeSlice, usedMemoryPercent));
            bufferMemorySeries.getData().add(new XYChart.Data<>(timeSlice, bufferMemoryPercent));
            cacheMemorySeries.getData().add(new XYChart.Data<>(timeSlice, cacheMemoryPercent));

            // Data points can be dynamically adjusted, make sure they get updated if user reduces them
            while (memoryChart.getData().getFirst().getData().size() > dataPoints+1) {
                usedMemorySeries.getData().removeFirst();
                bufferMemorySeries.getData().removeFirst();
                cacheMemorySeries.getData().removeFirst();
            }
        });
    }

    private void updateDiskChart(String timeSlice, DataPoint dp) {

        int readDiskMB = Math.round((float) dp.getReadDiskKB() / 1000f);
        int writeDiskMB = Math.round((float) dp.getWriteDiskKB() / 1000f);

        Platform.runLater(() -> {
            diskReadSeries.getData().add(new XYChart.Data<>(timeSlice, readDiskMB));
            diskWriteSeries.getData().add(new XYChart.Data<>(timeSlice, writeDiskMB));

            while (diskChart.getData().getFirst().getData().size() > dataPoints+1) {
                diskReadSeries.getData().removeFirst();
                diskWriteSeries.getData().removeFirst();
            }
        });

    }

    private int getBarScale(int value, int max) {

        int pixels = value * 5; // value * 5 pixels

        // If value == 0 --> 0*5 == 0
        if (pixels == 0) {
            pixels = 1;
        }
        else if (pixels > max) {
            pixels = max; // get max pixels
        }

        return pixels;
    }

    private DataPoint parseLine(String line) {
        if (conn.getOsInfo().getOs().equalsIgnoreCase("Linux")) {
            return parseLineLinux(line);
        }
        else {
            return new DataPoint();
        }
    }

    private DataPoint parseLineLinux(String line) {

        DataPoint dp = new DataPoint();

        Matcher matcher = pattern.matcher(line);

        if (matcher.matches()) {
            dp.setRunnableProcesses(Integer.valueOf(matcher.group("runQueue")));
            dp.setBlockedProcesses(Integer.valueOf(matcher.group("blockedQueue")));
            dp.setSwapMemoryKB(Long.valueOf(matcher.group("swapMemory")));
            dp.setFreeMemoryKB(Long.valueOf(matcher.group("freeMemory")));
            dp.setBufferMemoryKB(Long.valueOf(matcher.group("buffersMemory")));
            dp.setCacheMemoryKB(Long.valueOf(matcher.group("cacheMemory")));
            dp.setSwapFromDiskKB(Long.valueOf(matcher.group("swappedFromDisk")));
            dp.setSwapToDiskKB(Long.valueOf(matcher.group("swappedToDisk")));
            dp.setReadDiskKB(Long.valueOf(matcher.group("kbFromDisk")));
            dp.setWriteDiskKB(Long.valueOf(matcher.group("kbToDisk")));
            dp.setInterrupts(Long.valueOf(matcher.group("interruptsPerSec")));
            dp.setContextSwitches(Long.valueOf(matcher.group("contextSwitchesPerSec")));
            dp.setUserCPUPercent(Integer.valueOf(matcher.group("userCPU")));
            dp.setSystemCPUPercent(Integer.valueOf(matcher.group("systemCPU")));
            dp.setIdleCPUPercent(Integer.valueOf(matcher.group("idleCPU")));
            dp.setWaitCPUPercent(Integer.valueOf(matcher.group("waitCPU")));
            dp.setStealCPUPercent(Integer.valueOf(matcher.group("stealCPU")));
            dp.setDateTime(matcher.group("tms"));
        }

        return dp;
    }

    public void startRecording() throws IOException {
        startRecording(System.getProperty("user.home"), "");
    }

    public void startRecording(String path, String prefix) throws IOException {

        String fileName = conn.getName() + ".log";

        String fullFilePath = path + File.separator;
        if (prefix.trim().isEmpty()) {
            fullFilePath = fullFilePath + fileName;
        }
        else {
            fullFilePath = fullFilePath + prefix + fileName;
        }

        // Triggers recording once not null
        recordFileWriter = new BufferedWriter(new FileWriter(fullFilePath, true));
    }

    public void stopRecording() throws IOException {
        recordFileWriter.close();
        recordFileWriter = null;
    }

    private void recordLine(String line) throws IOException {
        if (null != recordFileWriter) {
            recordFileWriter.write(line);
            recordFileWriter.write("\n");
        }
    }

    public void removeSystem(ActionEvent actionEvent) {

        // Remove system from the configuration
        try {
            Config.getInstance().removeSystem(name);
            Config.getInstance().store();
        }
        catch (IOException | ParserConfigurationException | TransformerException e) {
            new Alert(Alert.AlertType.ERROR, String.format("Cannot remove system from configuration: %s", e.getMessage()), ButtonType.OK).show();
            return;
        }

        // Remove system from the window
        AnchorPane mainPane = (AnchorPane) Stage.getWindows().getFirst().getScene().lookup("#mainPane");
        Node monitoredSystem = Stage.getWindows().getFirst().getScene().lookup("#"+ name);
        mainPane.getChildren().remove(monitoredSystem);

        // Redraw the windows
        int nodeIdx = 0;
        for (Node node : mainPane.getChildren()) {
            AnchorPane.setTopAnchor(node, nodeIdx * SysMonitor.MONITORED_SYSTEM_HEIGHT);
            nodeIdx++;
        }

        // Terminate yourself (close the connection, etc.)
        this.terminate();
    }
}
