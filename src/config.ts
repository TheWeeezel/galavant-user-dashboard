export const config = {
  // Der Rueckfallwert ist bei Netlify KEIN Rueckfall, sondern die Regel: VITE_API_URL
  // steht in .env, und .env ist nicht eingecheckt — der Netlify-Bau zieht den Quelltext
  // aus GitHub und sieht die Datei nie. Solange die Variable nicht in netlify.toml oder
  // in der Netlify-Oberflaeche steht, ist es genau dieser Text, der im ausgelieferten
  // Bundle landet. Er zeigt deshalb auf die Hetzner-Box und nicht mehr auf Cloud Run,
  // wo mehrere Endpunkte (Markt, Enjin, Einloesung) inzwischen 404 antworten.
  apiUrl: import.meta.env.VITE_API_URL as string || 'https://ap1.galavant.run',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB as string || '',
};

if (!config.googleClientId) {
  console.warn('[config] VITE_GOOGLE_CLIENT_ID_WEB is not set. Google Sign-In will not work. See .env.example');
}
