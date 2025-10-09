import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const FAQSchema = ({ faqs }) => {
  const { t } = useTranslation();
  // Default FAQs if not provided
  const defaultFAQs = [
    {
      question: "How does HomeAI's AI property matching work?",
      answer: "HomeAI uses advanced AI algorithms to analyze your preferences, budget, and requirements to find the 4 best properties that match your needs. Instead of scrolling through hundreds of listings, you get personalized recommendations."
    },
    {
      question: "Is HomeAI available throughout Switzerland?",
      answer: "Yes, HomeAI covers properties across all of Switzerland, including major cities like Zürich, Geneva, Basel, Bern, and Lausanne, as well as smaller towns and rural areas."
    },
    {
      question: "What languages does HomeAI support?",
      answer: "HomeAI is available in English, German (Deutsch), French (Français), and Italian (Italiano) to serve all regions of Switzerland."
    },
    {
      question: "How much does HomeAI cost?",
      answer: "HomeAI offers various subscription plans starting from free basic searches to premium features for frequent users and property owners. Check our pricing page for current plans."
    },
    {
      question: "How quickly can I find a property with HomeAI?",
      answer: "Most users receive their personalized property matches within minutes of completing their preferences. The AI continuously updates recommendations as new properties become available."
    }
  ];

  const faqItems = faqs || defaultFAQs;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default FAQSchema;