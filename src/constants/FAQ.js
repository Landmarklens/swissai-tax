/**
 * SwissAI Tax FAQ Data
 * Frequently Asked Questions for Swiss tax filing platform
 */

// Static FAQ data
export const FAQ = [
  {
    title: 'About SwissAI Tax',
    questions: [
      {
        question: 'What is SwissAI Tax?',
        answer: 'SwissAI Tax is an AI-powered tax filing assistant specifically designed for Swiss taxpayers. It simplifies the complex Swiss tax system by guiding you through an intelligent interview process, automatically importing data from official Swiss standards (eCH-0196 bank statements and Swissdec salary certificates), and optimizing your deductions.'
      },
      {
        question: 'Which cantons are supported?',
        answer: 'SwissAI Tax supports all 26 Swiss cantons. The system automatically adjusts calculations based on your cantonal and municipal tax rates, including all local variations and special regulations.'
      },
      {
        question: 'How is this different from other tax software?',
        answer: 'Unlike generic tax software, SwissAI Tax is built specifically for the Swiss tax system with unique features:',
        bulletPoints: [
          'Automatic import of eCH-0196 bank statements and Swissdec salary certificates',
          'AI-powered deduction optimizer that finds savings you might miss',
          'Support for all 26 cantons with automatic rate updates',
          'Data stored exclusively in Switzerland with bank-level encryption',
          'Intelligent interview that adapts to your situation',
          'Real-time calculation as you answer questions'
        ]
      }
    ]
  },
  {
    title: 'Getting Started',
    questions: [
      {
        question: 'How does the tax filing process work?',
        answer: 'Filing your taxes with SwissAI Tax is simple and efficient:',
        processSteps: [
          'Create your account and select your canton',
          'Complete the smart 20-minute interview',
          'Upload or import your documents',
          'Review AI-optimized calculations',
          'Download your completed tax return',
          'Submit electronically or print and mail'
        ]
      },
      {
        question: 'What documents do I need?',
        answer: 'You\'ll need standard Swiss tax documents:',
        bulletPoints: [
          'Salary certificate (Lohnausweis)',
          'Bank statements for year-end balances',
          'Securities/investment statements',
          'Mortgage interest statements',
          'Pillar 3a contribution receipts',
          'Insurance premium receipts'
        ]
      },
      {
        question: 'How long does it take?',
        answer: 'Most users complete their tax return in 20-30 minutes. This is 60-70% faster than traditional manual filing thanks to automatic data import and AI guidance.'
      }
    ]
  },
  {
    title: 'Smart Features',
    questions: [
      {
        question: 'What is automatic document import?',
        answer: 'SwissAI Tax supports two official Swiss e-government standards:',
        detailedPoints: [
          {
            title: 'eCH-0196 Bank Statements:',
            description: 'Upload your bank statement PDF with eCH-0196 barcode. The system automatically extracts all financial data with 99% accuracy.'
          },
          {
            title: 'Swissdec Salary Certificates:',
            description: 'Upload your Swissdec XML salary certificate. The system instantly extracts salary, contributions, and tax-relevant data.'
          }
        ]
      },
      {
        question: 'How does the AI optimizer work?',
        answer: 'The AI analyzer reviews your return and suggests additional deductions you may have missed:',
        bulletPoints: [
          'Professional expenses (commute, meals, training)',
          'Insurance premiums',
          'Pillar 3a contributions',
          'Childcare costs',
          'Medical expenses',
          'Donation deductions'
        ]
      }
    ]
  },
  {
    title: 'Security & Privacy',
    questions: [
      {
        question: 'How is my data protected?',
        answer: 'Your financial data security is our top priority:',
        bulletPoints: [
          'AES-128 encryption (same as Swiss banks)',
          'Data stored exclusively on Swiss servers',
          'Full GDPR and Swiss FADP compliance',
          'No data transfer outside Switzerland',
          'No data sharing with third parties'
        ]
      },
      {
        question: 'Who has access to my information?',
        answer: 'Only you have access to your tax data. We never share, sell, or use your data for any purpose other than preparing your tax return.'
      }
    ]
  }
];

// Function to get FAQ with translation support (for backward compatibility)
export const getFAQ = (t) => {
  // If t is a function, use it for translations; otherwise return static data
  if (typeof t === 'function') {
    // For now, return static data - translations can be added later
    return FAQ;
  }
  return FAQ;
};
