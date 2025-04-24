/*
 * Since: March 2025
 * Author: gvenzl
 * Name: SysLogger.java
 * Description:
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

package com.gvenzl.log;

import com.gvenzl.config.Config;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

public class SysLogger {

    private static SysLogger instance = null;
    private BufferedWriter logWriter = null;

    private SysLogger (String logFilePath) throws IOException {
        setLogFilePath(logFilePath);
    }

    public void setLogFilePath(String path) throws IOException {

        // If empty path is provided, stop logging
        if (null == path || path.isEmpty()) {
            if (null != logWriter) {
                logWriter.flush();
                logWriter.close();
                logWriter = null;
            }
        }
        else {
            if (null != logWriter) {
                logWriter.flush();
                logWriter.close();
            }
            String logFile = path + File.separator + "SysMonitor.log";
            logWriter = new BufferedWriter(new FileWriter(logFile, true));
        }
    }

    public static synchronized SysLogger getInstance()
    {
        if (instance == null) {
            try {
                String path = Config.getInstance().getLogFilePath();
                try {
                    instance = new SysLogger(path);
                }
                catch (IOException e) {
                    System.err.printf("Cannot create log file: %s%n", e.getMessage());
                }
            }
            catch (IOException e) {
                System.err.printf("Cannot get logfile config: %s%n", e.getMessage());
            }
        }
        return instance;
    }

    public synchronized void log(String output) {
        if (null != logWriter) {
            try {
                logWriter.write(output);
                logWriter.newLine();
            } catch (IOException e) {
                System.err.println(e.getMessage());
            }
        }
    }

    public synchronized void error(String output) {
        if (null != logWriter) {
            try {
                logWriter.write("ERROR: ");
                logWriter.write(output);
                logWriter.newLine();
            } catch (IOException e) {
                System.err.println(e.getMessage());
            }
        }
    }
}
