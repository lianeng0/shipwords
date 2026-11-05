/** Redirect production page/API requests while keeping local HTTP previews usable. */
export function httpsRedirect(request: Request, siteOrigin: string): Response | undefined {
  const url = new URL(request.url);
  const origin = new URL(siteOrigin);
  if (url.protocol !== 'http:' || url.host !== origin.host || origin.protocol !== 'https:') return;
  url.protocol = 'https:';
  return Response.redirect(url.href, 308);
}
