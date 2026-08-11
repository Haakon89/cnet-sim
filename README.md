##Requirements
Docker
Node

##Known issues
Docker starts of needing sudo to run, to be able to run the docker environments in the app, your current user has to be in the docker group so that you can run the commands without sudo rights.

The application can be run on windows subsystem linux, but it requires linux based node for installs and many of the bash scripts have the linux line endings so will not run without changing to windows line endings.

##Startup
To run the web application you need to set up the server and then the frontend.

In netsim-backend run,
npm install
node server.js

In netsim-frontend run,
npm install
npm run dev

You should now have the web app running on localhost port 5173

##Controlls
Sidebar:
Most actions you can take is done using the sidebar on the left side of the screen. It is sepperated into sections.

Runtime settings:
Here you can choose if you want to run the simulation in interactive mode or in timed mode.

Templates:
Here you can choose and load saved network templates, choose one from the dropdown menu and then click load template to show the currently selected template.

Nodes:
Here you have a dropdown menu of the different nodes(devices) that are available. Choose one from the dropdown then click Add node to add that device to the canvas. Once you have a node on the canvas you can select it by right clicking on it or using shift+mouse drag to create a selection box. While a node is selected you can click the Create network from selection button to add the selected nodes to a network.

Environment:
Here you can save your current environment as a template for later use(refresh the page to add it to the loadable templates list). You can also choose to run the current environment by clicking the Run Network Environment button, this will start up the simulation and either take you to the interactive or run page.

Help:
Here you can find some helpfull notes on the controlls

Selected Node:
This panel will be available if a node on the canvas is selected. Here you can look at information on the selected node as well as set up traffic/attacks between the nodes.
to set up traffic/attack you first choose the traffic/attack type, then you choose which source ip to use(useually just one, but a device could have more than one network frame). After that you choose the destination IP, not all node types can take all sorts of traffic/attack types so the list shoul only list the correct targets.
Once that is done you set the duration, which is how long the node should attempt to send the traffic/attack.
When all options have been selected click Add traffic/attack to add the selected traffic/attack to the node.

Selected Edge:
Similar to selected node, this shows information on a selected edge and lets you set a distance between nodes. This will impact latency on the edge, but not that it currently only works from routers and only one distance per network it is connected to will be used.

Networks:
Here you will have a list of the networks that are currently in use. they all have three buttons, add to network, which adds the currently selected nodes to the network, remove from network, which removes the currently selected nodes from the network and remove network which deletes the network and all edges related to it.

Node Types:
PC - Standard device running ubuntu.

Webserver - sets up an http server running a simple html page

Router - Device used to connect devices together and set up traffic routes between networks. Is also sed to capture traffic that passes through it.

Fileserver - an sftp server containing a txt, png and pdf document

BotNet - work in progress, does nothing atm.

Bot - ubuntu device set up to running attacks agains other devices

BotRouter - Router that sends packets out, but refuses any traffic from outside.