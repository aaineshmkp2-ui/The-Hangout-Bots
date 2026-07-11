const path = require('path');
const express = require('express');
const session = require('express-session');

function createApp(client) {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));

  app.use(session({
    secret: process.env.SESSION_SECRET || 'change-me-please-this-is-not-safe',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
  }));

  // Make the bot client and logged-in user available to every route/view
  app.use((req, res, next) => {
    req.client = client;
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;
    next();
  });

  app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', { title: 'The Hangout Bot — Dashboard' });
  });

  app.use('/auth', require('./routes/auth'));
  app.use('/dashboard', require('./routes/dashboard'));

  // Simple health check for uptime pingers
  app.get('/health', (req, res) => res.send('OK'));

  app.use((req, res) => {
    res.status(404).render('error', { title: 'Not Found', message: "That page doesn't exist.", backHref: '/dashboard' });
  });

  return app;
}

module.exports = createApp;
