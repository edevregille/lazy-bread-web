// App Configuration for Lazy Bread Bakery
// Note: Data values are now loaded from S3 via configService.ts
// The hardcoded values below serve as fallbacks until S3 config is loaded

// Global config object that can be updated at runtime
let runtimeConfig: any = null;

// Function to update runtime config (called by ConfigContext)
export function setRuntimeConfig(config: any) {
  runtimeConfig = config;
  // Update the exported variables directly
  if (config.NAV_ITEMS) {
    NAV_ITEMS.length = 0;
    NAV_ITEMS.push(...config.NAV_ITEMS);
  }
  if (config.AUTH_NAV_ITEMS) {
    AUTH_NAV_ITEMS.length = 0;
    AUTH_NAV_ITEMS.push(...config.AUTH_NAV_ITEMS);
  }
  if (config.BREAD_TYPES) {
    BREAD_TYPES.length = 0;
    BREAD_TYPES.push(...config.BREAD_TYPES);
  }
  if (config.BUSINESS_SETTINGS) {
    Object.assign(BUSINESS_SETTINGS, config.BUSINESS_SETTINGS);
  }
  if (config.DELIVERY_ZONES) {
    Object.assign(DELIVERY_ZONES, config.DELIVERY_ZONES);
  }
  if (config.FIND_US_LOCATIONS) {
    FIND_US_LOCATIONS.length = 0;
    FIND_US_LOCATIONS.push(...config.FIND_US_LOCATIONS);
  }
  if (config.SOCIAL_MEDIA) {
    Object.assign(SOCIAL_MEDIA, config.SOCIAL_MEDIA);
  }
  if (config.VALIDATION_RULES) {
    Object.assign(VALIDATION_RULES, config.VALIDATION_RULES);
  }
  if (config.PAGE_CONTENT) {
    Object.assign(PAGE_CONTENT, config.PAGE_CONTENT);
  }
  if (config.ERROR_MESSAGES) {
    Object.assign(ERROR_MESSAGES, config.ERROR_MESSAGES);
  }
}

// Fallback values (used until S3 config is loaded)
export let NAV_ITEMS = [
  { name: "Home", path: "/" },
  { name: "Order", path: "/order" },
  { name: "About", path: "/about" },
  { name: "Find Us", path: "/find-us" },
];

export let AUTH_NAV_ITEMS = [
  { name: "Home", path: "/" },
  { name: "Order", path: "/order" },
  { name: "About", path: "/about" },
  { name: "Find Us", path: "/find-us" },
];

export let BREAD_TYPES = [
  { 
    id: 'classic-salt', 
    name: 'Classic Salt Loaf', 
    price: 6.00, 
    description: 'Traditional sourdough focaccia finished off with a light sprinkling of course kosher salt. Ready for anything!',
    availableForOrders: true, 
  },
  { 
    id: 'rosemary', 
    name: 'Rosemary Loaf', 
    price: 6.00, 
    description: 'Backyard rosemary gives a delicate flavor to this loaf that pairs beautifully with the slight sourdough tang.',
    availableForOrders: true, 
  },
  { 
    id: 'green-olive', 
    name: 'Olive', 
    price: 6.00, 
    description: 'Laced with green pimento olives throughout.',
    availableForOrders: true, 
  },
  { 
    id: 'caramelized-onion', 
    name: 'Caramelized onion with herbs de Provence', 
    price: 6.00, 
    description: 'Savory onions caramelized and baked into the dough for an added hit of flavor',
    availableForOrders: true, 
  },
  { 
    id: 'dilly-bread', 
    name: 'Dilly bread', 
    price: 6.00, 
    description: 'Dill seeds and onions bring comforting flavor to our tangy sourdough',
    availableForOrders: true, 
  },
];

export let BUSINESS_SETTINGS = {
  // Holiday mode settings
  isHolidayMode: false, // Set to true to disable ordering
  holidayMessage: "🏖️ We're on Holiday! Taking a well-deserved break.",
  returnDate: "September, 2025",
  
  // Contact information
  email: "lazybreadpdx@gmail.com",
  phone: "+1 (206) 272-0418",
  instagram: "https://www.instagram.com/lazybreadpdx/",
  
  // Recurring orders
  recurringOrdersEmail: "lazybreadpdx@gmail.com",
  
  // Business hours and delivery
  deliveryDays: ["Wednesday","Friday"],
  minOrderAdvanceHours: 36,
  maxOrderQuantity: 5,
  // Excluded delivery dates (format: YYYY-MM-DD)
  excludedDeliveryDates: [
    "2025-11-26",
    "2025-11-28",
  ],
};

export let DELIVERY_ZONES = {
  cityName: "Portland Multnomah County",
  stateName: "Oregon",
  allowedZipCodes: [
    '97201', '97202', '97203', '97204', '97205', '97206', '97207', '97208', '97209',
    '97210', '97211', '97212', '97213', '97214', '97215', '97216', '97217', '97218',
    '97219', '97220', '97221', '97222', '97223', '97224', '97225', '97227', '97228',
    '97229', '97230', '97231', '97232', '97233', '97236', '97238', '97239', '97240',
    '97242', '97266', '97267', '97268', '97269', '97280', '97281', '97282', '97283',
    '97286', '97290', '97291', '97292', '97293', '97294', '97296', '97298', '97299'
  ],
};

export let FIND_US_LOCATIONS = [
  {
    id: 'pop-up-shop',
    name: 'Pop-Up Shop',
    address: '55 NE Holman St, Portland OR',
    image: '/popup-shop.jpg',
    imageAlt: 'Pop-up Shop',
    schedule: 'Wednesdays and Fridays 8am to 9pm',
    active: true,
    coordinates: {
      lat: 45.5647,
      lng: -122.6587
    }
  },{
    id: 'woodlawn-farmers-market',
    name: 'Woodlawn Farmers Market',
    address: 'Woodlawn Triangle, Portland OR',
    image: '/contact-market.png',
    imageAlt: 'Woodlawn Farmers Market',
    schedule: 'Most Saturdays June - October',
    active: true,
    coordinates: {
      lat: 45.5647,
      lng: -122.6587
    }
  },{
    id: 'cafe-eleven',
    name: 'Café Eleven',
    address: '435 NE Rosa Parks, Portland OR 97211',
    image: '/contact-cafe11.png',
    imageAlt: 'Café Eleven location',
    schedule: 'Weekends',
    active: true,
    coordinates: {
      lat: 45.5801,
      lng: -122.6587
    }
  },
];

export let SOCIAL_MEDIA = {
  instagram: {
    url: 'https://www.instagram.com/lazybreadpdx/',
    handle: '@lazybreadpdx',
    active: true
  },
  email: {
    address: 'lazybreadpdx@gmail.com',
    active: true
  }
};

export let VALIDATION_RULES = {
  requireCaptcha: true, // Temporarily disabled for testing
  requirePhoneValidation: false,
  maxCommentLength: 255,
};

export let PAGE_CONTENT = {
  orderPageTitle: "Order Organic Sourdough Focaccia Bread",
  holidayPageTitle: "We're on Holiday!",
  recurringDeliveryMessage: "For weekly or monthly recurring deliveries, please contact us directly at",
  deliveryInstructions: "We deliver on Wednesdays and Fridays. Orders must be placed at least 24 hours in advance.",
  commentsPlaceholder: "Any special requests, delivery instructions, or other details you'd like us to know...",
  commentsHelper: "Optional: Let us know about any special requirements or delivery preferences. (Max 255 characters)",
};

export let ERROR_MESSAGES = {
  breadTypeRequired: "Please select at least one bread type",
  deliveryDateRequired: "Please select a delivery date",
  deliveryDateInvalid: "Please select a valid delivery date (Wednesday or Friday, at least 24 hours in advance)",
  addressRequired: "Address is required",
  zipCodeRequired: "ZIP code is required",
  zipCodeInvalid: "We only deliver to Multnomah County (Portland area)",
  nameRequired: "Name is required",
  emailRequired: "Email is required",
  emailInvalid: "Please enter a valid email address",
  phoneRequired: "Phone number is required",
  phoneInvalid: "Please enter a valid US phone number (e.g., (503) 555-0123 or 503-555-0123)",
  captchaRequired: "Please complete the CAPTCHA verification",
  captchaNotConfigured: "⚠️ CAPTCHA is not configured. Please set up reCAPTCHA keys in your environment variables.",
};

// Helper function to convert day names to numbers
export const getDayNumber = (dayName: string): number => {
  const dayNameToNumber: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return dayNameToNumber[dayName] ?? -1;
};

// Helper function to get current time in PST
export const getCurrentTimeInPST = (): Date => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
};

// Helper function to format current time in PST for debugging
export const getCurrentTimeInPSTString = (): string => {
  const pstTime = getCurrentTimeInPST();
  return pstTime.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
};

// Helper function to get the next available delivery date for a specific day
export const getNextDeliveryDateForDay = (dayName: string): string | null => {
  const dayNumber = getDayNumber(dayName);
  if (dayNumber === -1) return null;
  
  const pstTime = getCurrentTimeInPST();
  
  // Start from tomorrow
  const currentDate = new Date(pstTime);
  currentDate.setDate(currentDate.getDate() + 1);
  
  // Add minimum order time
  const minOrderTime = new Date(pstTime);
  minOrderTime.setHours(minOrderTime.getHours() + BUSINESS_SETTINGS.minOrderAdvanceHours);
  
  // Find the next occurrence of this day
  for (let i = 0; i < 14; i++) { // Look up to 2 weeks ahead
    const date = new Date(currentDate);
    date.setDate(date.getDate() + i);
    
    // Convert the date to PST for day calculation
    const pstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const dayOfWeek = pstDate.getDay();
    
    // Format date as YYYY-MM-DD for comparison
    const dateStr = date.toISOString().split('T')[0];
    
    if (dayOfWeek === dayNumber && date > minOrderTime && !BUSINESS_SETTINGS.excludedDeliveryDates.includes(dateStr)) {
      return dateStr;
    }
  }
  
  return null;
};

export const getAvailableDeliveryDates = (): string[] => {
  
  const allowedDeliveryDays = BUSINESS_SETTINGS.deliveryDays.map(day => getDayNumber(day));
  
  const results: string[] = [];
  // Use PST as the source of truth for time calculations
  const nowPST = getCurrentTimeInPST();
  const deadline = new Date(nowPST.getTime() + BUSINESS_SETTINGS.minOrderAdvanceHours * 60 * 60 * 1000); 

  // Start checking from today's date (PST), move forward day-by-day
  const checkDate = new Date(nowPST);
  checkDate.setHours(0, 0, 0, 0);

  while (results.length < 3) {
    // Convert the current iteration date to PST for accurate weekday calculation
    const pstDate = new Date(checkDate.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const dayOfWeek = pstDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Format candidate date and deadline into YYYY-MM-DD in PST for lexicographic comparison
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    const candidateParts = fmt.formatToParts(pstDate);
    const cYear = candidateParts.find(p => p.type === "year")?.value;
    const cMonth = candidateParts.find(p => p.type === "month")?.value;
    const cDay = candidateParts.find(p => p.type === "day")?.value;
    const candidateStr = `${cYear}-${cMonth}-${cDay}`;

    const deadlineParts = fmt.formatToParts(deadline);
    const dYear = deadlineParts.find(p => p.type === "year")?.value;
    const dMonth = deadlineParts.find(p => p.type === "month")?.value;
    const dDay = deadlineParts.find(p => p.type === "day")?.value;
    const deadlineStr = `${dYear}-${dMonth}-${dDay}`;

    // Only include if it's an allowed delivery day AND its PST calendar day is strictly after the 36h deadline day
    // AND it's not in the excluded dates list
    if (allowedDeliveryDays.includes(dayOfWeek) && candidateStr > deadlineStr && !BUSINESS_SETTINGS.excludedDeliveryDates.includes(candidateStr)) {
      results.push(candidateStr); // e.g. "2025-08-16"
    }

    // Move to next day (from PST baseline)
    checkDate.setDate(checkDate.getDate() + 1);
  }
  return results;
};

export const formatDeliveryDate = (dateString: string): string => {
  // Convert the ISO date string to a PST date
  const pstDate = new Date(dateString + 'T00:00:00-08:00'); // Force PST timezone  
  // Format the date in PST timezone
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Los_Angeles'
  };
  
  return pstDate.toLocaleDateString('en-US', options) + ' (PST)';
};

export const validateUSPhoneNumber = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 10) {
    return true; // 10 digits (area code + number)
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return true; // 11 digits starting with 1 (country code + area code + number)
  }
  
  return false;
};