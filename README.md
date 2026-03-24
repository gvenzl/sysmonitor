# SysMonitor
A graphical Linux system monitoring tool.
<img width="1108" alt="SysMonitor" src="https://github.com/user-attachments/assets/b54c7bc5-b1a1-4a96-9d1d-04193a05a76d" />

## About

`SysMonitor` is a graphical desktop tool for real-world performance monitoring of remote Linux systems.
It connects to hosts over SSH, gathers system data, and visualizes CPU, memory, disk, network, run queue,
and swap activity in a compact dashboard.

## Features

- **Remote Linux monitoring over SSH**
- **Live charts** for:
  - CPU
  - Memory
  - Disk
  - Network
- **Queue and swap indicators**
- **Multiple monitored systems** in one dashboard
- **Recording/export support** for collected metrics
- **Light / dark mode**
- **JSON-based config** at `~/.sysmonitor/config.json`

## Development

This repository now uses an Electron + TypeScript stack only.

### Commands

Run from the repository root:

- install dependencies:
  - `npm install`
- start development mode:
  - `npm run dev`
- run tests:
  - `npm test`
- build production bundles:
  - `npm run build`
- package release artifacts:
  - `npm run package`
- package an unpacked local app directory:
  - `npm run package:dir`

## Installation

Head over to [Releases](https://github.com/gvenzl/sysmonitor/releases) and download the latest version for your operating system. Release packaging now targets distributable artifacts from `dist/`; local bundle intermediates under `out/` are build outputs, not release artifacts.

**MacOS users**: Opening `SysMonitor` may still be blocked by macOS until signing/notarization credentials are configured for release builds.

## Usage

Launch the app, add one or more remote Linux systems, and monitor them from the dashboard.

## License

	Copyright 2025 Gerald Venzl

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	you may obtain a copy of the License at

	    http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
