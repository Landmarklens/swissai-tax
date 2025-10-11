# Translation Files Index

## Directory Structure
```
src/locales/
├── en/
│   ├── plans.json      (191 lines) - Pricing plans, features, cancellation reasons
│   ├── questions.json  (192 lines) - Interview questions and stepper labels
│   └── faq.json        (134 lines) - FAQ with 6 categories, 25 questions
├── de/
│   ├── plans.json      (191 lines) - German translations
│   ├── questions.json  (192 lines) - German translations
│   └── faq.json        (134 lines) - German translations
├── fr/
│   ├── plans.json      (191 lines) - French translations
│   ├── questions.json  (192 lines) - French translations
│   └── faq.json        (134 lines) - French translations
└── it/
    ├── plans.json      (191 lines) - Italian translations
    ├── questions.json  (192 lines) - Italian translations
    └── faq.json        (134 lines) - Italian translations
```

## File Paths (Absolute)

### English (en)
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/en/plans.json`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/en/questions.json`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/en/faq.json`

### German (de)
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/de/plans.json`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/de/questions.json`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/de/faq.json`

### French (fr)
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/fr/plans.json`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/fr/questions.json`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/fr/faq.json`

### Italian (it)
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/it/plans.json`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/it/questions.json`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/locales/it/faq.json`

## JSON Structure Overview

### plans.json Structure
```json
{
  "plans": {
    "free": { "title", "price", "description", "buttonText", "features", "advantages" },
    "comprehensive": { "title", "price", "description", "buttonText", "features", "advantages" }
  },
  "shortPlans": {
    "free": { "title", "price", "description", "buttonText", "features" },
    "comprehensive": { "title", "price", "description", "buttonText", "features" }
  },
  "upgradePlan": { "name", "price", "keyFeatures" },
  "proPlan": { "name", "price", "originalPrice", "keyFeatures" },
  "differences": [{ "title", "description" }],
  "cancelSubscriptionReasons": ["reason1", "reason2", ...]
}
```

### questions.json Structure
```json
{
  "stepper": [
    { "id", "label" }
  ],
  "questions": {
    "steps": [
      {
        "id",
        "label",
        "questions": [
          { "id", "question", "type", "required", "scaleMin?", "scaleMax?" }
        ]
      }
    ]
  }
}
```

### faq.json Structure
```json
{
  "faq": [
    {
      "category": "Category Name",
      "questions": [
        { "question": "Q?", "answer": "A." }
      ]
    }
  ]
}
```

## Content Breakdown by File

### plans.json (191 lines each)
**Contains:**
- 2 full pricing plans (Free, Advanced Search/Comprehensive)
- 2 short plan versions
- Upgrade plan details
- Pro plan with promotional pricing
- 5 plan difference points
- 9 cancellation reasons
- Feature descriptions (5-6 per plan)
- Advantage points (3 per full plan)

**Sections:**
- `plans.free` - Free tier features
- `plans.comprehensive` - CHF 99.99 premium tier
- `shortPlans` - Condensed versions for quick display
- `upgradePlan` - Upgrade path from free
- `proPlan` - Promotional pricing tier
- `differences` - Plan comparison highlights
- `cancelSubscriptionReasons` - User feedback options

### questions.json (192 lines each)
**Contains:**
- 11 stepper labels for multi-step wizard
- 5 question steps/categories
- 18 total interview questions

**Steps:**
1. Location Preferences (5 questions)
2. Budget and Financial Considerations (3 questions)
3. Apartment Features and Amenities (4 questions)
4. Lifestyle and Personal Preferences (3 questions)
5. Move-in Readiness and Timing (3 questions)

**Question Types:**
- text (open-ended)
- number (numeric input)
- boolean (yes/no)
- date (date picker)
- scale (1-5 rating)

### faq.json (134 lines each)
**Contains:**
- 6 FAQ categories
- 25 total question-answer pairs

**Categories:**
1. Getting Started (4 Q&A)
2. Tax Filing Process (5 Q&A)
3. Deductions & Savings (4 Q&A)
4. Security & Privacy (4 Q&A)
5. Technical Support (4 Q&A)
6. Pricing & Payment (4 Q&A)

## Validation Status
All 12 JSON files validated successfully:
- ✓ Valid JSON syntax
- ✓ Consistent structure across languages
- ✓ No encoding issues
- ✓ All special characters properly escaped

## Total Statistics
- **Languages**: 4 (English, German, French, Italian)
- **Files**: 12 (3 per language)
- **Total Lines**: 2,068
- **Plans Features**: 11 detailed features
- **Interview Questions**: 18 questions
- **FAQ Items**: 25 question-answer pairs
- **Cancellation Reasons**: 9 options
- **Stepper Steps**: 11 steps

## Source Data Origins
Original English content extracted from:
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/db.js`
- `/Users/lauraluciaroth/Desktop/HomeAi/swissai-tax/src/faqData.js`

## Related Documentation
- `TRANSLATION_SUMMARY.md` - Comprehensive overview with statistics
- `TRANSLATION_SAMPLES.md` - Key term translations and glossary
