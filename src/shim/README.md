Code that connects to the Groovy-based security-manager SmartApp.
Originally intended to be a shim server for the project, but now
deprecated in favor of the self-hosted SmartApp. Code is here for 
archival purposes.

* SmartAppClient.js: client that makes requests to the SmartApp.
* cli.js: Command line interface, allows you to read/write to iot devices
* server.js: Shim server that exposes an HTTP API to access devices
* authServer.js: Spins up a server that handles the OAuth with SmartThings.

