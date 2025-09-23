import './subscription.scss';
import { useDispatch } from 'react-redux';
import { PlanCard } from '../../../PlanCard/PlanCard';
import { useEffect } from 'react';
import { getPlans } from '../../../../store/slices/subscriptionsSlice';

export const featuresPlan = [
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
];

const Subscription = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getPlans());
  }, [dispatch]);

  return (
    <section className="plans-section">
      <h2 className="title">Subscription</h2>
      <div className="wrapper-content">
        <PlanCard title="Premium Advance Search" price="CHF 99.99" keyFeatures={featuresPlan} />
      </div>
    </section>
  );
};

export default Subscription;
