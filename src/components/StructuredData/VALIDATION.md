# Structured Data Validation Guide

## Why Validate?

Proper structured data validation ensures:
- Search engines can properly parse your data
- Rich snippets appear correctly in search results
- No errors that could harm SEO performance
- Compliance with Schema.org specifications

---

## Validation Tools

### 1. Google Rich Results Test
**URL:** https://search.google.com/test/rich-results

**Best for:**
- Testing how Google will interpret your data
- Seeing preview of rich snippets
- Finding Google-specific issues

**How to use:**
1. Enter your page URL or paste HTML
2. Click "Test URL" or "Test Code"
3. Review results and warnings
4. Fix any errors found

---

### 2. Schema Markup Validator
**URL:** https://validator.schema.org/

**Best for:**
- Validating against official Schema.org standards
- Detailed error messages
- Testing multiple schema types

**How to use:**
1. Select input method (URL, Code Snippet, or File)
2. Enter your page URL or paste JSON-LD
3. Review validation results
4. Check for warnings and recommendations

---

### 3. Browser DevTools

**How to inspect:**
```javascript
// Open browser console and run:
const scripts = document.querySelectorAll('script[type="application/ld+json"]');
scripts.forEach((script, index) => {
  console.log(`Schema ${index + 1}:`, JSON.parse(script.textContent));
});
```

This will show all structured data on the page in a readable format.

---

## Common Validation Errors & Fixes

### Error: "Missing required field"

**Problem:** A required property is not present

**Fix:**
```jsx
// Bad
<ArticleSchema
  title="My Article"
  // Missing description, image, datePublished
/>

// Good
<ArticleSchema
  title="My Article"
  description="A complete description"
  image="https://swissai.tax/image.jpg"
  datePublished="2024-01-15T09:00:00+01:00"
/>
```

---

### Error: "Invalid date format"

**Problem:** Date is not in ISO 8601 format

**Fix:**
```jsx
// Bad
datePublished="15/01/2024"

// Good
datePublished="2024-01-15T09:00:00+01:00"

// JavaScript example
const isoDate = new Date().toISOString();
// "2024-01-15T09:00:00.000Z"
```

---

### Error: "Invalid URL"

**Problem:** URL is malformed or relative

**Fix:**
```jsx
// Bad
url="/pricing"

// Good
url="https://swissai.tax/pricing"
```

---

### Error: "Duplicate structured data"

**Problem:** Same schema appears multiple times

**Fix:**
```jsx
// Bad - in layout AND page
// Layout.jsx
<OrganizationSchema />

// Page.jsx
<OrganizationSchema /> // DUPLICATE!

// Good - only in layout
// Layout.jsx
<OrganizationSchema />

// Page.jsx
// No duplicate OrganizationSchema
```

---

## Validation Checklist

Use this checklist before deploying:

### Organization Schema
- [ ] Legal name is correct: "LandMarK Lens GMBH"
- [ ] Brand name is correct: "SwissAI Tax"
- [ ] Email is correct: contact@swissai.tax
- [ ] Address matches exactly
- [ ] URL is absolute: https://swissai.tax
- [ ] Logo URL is absolute
- [ ] Description is about tax filing (not property search)

### LocalBusiness Schema
- [ ] @type is "ProfessionalService"
- [ ] All 26 Swiss cantons are listed
- [ ] All 4 languages are listed (de, fr, it, en)
- [ ] Price range is "$$"
- [ ] Geo-coordinates are present
- [ ] Opening hours are correct

### Article Schema
- [ ] Title is provided
- [ ] Description is provided
- [ ] Image URL is absolute
- [ ] datePublished is ISO 8601 format
- [ ] Publisher info is complete
- [ ] Author name is provided

### Service Schema
- [ ] Service type is one of: "Tax Preparation", "Tax Filing", "Tax Consultation"
- [ ] Provider links to organization
- [ ] Area served is Switzerland
- [ ] Available languages are listed

### HowTo Schema
- [ ] All 5 steps are present
- [ ] Total time is "PT20M" (ISO 8601 duration)
- [ ] Cost range is specified
- [ ] Step URLs are absolute
- [ ] Image URLs are absolute (when replaced)

### Offer Schema
- [ ] Name is provided
- [ ] Price is formatted correctly
- [ ] Currency is "CHF"
- [ ] Description is clear
- [ ] Features are listed (if provided)
- [ ] Pricing period is valid ("MONTH", "YEAR", or "ONE_TIME")
- [ ] URL is absolute

---

## Testing Workflow

### Development Phase
1. Implement schema component
2. Test in browser DevTools (see JSON output)
3. Validate with Schema Markup Validator
4. Fix any errors

### Staging Phase
1. Deploy to staging environment
2. Test with Google Rich Results Test
3. Check all pages with schemas
4. Verify no duplicates

### Production Phase
1. Deploy to production
2. Re-validate with both tools
3. Monitor Google Search Console for errors
4. Check for rich snippet appearance

---

## Monitoring

### Google Search Console

1. Go to **Enhancement** section
2. Check for:
   - Organization
   - Local Business
   - Article
   - FAQ
   - How-to
   - Offers

3. Look for:
   - Valid items
   - Items with warnings
   - Items with errors

4. Fix errors immediately

### Regular Checks (Monthly)

- [ ] Validate all pages with structured data
- [ ] Check Google Search Console for new errors
- [ ] Verify rich snippets still appear in search
- [ ] Update any changed business information
- [ ] Test new pages with schemas

---

## Debug Mode

Create a debug component to help during development:

```jsx
// StructuredDataDebug.jsx
import React, { useEffect } from 'react';

const StructuredDataDebug = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      console.group('🔍 Structured Data Debug');
      scripts.forEach((script, index) => {
        try {
          const data = JSON.parse(script.textContent);
          console.log(`Schema ${index + 1} (@type: ${data['@type']}):`, data);
        } catch (e) {
          console.error(`Error parsing schema ${index + 1}:`, e);
        }
      });
      console.groupEnd();
    }
  }, []);

  return null;
};

export default StructuredDataDebug;
```

Use it in your app:

```jsx
// App.jsx
import StructuredDataDebug from '@/components/StructuredData/StructuredDataDebug';

function App() {
  return (
    <>
      {process.env.NODE_ENV === 'development' && <StructuredDataDebug />}
      {/* Rest of your app */}
    </>
  );
}
```

---

## Quick Reference: Valid Values

### Currency Codes (ISO 4217)
- CHF (Swiss Franc)
- EUR (Euro)
- USD (US Dollar)

### Language Codes (ISO 639-1)
- de (German)
- fr (French)
- it (Italian)
- en (English)

### Country Codes (ISO 3166-1)
- CH (Switzerland)

### Date Format (ISO 8601)
```
YYYY-MM-DDTHH:mm:ss+TZ
2024-01-15T09:00:00+01:00
```

### Duration Format (ISO 8601)
```
PT20M = 20 minutes
PT2H = 2 hours
P1D = 1 day
P1M = 1 month (use P30D for 30 days)
```

---

## Troubleshooting

### Schema not appearing in tests?

**Check:**
1. Is the component rendering? (Check React DevTools)
2. Is it inside a `<Helmet>` component?
3. Is `HelmetProvider` wrapping your app?
4. Are there any JavaScript errors?

### Warnings about recommendations?

**These are usually optional but good to add:**
- Adding images to improve rich snippets
- Adding more detailed descriptions
- Including additional properties

### Rich snippets not showing in Google?

**Remember:**
- It can take weeks for Google to process
- Not all pages will get rich snippets
- Google chooses whether to show them
- Valid markup doesn't guarantee rich snippets
- Monitor Search Console for indexing status

---

## Resources

- [Schema.org Full Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
- [JSON-LD Playground](https://json-ld.org/playground/)
