import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoggedInLayout from '../LoggedInLayout/LoggedInLayout';
import MyAccountSection from '../../components/sections/MyAccount/MyAccount';
import { fetchUserProfile, selectAccount } from '../../store/slices/accountSlice';
import { useMediaQuery } from '@mui/material';
import { theme } from '../../theme/theme';
import Footer from '../../components/footer/Footer';

const MyAccount = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data } = useSelector(selectAccount);

  const [opened, setOpened] = useState(false);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const search = localStorage.getItem('input');

    if (search && search.trim()) {
      localStorage.removeItem('input');
      const decodedSearch = decodeURIComponent(search);
      return navigate(`/chat?input=${encodeURIComponent(decodedSearch)}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (!data) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, data]);

  useEffect(() => {
    if (isMobile && opened) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobile, opened]);

  return (
    <LoggedInLayout>
      <MyAccountSection data={data} setOpened={setOpened} opened={opened} />
      <Footer />
    </LoggedInLayout>
  );
};

export default MyAccount;
