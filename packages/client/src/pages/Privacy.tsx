import { Container, Typography, Paper } from '@mui/material';

const Privacy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          Privacy Policy
        </Typography>
        <Typography variant="body1" paragraph>
          At HolowStreet, we value your privacy above all else. Our policy is simple and transparent.
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Data Collection
        </Typography>
        <Typography variant="body1" paragraph>
          We do not store or use any more data than is legally and technically required to process your order. 
          The information we collect is used solely for shipping and fulfillment purposes.
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Payment Security
        </Typography>
        <Typography variant="body1" paragraph>
          Your card or banking information is **never** processed or stored on our servers. 
          All transactions are handled through secure, industry-leading payment gateways (like Stripe and PayPal), 
          ensuring your sensitive financial data remains private and protected.
        </Typography>
        <Typography variant="body1" sx={{ mt: 4, fontStyle: 'italic' }}>
          By using our shop, you agree to this straightforward approach to your data.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Privacy;
