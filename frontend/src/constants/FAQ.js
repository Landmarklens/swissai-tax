// TODO: add translations

/**
 * type FAQ = {
 *  title?: string
 *  titles?: string[],
 *  borderBottom?: boolean,
 *  questions: {
 *    question: string | undefined,
 *    answer: string,
 *    inline?: boolean
 *    options: {
 *    title: string,
 *    text: string,
 *    options: {
 *      title: string,
 *      text: string,
 *      }
 *    }[]
 *  }
 * }
 */

// Updated FAQ structure to handle mixed content (free text + bullet points)

export const FAQ = [
  {
    title: 'About HomeAI.CH',
    questions: [
      {
        question: 'What is the HomeAi.CH service?',
        answer: 'It\'s a chat-based assistant designed to streamline your property search in Switzerland. After answering a few simple yet comprehensive questions, it instantly provides personalized property recommendations, clearly detailing why each option fits your specific requirements.'
      },
      {
        question: 'How much does the assistant cost?',
        answer: 'You can try it free for 1 day. After the trial, unlimited access costs CHF 29.99 per month. You may cancel anytime, with no long-term commitment.'
      },
      {
        question: 'Which areas in Switzerland are covered?',
        answer: 'The assistant covers all Swiss cantons and municipalities—from major cities like Zurich, Geneva, Lausanne, and Basel to smaller towns and rural areas. Listings are updated multiple times daily to ensure accuracy.'
      }
    ]
  },
  {
    title: 'Why the Assistant is Needed',
    questions: [
      {
        question: 'Why use HomeAI instead of traditional search methods?',
        answer: 'Searching for properties involves much more than just filtering by price or location. The AI Home-Search Assistant considers a broad spectrum of personal, practical, and financial factors simultaneously, providing benefits such as:',
        bulletPoints: [
          'Highly personalized recommendations beyond basic filtering criteria.',
          'Comprehensive understanding of your lifestyle, including commuting habits, family and social life, and essential amenities.',
          'Detailed financial insights, accounting for total living costs, taxes, commuting expenses, and more.',
          'Efficient search experience, saving you time by narrowing down truly suitable options.'
        ],
        conclusion: 'The assistant helps you discover properties uniquely matched to your lifestyle that standard platforms might overlook.'
      },
      {
        question: 'How does the assistant save me time compared to manual searches?',
        answer: 'The assistant instantly filters through thousands of listings daily, applying your detailed preferences and analyzing complex factors like total living costs, precise commute times, and lifestyle considerations. This significantly reduces the time you\'d spend manually searching and comparing properties.'
      },
      {
        question: 'How can the assistant help me avoid hidden costs?',
        answer: 'The assistant explicitly evaluates hidden or overlooked costs such as local taxes, commuting expenses, and utilities (heating, broadband availability, energy efficiency). You\'ll receive transparent insights, preventing unexpected financial surprises.'
      },
      {
        question: 'How does the assistant improve decision-making accuracy?',
        answer: 'By considering over 60 detailed data points—including demographic data, environmental quality, local competition, transport accessibility, and detailed photo analysis—it ensures your choices are informed by comprehensive, accurate, and nuanced data, rather than guesswork or incomplete information.'
      },
      {
        question: 'How does the assistant ensure recommendations match my actual lifestyle?',
        answer: 'Recommendations go far beyond basic filters, incorporating personal and practical details about your family, daily routines, and preferred amenities. Whether it\'s proximity to favorite restaurants, fitness centers, or a safer route for your children\'s school commute, the assistant ensures each recommendation closely aligns with your actual day-to-day life.'
      },
      {
        question: 'Can the assistant uncover ideal locations I might not consider myself?',
        answer: 'Yes. By evaluating comprehensive commute patterns and total living costs rather than just geographic proximity, the assistant frequently recommends excellent properties in locations you might otherwise overlook, enhancing your living quality or financial efficiency.'
      },
      {
        question: 'How does the assistant continuously improve the quality of its recommendations?',
        answer: 'The assistant actively integrates your feedback on each suggestion, refining future recommendations. This interactive feedback loop ensures the search results become increasingly precise and personalized over time.'
      },
      {
        question: 'How detailed are the insights provided about each property?',
        answer: 'The assistant delivers thorough, actionable insights for every recommended property, clearly explaining why each home fits your needs—including detailed financial breakdowns, lifestyle suitability, commute efficiency, and environmental quality assessments.'
      }
    ]
  },
  {
    title: 'How HomeAI.ch Works',
    questions: [
      {
        question: 'Why is this assistant better than traditional property websites?',
        answer: 'Unlike standard property portals, which use basic filters (e.g., price, location, rooms), our assistant comprehensively considers detailed factors such as:',
        detailedPoints: [
          {
            title: 'Total Living Costs:',
            description: 'Estimates your total monthly expenses, including cantonal and municipal taxes.'
          },
          {
            title: 'Commute and Transit:',
            description: 'Calculates precise commute times tailored to your preferred transport methods (public transit, car, or bicycle).'
          },
          {
            title: 'Detailed Photo Analysis:',
            description: 'Highlights property features like natural lighting, views, balcony size, kitchen style, and overall aesthetic.'
          },
          {
            title: 'Quality-of-Life Indicators:',
            description: 'Assesses factors such as noise levels, air quality, proximity to green spaces, and broadband availability.'
          },
          {
            title: 'Competition Analysis:',
            description: 'Evaluates market competitiveness based on local vacancy rates and housing demand pressures.'
          },
          {
            title: 'Proximity to Personal Interests:',
            description: 'Evaluates convenience not only by distance but by travel time, based on your chosen mode of transportation and frequency of visits (e.g., family, friends, frequent destinations).'
          }
        ],
        freeTextExample: 'Example: If you commute three days per week using public transit, the assistant might suggest an apartment slightly farther in kilometers but with significantly better transit connections, reducing your daily commuting time dramatically compared to a geographically closer but less connected option.',
        familyConsiderations: [
          'Family Considerations: If you have young children, the assistant specifically analyzes proximity and safest routes to kindergartens, including whether children need to cross major roads. For families with older children, it calculates optimal school commute times and safety factors.'
        ],
        conclusion: 'This comprehensive approach ensures you uncover ideal properties you\'d likely miss using conventional search methods.'
      },
      {
        question: 'How detailed is the interview process?',
        answer: 'The interview process is thorough and replicates having a personal real estate assistant. It covers:',
        bulletPoints: [
          'Location preferences',
          'Property type and size',
          'Budget and financial flexibility',
          'Living space and layout preferences',
          'Lifestyle considerations (favorite restaurants, gyms, amenities)',
          'Family needs (proximity and ease of access to family, schools, safety)',
          'Commute preferences (transport mode and frequency of commute)',
          'Timelines and flexibility on various criteria'
        ],
        conclusion: 'The assistant integrates these nuanced details beyond simple filters, providing genuinely tailored recommendations.'
      },
      {
        question: 'How many data points does HomeAi.CH consider?',
        answer: 'The assistant evaluates over 60 unique data points tailored to your specific preferences, ensuring personalized and precise recommendations. These encompass financial, demographic, geographic, transportation, local amenities, environmental aspects, and personal lifestyle factors.'
      },
      {
        question: 'Can you provide a practical example?',
        answer: 'Certainly! Instead of merely providing a basic filter match, the assistant conducts a detailed and interactive interview to fully understand your specific lifestyle needs and preferences. For instance, you might share:',
        quote: '"I need a 3-bedroom apartment near Zurich for around CHF 3,000. It should be pet-friendly, have a modern kitchen and balcony with a view, excellent air quality, proximity to childcare, and good public schools. I commute three times a week via public transport."',
        process: 'The assistant then:',
        processSteps: [
          'Asks clarifying questions regarding your preferred maximum commute time, favorite transportation methods, and childcare specifics.',
          'Conducts an extensive analysis considering:'
        ],
        analysisPoints: [
          'Commute times tailored specifically to your frequency and mode of travel (e.g., prioritizing areas with frequent direct public transport connections rather than merely closer distances).',
          'Local taxes, sometimes recommending apartments slightly above your initial budget if reduced taxes significantly lower your total monthly expenses.',
          'Childcare facility quality and proximity, along with safe walking or commuting routes to kindergartens or schools.',
          'Environmental factors such as air quality, noise, and green space availability.',
          'Detailed visual analysis confirming desired features (modern kitchens, balconies, scenic views).'
        ],
        resultIntro: 'A resulting personalized recommendation might be:',
        resultQuote: '"This apartment in Küsnacht is CHF 3,200/month, slightly over your initial budget, but municipal taxes are lower, reducing your overall monthly costs by CHF 150. The apartment includes a modern kitchen, a balcony overlooking Lake Zurich, and excellent air quality. It is pet-friendly, located within five minutes of highly-rated childcare and primary schools, and your commute via direct S-Bahn to Zurich HB is precisely 25 minutes."',
        conclusion: 'Importantly, you can provide instant feedback on any recommendation (e.g., "too expensive," "too small"), enabling the assistant to continually refine future suggestions and improve personalization significantly over time.'
      },
      {
        question: 'What types of questions will I need to answer?',
        answer: 'Only essential questions, such as your budget, desired location(s), property type, preferred move-in date, pet-related needs, commuting habits, and key amenities (e.g., balcony, garden, elevator). All questions are concise, relevant, and user-friendly.'
      }
    ]
  },
  {
    title: 'Personalization and Preferences',
    questions: [
      {
        question: 'Does the assistant remember my preferences?',
        answer: 'Yes. With an active subscription, it securely stores your preferences (budget, preferred areas, essential home features). Future searches automatically apply these preferences, saving you valuable time.'
      },
      {
        question: 'Can I get alerts for new matching properties?',
        answer: 'Absolutely. You instantly receive email notifications whenever new properties matching your criteria become available.'
      }
    ]
  },
  {
    title: 'Renting and Buying',
    questions: [
      {
        question: 'Does the assistant help both renters and buyers?',
        answer: 'Yes. Recommendations adapt based on whether you\'re renting or buying. For buyers, it further considers property taxes, year of construction, renovation potential, mortgage options, and long-term investment value.'
      }
    ]
  },
  {
    title: 'Privacy and Account Management',
    questions: [
      {
        question: 'How secure is my personal data?',
        answer: 'Your data and preferences are stored securely, kept strictly confidential, and never shared or sold. You can easily update or delete your information via account settings.'
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'Canceling is simple and hassle-free. Visit your account page, select "Billing," and click "Cancel Subscription." Your subscription remains active until the current billing period ends, with no further charges afterward.'
      }
    ]
  }
];
