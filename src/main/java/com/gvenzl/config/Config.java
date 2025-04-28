/*
 * Since: March 2025
 * Author: gvenzl
 * Name: Config.java
 * Description: Holds the configuration
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

package com.gvenzl.config;

import com.gvenzl.connect.Connection;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.TreeMap;

public class Config {

    private static final String CONFIG_DIR = System.getProperty("user.home") + File.separator + ".sysmonitor";
    private static final File   CONFIG_FILE = new File (CONFIG_DIR + File.separator + "config.xml");
    // Statics for XML file tags and attributes
    private static final String ROOT = "configuration";
    private static final String PREFERENCES = "preferences";
    private static final String REFRESH = "refresh";
    private static final String RECONNECT = "reconnectRetries";
    private static final String CONNECT_TIMEOUT = "connectTimeout";
    private static final String DATA_POINTS = "dataPoints";
    private static final String SYSTEMS_ROOT = "systems";
    private static final String SYSTEM = "system";
    private static final String NAME = "name";
    private static final String HOST = "hostname";
    private static final String USER = "username";
    private static final String PORT = "port";
    private static final String PASSWORD = "password";
    private static final String PRIVATE_KEY = "privateKey";
    private static final String RECORD_DIR_PATH = "recordDir";
    private static final String LOG_DIR_PATH = "logDir";

    private final TreeMap<String, Connection> systems = new TreeMap<>();
    private int refreshCycle = 1;
    private int reconnectRetries = 3;
    private int connectTimeout = 5;
    private int dataPoints = 30;
    private String recordDirPath = null;
    private String logDirPath = null;

    private static Config instance = null;

    private Config() throws IOException {
        makeConfigFile();
        readConfig();
    }

    public static synchronized Config getInstance() throws IOException
    {
        if (instance == null) {
            instance = new Config();
        }
        return instance;
    }

    public int getRefreshCycle() {
        return this.refreshCycle;
    }

    public void setRefreshCycle(int cycle) {
        this.refreshCycle = cycle;
    }

    public void setReconnectRetries(int reconnRetries) {
        this.reconnectRetries = reconnRetries;
    }

    public int getReconnectRetries() {
        return this.reconnectRetries;
    }

    public void setConnectTimeoutSeconds(int timeout) { this.connectTimeout = timeout; }

    public int getConnectTimeoutSeconds() { return this.connectTimeout; }

    public int getConnectTimeoutMilliSeconds() { return this.connectTimeout * 1000; }

    public int getDataPoints() {
        return this.dataPoints;
    }

    public void setDataPoints(int points) {
        this.dataPoints = points;
    }

    public void setRecordDirPath(String path) {
        recordDirPath = path;
    }

    public String getRecordDirPath() {
        return recordDirPath;
    }

    public void setLogDirPath(String path) {
        logDirPath = path;
    }

    public String getLogDirPath() {
        return logDirPath;
    }

    private void readConfig() throws IOException {

        // File is not empty/new
        if (CONFIG_FILE.length() > 0) {

            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();

            try {
                DocumentBuilder db = dbf.newDocumentBuilder();
                Document doc = db.parse(CONFIG_FILE);
                doc.getDocumentElement().normalize();

                // Preferences tag
                Element preferences = (Element) doc.getElementsByTagName(PREFERENCES).item(0);
                refreshCycle = Integer.parseInt(preferences.getAttribute(REFRESH));
                reconnectRetries = Integer.parseInt(preferences.getAttribute(RECONNECT));
                connectTimeout = Integer.parseInt(preferences.getAttribute(CONNECT_TIMEOUT));
                dataPoints = Integer.parseInt(preferences.getAttribute(DATA_POINTS));
                recordDirPath = preferences.getAttribute(RECORD_DIR_PATH);
                logDirPath = preferences.getAttribute(LOG_DIR_PATH);

                // Systems tag
                Element systemsRoot = (Element) doc.getElementsByTagName(SYSTEMS_ROOT).item(0);
                NodeList xmlSystems = systemsRoot.getElementsByTagName(SYSTEM);

                for (int i = 0; i < xmlSystems.getLength(); i++) {

                    Element child = (Element) xmlSystems.item(i);
                    Connection conn = new Connection();
                    conn.setName(child.getAttribute(NAME));
                    conn.setHostName(child.getAttribute(HOST));
                    conn.setPort(child.getAttribute(PORT));
                    conn.setUserName(child.getAttribute(USER));
                    conn.setPassWord(deobfuscate(child.getAttribute(PASSWORD)));
                    conn.setSshKey(deobfuscate(child.getAttribute(PRIVATE_KEY)));
                    systems.put(conn.getName(), conn);
                }

            } catch (IOException | ParserConfigurationException | SAXException e) {
                throw new IOException(String.format("Cannot open config: %s", e.getMessage()));
            }
        }
    }

    private void makeConfigFile() throws IOException {

        if (!new File(CONFIG_DIR).exists()) {
            if (!new File(CONFIG_DIR).mkdirs()) {
                throw new IOException(String.format("Cannot create config directory: '%s'", CONFIG_DIR));
            }
        }

        if (!CONFIG_FILE.exists()) {
            if (!CONFIG_FILE.createNewFile()) {
                throw new IOException(String.format("Cannot create config file: '%s'", CONFIG_FILE));
            }
        }
    }

    public void addSystem(Connection system) {
        systems.put(system.getName(), system);
    }

    public Connection getSystem(String name) {
        return systems.get(name);
    }

    public TreeMap<String, Connection> getSystems() {
        return systems;
    }

    public void removeSystem(String name) { systems.remove(name); }

    public void store() throws ParserConfigurationException, TransformerException, IOException {
        Document doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().newDocument();

        Element root = doc.createElement(ROOT);

        Element preferences = doc.createElement(PREFERENCES);
        preferences.setAttribute(REFRESH, String.valueOf(refreshCycle));
        preferences.setAttribute(RECONNECT, String.valueOf(reconnectRetries));
        preferences.setAttribute(CONNECT_TIMEOUT, String.valueOf(connectTimeout));
        preferences.setAttribute(DATA_POINTS, String.valueOf(dataPoints));
        preferences.setAttribute(RECORD_DIR_PATH, recordDirPath);
        preferences.setAttribute(LOG_DIR_PATH, logDirPath);
        root.appendChild(preferences);

        Element systemRoot = doc.createElement(SYSTEMS_ROOT);
        for (Map.Entry<String, Connection> entry : systems.entrySet()) {
            Element sys = doc.createElement(SYSTEM);
            sys.setAttribute(NAME, entry.getKey());
            sys.setAttribute(HOST, entry.getValue().getHostName());
            sys.setAttribute(PORT, entry.getValue().getPort());
            sys.setAttribute(USER, entry.getValue().getUserName());
            if (!entry.getValue().getPassWord().isEmpty()) {
                sys.setAttribute(PASSWORD, obfuscate(entry.getValue().getPassWord()));
            }
            if (!entry.getValue().getSshKey().isEmpty()) {
                sys.setAttribute(PRIVATE_KEY, obfuscate(entry.getValue().getSshKey()));
            }
            systemRoot.appendChild(sys);
        }

        root.appendChild(systemRoot);
        doc.appendChild(root);

        // save the xml file
        // Transformer is for process XML from a variety of sources and write the
        // transformation
        // output to a variety of sinks
        Transformer tr = TransformerFactory.newInstance().newTransformer();

        tr.setOutputProperty(OutputKeys.INDENT, "yes");
        tr.setOutputProperty(OutputKeys.METHOD, "xml");
        tr.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        tr.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "4");

        DOMSource source = new DOMSource(doc);

        tr.transform(source, new StreamResult(new FileOutputStream(CONFIG_FILE)));
    }

    private String obfuscate(String input) {
        byte[] encodedBytes = Base64.getEncoder().encode(input.getBytes());
        return new String(encodedBytes);
    }

    private String deobfuscate(String input) {
        byte[] decodedBytes = Base64.getDecoder().decode(input);
        return new String(decodedBytes);
    }
}
