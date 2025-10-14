import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * HowToSchema - Structured data for step-by-step tax filing guide
 *
 * This component generates Schema.org HowTo structured data to help search engines
 * understand the process of filing taxes with SwissAI Tax. This can appear in
 * search results as a rich snippet with steps.
 *
 * @component
 * @example
 * return <HowToSchema />
 */
const HowToSchema = () => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to File Swiss Taxes with SwissAI Tax",
    "description": "A simple, AI-powered process to file your Swiss tax return online in just 20 minutes. Complete your federal and cantonal taxes with expert guidance.",
    "image": "https://swissai.tax/images/how-to-file-taxes.jpg",
    "totalTime": "PT20M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "CHF",
      "value": "0",
      "minValue": "0",
      "maxValue": "199"
    },
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "Tax documents (salary statements, investment reports, etc.)"
      },
      {
        "@type": "HowToSupply",
        "name": "Personal identification information"
      },
      {
        "@type": "HowToSupply",
        "name": "Internet connection and device"
      }
    ],
    "tool": [
      {
        "@type": "HowToTool",
        "name": "SwissAI Tax Platform"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Create Your Account",
        "text": "Sign up for a free SwissAI Tax account. Provide your basic information and select your canton of residence.",
        "url": "https://swissai.tax/signup",
        "image": "https://swissai.tax/images/step-1-signup.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Answer Simple Questions",
        "text": "Our AI assistant will ask you straightforward questions about your income, deductions, and personal situation. The intelligent system adapts to your specific circumstances.",
        "url": "https://swissai.tax/questionnaire",
        "image": "https://swissai.tax/images/step-2-questions.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Upload Your Documents",
        "text": "Securely upload your tax documents (salary statements, investment reports, receipts for deductions). Our AI will automatically extract and verify the information.",
        "url": "https://swissai.tax/upload",
        "image": "https://swissai.tax/images/step-3-upload.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": "Review and Optimize",
        "text": "Review your tax return with AI-powered suggestions for maximizing deductions. Our system checks for common errors and ensures compliance with Swiss tax law.",
        "url": "https://swissai.tax/review",
        "image": "https://swissai.tax/images/step-4-review.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 5,
        "name": "Submit Your Tax Return",
        "text": "Submit your completed tax return directly to your cantonal tax authority. You'll receive confirmation and can track the status of your submission.",
        "url": "https://swissai.tax/submit",
        "image": "https://swissai.tax/images/step-5-submit.jpg"
      }
    ],
    "publisher": {
      "@type": "Organization",
      "name": "SwissAI Tax",
      "legalName": "LandMarK Lens GMBH",
      "url": "https://swissai.tax",
      "logo": "https://swissai.tax/logo.png"
    },
    "inLanguage": ["de", "fr", "it", "en"],
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Difficulty Level",
        "value": "Beginner"
      },
      {
        "@type": "PropertyValue",
        "name": "Success Rate",
        "value": "99%"
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default HowToSchema;
