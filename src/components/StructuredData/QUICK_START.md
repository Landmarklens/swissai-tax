# Quick Start Guide - Structured Data Schemas

## 30-Second Setup

### 1. Import what you need:
```jsx
import {
  OrganizationSchema,
  LocalBusinessSchema,
  HowToSchema,
  ServiceSchema,
  ArticleSchema,
  OfferSchema,
  FAQSchema
} from '@/components/StructuredData';
```

### 2. Drop them in your page:
```jsx
function MyPage() {
  return (
    <>
      <OrganizationSchema />
      <LocalBusinessSchema />
      {/* Your page content */}
    </>
  );
}
```

### 3. Test it:
Open your page and run in browser console:
```javascript
document.querySelectorAll('script[type="application/ld+json"]').forEach((s, i) =>
  console.log(`Schema ${i+1}:`, JSON.parse(s.textContent))
);
```

---

## Most Common Uses

### Homepage
```jsx
<OrganizationSchema />
<LocalBusinessSchema />
<HowToSchema />
<FAQSchema />
```

### Pricing Page
```jsx
<OfferSchema name="Basic" price="0" description="..." features={[...]} />
<OfferSchema name="Premium" price="99" description="..." features={[...]} />
```

### Blog Post
```jsx
<ArticleSchema
  title={post.title}
  description={post.excerpt}
  image={post.image}
  datePublished={post.date}
  author={post.author}
/>
```

### Services Page
```jsx
<ServiceSchema serviceType="Tax Preparation" />
<ServiceSchema serviceType="Tax Filing" />
<ServiceSchema serviceType="Tax Consultation" />
```

---

## Props Cheat Sheet

### ArticleSchema (all required except author, url, category)
```jsx
<ArticleSchema
  title="string"
  description="string"
  image="https://..."
  datePublished="2024-01-15T09:00:00+01:00"
  dateModified="2024-02-10T14:30:00+01:00"  // optional
  author="Author Name"                       // optional
  url="https://..."                          // optional
  category="Tax Tips"                        // optional
/>
```

### OfferSchema (name, price, description required)
```jsx
<OfferSchema
  name="Plan Name"
  price="99"                            // or "0" or "Free"
  currency="CHF"                        // optional, default CHF
  description="What's included"
  features={["Feature 1", "Feature 2"]} // optional
  pricingPeriod="YEAR"                  // optional: MONTH, YEAR, ONE_TIME
  url="https://..."                     // optional
/>
```

### ServiceSchema (all optional)
```jsx
<ServiceSchema
  serviceType="Tax Preparation"  // or "Tax Filing" or "Tax Consultation"
  description="Custom description"
/>
```

### No Props Needed
```jsx
<OrganizationSchema />
<LocalBusinessSchema />
<HowToSchema />
<FAQSchema />  // or pass custom faqs array
```

---

## Rules of Thumb

1. **One per page** - Don't duplicate the same schema type
2. **Exception: Offers** - Multiple `OfferSchema` on pricing page is fine
3. **Exception: Services** - Multiple `ServiceSchema` on services page is fine
4. **Root layout** - Put `OrganizationSchema` and `WebSiteSchema` in root
5. **Page specific** - Put page-specific schemas in those pages
6. **Always absolute URLs** - Never use relative paths like "/pricing"

---

## Validation

### Quick Test
```bash
# Paste your page URL here
https://search.google.com/test/rich-results
```

### During Development
```javascript
// In browser console
document.querySelectorAll('script[type="application/ld+json"]')
  .forEach((s, i) => console.log(`Schema ${i+1}:`, JSON.parse(s.textContent)));
```

---

## Common Mistakes

### ❌ Don't Do This
```jsx
// Relative URL
<ArticleSchema url="/blog/post" />

// Missing required props
<ArticleSchema title="Only title" />

// Duplicate schemas
<OrganizationSchema />  // in layout
<OrganizationSchema />  // in page - DUPLICATE!

// Wrong date format
<ArticleSchema datePublished="01/15/2024" />
```

### ✅ Do This
```jsx
// Absolute URL
<ArticleSchema url="https://swissai.tax/blog/post" />

// All required props
<ArticleSchema
  title="..."
  description="..."
  image="https://..."
  datePublished="2024-01-15T09:00:00+01:00"
/>

// Only in layout OR page, not both
<OrganizationSchema />  // just once

// ISO 8601 date format
<ArticleSchema datePublished="2024-01-15T09:00:00+01:00" />
```

---

## Need More Help?

- **Full docs:** `src/components/StructuredData/README.md`
- **Examples:** `src/components/StructuredData/EXAMPLES.md`
- **Validation:** `src/components/StructuredData/VALIDATION.md`
- **Summary:** `/STRUCTURED_DATA_SUMMARY.md`

---

## Company Info (for reference)

```javascript
{
  legalName: "LandMarK Lens GMBH",
  brandName: "SwissAI Tax",
  email: "contact@swissai.tax",
  address: "Sandbuckstrasse 24, Schneisingen 5425, Switzerland",
  url: "https://swissai.tax",
  languages: ["de", "fr", "it", "en"]
}
```

---

That's it! You're ready to add structured data to your pages.
