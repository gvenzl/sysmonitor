/*
 * Since: March 2025
 * Author: gvenzl
 * Name: Connection.java
 * Description: The connection to the system.
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

package com.gvenzl.connect;

import com.gvenzl.config.Config;
import com.gvenzl.system.OSInfo;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.connection.ConnectionException;
import net.schmizz.sshj.connection.channel.direct.Session;
import net.schmizz.sshj.transport.TransportException;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;
import net.schmizz.sshj.userauth.keyprovider.KeyProvider;
import net.schmizz.sshj.userauth.password.PasswordUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

public class Connection {

    private String name = "";
    private OSInfo osInfo;
    private String hostName = "";
    private String port = "22";
    private String userName = "";
    private String passWord = "";
    private String sshKey = "";
    private SSHClient client;

    public String getHostName() {
        return hostName;
    }

    public void setHostName(String hostName) {
        this.hostName = hostName;
    }

    public String getPort() {
        return port;
    }

    public void setPort(String port) {
        this.port = port;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassWord() {
        return passWord;
    }

    public void setPassWord(String passWord) {
        this.passWord = passWord;
    }

    public String getSshKey() {
        return sshKey;
    }

    public void setSshKey(String sshKey) {
        this.sshKey = sshKey;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public OSInfo getOsInfo() {
        return osInfo;
    }

    public void connect() throws IOException {
        connect(0);
    }

    public void connect(int timeoutMilliSeconds) throws IOException {
        client = new SSHClient();
        client.addHostKeyVerifier(new PromiscuousVerifier());
        client.setConnectTimeout(timeoutMilliSeconds);
        client.connect(hostName, Integer.parseInt(port));

        if (sshKey.isEmpty()) {
            client.authPassword(userName, passWord);
        }
        else {
            KeyProvider privateKey;
            if (passWord.isEmpty()) {
                privateKey = client.loadKeys(sshKey, null, null);
            }
            else {
                privateKey = client.loadKeys(sshKey, null, PasswordUtils.createOneOff(passWord.toCharArray()));
            }
            client.authPublickey(userName, privateKey);
        }

        retrieveOsInfo();
    }

    private void retrieveOsInfo() throws TransportException, ConnectionException {
        if (executeCommand("uname -s").equalsIgnoreCase("Linux")) {
            retrieveOsInfoLinux();
        }
    }

    private void retrieveOsInfoLinux() throws TransportException, ConnectionException {
        osInfo = new OSInfo();
        osInfo.setHostName(executeCommand("hostname"));
        osInfo.setArchitecture(executeCommand("uname -m"));
        osInfo.setOs(executeCommand("uname -s"));
        osInfo.setKernelVersion(executeCommand("uname -r"));
        osInfo.setCpus(Integer.valueOf(executeCommand("grep processor /proc/cpuinfo | wc -l")));
        osInfo.setCpuType(executeCommand("grep 'model name' /proc/cpuinfo | head -n 1 | awk '{ split($0, array, \":\"); print array[2] }'".trim()));
        osInfo.setMemoryKB(Long.valueOf(executeCommand("awk '/MemTotal/ {print $2}' /proc/meminfo")));
        osInfo.createVMStatPattern(executeCommand("vmstat"));
    }

    public String executeCommand(String command) throws TransportException, ConnectionException {
        Session session = client.startSession();
        Session.Command cmd = session.exec(command);
        BufferedReader reader = new BufferedReader(new InputStreamReader(cmd.getInputStream()));
        String output = reader.lines().collect(Collectors.joining(System.lineSeparator()));
        cmd.join(5, TimeUnit.SECONDS);
        session.close();
        return output;
    }

    public BufferedReader executeCommandAndRead(String command) throws IOException {
        if (!client.isConnected()) {
            connect(Config.getInstance().getConnectTimeoutMilliSeconds());
        }

        Session session;
        try {
            session = client.startSession();
        }
        catch (TransportException e) {
            connect();
            session = client.startSession();
        }

        Session.Command cmd = session.exec(command);
        return new BufferedReader(new InputStreamReader(cmd.getInputStream()));
    }

    public void close() {
        try {
            client.close();
        } catch (IOException e) {
            //Ignore
        }
    }
}
