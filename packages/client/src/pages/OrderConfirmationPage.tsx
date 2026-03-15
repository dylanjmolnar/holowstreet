import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
      <Typography variant="h4" component="h1" gutterBottom>
        Thank You for Your Order!
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Your order has been placed successfully.
      </Typography>
      {orderId && (
        <Typography variant="body1" sx={{ mt: 2, mb: 4 }}>
          Your Order ID is: <strong>{String(orderId).padStart(5, '0')}</strong>
        </Typography>
      )}
      <Button variant="contained" onClick={handleGoHome}>
        Continue Shopping
      </Button>
    </Box>
  );
};

export default OrderConfirmationPage;
