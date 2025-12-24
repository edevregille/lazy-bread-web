// Service to fetch app configuration from S3

export interface AppConfig {
  NAV_ITEMS: Array<{ name: string; path: string }>;
  AUTH_NAV_ITEMS: Array<{ name: string; path: string }>;
  BREAD_TYPES: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
    availableForOrders: boolean;
  }>;
  BUSINESS_SETTINGS: {
    isHolidayMode: boolean;
    holidayMessage: string;
    returnDate: string;
    email: string;
    phone: string;
    instagram: string;
    recurringOrdersEmail: string;
    deliveryDays: string[];
    minOrderAdvanceHours: number;
    maxOrderQuantity: number;
    excludedDeliveryDates: string[];
  };
  DELIVERY_ZONES: {
    cityName: string;
    stateName: string;
    allowedZipCodes: string[];
  };
  FIND_US_LOCATIONS: Array<{
    id: string;
    name: string;
    address: string;
    image: string;
    imageAlt: string;
    schedule: string;
    active: boolean;
    coordinates: { lat: number; lng: number };
  }>;
  SOCIAL_MEDIA: {
    instagram: { url: string; handle: string; active: boolean };
    email: { address: string; active: boolean };
  };
  VALIDATION_RULES: {
    requireCaptcha: boolean;
    requirePhoneValidation: boolean;
    maxCommentLength: number;
  };
  PAGE_CONTENT: {
    orderPageTitle: string;
    holidayPageTitle: string;
    recurringDeliveryMessage: string;
    deliveryInstructions: string;
    commentsPlaceholder: string;
    commentsHelper: string;
  };
  ERROR_MESSAGES: Record<string, string>;
}

let cachedConfig: AppConfig | null = null;
let configPromise: Promise<AppConfig> | null = null;

export async function fetchAppConfig(forceRefresh: boolean = false): Promise<AppConfig> {
  // Clear cache if force refresh is requested
  if (forceRefresh) {
    cachedConfig = null;
    configPromise = null;
  }

  // Return cached config if available (and not forcing refresh)
  if (cachedConfig && !forceRefresh) {
    return cachedConfig;
  }

  // Return existing promise if already fetching (and not forcing refresh)
  if (configPromise && !forceRefresh) {
    return configPromise;
  }

  // Fetch config directly from S3
  const configUrl = process.env.NEXT_PUBLIC_CONFIG_S3_URL || '';
  
  if (!configUrl) {
    throw new Error('NEXT_PUBLIC_CONFIG_S3_URL is not configured');
  }

  // Add cache-busting query parameter to ensure fresh fetch
  const urlWithCacheBust = `${configUrl}?t=${Date.now()}`;

  configPromise = fetch(urlWithCacheBust, {
    cache: 'no-store', // Always fetch fresh config
    redirect: 'follow', // Follow redirects (handles S3 307 redirects)
    mode: 'cors', // Enable CORS
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }
      const config = await response.json();
      cachedConfig = config as AppConfig;
      return cachedConfig;
    })
    .catch((error) => {
      configPromise = null; // Reset promise on error
      throw error;
    });

  return configPromise;
}

// Function to clear cache (useful for testing or after updates)
export function clearConfigCache() {
  cachedConfig = null;
  configPromise = null;
}

