# Schema Component Usage Examples

## Homepage Example

```jsx
import React from 'react';
import {
  OrganizationSchema,
  LocalBusinessSchema,
  HowToSchema,
  FAQSchema
} from '@/components/StructuredData';

export default function HomePage() {
  return (
    <>
      {/* Structured Data */}
      <OrganizationSchema />
      <LocalBusinessSchema />
      <HowToSchema />
      <FAQSchema />

      {/* Page Content */}
      <main>
        <h1>SwissAI Tax - AI-Powered Swiss Tax Filing</h1>
        {/* ... rest of your homepage content ... */}
      </main>
    </>
  );
}
```

---

## Pricing Page Example

```jsx
import React from 'react';
import { OfferSchema, ServiceSchema } from '@/components/StructuredData';

export default function PricingPage() {
  const pricingPlans = [
    {
      name: "Basic Plan",
      price: "0",
      description: "Perfect for simple tax returns",
      features: [
        "AI-powered filing",
        "Federal and cantonal taxes",
        "Email support",
        "Basic deduction optimization"
      ],
      pricingPeriod: "YEAR"
    },
    {
      name: "Standard Plan",
      price: "49",
      description: "For most individuals and freelancers",
      features: [
        "Everything in Basic",
        "Advanced deduction optimization",
        "Priority support",
        "Multiple income sources",
        "Investment income support"
      ],
      pricingPeriod: "YEAR"
    },
    {
      name: "Premium Plan",
      price: "99",
      description: "Complete solution with expert review",
      features: [
        "Everything in Standard",
        "Expert tax review",
        "Audit protection",
        "Business tax support",
        "Phone support",
        "Year-round tax planning"
      ],
      pricingPeriod: "YEAR"
    }
  ];

  return (
    <>
      {/* Structured Data */}
      <ServiceSchema serviceType="Tax Preparation" />
      {pricingPlans.map((plan, index) => (
        <OfferSchema
          key={index}
          name={plan.name}
          price={plan.price}
          currency="CHF"
          description={plan.description}
          features={plan.features}
          pricingPeriod={plan.pricingPeriod}
          url={`https://swissai.tax/pricing/${plan.name.toLowerCase().replace(' ', '-')}`}
        />
      ))}

      {/* Page Content */}
      <main>
        <h1>Pricing Plans</h1>
        {/* ... rest of your pricing content ... */}
      </main>
    </>
  );
}
```

---

## Blog Post Example

```jsx
import React from 'react';
import { ArticleSchema, BreadcrumbSchema } from '@/components/StructuredData';

export default function BlogPost({ post }) {
  const breadcrumbs = [
    { name: 'Home', url: 'https://swissai.tax' },
    { name: 'Blog', url: 'https://swissai.tax/blog' },
    { name: post.title, url: `https://swissai.tax/blog/${post.slug}` }
  ];

  return (
    <>
      {/* Structured Data */}
      <ArticleSchema
        title={post.title}
        description={post.excerpt}
        image={post.featuredImage}
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        author={post.author}
        url={`https://swissai.tax/blog/${post.slug}`}
      />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Page Content */}
      <article>
        <h1>{post.title}</h1>
        <time dateTime={post.publishedAt}>{post.publishedDate}</time>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
```

---

## Services Page Example

```jsx
import React from 'react';
import { ServiceSchema, LocalBusinessSchema } from '@/components/StructuredData';

export default function ServicesPage() {
  return (
    <>
      {/* Structured Data for all service types */}
      <ServiceSchema serviceType="Tax Preparation" />
      <ServiceSchema serviceType="Tax Filing" />
      <ServiceSchema serviceType="Tax Consultation" />
      <LocalBusinessSchema />

      {/* Page Content */}
      <main>
        <h1>Our Services</h1>

        <section>
          <h2>Tax Preparation</h2>
          <p>AI-powered tax preparation service for Swiss residents...</p>
        </section>

        <section>
          <h2>Tax Filing</h2>
          <p>Complete tax filing service for individuals and businesses...</p>
        </section>

        <section>
          <h2>Tax Consultation</h2>
          <p>Professional tax consultation services to optimize your tax strategy...</p>
        </section>
      </main>
    </>
  );
}
```

---

## FAQ Page Example

```jsx
import React from 'react';
import { FAQSchema } from '@/components/StructuredData';

export default function FAQPage() {
  // Use default FAQs
  return (
    <>
      <FAQSchema />

      <main>
        <h1>Frequently Asked Questions</h1>
        {/* ... FAQ content ... */}
      </main>
    </>
  );
}

// Or with custom FAQs
export function CustomFAQPage() {
  const customFAQs = [
    {
      question: "What documents do I need to file my taxes?",
      answer: "You'll need your salary statements, investment reports, insurance documents, and any receipts for deductible expenses. SwissAI Tax will guide you through exactly what's needed based on your situation."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use bank-level encryption and are fully compliant with Swiss data protection laws. Your data is stored securely in Switzerland and never shared with third parties."
    }
    // ... more FAQs
  ];

  return (
    <>
      <FAQSchema faqs={customFAQs} />

      <main>
        <h1>Help Center</h1>
        {/* ... FAQ content ... */}
      </main>
    </>
  );
}
```

---

## Contact Page Example

```jsx
import React from 'react';
import { LocalBusinessSchema, OrganizationSchema } from '@/components/StructuredData';

export default function ContactPage() {
  return (
    <>
      {/* Structured Data */}
      <LocalBusinessSchema />
      <OrganizationSchema />

      {/* Page Content */}
      <main>
        <h1>Contact Us</h1>

        <section>
          <h2>Get in Touch</h2>
          <p>Email: contact@swissai.tax</p>
          <address>
            LandMarK Lens GMBH<br />
            Sandbuckstrasse 24<br />
            5425 Schneisingen<br />
            Switzerland
          </address>
        </section>
      </main>
    </>
  );
}
```

---

## How It Works Page Example

```jsx
import React from 'react';
import { HowToSchema, ServiceSchema } from '@/components/StructuredData';

export default function HowItWorksPage() {
  return (
    <>
      {/* Structured Data */}
      <HowToSchema />
      <ServiceSchema serviceType="Tax Preparation" />

      {/* Page Content */}
      <main>
        <h1>How SwissAI Tax Works</h1>

        <ol className="steps">
          <li>
            <h2>Create Your Account</h2>
            <p>Sign up in seconds and get started immediately...</p>
          </li>
          <li>
            <h2>Answer Simple Questions</h2>
            <p>Our AI assistant guides you through the process...</p>
          </li>
          <li>
            <h2>Upload Your Documents</h2>
            <p>Securely upload your tax documents...</p>
          </li>
          <li>
            <h2>Review and Optimize</h2>
            <p>Review your return with AI-powered suggestions...</p>
          </li>
          <li>
            <h2>Submit Your Tax Return</h2>
            <p>Submit directly to your cantonal tax authority...</p>
          </li>
        </ol>
      </main>
    </>
  );
}
```

---

## App Layout Example (Root)

```jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { OrganizationSchema, WebSiteSchema } from '@/components/StructuredData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RootLayout() {
  return (
    <>
      {/* Global Structured Data */}
      <OrganizationSchema />
      <WebSiteSchema />

      {/* App Layout */}
      <div className="app">
        <Header />
        <main>
          <Outlet /> {/* Page-specific schemas go in child routes */}
        </main>
        <Footer />
      </div>
    </>
  );
}
```

---

## Testing Your Implementation

After implementing, test with:

1. **Google Rich Results Test**
   ```
   https://search.google.com/test/rich-results
   ```

2. **Schema Markup Validator**
   ```
   https://validator.schema.org/
   ```

3. **Browser DevTools**
   ```jsx
   // Check the page source
   view-source:https://swissai.tax

   // Look for <script type="application/ld+json">
   ```

4. **React DevTools**
   - Check that Helmet components are rendering
   - Verify no duplicate schemas

---

## Tips

1. **Don't over-use:** Only add schemas relevant to the current page
2. **One per type:** Generally only one of each schema type per page
3. **Except Offers:** You can have multiple `OfferSchema` on pricing pages
4. **Except Services:** You can have multiple `ServiceSchema` on services pages
5. **Keep data accurate:** Ensure schema data matches visible page content
6. **Update regularly:** Keep company info and pricing current
