# CNet-Sim

CNet-Sim is a container-based network simulation tool designed for creating, running, and analyzing network environments.

Users can construct network topologies through a web interface, configure traffic between devices, and run the resulting environment using Docker containers. Network traffic can then be captured and analyzed to examine communication between devices and networks.

## Features

* Visual network topology creation
* Container-based network environments
* Multiple device types, including PCs, routers, and servers
* Configurable traffic and attacks between nodes
* Network traffic capture
* Interactive and timed simulation modes
* Reusable network templates
* Configurable distance and latency between network components

## Requirements

The following software is required to run CNet-Sim:

* Docker
* Node.js and npm
* Go

Docker must be configured so that it can be run by the current user without `sudo`. See [Known Issues](#known-issues) for more information.

## Installation and Startup

Clone the repository and navigate to the project directory.

### Backend

Navigate to the backend directory:

```bash
cd backend
```

Install the required Node.js dependencies:

```bash
npm install
```

Start the backend server:

```bash
node server.js
```

### Frontend

In a separate terminal, navigate to the frontend directory:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The web application should now be available at:

`http://localhost:5173`

## Controls

Most actions are performed using the sidebar on the left side of the application. The sidebar is divided into several sections.

### Runtime Settings

The runtime settings allow you to choose how the network simulation should run.

Two modes are available:

* **Interactive Mode** — Runs the environment interactively.
* **Timed Mode** — Runs the environment for a specified period.

### Templates

The Templates section allows saved network environments to be loaded.

Select a template from the dropdown menu and click **Load Template** to display the selected topology on the canvas.

### Nodes

The Nodes section contains a dropdown menu with the available device types.

Select a device type and click **Add Node** to add the device to the canvas.

Nodes can be selected by right-clicking them or by holding `Shift` and dragging with the mouse to create a selection box.

After selecting multiple nodes, click **Create Network from Selection** to create a network containing the selected nodes.

### Environment

The Environment section provides controls for saving and running the current network environment.

The current environment can be saved as a template for later use. After saving a template, refresh the page to make it available in the Templates dropdown menu.

Click **Run Network Environment** to start the current network simulation. Depending on the selected runtime mode, you will be taken to either the interactive environment or the timed run page.

### Help

The Help section contains additional information about the application's controls.

### Selected Node

The Selected Node panel becomes available when a node on the canvas is selected.

This panel displays information about the selected device and allows traffic or attacks to be configured between nodes.

To configure traffic or an attack:

1. Select the traffic or attack type.
2. Select the source IP address. A device will usually have one source IP address, but devices connected to multiple networks may have several.
3. Select the destination IP address. Only compatible destinations for the selected traffic or attack type are displayed.
4. Set the duration for which the node should generate the traffic or attack.
5. Click **Add Traffic/Attack** to add the configuration to the node.

### Selected Edge

The Selected Edge panel displays information about the currently selected connection between nodes.

A distance can be assigned to the connection, which affects the latency applied to network traffic.

Currently, distance-based latency is primarily applied to router connections, and only one configured distance per connected network is used.

### Networks

The Networks section displays all networks currently defined in the environment.

Each network provides three actions:

* **Add to Network** — Adds the currently selected nodes to the network.
* **Remove from Network** — Removes the currently selected nodes from the network.
* **Remove Network** — Deletes the network and its associated edges.

## Node Types

| Node            | Description                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **PC**          | Standard Ubuntu-based end device.                                                                   |
| **Web Server**  | Runs an HTTP server serving a simple HTML page.                                                     |
| **Router**      | Connects networks, configures routes between them, and captures traffic passing through the device. |
| **File Server** | Runs an SFTP server containing example TXT, PNG, and PDF files.                                     |
| **BotNet**      | Work in progress and currently has no functionality.                                                |
| **Bot**         | Ubuntu-based device configured to generate attacks against other devices.                           |
| **BotRouter**   | Router configured to send packets while rejecting incoming traffic from external networks.          |

## Contributing

Changes to the repository must be submitted through a pull request from a non-main branch.

Before creating a pull request, make sure that all linting checks and automated tests pass.

From the root `cnet-sim` directory, run:

```bash
npm run lint
npm test
```

Pull requests must pass all linting and automated tests before they can be merged.

Changes submitted through pull requests will be reviewed before being merged into the main branch.

## Known Issues

### Docker Permissions

Docker may initially require `sudo` to run commands on Linux.

CNet-Sim needs to execute Docker commands without `sudo`, so the current user must have permission to access Docker. This can be achieved by adding the user to the Docker group.

After configuring Docker permissions, verify that Docker can be run without `sudo`:

```bash
docker ps
```

### Windows Subsystem for Linux

CNet-Sim can run using Windows Subsystem for Linux (WSL), but Node.js dependencies should be installed using the Linux/WSL Node.js environment.

The project also contains Bash scripts that require Unix (`LF`) line endings. Windows (`CRLF`) line endings may cause these scripts to fail with errors such as:

```text
/usr/bin/env: 'bash\r': No such file or directory
```

If this occurs, convert the affected scripts to Unix line endings before running the environment.

## Feedback

If you are using CNet-Sim, please consider providing feedback about your experience. Feedback is useful for identifying usability issues and areas where the application can be improved.

[Open the CNet-Sim feedback form](https://docs.google.com/forms/d/e/1FAIpQLSfiL8SyxKF5C9__YQpylQoml6bVT4GC0Q24rewaBwH_zMRxiQ/viewform?usp=publish-editor)
