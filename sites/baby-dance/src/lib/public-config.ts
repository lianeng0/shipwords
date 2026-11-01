import { createServerFn } from '@tanstack/react-start';
import site from '../../site.config';

// Public config the browser needs (reCAPTCHA site key, Google client ID). Values come from wrangler vars or .dev.vars, not baked into the build.
export const getPublicConfig = createServerFn({ method: 'GET' }).handler(async () => {
  const { core } = await import('~/core.server');
  const env = core.env;
  return {
    analyticsEnabled: (env.APP_URL ?? site.url).replace(/\/$/, '') === site.url,
    recaptchaSiteKey: env.RECAPTCHA_SITE_KEY || null,
    googleClientId: env.GOOGLE_CLIENT_ID || null,
  };
});
