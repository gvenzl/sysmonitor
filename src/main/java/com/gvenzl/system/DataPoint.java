/*
 * Since: March 2025
 * Author: gvenzl
 * Name: DataPoint.java
 * Description: A data point from a system.
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

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class DataPoint {

    /*
    FIELD DESCRIPTION FOR VM MODE
       Procs
           r: The number of runnable processes (running or waiting for run time).
           b: The number of processes blocked waiting for I/O to complete.

       Memory --> in KB
           swpd: the amount of virtual memory used.
           free: the amount of idle memory.
           buff: the amount of memory used as buffers.
           cache: the amount of memory used as cache.
           inact: the amount of inactive memory.  (-a option)
           active: the amount of active memory.  (-a option)

       Swap
           si: Amount of memory swapped in from disk (/s).
           so: Amount of memory swapped to disk (/s).

       IO
           bi: Blocks received from a block device (blocks/s).
           bo: Blocks sent to a block device (blocks/s).

       System
           in: The number of interrupts per second, including the clock.
           cs: The number of context switches per second.

       CPU
           These are percentages of total CPU time.
           us: Time spent running non-kernel code.  (user time, including nice time)
           sy: Time spent running kernel code.  (system time)
           id: Time spent idle.  Prior to Linux 2.5.41, this includes IO-wait time.
           wa: Time spent waiting for IO.  Prior to Linux 2.5.41, included in idle.
           st: Time stolen from a virtual machine.  Prior to Linux 2.6.11, unknown.

       NOTES
           vmstat does not require special permissions.

           These reports are intended to help identify system bottlenecks.   Linux
           vmstat does not count itself as a running process.

           All  linux  blocks  are  currently  1024 bytes.  Old kernels may report
           blocks as 512 bytes, 2048 bytes, or 4096 bytes.

           Since procps 3.1.9, vmstat lets you choose units (k, K, m, M).  Default
           is K (1024 bytes) in the default mode.

           vmstat uses slabinfo 1.1

       */

    private int runnableProcesses = 0;
    private int blockedProcesses = 0;
    private long swapMemoryKB = 0;
    private long freeMemoryKB = 0;
    private long bufferMemoryKB = 0;
    private long cacheMemoryKB = 0;

    private long swapFromDiskKB = 0;
    private long swapToDiskKB = 0;

    private long readDiskKB = 0;
    private long writeDiskKB = 0;

    private long interrupts = 0;
    private long contextSwitches = 0;

    private int userCPUPercent = 0;
    private int systemCPUPercent = 0;
    private int idleCPUPercent = 0;
    private int waitCPUPercent = 0;
    private int stealCPUPercent = 0;

    private Date dateTime;

    private final SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public Integer getRunnableProcesses() {
        return runnableProcesses;
    }

    public void setRunnableProcesses(Integer runnableProcesses) {
        this.runnableProcesses = runnableProcesses;
    }

    public Integer getBlockedProcesses() {
        return blockedProcesses;
    }

    public void setBlockedProcesses(Integer blockedProcesses) {
        this.blockedProcesses = blockedProcesses;
    }

    public Long getSwapMemoryKB() {
        return swapMemoryKB;
    }

    public void setSwapMemoryKB(Long swapMemoryKB) {
        this.swapMemoryKB = swapMemoryKB;
    }

    public Long getFreeMemoryKB() {
        return freeMemoryKB;
    }

    public void setFreeMemoryKB(Long freeMemoryKB) {
        this.freeMemoryKB = freeMemoryKB;
    }

    public Long getBufferMemoryKB() {
        return bufferMemoryKB;
    }

    public void setBufferMemoryKB(Long bufferMemoryKB) {
        this.bufferMemoryKB = bufferMemoryKB;
    }

    public Long getCacheMemoryKB() {
        return cacheMemoryKB;
    }

    public void setCacheMemoryKB(Long cacheMemoryKB) {
        this.cacheMemoryKB = cacheMemoryKB;
    }

    public Long getSwapFromDiskKB() {
        return swapFromDiskKB;
    }

    public void setSwapFromDiskKB(Long swapFromDiskKB) {
        this.swapFromDiskKB = swapFromDiskKB;
    }

    public Long getSwapToDiskKB() {
        return swapToDiskKB;
    }

    public void setSwapToDiskKB(Long swapToDiskKB) {
        this.swapToDiskKB = swapToDiskKB;
    }

    public Long getReadDiskKB() {
        return readDiskKB;
    }

    public void setReadDiskKB(Long readDiskKB) {
        this.readDiskKB = readDiskKB;
    }

    public Long getWriteDiskKB() {
        return writeDiskKB;
    }

    public void setWriteDiskKB(Long writeDiskKB) {
        this.writeDiskKB = writeDiskKB;
    }

    public Long getInterrupts() {
        return interrupts;
    }

    public void setInterrupts(Long interrupts) {
        this.interrupts = interrupts;
    }

    public Long getContextSwitches() {
        return contextSwitches;
    }

    public void setContextSwitches(Long contextSwitches) {
        this.contextSwitches = contextSwitches;
    }

    public Integer getUserCPUPercent() {
        return userCPUPercent;
    }

    public void setUserCPUPercent(Integer userCPUPercent) {
        this.userCPUPercent = userCPUPercent;
    }

    public Integer getSystemCPUPercent() {
        return systemCPUPercent;
    }

    public void setSystemCPUPercent(Integer systemCPUPercent) {
        this.systemCPUPercent = systemCPUPercent;
    }

    public Integer getIdleCPUPercent() {
        return idleCPUPercent;
    }

    public void setIdleCPUPercent(Integer idleCPUPercent) {
        this.idleCPUPercent = idleCPUPercent;
    }

    public Integer getWaitCPUPercent() {
        return waitCPUPercent;
    }

    public void setWaitCPUPercent(Integer waitCPUPercent) {
        this.waitCPUPercent = waitCPUPercent;
    }

    public Integer getStealCPUPercent() {
        return stealCPUPercent;
    }

    public void setStealCPUPercent(Integer stealCPUPercent) {
        this.stealCPUPercent = stealCPUPercent;
    }

    public Date getDateTime() {
        return this.dateTime;
    }

    public void setDateTime(String date) {
        try {
            dateTime = dateFormatter.parse(date);
        } catch (ParseException | NumberFormatException e) {
            System.out.println("Cannot parse string: '%s'".formatted(date));
            System.out.println("Date format used: %s".formatted(dateFormatter.getDateFormatSymbols().getLocalPatternChars()));
            System.out.println(e.getMessage());
            dateTime = new Date();
        }
    }
}
