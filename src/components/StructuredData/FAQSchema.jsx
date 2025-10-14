import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const FAQSchema = ({ faqs }) => {
  const { t } = useTranslation();
  // Default FAQs if not provided
  const defaultFAQs = [
    {
      question: "How does SwissAI Tax's AI tax filing work?",
      answer: "SwissAI Tax uses advanced AI algorithms to analyze your financial documents and guide you through the Swiss tax filing process. Our intelligent system helps you maximize deductions and ensures accuracy."
    },
    {
      question: "Is SwissAI Tax available throughout Switzerland?",
      answer: "Yes, SwissAI Tax supports tax filing for all Swiss cantons, including Zürich, Geneva, Basel, Bern, and Lausanne, ensuring compliance with both federal and cantonal tax regulations."
    },
    {
      question: "What languages does SwissAI Tax support?",
      answer: "SwissAI Tax is available in English, German (Deutsch), French (Français), and Italian (Italiano) to serve all regions of Switzerland."
    },
    {
      question: "How much does SwissAI Tax cost?",
      answer: "SwissAI Tax offers various pricing plans tailored to individuals and businesses. Check our pricing page for current plans and features."
    },
    {
      question: "How quickly can I complete my tax filing with SwissAI Tax?",
      answer: "Most users complete their tax filing within minutes using our AI-powered platform. The system guides you step-by-step and automatically fills in information from your uploaded documents."
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