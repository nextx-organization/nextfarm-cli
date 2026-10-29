// One codebase, several branded binaries. The entry file (src/bin/<brand>.ts) picks the brand before
// anything else is imported; every user-facing name, host and storage location comes from here.

export type BrandId = "nextx"
  | "nextfarm"
  ;
/** Which backend contract the brand talks to. A platform may have its own assistant and proposal APIs; most brands share the default one. */
export type PlatformId = "nextx"
  | "nextfarm"
  ;
export type EnvName = "prod" | "sandbox";

export interface Endpoints {
  /** Public API gateway, without trailing slash. */
  api: string;
  /** OAuth authorization server (browser login). */
  auth: string;
  /** Hosted MCP server URL. */
  mcp: string;
  /** Web app, used for confirmation links. */
  app: string;
  /** Developer portal. */
  docs: string;
  /** Account portal (sessions, devices). */
  id: string;
}

export interface Brand {
  id: BrandId;
  platform: PlatformId;
  /** Command users type. */
  bin: string;
  /** Product name shown in the terminal. */
  name: string;
  /** Name of the AI assistant. */
  aiName: string;
  /** npm package name. */
  pkg: string;
  /** OAuth client id of the CLI (public client, PKCE, loopback redirect). */
  clientId: string;
  /** Prefix of environment variables (NEXTX_API_KEY, …). */
  envPrefix: string;
  /** Mobile app name for QR login. */
  mobileApp: string;
  /** Examples shown in help: permission codes for `keys create --scopes`, and what a CI write policy covers. */
  examples: { scopes: string; ciKinds: string; modules: string };
  /** A typical first question, shown in hints. */
  example: { vi: string; en: string };
  /** A real request for `api --help`, valid on this brand's gateway. */
  apiExample: string;
  /** Sign-in methods the brand's server does not offer yet; the CLI says so instead of failing mid-flow. */
  notYet?: ("device" | "ci")[];
  /** Where an admin allows a CI repository, after the web app address. */
  ciSettings: { vi: string; en: string };
  /** Modules this brand exposes. null = all except `hiddenModules`. */
  modules: string[] | null;
  /** Modules never shown: a broad brand hides the niche products that sell on their own; a niche brand shows everything else. */
  hiddenModules: string[];
  env: Record<EnvName, Endpoints>;
}



const NEXTFARM: Brand = {
  id: "nextfarm",
  platform: "nextfarm",
  bin: "nextfarm",
  name: "NextFarm",
  aiName: "NextFarm AI",
  pkg: "nextfarm",
  clientId: "nextfarm-cli",
  envPrefix: "NEXTFARM",
  mobileApp: "NextFarm",
  examples: { scopes: "gis.parcels.view,iot.devices.view", ciKinds: "field_log", modules: "gis, iot, office…" },
  example: { vi: "lô nào sắp thu hoạch tuần này", en: "which plots are due for harvest this week" },
  apiExample: "GET /gis/parcels -f page_size=5",
  notYet: [],
  ciSettings: { vi: "Quản lý › Khoá API › CI đăng nhập không cần khoá", en: "Manage › API keys › CI login without keys" },
  modules: null,
  hiddenModules: [],
  env: {
    prod: {
      api: "https://api-prod.nextfarm.vn",
      auth: "https://auth.nextfarm.vn",
      mcp: "https://mcp.nextfarm.vn/mcp",
      app: "https://app.nextfarm.vn",
      docs: "https://developers.nextfarm.vn",
      id: "https://id.nextfarm.vn",
    },
    sandbox: {
      api: "https://api-dev.nextfarm.vn",
      auth: "https://auth-dev.nextfarm.vn",
      mcp: "https://mcp-dev.nextfarm.vn/mcp",
      app: "https://app-dev.nextfarm.vn",
      docs: "https://developers-dev.nextfarm.vn",
      id: "https://id-dev.nextfarm.vn",
    },
  },
};

// Exported trees keep only their own brand (scripts/export.sh strips the other block and its line here).
const BRANDS: Partial<Record<BrandId, Brand>> = {
  nextfarm: NEXTFARM,
};

let current: Brand = Object.values(BRANDS)[0]!;

export function setBrand(id: BrandId): void {
  const b = BRANDS[id];
  if (b) current = b;
}

export function brand(): Brand {
  return current;
}

/** Reads `<PREFIX>_<name>` from the environment, e.g. envVar("API_KEY") → NEXTX_API_KEY. */
export function envVar(name: string): string | undefined {
  const v = process.env[`${current.envPrefix}_${name}`];
  return v === undefined || v === "" ? undefined : v;
}

/** Whether a module (or `module:scope`, `module.resource.action`) is shown by the current brand. */
export function visibleModule(code: string): boolean {
  const m = code.split(/[.:]/)[0]!.toLowerCase();
  const b = brand();
  return !b.hiddenModules.includes(m) && (!b.modules || b.modules.includes(m));
}
