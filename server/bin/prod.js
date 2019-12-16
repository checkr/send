const express = require('express');
const path = require('path');
const Sentry = require('@sentry/node');
const config = require('../config');
const routes = require('../routes');
const pages = require('../routes/pages');
const expressWs = require('@dannycoates/express-ws');
const morgan = require('morgan');

if (config.sentry_dsn) {
  Sentry.init({ dsn: config.sentry_dsn });
}

const app = express();

expressWs(app, null, { perMessageDeflate: false });
routes(app);
app.ws('/api/ws', require('../routes/ws'));

if (config.sentry_dsn) {
  // The error handler must be before any other error middleware
  // and after all controllers
  app.use(Sentry.Handlers.errorHandler());
}

app.use(morgan(config.log_format));

app.use(
  express.static(path.resolve(__dirname, '../../dist/'), {
    setHeaders: function(res, path) {
      if (!/serviceWorker\.js$/.test(path)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      res.removeHeader('Pragma');
    }
  })
);

app.use(pages.notfound);

app.listen(config.listen_port, config.listen_address);
