'use strict';
// Production bootstrap kept for systemd compatibility.
// All game and security rules live in server.js; do not rewrite or dynamically compile source at runtime.
require('./server.js');
