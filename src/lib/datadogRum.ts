/**
 * Client-only Datadog RUM helpers. Call initDatadogRum() from a client component
 * after the datadog-rum.js script has loaded (e.g. useEffect).
 */

const BOT_USER_AGENT_PATTERN =
  '(googlebot\\/|bot|Googlebot-Mobile|Googlebot-Image|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|tagoobot|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|AddThis)';

const botUserAgentRegex = new RegExp(BOT_USER_AGENT_PATTERN, 'i');

export function isLikelyBotUserAgent(userAgent: string): boolean {
  return botUserAgentRegex.test(userAgent);
}

/** 0 for bots (discard RUM session), 100 for real browsers. */
export function getRumSessionSampleRate(): number {
  if (typeof navigator === 'undefined') return 100;
  return isLikelyBotUserAgent(navigator.userAgent) ? 0 : 100;
}

type DatadogRumGlobal = {
  init: (config: Record<string, unknown>) => void;
};

function getDatadogRumGlobal(): DatadogRumGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & { DD_RUM?: DatadogRumGlobal };
  return w.DD_RUM;
}

const MAX_INIT_ATTEMPTS = 60;
const INIT_RETRY_MS = 50;

/**
 * Initializes Datadog RUM once DD_RUM is available. No-op if credentials are missing.
 * Retries briefly if the v6 script has not finished loading.
 */
export function initDatadogRum(): void {
  const applicationId = process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID || '';
  const clientToken = process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN || '';
  if (!applicationId || !clientToken) {
    return;
  }

  const tryInit = (attempt: number) => {
    const DD_RUM = getDatadogRumGlobal();
    if (DD_RUM?.init) {
      const sessionSampleRate = getRumSessionSampleRate();
      const replayRate = sessionSampleRate === 0 ? 0 : 100;

      DD_RUM.init({
        applicationId,
        clientToken,
        site: 'datadoghq.com',
        service: 'lazy-bread-web',
        env: process.env.NEXT_PUBLIC_DD_ENV || '',
        version: process.env.NEXT_PUBLIC_DD_VERSION || '',
        sessionSampleRate,
        sessionReplaySampleRate: replayRate,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
      });
      return;
    }
    if (attempt < MAX_INIT_ATTEMPTS) {
      window.setTimeout(() => tryInit(attempt + 1), INIT_RETRY_MS);
    }
  };

  tryInit(0);
}
