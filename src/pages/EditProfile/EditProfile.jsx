import React from 'react';
import LoggedInLayout from '../LoggedInLayout/LoggedInLayout';
import EditProfileSection from '../../components/sections/EditProfile/EditProfile';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const EditProfile = () => {
  return (
    <>
      <SEOHelmet
        title="Edit Profile - HomeAI"
        description="Manage your HomeAI profile and preferences"
      />
      <LoggedInLayout>
        <EditProfileSection />
      </LoggedInLayout>
    </>
  );
};

export default EditProfile;
