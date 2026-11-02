import site from '../../site.config';

export const ANALYTICS_OPT_OUT_KEY = 'baby-dance:analytics-off';
const flag = `ga-disable-${site.analytics.ga4}`;

// Runs before the Google tag: operators can exclude this browser without filtering an entire country.
export const analyticsPreferenceScript = `(()=>{const key=${JSON.stringify(ANALYTICS_OPT_OUT_KEY)};const mode=new URLSearchParams(location.search).get('analytics');let off=mode==='off';try{if(mode==='off')localStorage.setItem(key,'1');if(mode==='on')localStorage.removeItem(key);off=mode==='on'?false:off||localStorage.getItem(key)==='1'}catch{}window[${JSON.stringify(flag)}]=off})();`;

export function analyticsDisabled() {
  return (window as unknown as Record<string, unknown>)[flag] === true;
}
