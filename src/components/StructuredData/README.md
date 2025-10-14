# Structured Data Components

This directory contains Schema.org structured data components for SwissAI Tax to improve SEO and search engine understanding of our content and services.

## Overview

All components use `react-helmet-async` to inject JSON-LD structured data into the page `<head>`. This helps search engines like Google understand your content and can result in rich snippets in search results.

## Company Information

- **Legal Name:** LandMarK Lens GMBH
- **Brand Name:** SwissAI Tax
- **Email:** contact@swissai.tax
- **Address:** Sandbuckstrasse 24, Schneisingen 5425, Switzerland
- **Website:** https://swissai.tax
- **Languages:** German (de), French (fr), Italian (it), English (en)

## Available Components

### 1. OrganizationSchema.jsx

**Purpose:** Main organization structured data for the entire site.

**Usage:**
```jsx
import { OrganizationSchema } from '@/components/StructuredData';

<OrganizationSchema />
```

**Appears on:** All pages (typically in root layout)

**Features:**
- Legal company information
- Contact details
- Address
- Aggregate ratings
- TODO: Social media links (marked for future addition)

---

### 2. LocalBusinessSchema.jsx

**Purpose:** Local business information as a Professional Service.

**Usage:**
```jsx
import { LocalBusinessSchema } from '@/components/StructuredData';

<LocalBusinessSchema />
```

**Appears on:** Homepage, About page, Contact page

**Features:**
- Professional service classification
- Full address with geo-coordinates
- Service area (all Swiss cantons)
- Available languages
- Opening hours
- Price range ($$)
- Contact information

---

### 3. ArticleSchema.jsx

**Purpose:** Blog posts and article structured data.

**Usage:**
```jsx
import { ArticleSchema } from '@/components/StructuredData';

<ArticleSchema
  title="How to File Swiss Taxes Online"
  description="A comprehensive guide to filing your Swiss taxes online..."
  image="https://swissai.tax/blog/tax-filing-guide.jpg"
  datePublished="2024-01-15T09:00:00+01:00"
  dateModified="2024-02-10T14:30:00+01:00"
  author="Jane Smith"
  url="https://swissai.tax/blog/how-to-file-swiss-taxes"
/>
```

**Appears on:** Blog posts, articles, guides

**Props:**
- `title` (required): Article headline
- `description` (required): Brief description or excerpt
- `image` (required): Main article image URL
- `datePublished` (required): ISO 8601 publication date
- `dateModified` (optional): ISO 8601 modification date
- `author` (optional): Author name (defaults to "SwissAI Tax Team")
- `url` (optional): Canonical URL

**Features:**
- Publisher information included
- Author attribution
- Image metadata
- Publication dates

---

### 4. ServiceSchema.jsx

**Purpose:** Structured data for specific services offered.

**Usage:**
```jsx
import { ServiceSchema } from '@/components/StructuredData';

// Default (Tax Preparation)
<ServiceSchema />

// Specific service type
<ServiceSchema
  serviceType="Tax Consultation"
  description="Expert tax consultation for complex cases..."
/>
```

**Appears on:** Services page, individual service pages

**Props:**
- `serviceType` (optional): One of "Tax Preparation", "Tax Filing", "Tax Consultation" (default: "Tax Preparation")
- `description` (optional): Custom description (has defaults for each type)

**Features:**
- Links to organization schema
- Area served (Switzerland)
- Available languages
- Service channel information
- Offer details

---

### 5. HowToSchema.jsx

**Purpose:** Step-by-step guide for filing taxes with SwissAI Tax.

**Usage:**
```jsx
import { HowToSchema } from '@/components/StructuredData';

<HowToSchema />
```

**Appears on:** Homepage, How It Works page, Getting Started guide

**Features:**
- 5-step tax filing process
- Estimated time: 20 minutes
- Cost range: CHF 0-199
- Required supplies and tools
- Images for each step
- Difficulty level and success rate

**Steps included:**
1. Create Your Account
2. Answer Simple Questions
3. Upload Your Documents
4. Review and Optimize
5. Submit Your Tax Return

---

### 6. OfferSchema.jsx

**Purpose:** Pricing plans and subscription offers.

**Usage:**
```jsx
import { OfferSchema } from '@/components/StructuredData';

// Basic plan
<OfferSchema
  name="Basic Plan"
  price="0"
  currency="CHF"
  description="Free tax filing for simple returns"
  features={[
    "AI-powered filing",
    "Basic support",
    "Federal and cantonal taxes"
  ]}
  pricingPeriod="YEAR"
  url="https://swissai.tax/pricing/basic"
/>

// Premium plan
<OfferSchema
  name="Premium Plan"
  price="99"
  currency="CHF"
  description="Complete tax filing with expert support"
  features={[
    "AI-powered filing",
    "Expert review",
    "Priority support",
    "Audit protection"
  ]}
  pricingPeriod="YEAR"
  url="https://swissai.tax/pricing/premium"
/>
```

**Appears on:** Pricing page

**Props:**
- `name` (required): Plan name
- `price` (required): Price (number or string, use "0" or "Free" for free plans)
- `currency` (optional): Currency code (default: "CHF")
- `description` (required): Plan description
- `features` (optional): Array of feature strings
- `pricingPeriod` (optional): "MONTH", "YEAR", or "ONE_TIME" (default: "MONTH")
- `url` (optional): Link to pricing/checkout page
- `availability` (optional): "InStock", "OutOfStock", etc. (default: "InStock")

**Features:**
- Seller information included
- Billing period specification
- Feature listing
- Service details

---

### 7. WebSiteSchema.jsx

**Purpose:** Website-level structured data (existing component).

**Usage:**
```jsx
import { WebSiteSchema } from '@/components/StructuredData';

<WebSiteSchema />
```

**Appears on:** All pages (root layout)

---

### 8. BreadcrumbSchema.jsx

**Purpose:** Breadcrumb navigation structured data (existing component).

**Usage:**
```jsx
import { BreadcrumbSchema } from '@/components/StructuredData';

<BreadcrumbSchema items={breadcrumbItems} />
```

**Appears on:** Pages with breadcrumb navigation

---

### 9. FAQSchema.jsx

**Purpose:** FAQ page structured data (existing component, updated for SwissAI Tax).

**Usage:**
```jsx
import { FAQSchema } from '@/components/StructuredData';

// Use defaults
<FAQSchema />

// Custom FAQs
<FAQSchema faqs={customFAQs} />
```

**Appears on:** FAQ page, Help page

---

## Implementation Guide

### Basic Setup

1. **Import in your page/component:**
```jsx
import { OrganizationSchema, LocalBusinessSchema } from '@/components/StructuredData';
```

2. **Add to your component:**
```jsx
function HomePage() {
  return (
    <>
      <OrganizationSchema />
      <LocalBusinessSchema />
      <HowToSchema />

      {/* Your page content */}
    </>
  );
}
```

### Recommended Implementation by Page Type

#### Homepage
- `OrganizationSchema`
- `LocalBusinessSchema`
- `HowToSchema`
- `FAQSchema`

#### Pricing Page
- Multiple `OfferSchema` components (one per plan)
- `ServiceSchema`

#### Blog Post
- `ArticleSchema` (with specific post data)
- `BreadcrumbSchema`

#### Services Page
- `ServiceSchema` (for each service type)
- `LocalBusinessSchema`

#### About/Contact Page
- `LocalBusinessSchema`
- `OrganizationSchema`

### Testing

Use Google's Rich Results Test to validate your structured data:
https://search.google.com/test/rich-results

Or use the Schema Markup Validator:
https://validator.schema.org/

## Best Practices

1. **Don't duplicate:** Only include each schema type once per page
2. **Be accurate:** Ensure all information matches what's visible on the page
3. **Keep updated:** Update schemas when business information changes
4. **Test regularly:** Use validation tools after changes
5. **Monitor performance:** Check Google Search Console for rich result status

## TODO

- [ ] Add actual social media links to OrganizationSchema once available
- [ ] Replace placeholder images with actual images
- [ ] Update aggregate ratings when real review data is available
- [ ] Add more specific canton-level data if needed
- [ ] Consider adding VideoSchema for tutorial videos
- [ ] Consider adding ReviewSchema for customer testimonials

## Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [react-helmet-async Documentation](https://github.com/staylor/react-helmet-async)
