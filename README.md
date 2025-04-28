# SysMonitor
A graphical Linux system monitoring tool.
<img width="1108" alt="SysMonitor" src="https://github.com/user-attachments/assets/b54c7bc5-b1a1-4a96-9d1d-04193a05a76d" />

## About

`SysMonitor` was born out of my own struggles with monitoring Linux servers.
It’s designed to be a simple yet practical graphical tool for real-world performance statistic monitoring of remote Linux servers by connecting
to them via SSH and running the `vmstat` command. Here’s what you can accomplish with it:

* **Troubleshoot Performance Problems:** See at a glance if CPU, memory, or disk I/O is causing slowdowns. For instance, a high run queue or swap activity can point to resource issues, helping you tweak configurations or kill problematic processes.
* **Avoid Downtime:** Track disk I/O to catch I/O waits early, or monitor memory to prevent crashes from runaway processes.
* **Monitor Multiple Systems:** Use SSH to connect to remote servers and check multiple machines from one interface, saving time for sysadmins managing many machines.
* **Understand System Behavior:** The visual dashboard makes it easier for learners or hobbyists to see how Linux responds to workloads, clarifying concepts like process scheduling or memory management.
* **Document Configurations:** Static details like hostname and kernel version, paired with exportable metrics, help you record system setups for audits or team collaboration.

Unlike command-line tools that require parsing text or web-based dashboards that demand complex setups, SysMonitor strikes a balance:
it’s lightweight, graphical, and easy to use.

## Features

SysMonitor provides a straightforward interface to view both dynamic and static information about remote Linux systems. It offers:

* **Real-Time Performance Metrics:**
  * **CPU usage:** Identify high loads or spikes to troubleshoot performance.
  * **Memory usage:** Monitor available RAM to catch memory hogs or memory pressure.
  * **Disk usage:** Keep an eye on I/O throughput.
  * **Run queue:** Gauge system load and process demands.
  * **Block queue:** Detect I/O bottlenecks in disk operations.
  * **Swap read/write:** Spot excessive swapping that slows systems down.
* **Static System Information:**
  * **Hostname:** Confirm which system you’re monitoring.
  * **CPU core count:** Understand available processing power.
  * **Total memory:** Know the system’s memory capacity.
  * **OS info:** Check the OS, version, and architecture for debugging or compatibility.
* **Recording feature**: Record all performance metrics into log files.

## Installation

Head over to [Releases](https://github.com/gvenzl/sysmonitor/releases) and download the latest version for your operating system.

**MacOS users**: Opening `SysMonitor` will be blocked by MacOS because `Apple could not verify "SysMonitor" is free of malware that may harm your Mac or compromise your privacy`.
To open it, go into `Settings`-->`Privacy & Security` and under `Security` click on `Open Anyway`.

## Usage

Once running, add your Linux systems and start monitoring them.

## License

	Copyright 2025 Gerald Venzl

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	    http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.

