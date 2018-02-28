This is the backend service for the system - it is a REST-based SmartApp backend
but also serves a web UI and endpoints for the mobile app.

The backend has three main functions:
1. Handles SmartThings events. Events include the configuration flow (when users install the smartapp), and device events.
2. Makes requests to SmartThings. These allow the server to control devices and subscribe to events on the user's behalf.
3. Serve endpoints for the web/mobile interface. Mostly for logins and notifications.

### Authentication
Authentication is complicated because SmartThings is no longer an OAuth provider
in the new REST platform. When a user installs the SmartApp, the server receives
an event containing their SmartThings ids and OAuth tokens, which allows the
server to control/view their home on their behalf.

However, we also need to let users control/view the home through the mobile and
web interfaces. Since we can't get OAuth access to SmartThings from the client
web/mobile side, we have to implement our own logins, and then somehow link them
to a SmartApp instance.

To do this, we do a "reverse" OAuth - in the SmartApp configuration, the server
acts as its own OAuth provider, and prompts the user to login to the server
from the SmartThings app. This allows us to associate an SmartThings
installedAppId with our system's user account.

### Files and directories
- `smartapp.js`: Server entry point
- `/db`: Mongoose (MongoDB) schema files
- `SmartThingsClient.js`: Code for accessing the SmartThings API

### Runbook
- `$ mongod`: Start database
- `$ node server/smartapp.js`: Start server