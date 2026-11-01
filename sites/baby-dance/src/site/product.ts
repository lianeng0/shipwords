import { creditsFor } from '@shipwords/jobs/models';
import site from '../../site.config';
import models from '../../site.models';

// Public product facts only. Prices and credit costs are read from their existing sources of truth.
export const previewCredits = creditsFor(models[0], {});
export const fullCredits = creditsFor(models[1], {});
export const updatedDate = '2026-11-01';
export const organization = {
  '@type': 'Organization',
  '@id': `${site.url}/about#organization`,
  name: site.name,
  url: `${site.url}/about`,
  email: 'support@aibabydancing.com',
};
export function money(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
}
export function priceSummary() {
  return site.products
    .map((p) => `${p.credits / fullCredits} × 12s: ${money(p.price.amount, p.price.currency)}`)
    .join('; ');
}
export function freeConditions() {
  return `${site.signup.bonusCredits} sign-up credits cover one 5-second preview. Sign-in required; credits expire after ${site.signup.bonusExpiresDays} days. Bonus limited to one new account per IP per day.`;
}
export function firstVideoPrice() {
  return money(site.products[0].price.amount, site.products[0].price.currency);
}
export function offers() {
  return site.products.map((p) => ({
    '@type': 'Offer',
    name: p.name,
    price: (p.price.amount / 100).toFixed(2),
    priceCurrency: p.price.currency.toUpperCase(),
    url: `${site.url}/#pricing`,
  }));
}

export function breadcrumbs(path: string, title: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.name, item: site.url },
      { '@type': 'ListItem', position: 2, name: title, item: `${site.url}${path}` },
    ],
  };
}
