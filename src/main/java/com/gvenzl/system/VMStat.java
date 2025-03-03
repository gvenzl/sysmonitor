/*
 * Since: March 2025
 * Author: gvenzl
 * Name: VMStat.java
 * Description: Information about the provided `vmstat` tool.
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

/*
FIELD DESCRIPTION FOR VM MODE
   Procs
       r: The number of runnable processes (running or waiting for run time).
       b: The number of processes blocked waiting for I/O to complete.

   Memory
       These are affected by the --unit option.
       swpd: the amount of swap memory used.
       free: the amount of idle memory.
       buff: the amount of memory used as buffers.
       cache: the amount of memory used as cache.
       inact: the amount of inactive memory.  (-a option)
       active: the amount of active memory.  (-a option)

   Swap
       These are affected by the --unit option.
       si: Amount of memory swapped in from disk (/s).
       so: Amount of memory swapped to disk (/s).

   IO
       bi: Kibibyte received from a block device (KiB/s).
       bo: Kibibyte sent to a block device (KiB/s).

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
       gu: Time spent running KVM guest code (guest time, including guest nice).
 */

public class VMStat {

    private boolean r;
    private boolean b;
    private boolean swpd;
    private boolean free;
    private boolean buff;
    private boolean cache;
    private boolean si;
    private boolean so;
    private boolean bi;
    private boolean bo;
    private boolean in;
    private boolean cs;
    private boolean us;
    private boolean sy;
    private boolean id;
    private boolean wa;
    private boolean st;
    private boolean gu;
    private String pattern;

    public VMStat(String vmStatOutput) {
        for (String line : vmStatOutput.split("\n")) {
            if (line.startsWith(" r  b")) {
                r = line.contains(" r");
                b = line.contains(" b");
                swpd = line.contains(" swpd");
                free = line.contains(" free");
                buff = line.contains(" buff");
                cache = line.contains(" cache");
                si = line.contains(" si");
                so = line.contains(" so");
                bi = line.contains(" bi");
                bo = line.contains(" bo");
                in = line.contains(" in");
                cs = line.contains(" cs");
                us = line.contains(" us");
                sy = line.contains(" sy");
                id = line.contains(" id");
                wa = line.contains(" wa");
                st = line.contains(" st");
                gu = line.contains(" gu");
            }
        }

        if (hasGu()) {
            pattern = " *(?<runQueue>\\d+) *(?<blockedQueue>\\d+) *(?<swapMemory>\\d+) *(?<freeMemory>\\d+) *(?<buffersMemory>\\d+) *(?<cacheMemory>\\d+) *(?<swappedFromDisk>\\d+) *(?<swappedToDisk>\\d+) *(?<kbFromDisk>\\d+) *(?<kbToDisk>\\d+) *(?<interruptsPerSec>\\d+) *(?<contextSwitchesPerSec>\\d+) *(?<userCPU>\\d+) *(?<systemCPU>\\d+) *(?<idleCPU>\\d+) *(?<waitCPU>\\d+) *(?<stealCPU>\\d+) *(?<guestCPU>\\d+) *(?<tms>\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d)";
        }
        else {
            pattern = " *(?<runQueue>\\d+) *(?<blockedQueue>\\d+) *(?<swapMemory>\\d+) *(?<freeMemory>\\d+) *(?<buffersMemory>\\d+) *(?<cacheMemory>\\d+) *(?<swappedFromDisk>\\d+) *(?<swappedToDisk>\\d+) *(?<kbFromDisk>\\d+) *(?<kbToDisk>\\d+) *(?<interruptsPerSec>\\d+) *(?<contextSwitchesPerSec>\\d+) *(?<userCPU>\\d+) *(?<systemCPU>\\d+) *(?<idleCPU>\\d+) *(?<waitCPU>\\d+) *(?<stealCPU>\\d+) *(?<tms>\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d)";
        }
    }

    public boolean hasR() {
        return r;
    }

    public boolean hasB() {
        return b;
    }

    public boolean hasSwpd() {
        return swpd;
    }

    public boolean hasFree() {
        return free;
    }

    public boolean hasBuff() {
        return buff;
    }

    public boolean hasCache() {
        return cache;
    }

    public boolean hasSi() {
        return si;
    }

    public boolean hasSo() {
        return so;
    }

    public boolean hasBi() {
        return bi;
    }

    public boolean hasBo() {
        return bo;
    }

    public boolean hasIn() {
        return in;
    }

    public boolean hasCs() {
        return cs;
    }

    public boolean hasUs() {
        return us;
    }

    public boolean hasSy() {
        return sy;
    }

    public boolean hasId() {
        return id;
    }

    public boolean hasWa() {
        return wa;
    }

    public boolean hasSt() {
        return st;
    }

    public boolean hasGu() {
        return gu;
    }

    public String getPattern() {
        return pattern;
    }
}
