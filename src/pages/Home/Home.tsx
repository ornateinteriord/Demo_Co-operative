import { useState, forwardRef } from 'react';
import { Box, Typography, Button, Container, Grid, Card, CardContent, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText, useMediaQuery, useTheme, Dialog, Slide } from "@mui/material";
import { TransitionProps } from '@mui/material/transitions';
import { Link, useNavigate } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import Login from '../Auth/Login';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLoginOpen = () => {
    setLoginOpen(true);
    setMobileOpen(false); // Close drawer if open
  };

  const handleLoginClose = () => {
    setLoginOpen(false);
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Privacy Policy', path: '/privacy-policy' }
  ];

  const features = [
    { icon: <AccountBalanceIcon sx={{ fontSize: 40, color: '#1a237e' }} />, title: "Secure Banking", description: "Experience safe and reliable cooperative banking tailored for our community." },
    { icon: <TrendingUpIcon sx={{ fontSize: 40, color: '#1a237e' }} />, title: "Growth Focused", description: "Attractive interest rates on deposits and flexible loan options to fuel your growth." },
    { icon: <SecurityIcon sx={{ fontSize: 40, color: '#1a237e' }} />, title: "Trusted Partner", description: "Built on transparency, trust, and a commitment to members' financial well-being." },
    { icon: <GroupsIcon sx={{ fontSize: 40, color: '#1a237e' }} />, title: "Community First", description: "Profits are reinvested to benefit our members and empower the local economy." }
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Navigation */}
      <AppBar position="fixed" sx={{ backgroundColor: 'white', color: '#1a237e', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', padding: { xs: '0 1rem', md: '0 4rem' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
             <AccountBalanceIcon sx={{ fontSize: 32 }} />
             <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
               Co-operative
             </Typography>
          </Box>
          
          {isMobile ? (
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {navItems.map((item) => (
                <Link key={item.label} to={item.path} style={{ textDecoration: 'none', color: '#475569', fontWeight: 500, fontSize: '1rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1a237e'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
                  {item.label}
                </Link>
              ))}
              <Button variant="contained" onClick={handleLoginOpen} sx={{ backgroundColor: '#1a237e', '&:hover': { backgroundColor: '#0a2558' }, borderRadius: '8px', padding: '0.5rem 1.5rem', textTransform: 'none', fontWeight: 600 }}>
                Login
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer variant="temporary" anchor="right" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}>
        <Box sx={{ textAlign: 'center', width: 250, paddingTop: 2 }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.label} disablePadding onClick={handleDrawerToggle}>
                <ListItemText primary={
                  <Link to={item.path} style={{ display: 'block', padding: '12px 24px', textDecoration: 'none', color: '#1a237e', fontWeight: 500 }}>
                    {item.label}
                  </Link>
                } />
              </ListItem>
            ))}
            <ListItem disablePadding sx={{ mt: 2, px: 3 }}>
              <Button fullWidth variant="contained" onClick={handleLoginOpen} sx={{ backgroundColor: '#1a237e', '&:hover': { backgroundColor: '#0a2558' } }}>
                Login
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Hero Section */}
      <Box sx={{ paddingTop: '80px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1a237e 0%, #0a2558 100%)', 
          color: 'white', 
          padding: { xs: '4rem 1rem', md: '8rem 4rem' },
          textAlign: 'center',
          borderRadius: { xs: '0 0 2rem 2rem', md: '0 0 4rem 4rem' },
          boxShadow: '0 10px 30px rgba(26, 35, 126, 0.2)'
        }}>
          <Container maxWidth="md">
            <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: '2.5rem', md: '4rem' }, marginBottom: '1.5rem', lineHeight: 1.2 }}>
              Empowering Communities, Building Futures
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, marginBottom: '2.5rem', lineHeight: 1.6 }}>
              Your trusted financial partner for a secure and prosperous tomorrow. Join our cooperative society and experience banking that puts you first.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" onClick={handleLoginOpen} sx={{ backgroundColor: '#FFC000', color: '#1a237e', fontWeight: 700, padding: '1rem 2.5rem', borderRadius: '50px', '&:hover': { backgroundColor: '#e6ad00' } }}>
                Get Started
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/about')} sx={{ borderColor: 'white', color: 'white', fontWeight: 600, padding: '1rem 2.5rem', borderRadius: '50px', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                Learn More
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ paddingY: { xs: '4rem', md: '6rem' } }}>
          <Box sx={{ textAlign: 'center', marginBottom: '4rem' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Why Choose Us?
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
              We provide a comprehensive suite of financial services designed with the community's best interests at heart.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none', transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' } }}>
                  <CardContent sx={{ padding: '2rem', textAlign: 'center' }}>
                    <Box sx={{ backgroundColor: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Login Modal */}
      <Dialog
        open={loginOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleLoginClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible', // Allow blur effects from Login to show
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(10, 37, 88, 0.5)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <Login isModal={true} />
      </Dialog>
    </Box>
  );
};

export default Home;
