// SwissAI Tax FAQ Data
// This function generates FAQ data using translation keys

export const getFAQ = (t) => [
  {
    title: t('faq.categories.getting_started'),
    questions: [
      {
        question: t('faq.getting_started.q1.question'),
        answer: t('faq.getting_started.q1.answer'),
      },
      {
        question: t('faq.getting_started.q2.question'),
        answer: t('faq.getting_started.q2.answer'),
      },
      {
        question: t('faq.getting_started.q3.question'),
        answer: t('faq.getting_started.q3.answer'),
      },
      {
        question: t('faq.getting_started.q4.question'),
        answer: t('faq.getting_started.q4.answer'),
      }
    ]
  },
  {
    title: t('faq.categories.tax_filing'),
    questions: [
      {
        question: t('faq.tax_filing.q1.question'),
        answer: t('faq.tax_filing.q1.answer'),
      },
      {
        question: t('faq.tax_filing.q2.question'),
        answer: t('faq.tax_filing.q2.answer'),
      },
      {
        question: t('faq.tax_filing.q3.question'),
        answer: t('faq.tax_filing.q3.answer'),
      },
      {
        question: t('faq.tax_filing.q4.question'),
        answer: t('faq.tax_filing.q4.answer'),
      },
      {
        question: t('faq.tax_filing.q5.question'),
        answer: t('faq.tax_filing.q5.answer'),
      }
    ]
  },
  {
    title: t('faq.categories.deductions'),
    questions: [
      {
        question: t('faq.deductions.q1.question'),
        answer: t('faq.deductions.q1.answer'),
      },
      {
        question: t('faq.deductions.q2.question'),
        answer: t('faq.deductions.q2.answer'),
      },
      {
        question: t('faq.deductions.q3.question'),
        answer: t('faq.deductions.q3.answer'),
      },
      {
        question: t('faq.deductions.q4.question'),
        answer: t('faq.deductions.q4.answer'),
      }
    ]
  },
  {
    title: t('faq.categories.security'),
    questions: [
      {
        question: t('faq.security.q1.question'),
        answer: t('faq.security.q1.answer'),
      },
      {
        question: t('faq.security.q2.question'),
        answer: t('faq.security.q2.answer'),
      },
      {
        question: t('faq.security.q3.question'),
        answer: t('faq.security.q3.answer'),
      },
      {
        question: t('faq.security.q4.question'),
        answer: t('faq.security.q4.answer'),
      }
    ]
  },
  {
    title: t('faq.categories.support'),
    questions: [
      {
        question: t('faq.support.q1.question'),
        answer: t('faq.support.q1.answer'),
      },
      {
        question: t('faq.support.q2.question'),
        answer: t('faq.support.q2.answer'),
      },
      {
        question: t('faq.support.q3.question'),
        answer: t('faq.support.q3.answer'),
      },
      {
        question: t('faq.support.q4.question'),
        answer: t('faq.support.q4.answer'),
      }
    ]
  },
  {
    title: t('faq.categories.pricing'),
    questions: [
      {
        question: t('faq.pricing.q1.question'),
        answer: t('faq.pricing.q1.answer'),
      },
      {
        question: t('faq.pricing.q2.question'),
        answer: t('faq.pricing.q2.answer'),
      },
      {
        question: t('faq.pricing.q3.question'),
        answer: t('faq.pricing.q3.answer'),
      },
      {
        question: t('faq.pricing.q4.question'),
        answer: t('faq.pricing.q4.answer'),
      }
    ]
  }
];

// Keep original export for backward compatibility
export const FAQ = getFAQ((key) => key);
