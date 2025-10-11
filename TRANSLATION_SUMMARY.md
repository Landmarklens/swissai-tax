# Translation Summary - SwissAI Tax Application

## Overview
Complete manual translation of static data files from English to German (de), French (fr), and Italian (it) for the Swiss tax/real estate application.

## Files Created

### English (en)
- `/src/locales/en/plans.json` - 191 lines
- `/src/locales/en/questions.json` - 192 lines  
- `/src/locales/en/faq.json` - 134 lines

### German (de)
- `/src/locales/de/plans.json` - 191 lines
- `/src/locales/de/questions.json` - 192 lines
- `/src/locales/de/faq.json` - 134 lines

### French (fr)
- `/src/locales/fr/plans.json` - 191 lines
- `/src/locales/fr/questions.json` - 192 lines
- `/src/locales/fr/faq.json` - 134 lines

### Italian (it)
- `/src/locales/it/plans.json` - 191 lines
- `/src/locales/it/questions.json` - 192 lines
- `/src/locales/it/faq.json` - 134 lines

## Content Translated

### 1. plans.json (191 lines each)
**Pricing Plans & Features:**
- 2 main plans (Free & Advanced Search/Comprehensive)
- Plan titles, prices, descriptions, button text
- Detailed feature lists with titles and descriptions (5-6 features per plan)
- Advantage points (3 per plan)
- Short plan versions with condensed features
- Upgrade plan details with 6 key features
- Pro plan with promotional pricing
- 5 plan difference categories
- 9 cancellation/subscription reasons

**Key Sections:**
- `plans.free` - Free tier with basic property matching
- `plans.comprehensive` - CHF 99.99 advanced search tier
- `shortPlans` - Condensed plan versions
- `upgradePlan` - Upgrade features (CHF 99.99)
- `proPlan` - Pro tier (CHF 79.99 promotional price)
- `differences` - Plan comparison points
- `cancelSubscriptionReasons` - User cancellation options

### 2. questions.json (192 lines each)
**Interview Flow Structure:**
- 11 stepper labels for multi-step process
- 5 main question categories/steps
- 18 total interview questions organized by category

**Step Categories:**
1. **General Preferences / Location Preferences** (5 questions)
   - City/neighborhood selection
   - Workplace/school proximity
   - Public transport access
   - Neighborhood safety (scale 1-5)
   - Nearby amenities

2. **Type of Property / Budget and Financial Considerations** (3 questions)
   - Monthly budget (rent/mortgage)
   - Down payment amount
   - Other financial considerations

3. **Space and Layout / Apartment Features and Amenities** (4 questions)
   - Apartment type (studio, 1-bed, 2-bed)
   - Amenity preferences (pool, gym, parking)
   - Minimum bedroom count
   - Specific features (balcony, fireplace)

4. **Lifestyle and Amenities / Personal Preferences** (3 questions)
   - Quiet vs lively neighborhood
   - Pet ownership
   - Proximity to hobbies/activities

5. **Personal and Family / Move-in Readiness and Timing** (3 questions)
   - Move-in date
   - Move-in ready vs open to renovations
   - Current lease coordination

**Question Types:**
- Text input
- Number input
- Boolean (yes/no)
- Date picker
- Scale (1-5 rating)

### 3. faq.json (134 lines each)
**6 FAQ Categories with 25 Total Questions:**

1. **Getting Started** (4 questions)
   - What is SwissAI Tax?
   - Who can use SwissAI Tax?
   - Which cantons are supported? (all 26 listed)
   - What languages are available?

2. **Tax Filing Process** (5 questions)
   - How AI interview works (Q01-Q14 questionnaire)
   - Required documents (Lohnausweis, insurance, receipts)
   - Document upload process (OCR with AWS Textract)
   - Tax calculation accuracy (federal, cantonal, municipal)
   - Progress saving functionality

3. **Deductions & Savings** (4 questions)
   - Automatic deduction finder (work, insurance, donations, childcare)
   - Common deductions (AHV, IV, ALV, KTG, pillar 3a, etc.)
   - Home office expense deductions
   - Tax refund maximization strategies

4. **Security & Privacy** (4 questions)
   - Data security measures (HTTPS, encryption, AWS S3)
   - Data storage location (Swiss servers, AWS Frankfurt)
   - Data deletion rights (GDPR compliance)
   - Data sharing policy (never automatic, user controlled)

5. **Technical Support** (4 questions)
   - Error handling and support channels
   - Mobile device compatibility
   - Supported browsers (Chrome, Firefox, Safari, Edge)
   - Complex tax situation assistance

6. **Pricing & Payment** (4 questions)
   - Pricing tiers (free and CHF 49+ premium)
   - Try before buy option
   - Payment methods (Visa, Mastercard, Amex, Twint, bank transfer)
   - 30-day refund policy

## Translation Quality Standards Applied

### Swiss Context Adaptations
- **Cantons**: All 26 Swiss cantons named correctly in each language
- **Insurance Terms**: Swiss-specific (AHV/AVS, IV/AI, ALV/AC, KTG/IPG)
- **Tax Terms**: Federal/cantonal/municipal tax structure
- **Financial Terms**: Pillar 3a, Lohnausweis (salary certificate)
- **Swiss Places**: Zürich, Genève/Genf/Ginevra variations

### Terminology Consistency
- **German**: Formal "Sie" form, Swiss German spelling (ß → ss)
- **French**: Formal "vous" form, Swiss French terminology
- **Italian**: Formal "Lei" form, Swiss Italian conventions
- **Real Estate**: Proper property/rental terminology
- **Financial**: Banking and tax-specific vocabulary

### Tone & Style
- **Formal professional tone** throughout
- **Clear explanatory answers** in FAQs
- **Action-oriented** button text and calls-to-action
- **User-friendly** question phrasing
- **Technical accuracy** for tax/real estate terms

## Source Files Analyzed
1. `src/db.js` - Static database with plans, questions, stepper labels
2. `src/faqData.js` - Complete FAQ system with 6 categories

## Statistics
- **Total Languages**: 4 (English, German, French, Italian)
- **Total Files Created**: 12 (3 files × 4 languages)
- **Total Lines**: 2,068 lines across all files
- **Plans Content**: ~191 lines per language
- **Questions Content**: ~192 lines per language  
- **FAQ Content**: ~134 lines per language
- **Total Questions**: 18 interview questions + 25 FAQ items
- **Plan Features**: 11 detailed features across tiers
- **Cancellation Reasons**: 9 options

## Usage in Application
These translation files should be imported into the i18n system to replace hardcoded strings in:
- Pricing/plan selection pages
- Multi-step interview wizard
- FAQ section/help center
- Account management/cancellation flows

## Next Steps (Recommendations)
1. Update `src/db.js` to use i18n keys instead of hardcoded strings
2. Update `src/faqData.js` to use i18n keys instead of hardcoded strings  
3. Configure i18n to load these JSON files per locale
4. Add language switcher UI component
5. Test all 4 languages in application flows
6. Consider adding Italian canton names (Ticino-specific terms)

## Notes
- All prices kept in CHF (Swiss Francs)
- URLs and technical terms (AWS, OCR, HTTPS) kept in English
- Email addresses and proper nouns preserved
- Question IDs and technical keys unchanged
- JSON structure identical across all languages for easy i18n integration
