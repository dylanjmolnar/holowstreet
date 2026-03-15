import React from 'react';
import { Typography, Box, Button, Grid, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { resolveImageUrl } from '../utils/imageUtils';

const Home: React.FC = () => {
  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          minHeight: { xs: '70vh', md: '80vh' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          mb: 6,
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          borderRadius: 4,
          overflow: 'hidden',
          p: { xs: 3, md: 8 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backgroundImage: `url(${resolveImageUrl('/uploads/hero.jpg')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
            opacity: 0.4
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 800, 
              mb: 2,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
              letterSpacing: '-0.02em',
              background: 'linear-gradient(to right, #fff, #aaa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            HolowStreet
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4, 
              fontWeight: 400,
              color: '#d1d5db',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              lineHeight: 1.6
            }}
          >
            Curated streetwear, accessories, and art to define your aesthetic. Explore our latest drops and exclusive collections.
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/shop"
            endIcon={<ArrowForwardIcon />}
            sx={{
              backgroundColor: '#ffffff',
              color: '#000000',
              px: { xs: 4, md: 6 },
              py: { xs: 1.5, md: 2 },
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '50px',
              textTransform: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#e5e7eb',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Shop Now
          </Button>
        </Box>
      </Box>

      {/* Featured Categories */}
      <Box sx={{ mb: 8, px: { xs: 2, md: 4 } }}>
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ 
            fontWeight: 700, 
            mb: 4,
            textAlign: 'center',
            letterSpacing: '-0.01em'
          }}
        >
          Explore Categories
        </Typography>
        <Grid container spacing={3}>
          {[
            { title: 'Apparel', img: resolveImageUrl('/uploads/apparel.jpg') },
            { title: 'Wall Art', img: resolveImageUrl('/uploads/wall-art.jpg') },
            { title: 'Accessories', img: resolveImageUrl('/uploads/accessories.jpg') }
          ].map((cat, index) => (
            <Grid size={{ xs: 12, sm: 4 }} key={index}>
              <Paper
                component={Link}
                to={`/shop?category=${encodeURIComponent(cat.title.toLowerCase())}`}
                elevation={0}
                sx={{
                  position: 'relative',
                  height: '350px',
                  borderRadius: 4,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    '& .cat-overlay': {
                      backgroundColor: 'rgba(0,0,0,0.3)'
                    }
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${cat.img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <Box
                  className="cat-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    transition: 'background-color 0.3s ease'
                  }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    position: 'relative',
                    zIndex: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  {cat.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

    </Box>
  );
};

export default Home;