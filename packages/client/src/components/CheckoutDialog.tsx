import { useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, Typography, Box, TextField,
  Button, Tabs, Tab, CircularProgress, Alert, Divider, IconButton,
  Checkbox, FormControlLabel, Grid, Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
}

const StripeCardForm = ({
  customerName,
  customerEmail,
  onSuccess,
  onError,
  total,
  items,
  shippingAddress,
  billingAddress,
}: {
  customerName: string;
  customerEmail: string;
  onSuccess: (orderId: number) => void;
  onError: (msg: string) => void;
  total: number;
  items: any[];
  shippingAddress: any;
  billingAddress: any;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    onError('');

    try {
      // 1. Create PaymentIntent on server
      const { data } = await axios.post(`${API_BASE_URL}/api/stripe/create-payment-intent`, {
        amount: total,
      });

      // 2. Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerName,
            email: customerEmail,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // 3. Create order in our DB
        const orderRes = await axios.post(`${API_BASE_URL}/api/stripe/confirm-order`, {
          customer_name: customerName,
          customer_email: customerEmail,
          ...shippingAddress,
          ...billingAddress,
          total_amount: total,
          items,
          payment_intent_id: paymentIntent.id,
        });
        onSuccess(orderRes.data.orderId);
      }
    } catch (err: any) {
      onError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box
        sx={{
          border: '1px solid #444',
          borderRadius: 2,
          p: 2,
          mb: 3,
          '& .StripeElement': {
            padding: '12px',
          },
        }}
      >
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#fff',
                '::placeholder': { color: '#888' },
              },
              invalid: { color: '#ff6b6b' },
            },
          }}
        />
      </Box>
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={!stripe || loading}
        startIcon={loading ? <CircularProgress size={20} /> : <CreditCardIcon />}
        sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
      >
        {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </Button>
    </Box>
  );
};

// ─── Main CheckoutDialog ───
const CheckoutDialog = ({ open, onClose }: CheckoutDialogProps) => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [error, setError] = useState('');
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Address State
  const [shippingAddress, setShippingAddress] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'USA'
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    billing_address: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    billing_country: 'USA'
  });

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newState = { ...shippingAddress, [name]: value };
    setShippingAddress(newState);
    if (billingSameAsShipping) {
      const billingKey = name.replace('shipping_', 'billing_');
      setBillingAddress(prev => ({ ...prev, [billingKey]: value }));
    }
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleBilling = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setBillingSameAsShipping(isChecked);
    if (isChecked) {
      setBillingAddress({
        billing_address: shippingAddress.shipping_address,
        billing_city: shippingAddress.shipping_city,
        billing_state: shippingAddress.shipping_state,
        billing_zip: shippingAddress.shipping_zip,
        billing_country: shippingAddress.shipping_country
      });
    }
  };

  const total = getCartTotal();
  const orderItems = cartItems.map((item) => ({
    product_id: item.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    price: item.price,
    color: item.color,
    size: item.size,
  }));

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const isInfoValid = 
    customerName.trim() !== '' && 
    validateEmail(customerEmail) &&
    shippingAddress.shipping_address.trim() !== '' &&
    shippingAddress.shipping_city.trim() !== '' &&
    shippingAddress.shipping_zip.trim() !== '' &&
    (shippingAddress.shipping_country !== 'USA' || US_STATES.includes(shippingAddress.shipping_state)) &&
    (billingSameAsShipping || (
      billingAddress.billing_address.trim() !== '' &&
      billingAddress.billing_city.trim() !== '' &&
      billingAddress.billing_zip.trim() !== '' &&
      (billingAddress.billing_country !== 'USA' || US_STATES.includes(billingAddress.billing_state))
    ));

  const handleSuccess = (orderId: number) => {
    clearCart();
    onClose();
    navigate('/order-confirmation', { state: { orderId } });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Checkout</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Order Summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Order Summary
          </Typography>
          {cartItems.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">
                {item.name} × {item.quantity}
                {item.color && ` (${item.color}`}
                {item.size && `, ${item.size}`}
                {item.color && ')'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ${(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${total.toFixed(2)}</Typography>
          </Box>
        </Box>

        {/* Customer Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Your Information
          </Typography>
          <TextField
            label="Full Name"
            fullWidth
            size="small"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Email"
            fullWidth
            size="small"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            sx={{ mb: 0 }}
          />
        </Box>

        {/* Shipping Address */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Shipping Address
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                name="shipping_address"
                fullWidth
                size="small"
                value={shippingAddress.shipping_address}
                onChange={handleShippingChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="City"
                name="shipping_city"
                fullWidth
                size="small"
                value={shippingAddress.shipping_city}
                onChange={handleShippingChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              {shippingAddress.shipping_country === 'USA' ? (
                <Autocomplete
                  freeSolo
                  options={US_STATES}
                  size="small"
                  value={shippingAddress.shipping_state}
                  onChange={(_, newValue) => {
                    const e = { target: { name: 'shipping_state', value: newValue || '' } } as any;
                    handleShippingChange(e);
                  }}
                  onInputChange={(_, newValue) => {
                    const e = { target: { name: 'shipping_state', value: newValue || '' } } as any;
                    handleShippingChange(e);
                  }}
                  blurOnSelect
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="State" 
                      required 
                    />
                  )}
                  disableClearable={false}
                />
              ) : (
                <TextField
                  label="State"
                  name="shipping_state"
                  fullWidth
                  size="small"
                  value={shippingAddress.shipping_state}
                  onChange={handleShippingChange}
                />
              )}
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Zip Code"
                name="shipping_zip"
                fullWidth
                size="small"
                value={shippingAddress.shipping_zip}
                onChange={handleShippingChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Country"
                name="shipping_country"
                fullWidth
                size="small"
                value={shippingAddress.shipping_country}
                onChange={handleShippingChange}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Billing Address Toggle */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={billingSameAsShipping} 
                onChange={handleToggleBilling}
                color="primary"
              />
            }
            label={<Typography variant="body2">Billing same as shipping</Typography>}
          />
        </Box>

        {/* Billing Address (if different) */}
        {!billingSameAsShipping && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Billing Address
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address"
                  name="billing_address"
                  fullWidth
                  size="small"
                  value={billingAddress.billing_address}
                  onChange={handleBillingChange}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="City"
                  name="billing_city"
                  fullWidth
                  size="small"
                  value={billingAddress.billing_city}
                  onChange={handleBillingChange}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                {billingAddress.billing_country === 'USA' ? (
                  <Autocomplete
                    freeSolo
                    options={US_STATES}
                    size="small"
                    value={billingAddress.billing_state}
                    onChange={(_, newValue) => {
                      const e = { target: { name: 'billing_state', value: newValue || '' } } as any;
                      handleBillingChange(e);
                    }}
                    onInputChange={(_, newValue) => {
                      const e = { target: { name: 'billing_state', value: newValue || '' } } as any;
                      handleBillingChange(e);
                    }}
                    blurOnSelect
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="State" 
                        required 
                      />
                    )}
                  />
                ) : (
                  <TextField
                    label="State"
                    name="billing_state"
                    fullWidth
                    size="small"
                    value={billingAddress.billing_state}
                    onChange={handleBillingChange}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Zip Code"
                  name="billing_zip"
                  fullWidth
                  size="small"
                  value={billingAddress.billing_zip}
                  onChange={handleBillingChange}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Country"
                  name="billing_country"
                  fullWidth
                  size="small"
                  value={billingAddress.billing_country}
                  onChange={handleBillingChange}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Payment Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth">
            <Tab label="💳 Card" disabled={!isInfoValid} />
            <Tab label="PayPal" disabled={!isInfoValid} />
          </Tabs>
        </Box>

        {!isInfoValid && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
            Please fill in your name, email, and shipping address to continue.
          </Typography>
        )}

        {/* Stripe Tab */}
        {tabValue === 0 && isInfoValid && (
          <Elements stripe={stripePromise}>
            <StripeCardForm
              customerName={customerName}
              customerEmail={customerEmail}
              onSuccess={handleSuccess}
              onError={setError}
              total={total}
              items={orderItems}
              shippingAddress={shippingAddress}
              billingAddress={billingAddress}
            />
          </Elements>
        )}

        {/* PayPal Tab */}
        {tabValue === 1 && isInfoValid && (
          <Box>
            {paypalLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            <PayPalButtons
              style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
              createOrder={async () => {
                setError('');
                const { data } = await axios.post(`${API_BASE_URL}/api/paypal/create-order`, {
                  amount: total,
                });
                return data.orderID;
              }}
              onApprove={async (data: any) => {
                setPaypalLoading(true);
                try {
                  const res = await axios.post(`${API_BASE_URL}/api/paypal/capture-order`, {
                    orderID: data.orderID,
                    customer_name: customerName,
                    customer_email: customerEmail,
                    ...shippingAddress,
                    ...billingAddress,
                    total_amount: total,
                    items: orderItems,
                  });
                  handleSuccess(res.data.orderId);
                } catch (err: any) {
                  setError('PayPal payment failed. Please try again.');
                } finally {
                  setPaypalLoading(false);
                }
              }}
              onError={() => {
                setError('Something went wrong with PayPal. Please try again.');
              }}
              onCancel={() => {
                setError('Payment was cancelled.');
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
