import { useTranslation } from 'react-i18next';

export const useGetAccountNavigation = () => {
  const { t } = useTranslation();

  return [
    {
      name: 'searches',
      title: t('My Searches')
    },
    {
      name: 'saved-properties',
      title: t('Saved Properties')
    },
    {
      name: 'subscription',
      title: t('Subscription')
    },
    {
      name: 'billing-history',
      title: t('Billing History')
    }
    // {
    //   name: 'payments',
    //   title: 'Payments'
    // },
    // {
    //   name: 'viewings',
    //   title: t('My Viewings')
    // },
    // {
    //   name: 'contact',
    //   title: t('Contact Manager')
    // },
    // {
    //   name: 'notes',
    //   title: t('Notes')
    // }
  ];
};
