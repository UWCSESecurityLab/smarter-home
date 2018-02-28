This is the user-facing web interface for the system. It is built with
standard React and EJS templates, with Firebase for notifications.

### Directories
- `/components`: React components for frontend interface
- `/sw`: Service Worker(s) for receiving notifications
- `/views`: EJS templates

### React entry points
- `home.js`: logged-in view
- `login.js`: login and registration

### Runbook
Build: in the top level smartapp directory, run `webpack` to build the JS
bundles.

Run:
1. `$ mongod`: Start database
2. `$ node server/smartapp.js`: Start server
3. Open `localhost:5000/login`

Note: you may need to use the host `selenium.dyn.cs.washington.edu:5000` if you
need to access the page from a machine besides the server (e.g. on a phone via
the SmartThings app).