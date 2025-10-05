// Tax filing constants

export const CURRENT_TAX_YEAR = 2024;

export const SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'it'];

export const SWISS_CANTONS = [
  { code: 'AG', name: 'Aargau' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'BE', name: 'Bern' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'FR', name: 'Fribourg' },
  { code: 'GE', name: 'Geneva' },
  { code: 'GL', name: 'Glarus' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'JU', name: 'Jura' },
  { code: 'LU', name: 'Lucerne' },
  { code: 'NE', name: 'Neuchâtel' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Ticino' },
  { code: 'UR', name: 'Uri' },
  { code: 'VD', name: 'Vaud' },
  { code: 'VS', name: 'Valais' },
  { code: 'ZG', name: 'Zug' },
  { code: 'ZH', name: 'Zürich' }
];

export const FILING_STATUS = {
  SINGLE: 'single',
  MARRIED: 'married',
  MARRIED_SEPARATELY: 'married_separately',
  WIDOWED: 'widowed',
  DIVORCED: 'divorced'
};

export const DOCUMENT_TYPES = {
  LOHNAUSWEIS: 'lohnausweis',
  PILLAR_3A: 'pillar_3a',
  BANK_STATEMENT: 'bank_statement',
  INSURANCE_PREMIUM: 'insurance_premium',
  INVESTMENT_INCOME: 'investment_income',
  PROPERTY_DOCUMENT: 'property_document',
  OTHER: 'other'
};

export const VALID_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

export const MAX_FILE_SIZE_MB = 10;

export const AUTO_SAVE_INTERVAL_MS = 30000; // 30 seconds

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 0,
    currency: 'CHF',
    features: [
      'Basic tax calculation',
      'Q&A interview',
      'Limited document upload',
      'No e-filing',
      'No support'
    ]
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    price: 39,
    currency: 'CHF',
    features: [
      'All Basic features',
      'Unlimited document uploads',
      'OCR scanning',
      'E-filing support',
      'Email support'
    ]
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 99,
    currency: 'CHF',
    features: [
      'All Standard features',
      'Expert tax review',
      'Phone support',
      'Priority processing',
      'Tax optimization tips'
    ]
  }
};

export const DOCUMENT_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  ERROR: 'error'
};

export const FILING_WORKFLOW_STEPS = [
  { id: 'interview', name: 'Interview', path: '/tax-filing/interview' },
  { id: 'documents', name: 'Documents', path: '/tax-filing/documents' },
  { id: 'review', name: 'Review', path: '/tax-filing/review' },
  { id: 'payment', name: 'Payment', path: '/tax-filing/payment' },
  { id: 'submit', name: 'Submit', path: '/tax-filing/submit' }
];

export const TAX_DEADLINES = {
  2024: '2025-04-30',
  2025: '2026-04-30'
};
