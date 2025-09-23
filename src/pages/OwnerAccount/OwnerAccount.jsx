import React from 'react';
import LoggedInLayout from '../LoggedInLayout/LoggedInLayout';
import OwnerAccountSection from '../../components/sections/OwnerAccount/OwnerAccount';
import LoggedInFooter from '../LoggedInFooter/LoggedInFooter';
import Footer from '../../components/footer/Footer';

const OwnerAccount = () => {
  return (
    <LoggedInLayout hideSubscription>
      <OwnerAccountSection />
      <Footer />
    </LoggedInLayout>
  );
};

export default OwnerAccount;
