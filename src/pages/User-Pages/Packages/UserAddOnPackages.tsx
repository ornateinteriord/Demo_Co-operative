import React, { useState, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Autocomplete,
  TextField,
  Divider,
  InputAdornment,
  Chip,
  LinearProgress,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StarsIcon from '@mui/icons-material/Stars';
import DownloadIcon from '@mui/icons-material/Download';
import UserContext from '../../../context/user/userContext';
import { useRequestAddOnMutation, useGetMemberAddOns } from '../../../api/Packages';
import { openBondCertificate } from '../../../utils/BondCertificateGenerator';

export const UserAddOnPackages = () => {
  const { user } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view'); // 'fd' or 'addon'

  const [packageAmount, setPackageAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: requestAddOn } = useRequestAddOnMutation();
  const { data: addOns = [], isLoading: addOnsLoading } = useGetMemberAddOns(user?.Member_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageAmount || !user?.Member_id) return;

    setIsSubmitting(true);

    requestAddOn({
      member_id: user.Member_id,
      requested_amount: Number(packageAmount)
    }, {
      onSuccess: () => {
        setIsSubmitting(false);
        setPackageAmount('');
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  };

  if (!user) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 10 }} />;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, mt: { xs: 3, md: 7 } }}>
      {/* ── ROW 1: CENTERED REQUEST FORM (Only if view is 'addon' or empty) ── */}
      {(!view || view === 'addon') && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: view === 'addon' ? 0 : 6 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#0a2558', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AddCircleOutlineIcon sx={{ fontSize: 28, color: '#ed6c02' }} />
            Request Add-On Package
          </Typography>
          <Card sx={{
            boxShadow: '0 8px 32px rgba(10,37,88,0.08)',
            borderRadius: '16px',
            border: '1px dashed #90a4d4',
            backgroundColor: '#fdfdff',
            maxWidth: 500,
            width: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5 }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 32, color: '#ed6c02', mr: 2, mt: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Purchase an independent add-on package with its own 300-day ROI cycle.
                  Runs parallel to your primary investment!
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <Autocomplete
                  freeSolo
                  options={["1000", "2000", "5000", "10000", "25000", "50000", "100000", "250000", "500000", "1000000", "2500000"]}
                  value={packageAmount}
                  onChange={(_, newValue) => setPackageAmount(newValue || '')}
                  onInputChange={(_, newInputValue) => setPackageAmount(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Amount (₹)"
                      variant="outlined"
                      size="medium"
                      placeholder="e.g. 10000"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PaymentsIcon sx={{ color: '#0a2558', fontSize: 20 }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          backgroundColor: 'white',
                        },
                      }}
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={!packageAmount || isSubmitting}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    backgroundColor: '#0a2558',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'none',
                    borderRadius: '12px',
                    '&:hover': { backgroundColor: '#153b93' }
                  }}
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Deposit Request'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── ROW 2: ACTIVE PORTFOLIO (Only if view is 'fd' or empty) ── */}
      {(!view || view === 'fd') && (
        <>
          <Box sx={{ mb: 4, mt: view === 'fd' ? 0 : 4 }}>
            <Typography variant="h5" sx={{ color: '#0a2558', fontWeight: 900, letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 4, height: 24, backgroundColor: '#ed6c02', borderRadius: 1 }} />
              My Deposits
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, ml: 2, fontWeight: 500 }}>
              Manage your primary investment and independent add-on tracks.
            </Typography>
          </Box>

      {addOnsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#0a2558' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {(() => {
            // Check if the primary package is already in the add-ons list (new logic)
            const primaryInAddOns = addOns.find((a: any) => a.package_id?.startsWith('PKG-P-'));
            
            // If we found it in the list, we don't need to manually create the primaryPkg object
            // But we should mark it as primary for styling
            let finalAddOns = [...addOns];
            if (primaryInAddOns) {
              finalAddOns = addOns.map((a: any) => 
                a.package_id === primaryInAddOns.package_id ? { ...a, isPrimary: true } : a
              );
            }

            const totalAddOnAmount = addOns.reduce((sum: number, a: any) => sum + (a.amount || a.requested_amount || 0), 0);
            
            // For legacy users, we still need to calculate the base amount if it's not in the add-on table
            const baseAmount = (user.package_value || 0) - (primaryInAddOns ? 0 : totalAddOnAmount);

            const primaryPkg = {
              request_id: 'PRIMARY',
              isPrimary: true,
              requested_amount: baseAmount > 0 ? baseAmount : (user.package_value || 0),
              roi_status: user.roi_status || 'Active',
              roi_payout_target: user.roi_payout_target || ((user.package_value || 0) * 2),
              roi_payout_count: user.roi_payout_count || 0,
              roi_start_date: user.roi_start_date || user.Date_of_joining,
            };

            // If primary is already in add-ons, just use the mapped list, otherwise prepend the manual primaryPkg
            const allPackages = primaryInAddOns ? finalAddOns : [primaryPkg, ...addOns];

            return allPackages.map((pkg: any, index: number) => {
              const pkgAmount = pkg.amount || pkg.requested_amount || 0;
              const pkgId = pkg.package_id || pkg.request_id || 'N/A';
              const totalDays = pkg.isFD 
                ? (moment(pkg.date_of_maturity).diff(moment(pkg.roi_start_date), 'days') || 1)
                : 300;
              const pkgProgress = pkg.roi_payout_count ? Math.min((pkg.roi_payout_count / totalDays) * 100, 100) : 0;
              const pkgTarget = pkg.roi_payout_target || (pkgAmount * 2);
              const pkgDailyROI = pkgTarget > 0 ? parseFloat((pkgTarget / 300).toFixed(2)) : 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={pkgId}>
                  <Card sx={{
                    height: '100%',
                    boxShadow: pkg.isPrimary ? '0 10px 30px rgba(10,37,88,0.12)' : '0 4px 15px rgba(0,0,0,0.06)',
                    borderRadius: '16px',
                    border: pkg.isPrimary ? '2px solid #0a2558' : '1px solid #e3eafc',
                    backgroundColor: pkg.isPrimary ? '#f9fbff' : 'white',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            {pkg.isPrimary ? <StarsIcon sx={{ fontSize: 14, color: '#0a2558' }} /> : (pkg.isFD ? <AccountBalanceIcon sx={{ fontSize: 14, color: '#ed6c02' }} /> : <PaymentsIcon sx={{ fontSize: 14, color: 'text.secondary' }} />)}
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 800, color: pkg.isPrimary ? '#0a2558' : (pkg.isFD ? '#ed6c02' : 'text.secondary'), textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {pkg.isPrimary ? 'Primary Package' : (pkg.isFD ? 'Fixed Deposit' : `My Deposit #${index}`)}
                            </Typography>
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 900, fontSize: '1.4rem', color: '#0a2558', lineHeight: 1.2 }}>
                            ₹{pkgAmount.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                        <Chip
                          label={pkg.roi_status}
                          size="small"
                          color={pkg.roi_status === 'Active' ? 'success' : 'default'}
                          sx={{ height: 24, fontSize: '0.75rem', fontWeight: 800, borderRadius: '6px' }}
                        />
                      </Box>

                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block', fontWeight: 600 }}>
                          {pkg.isFD ? 'Interest Rate' : 'Daily ROI'}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1565c0', fontSize: '1.1rem' }}>
                          {pkg.isFD ? `${pkg.interest_rate || 0}% p.a.` : `₹${pkgDailyROI.toLocaleString('en-IN')}`}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                          {pkg.isFD ? `Matures ${moment(pkg.date_of_maturity).format('DD MMM YYYY')}` : `Day ${pkg.roi_payout_count} of 300`}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 700 }}>{pkgProgress.toFixed(0)}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pkgProgress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#f0f4ff',
                          '& .MuiLinearProgress-bar': {
                            background: pkg.isPrimary ? 'linear-gradient(90deg, #ed6c02, #0a2558)' : 'linear-gradient(90deg, #1565c0, #0a2558)',
                            borderRadius: 4
                          }
                        }}
                      />

                      {/* Download Bond Button */}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => openBondCertificate({
                          memberNumber: user.Member_id,
                          memberName: user.Name,
                          dob: user.dob,
                          fatherName: user.Father_name,
                          address: user.address,
                          accountNo: user.account_number || pkg.package_id || `FD${pkgId.toString().slice(-5)}`,
                          commencementDate: pkg.roi_start_date || user.Date_of_joining || new Date().toISOString(),
                          planTerm: 'FD / 365 days',
                          planAmount: pkgAmount,
                          interestRate: 9.0,
                          aadhaarNo: user.aadharcard_no,
                          panNo: user.Pan_no,
                          nomineeName: user.Nominee_name,
                          nomineeRelation: user.Nominee_Relation,
                          branchCode: '004',
                          branch: 'UDUPI',
                          profilePhotoUrl: user.profile_image,
                        })}
                        sx={{
                          mt: 2,
                          width: '100%',
                          borderColor: '#0a2558',
                          color: '#0a2558',
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          '&:hover': { bgcolor: '#0a2558', color: '#fff' }
                        }}
                      >
                        Download Bond Certificate
                      </Button>

                      <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ color: 'text.disabled', fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 500 }}>
                            {new Date(pkg.roi_start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', opacity: 0.6, fontFamily: 'monospace', fontWeight: 500 }}>
                          #{pkgId.toString().slice(-8)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            });
          })()}
          </Grid>
        )}
      </>
    )}
  </Box>
);
};

export default UserAddOnPackages;
