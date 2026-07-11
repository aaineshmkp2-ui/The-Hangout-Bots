const express = require('express');
const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';

function getRedirectUri(req) {
  if (process.env.DASHBOARD_URL) return `${process.env.DASHBOARD_URL}/auth/callback`;
  // Fallback: infer from the incoming request (works for local testing)
  return `${req.protocol}://${req.get('host')}/auth/callback`;
}

router.get('/login', (req, res) => {
  const redirectUri = getRedirectUri(req);
  const url = new URL(`${DISCORD_API}/oauth2/authorize`);
  url.searchParams.set('client_id', process.env.CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify guilds');
  res.redirect(url.toString());
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/');

  try {
    const redirectUri = getRedirectUri(req);

    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('OAuth token exchange failed:', errText);
      return res.render('error', { title: 'Login Failed', message: 'Could not complete Discord login. Try again.', backHref: '/' });
    }

    const tokenData = await tokenRes.json();

    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildsRes.json();

    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    };
    req.session.guilds = Array.isArray(guilds) ? guilds : [];

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Login Failed', message: 'Something went wrong during login.', backHref: '/' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
