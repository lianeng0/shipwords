export const SOURCES = {
  reporting: {
    href: 'https://elcomercio.pe/luces/musica/no-existe-fue-creado-con-ia-su-cancion-se-volvio-viral-y-desata-polemica-quien-es-thiago-navarro-apuesplan-noticia/',
    title: 'El Comercio (Peru) — reporting on the AI artist and songwriter',
    date: '21 October 2026; updated 22 October 2026',
    detail:
      'Reports the 3 August release, human-written lyrics, AI voice and melody, platform labels and earlier CubaniPro credits. Platform labels are attributed to this report, not to an independent inspection of every profile.',
  },
  creator: {
    href: 'https://www.elcolombiano.com/amp/tendencias/bonito-bonito-historia-creador-cancion-viral-tiktok-inteligencia-artificial-GF41556033',
    title: 'El Colombiano — the creator explains the song and earlier releases',
    date: '25 September 2026',
    detail:
      'Quotes the creator and links his public statement. Describes Cruz as Venezuelan, while El Comercio describes him as Cuban; we do not resolve that difference.',
  },
  capcut: {
    href: 'https://www.capcut.com/help/download-template-video-without-watermark',
    title: 'CapCut Help — downloading a template video without a watermark',
    date: 'Reviewed 1 November 2026',
    detail:
      'CapCut says watermark-free template exports are possible, depending on export options and built-in branding. Check the template you actually select.',
  },
};

export function Sources({ items = ['reporting', 'creator'] }: { items?: (keyof typeof SOURCES)[] }) {
  return (
    <section aria-label="Sources">
      <h2>Sources and editorial notes</h2>
      <p>
        Reviewed 1 November 2026. Reporting is attributed below; our English meanings and gesture notes are
        editorial interpretation. Send corrections to{' '}
        <a href="mailto:support@aibabydancing.com">support@aibabydancing.com</a>.
      </p>
      <ul>
        {items.map((key) => {
          const source = SOURCES[key];
          return (
            <li key={key}>
              <a href={source.href} rel="noopener">
                {source.title}
              </a>{' '}
              — {source.date}. <span>{source.detail}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
