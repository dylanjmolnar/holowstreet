import { Container, Typography, Box, Paper } from '@mui/material';

const About = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          About the Artist
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to HolowStreet. I'm a local artist driven by a tri-fold passion: art, cars, and tattoos. 
          For me, these worlds aren't separate; they're different canvases for the same creative energy.
        </Typography>
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="medium">
            Art & Design
          </Typography>
          <Typography variant="body1" paragraph>
            My work is heavily influenced by the raw aesthetics of street culture and the precision of fine line work. 
            Every piece in the shop is a reflection of my journey as a creator.
          </Typography>
        </Box>
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="medium">
            Cars & Machines
          </Typography>
          <Typography variant="body1" paragraph>
            The flow of a car's lines, the grit of the garage, and the sound of a finely tuned engine—machines 
            are a constant source of inspiration for my designs and my lifestyle.
          </Typography>
        </Box>
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="medium">
            Tattoo Culture
          </Typography>
          <Typography variant="body1" paragraph>
            Tattoos are the ultimate expression of permanence and personal storytelling. The discipline 
            and artistry of tattooing fuel my attention to detail in everything I create.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default About;
