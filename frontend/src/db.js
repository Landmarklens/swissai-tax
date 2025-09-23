export const jsonData = {
  counter: {
    count: '1242'
  },
  testimonials: [
    {
      id: 1,
      name: 'Alice B.',
      location: 'Bahnhofstrasse 10, 8001 Zürich',
      details: '4 Bed / 3 Ba • 3,200.- per month',
      avatar:
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      rating: 5,
      text: 'I was able to find the perfect home in no time. The service was exceptional and so easy to use.'
    },
    {
      id: 2,
      name: 'Michael K.',
      location: 'Rämistrasse 28, 8001 Zürich',
      details: '2 Bed / 2 Ba • 2,200.- per month',
      avatar: 'https://unsplash.com/photos/J7w6Hk7lbXk',
      rating: 4,
      text: 'Very efficient and user-friendly. Found a great place that fits my needs perfectly.'
    },
    {
      id: 3,
      name: 'Olivia H.',
      location: 'Limmatquai 70, 8001 Zürich',
      details: '3 Bed / 2 Ba • 2,800.- per month',
      avatar: 'https://unsplash.com/photos/0Z3rFvDhs5k',
      rating: 5,
      text: 'A fantastic experience! The AI-driven search made everything so simple and stress-free.'
    },
    {
      id: 4,
      name: 'David G.',
      location: 'Seefeldstrasse 123, 8008 Zürich',
      details: '1 Bed / 1 Ba • 1,500.- per month',
      avatar: 'https://unsplash.com/photos/mEZ3PoFGs_k',
      rating: 3,
      text: 'Good service, though I had some minor issues with the search filters. Overall, a positive experience.'
    },
    {
      id: 5,
      name: 'Sophia M.',
      location: 'Niederdorfstrasse 66, 8001 Zürich',
      details: '3 Bed / 1 Ba • 2,400.- per month',
      avatar: 'https://unsplash.com/photos/iFgRcqHznqg',
      rating: 4,
      text: 'Easy to use and reliable. I found a great apartment that I love.'
    },
    {
      id: 6,
      name: 'Liam T.',
      location: 'Zurichbergstrasse 112, 8044 Zürich',
      details: '4 Bed / 2 Ba • 3,000.- per month',
      avatar: 'https://unsplash.com/photos/SJzHyhJFi8I',
      rating: 5,
      text: 'This service saved me so much time. Highly recommended for anyone looking for a new home.'
    },
    {
      id: 7,
      name: 'Chloe F.',
      location: 'Langstrasse 50, 8004 Zürich',
      details: '2 Bed / 1 Ba • 1,900.- per month',
      avatar: 'https://unsplash.com/photos/RrhhzitYizg',
      rating: 4,
      text: 'Smooth process from start to finish. The insights were spot-on.'
    },
    {
      id: 8,
      name: 'James R.',
      location: 'Sihlquai 10, 8005 Zürich',
      details: '3 Bed / 2 Ba • 2,600.- per month',
      avatar: 'https://unsplash.com/photos/UWcP02uAXJ4',
      rating: 5,
      text: 'The best way to find a home. Simple, efficient, and accurate.'
    },
    {
      id: 9,
      name: 'Isabella N.',
      location: 'Europaallee 21, 8004 Zürich',
      details: '1 Bed / 1 Ba • 1,700.- per month',
      avatar: 'https://unsplash.com/photos/RN6ts8IZ4_0',
      rating: 4,
      text: 'I had a great experience. Found a nice place quickly and without any hassle.'
    }
  ],
  differences: [
    {
      title: 'Search Frequency',
      description: 'Ranges from daily (Free) to real-time (Pro and VIP).'
    },
    {
      title: 'Search Scope:',
      description:
        'Limited to 1 match per month in Free, 10 in Premium, 30 in Pro, and unlimited in VIP.'
    },
    {
      title: 'Data Analysis:',
      description:
        'Text-only in Free, basic photo analysis in Premium, and in-depth analysis with environmental and market data in Pro and VIP.'
    },
    {
      title: 'Support:',
      description:
        'Community-based in Free, email support in Premium, dedicated account managers in Pro, and priority service in VIP'
    },
    {
      title: 'Exclusive Extras:',
      description:
        'The VIP Plan offers automated application submissions and real-time communication via WhatsApp.'
    }
  ],
  plan: [
    {
      id: 1,
      title: 'Free',
      price: 'Free',
      plan: 'free',
      description: 'Basic plan for essential needs',
      features: [
        {
          title: 'Basic Property Matching',
          description:
            'The AI matches properties based on essential criteria such as budget, location, commute time to work and family members, and property size.'
        },
        {
          title: 'Daily Market Scan',
          description: 'Property scans once a day.'
        },
        {
          title: 'Limited Search Scope',
          description: 'Up to 1 active property match per month.'
        },
        {
          title: 'Text-Based Analysis',
          description: 'The AI analyzes only property descriptions without considering photos.'
        },
        {
          title: 'Community Support',
          description: 'Access to a user community for help and advice.'
        }
      ],
      advantages: [
        {
          title: 'Free with no financial commitment.'
        },
        {
          title: 'Ideal for users with simple needs or just starting their property search.'
        },
        {
          title: 'Experience AI-driven property search at no cost.'
        }
      ],
      buttonText: 'Get Started',
      selected: false
    },
    {
      id: 2,
      title: 'Advanced Search',
      plan: 'comprehensive',
      price: 'CHF99.99',
      description:
        'High-demand renters, professionals, or families needing a highly personalized and proactive property search experience.',
      features: [
        {
          title: 'Ultimate Property Matching',
          description:
            'The AI evaluates properties based on commute, amenities, livability, local trends, and potential issues.'
        },
        {
          title: 'Real-Time Market Scan',
          description: 'Continuous market scans with instant updates.'
        },
        {
          title: 'Expanded Search Scope',
          description: 'Up to 30 active property matches per month.'
        },
        {
          title: 'In-Depth Analysis',
          description:
            'AI conducts deep analysis of text and photos, evaluating details like view quality, noise levels, interior design, and proximity to amenities.'
        },
        {
          title: 'VIP Support',
          description: 'Priority customer service with dedicated account managers.'
        },
        {
          title: 'WhatsApp Notifications',
          description: 'Instant alerts via WhatsApp for new property matches and market updates.'
        }
      ],
      advantages: [
        {
          title: 'The most comprehensive property search experience available.'
        },
        {
          title: 'Perfect for users with specific needs in competitive markets.'
        },
        {
          title: 'Highly personalized insights and real-time updates via WhatsApp and email.'
        }
      ],
      buttonText: 'Get Started',
      selected: true
    }
  ],
  shortPlan: [
    {
      id: 1,
      title: 'Free',
      plan: 'free',
      price: 'Free',
      description: 'Basic plan for essential needs',
      features: [{ title: 'Limited property matches' }, { title: 'Basic AI assistance' }],
      advantages: [],
      buttonText: 'Start Free Week',
      selected: false,
      is_trial: false
    },
    {
      id: 2,
      title: 'Advanced Search',
      plan: 'comprehensive',
      price: 'CHF99.99',
      description: 'Comprehensive solution for professionals',
      features: [
        { title: 'Full AI capabilities' },
        { title: 'Personalized market analysis' },
        { title: '24/7 dedicated support' }
      ],
      advantages: [],
      buttonText: 'Get Started',
      selected: true,
      is_trial: true
    }
  ],
  team: [
    {
      id: 1,
      alt: 'img',
      src: 'https://images.unsplash.com/photo-1585580829850-a074625a2f27?q=80&w=2011&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 2,
      alt: 'img',
      src: 'https://images.unsplash.com/photo-1585580829850-a074625a2f27?q=80&w=2011&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 3,
      alt: 'img',
      src: 'https://images.unsplash.com/photo-1585580829850-a074625a2f27?q=80&w=2011&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 4,
      alt: 'img',
      src: 'https://images.unsplash.com/photo-1585580829850-a074625a2f27?q=80&w=2011&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 5,
      alt: 'img',
      src: 'https://images.unsplash.com/photo-1585580829850-a074625a2f27?q=80&w=2011&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 6,
      alt: 'img',
      src: 'https://images.unsplash.com/photo-1585580829850-a074625a2f27?q=80&w=2011&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }
  ],
  stepper: [
    {
      id: 1,
      label: 'General Preferences'
    },
    {
      id: 2,
      label: 'Type of Property'
    },
    {
      id: 3,
      label: 'Budget'
    },
    {
      id: 4,
      label: 'Space and Layout'
    },
    {
      id: 5,
      label: 'Lifestyle and Amenities'
    },
    {
      id: 6,
      label: 'Personal and Family Considerations'
    },
    {
      id: 7,
      label: 'Property Features'
    },
    {
      id: 8,
      label: 'Additional Considerations'
    },
    {
      id: 9,
      label: 'Timing and Deadlines'
    },
    {
      id: 10,
      label: 'Flexibility and Prioritization'
    },
    {
      id: 11,
      label: 'Feedback and Follow-Up'
    }
  ],
  questions: {
    steps: [
      {
        id: 1,
        label: 'Location Preferences',
        questions: [
          {
            id: 1,
            question: 'What city or neighborhood are you interested in?',
            type: 'text',
            required: true,
            nextQuestion: 2
          },
          {
            id: 2,
            question: 'How close would you like your home to be from your workplace or school?',
            type: 'text',
            required: true,
            nextQuestion: 3
          },
          {
            id: 3,
            question: 'Do you need easy access to public transport?',
            type: 'boolean',
            required: false,
            nextQuestion: 4
          },
          {
            id: 4,
            question: 'How important is the safety of the neighborhood to you?',
            type: 'scale',
            scaleMin: 1,
            scaleMax: 5,
            required: true,
            nextQuestion: 5
          },
          {
            id: 5,
            question: 'What types of amenities would you like nearby?',
            type: 'text',
            required: false,
            nextQuestion: null
          }
        ]
      },
      {
        id: 2,
        label: 'Budget and Financial Considerations',
        questions: [
          {
            id: 6,
            question: 'What is your maximum monthly budget for rent or mortgage?',
            type: 'number',
            required: true,
            nextQuestion: 7
          },
          {
            id: 7,
            question: 'If buying, how much can you afford for the down payment?',
            type: 'number',
            required: false,
            nextQuestion: 8
          },
          {
            id: 8,
            question: 'Are there any other financial considerations we should know about?',
            type: 'text',
            required: false,
            nextQuestion: null
          }
        ]
      },
      {
        id: 3,
        label: 'Apartment Features and Amenities',
        questions: [
          {
            id: 9,
            question:
              'What type of apartment are you looking for? (e.g., studio, 1-bedroom, 2-bedroom)',
            type: 'text',
            required: true,
            nextQuestion: 10
          },
          {
            id: 10,
            question:
              'Do you have any preferences for apartment amenities? (e.g., pool, gym, parking)',
            type: 'text',
            required: false,
            nextQuestion: 11
          },
          {
            id: 11,
            question: 'What is the minimum number of bedrooms you need?',
            type: 'number',
            required: true,
            nextQuestion: 12
          },
          {
            id: 12,
            question:
              'Do you need any specific features in the apartment? (e.g., balcony, fireplace)',
            type: 'text',
            required: false,
            nextQuestion: null
          }
        ]
      },
      {
        id: 4,
        label: 'Lifestyle and Personal Preferences',
        questions: [
          {
            id: 13,
            question: 'Do you prefer a quiet or lively neighborhood?',
            type: 'text',
            required: true,
            nextQuestion: 14
          },
          {
            id: 14,
            question: 'Do you have any pets or plan to get any in the future?',
            type: 'boolean',
            required: false,
            nextQuestion: 15
          },
          {
            id: 15,
            question:
              'Are there any hobbies or activities you want to be close to? (e.g., hiking, dining)',
            type: 'text',
            required: false,
            nextQuestion: null
          }
        ]
      },
      {
        id: 5,
        label: 'Move-in Readiness and Timing',
        questions: [
          {
            id: 16,
            question: 'When do you plan to move in?',
            type: 'date',
            required: true,
            nextQuestion: 17
          },
          {
            id: 17,
            question:
              'Are you looking for a home that is move-in ready or are you open to renovations?',
            type: 'text',
            required: false,
            nextQuestion: 18
          },
          {
            id: 18,
            question: 'Do you need to coordinate with your current lease end date?',
            type: 'boolean',
            required: false,
            nextQuestion: null
          }
        ]
      }
    ]
  },
  insights: {
    'Location Preferences': [
      'Close to Johar Town',
      'Central vibrant areas',
      'Public transport essentials'
    ],
    'Budget and financial consideration': ['20k-30k', 'Standard deposit', 'Long term stability']
  },
  currentPlan: {
    name: 'Free',
    price: 'Free',
    keyFeatures: []
  },
  upgradePlan: {
    name: 'Advanced Search',
    price: 'CHF99.99',
    keyFeatures: [
      {
        feature: 'Enhanced Property Matching',
        description: 'Taxes, other interests like hobbies etc.'
      },
      {
        feature: 'Frequent Market Scan',
        description: 'Regular updates on market trends.'
      },
      {
        feature: 'Broader Search Scope',
        description: 'Wider range of properties and data.'
      },
      {
        feature: 'Automated Alerts',
        description: 'Notifications for new properties.'
      },
      {
        feature: 'Text and Basic Photo Analysis',
        description: 'AI-based property analysis.'
      },
      {
        feature: 'Personalized Support',
        description: 'Dedicated customer support.'
      }
    ]
  },
  discountOffer: {
    upgradePlanName: 'Pro: Comprehensive Search',
    timer: '11:11'
  },
  proPlan: {
    name: 'Pro: Comprehensive Search',
    price: 'CHF79.99',
    originalPrice: 'CHF99.99',
    keyFeatures: [
      { feature: 'Ultimate Property Matching', description: 'desc' },
      {
        feature: 'Real-Time Market Scan',
        description: 'Continuous market scans with instant updates.'
      },
      { feature: 'Expanded Search Scope', description: 'desc' },
      { feature: 'In-Depth Analysis', description: 'desc' },
      { feature: 'VIP Support', description: 'desc' },
      { feature: 'WhatsApp Notifications', description: 'desc' }
    ]
  },
  profile: {
    name: 'typicode'
  },
  chat: [
    {
      id: '1',
      name: ''
    }
  ],
  accountNotes: [
    {
      image:
        'https://plus.unsplash.com/premium_photo-1723901831135-782c98d8d8e0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      address: 'Johar Town 345 Lahore,Pakistan',
      beds: 3,
      baths: 3,
      sqrFeet: 120,
      price: 'CHF79.99',
      notes: 4,
      feedbacks: [
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        },
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        },
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        },
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        }
      ]
    },
    {
      image:
        'https://images.unsplash.com/photo-1592595896551-12b371d546d5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      address: 'Johar Town 345 Lahore,Pakistan',
      beds: 3,
      baths: 2,
      sqrFeet: 1710,
      price: 'CHF89.99',
      notes: 3,
      feedbacks: [
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        },
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        },
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        }
      ]
    },
    {
      image:
        'https://images.unsplash.com/photo-1560185127-2d06c6d08d3d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      address: 'Johar Town 345 Lahore,Pakistan',
      beds: 2,
      baths: 3,
      sqrFeet: 1420,
      price: 'CHF99.99',
      notes: 1,
      feedbacks: [
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        },
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        },
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        },
        {
          name: 'Amanda Bush',
          image: 'https://via.placeholder.com/100',
          date: 'Apr 11, 2024',
          description: 'Thank a lot for your help with this apartment. I’m really happy about it!'
        }
      ]
    }
  ],
  cancelSubscriptionReasons: [
    'Only want to pay monthly',
    'HOME AI sufficient for my needs',
    'Premium is too expensive',
    'Premium features are not valuable to me',
    'Product has too many bugs',
    'No Longer Need',
    "Don't use diagramming tools enough to pay",
    "Don't know the Home AI Search",
    'Other'
  ],
  accountContacts: [
    {
      id: 1,
      name: 'Annet Wilson',
      lastMessage: 'Hello!',
      date: '02 Aug',
      unreadCount: 2,
      messages: [
        {
          id: 1,
          content: 'Hello!',
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 2,
          content:
            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 3,
          content:
            'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using',
          sender: 'You',
          time: '10:01 AM'
        }
      ]
    },
    {
      id: 2,
      name: 'Annet Wilson',
      lastMessage: 'Hello!',
      date: '02 Aug',
      unreadCount: 2,
      messages: [
        {
          id: 1,
          content: 'Hello!',
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 2,
          content:
            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 3,
          content:
            'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using',
          sender: 'You',
          time: '10:01 AM'
        },
        {
          id: 4,
          content:
            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
          sender: 'You',
          time: '10:01 AM'
        }
      ]
    },
    {
      id: 3,
      name: 'Annet Wilson',
      lastMessage: 'Hello!',
      date: '02 Aug',
      unreadCount: 2,
      messages: [
        {
          id: 1,
          content: 'Hello!',
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 2,
          content:
            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 3,
          content:
            'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using',
          sender: 'You',
          time: '10:01 AM'
        }
      ]
    },
    {
      id: 4,
      name: 'Annet Wilson',
      lastMessage: 'Hello!',
      date: '02 Aug',
      unreadCount: 2,
      messages: [
        {
          id: 1,
          content: 'Hello!',
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 2,
          content:
            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 3,
          content:
            'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using',
          sender: 'You',
          time: '10:01 AM'
        }
      ]
    },
    {
      id: 5,
      name: 'Annet Wilson',
      lastMessage: 'Hello!',
      date: '02 Aug',
      unreadCount: 2,
      messages: [
        {
          id: 1,
          content: 'Hello!',
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 2,
          content:
            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 3,
          content:
            'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using',
          sender: 'You',
          time: '10:01 AM'
        }
      ]
    },
    {
      id: 6,
      name: 'Annet Wilson',
      lastMessage: 'Hello!',
      date: '02 Aug',
      unreadCount: 2,
      messages: [
        {
          id: 1,
          content: 'Hello!',
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 2,
          content:
            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
          sender: 'Christopher Blake',
          time: '10:01 AM'
        },
        {
          id: 3,
          content:
            'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using',
          sender: 'You',
          time: '10:01 AM'
        }
      ]
    }
  ]
};
