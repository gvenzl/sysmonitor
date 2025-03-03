/*
 * Since: March 2025
 * Author: gvenzl
 * Name: OSInfo.java
 * Description: Information about an OS / System.
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

public class OSInfo {

    private String os;
    private String hostName;
    private String cpuType;
    private int cpus;
    private long memoryKB;
    private String kernelVersion;
    private String architecture;
    private VMStat vmStat;

    public String getOs() {
        return os;
    }

    public void setOs(String os) {
        this.os = os;
    }

    public String getHostName() {
        return hostName;
    }

    public void setHostName(String hostName) {
        this.hostName = hostName;
    }

    public String getCpuType() {
        return cpuType;
    }

    public void setCpuType(String cpuType) {
        this.cpuType = cpuType;
    }

    public Integer getCpus() {
        return cpus;
    }

    public void setCpus(Integer cpus) {
        this.cpus = cpus;
    }

    public Long getMemoryKB() {
        return memoryKB;
    }

    public void setMemoryKB(Long memoryKB) {
        this.memoryKB = memoryKB;
    }

    public String getKernelVersion() {
        return kernelVersion;
    }

    public void setKernelVersion(String kernelVersion) {
        this.kernelVersion = kernelVersion;
    }

    public String getArchitecture() {
        return architecture;
    }

    public void setArchitecture(String architecture) {
        this.architecture = architecture;
    }

    public String getVMStatPattern() {
        return vmStat.getPattern();
    }

    public void createVMStatPattern(String vmStatOutput) {
        vmStat = new VMStat(vmStatOutput);
    }
}
