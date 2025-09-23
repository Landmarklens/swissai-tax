import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardHeader,
    CardContent,
    CircularProgress,
    Link
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
    getBillingHistory,
    selectSubscriptions
} from '../../../../store/slices/subscriptionsSlice';

const BillingHistory = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const { billingHistory } = useSelector(selectSubscriptions);

    useEffect(() => {
        dispatch(getBillingHistory());
    }, [dispatch]);

    const renderBillingHistory = () => {
        if (billingHistory.loading) {
            return (
                <Box display="flex" justifyContent="center" mt={2}>
                    <CircularProgress size={18} sx={{ color: '#000' }} />
                </Box>
            );
        }

        if (billingHistory.error) {
            return (
                <Box mt={2} display="flex">
                    <Typography fontSize={16} color="#ed4347">
                        {billingHistory.error ?? 'Something went wrong...'}
                    </Typography>
                </Box>
            );
        }

        if (!billingHistory.data || !Array.isArray(billingHistory.data) || billingHistory.data.length === 0) {
            return (
                <Box mt={2} display="flex">
                    <Typography fontSize={16}>Billing History is empty</Typography>
                </Box>
            );
        }

        return (
            <Box mt={2} display="flex" flexDirection="column" gap={2}>
                {billingHistory.data.map((item, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" flexDirection="column">
                            <Typography
                                sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    color: '#000'
                                }}>
                                {item.plan}
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center">
                                <Typography color="#000">₣{item.amount_paid}</Typography>
                                <Typography color="#000">|</Typography>
                                <Typography color="#000">{dayjs(item.created).format('DD/MM/YYYY')}</Typography>
                            </Box>
                        </Box>
                        <Link href={item.receipt_url} target="_blank" color="primary" underline="always">
                            {t('Download')}
                        </Link>
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Box
            sx={{
                p: {
                    lg: 3,
                    md: 2,
                    xs: 1.5
                },
                width: '100%'
            }}>
            <Card>
                <CardContent>
                    <CardHeader
                        title="Billing History"
                        sx={{
                            p: 0,
                            pb: 1,
                            borderBottom: '1px solid #d4d4d4',
                            alignItems: 'center',
                            fontSize: 18
                        }}
                    />
                    {renderBillingHistory()}
                </CardContent>
            </Card>
        </Box>
    );
};

export default BillingHistory;