// App Configuration for Lazy Bread Bakery

export const NAV_ITEMS = [
  { name: "Home", path: "/" },
  { name: "Order", path: "/order" },
  { name: "About", path: "/about" },
  { name: "Find Us", path: "/find-us" },
];

export const BREAD_TYPES = [
  { id: 'classic-salt', name: 'Classic Salt', price: 6.00, description: 'Traditional sourdough with sea salt' },
  { id: 'rosemary', name: 'Rosemary', price: 6.00, description: 'Artisan bread with fresh rosemary' },
  { id: 'green-olive', name: 'Green Olive', price: 6.00, description: 'Rustic bread with green olives' },
  { id: 'cheez-it', name: 'Cheez-it', price: 6.00, description: 'Cheesy bread with a crispy crust' },
];

export const BUSINESS_SETTINGS = {
  // Holiday mode settings
  isHolidayMode: true, // Set to true to disable ordering
  holidayMessage: "🏖️ We're on Holiday! Taking a well-deserved break.",
  returnDate: "September, 2025",
  
  // Contact information
  email: "lazybreadpdx@gmail.com",
  phone: "+1 (206) 272-0418",
  instagram: "https://www.instagram.com/lazybreadpdx/",
  
  // Recurring orders
  recurringOrdersEmail: "lazybreadpdx@gmail.com",
  
  // Business hours and delivery
  deliveryDays: ["Wednesday", "Friday", "Sunday"],
  minOrderAdvanceHours: 24,
  maxOrderQuantity: 5,
};

export const DELIVERY_ZONES = {
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

export const FIND_US_LOCATIONS = [
  {
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
  {
    id: 'woodlawn-farmers-market',
    name: 'Woodlawn Farmers Market',
    address: 'Woodlawn Triangle, Portland OR',
    image: '/contact-market.png',
    imageAlt: 'Woodlawn Farmers Market',
    schedule: 'Every other Saturday',
    active: true,
    coordinates: {
      lat: 45.5647,
      lng: -122.6587
    }
  },{
    id: 'pop-up-shop',
    name: 'Pop-Up Shop',
    address: '55 NE Holman St, Portland OR',
    image: '/home.png',
    imageAlt: 'Pop-up Shop',
    schedule: 'Weekends',
    active: true,
    coordinates: {
      lat: 45.5647,
      lng: -122.6587
    }
  }
];

export const SOCIAL_MEDIA = {
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

export const VALIDATION_RULES = {
  requireCaptcha: true, // Temporarily disabled for testing
  requirePhoneValidation: false,
  maxCommentLength: 255,
};

export const PAGE_CONTENT = {
  orderPageTitle: "Order Organic Sourdough Focaccia Bread",
  holidayPageTitle: "We're on Holiday!",
  recurringDeliveryMessage: "For weekly or monthly recurring deliveries, please contact us directly at",
  deliveryInstructions: "We deliver on Wednesdays and Fridays. Orders must be placed at least 24 hours in advance.",
  commentsPlaceholder: "Any special requests, delivery instructions, or other details you'd like us to know...",
  commentsHelper: "Optional: Let us know about any special requirements or delivery preferences. (Max 255 characters)",
};

export const ERROR_MESSAGES = {
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

// Helper functions
export const getAvailableDeliveryDates = (): string[] => {
  const dates: string[] = [];
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  // Start from tomorrow
  const currentDate = new Date(pacificTime);
  currentDate.setDate(currentDate.getDate() + 1);
  
  // Add minimum order time
  const minOrderTime = new Date(pacificTime);
  minOrderTime.setHours(minOrderTime.getHours() + BUSINESS_SETTINGS.minOrderAdvanceHours);
  
  // Generate dates for the next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + i);
    
    // Only include Wednesday (3) and Friday (5)
    if (date.getDay() === 3 || date.getDay() === 5) {
      // Check if this date is at least minimum order time in the future
      if (date > minOrderTime) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
  }
  
  return dates;
};

export const formatDeliveryDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
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