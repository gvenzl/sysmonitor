/*
 * Since: March 2025
 * Author: gvenzl
 * Name: Systems.java
 * Description: Singleton to store system
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

package com.gvenzl.system;

import com.gvenzl.system.ui.MonitoredSystem;

import java.util.TreeMap;

public class Systems {

    private static Systems instance = null;
    private final TreeMap<String, MonitoredSystem> monitoredSystemControllers = new TreeMap<>();

    private Systems() {
        // Prevent instantiation
    }

    public static synchronized Systems getInstance() {
        if (instance == null) {
            instance = new Systems();
        }
        return instance;
    }

    public void addSystem(MonitoredSystem monitoredSystem) {
        monitoredSystemControllers.put(monitoredSystem.getName(), monitoredSystem);
    }

    public TreeMap<String, MonitoredSystem> getSystems() {
        return monitoredSystemControllers;
    }
}
