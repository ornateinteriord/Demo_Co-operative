import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AccountOpeningForm from '../../../components/AccountOpening/AccountOpeningForm';
import { 
  Box, Paper, Typography, Container, Button, Grid, IconButton, 
  Divider, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, InputAdornment 
} from '@mui/material';
import TokenService from '../../../api/token/tokenService';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'react-toastify';
import * as MemberQueries from '../../../queries/Member';
import { useGetTransactionDetails, useTransferMoney } from '../../../api/Memeber';
import { exportToExcel } from '../../../utils/excelExport';
import DataTable from "react-data-table-component";
import { DASHBOARD_CUTSOM_STYLE, getTransactionColumns } from "../../../utils/DataTableColumnsProvider";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const ACCOUNT_THEMES: Record<string, any> = {
    SB: {
        primary: '#1a237e',
        secondary: '#0d47a1',
        light: '#bfdbfe',
        gradient: 'linear-gradient(135deg, #1a237e 0%, #0f172a 100%)',
        shadow: '0 4px 14px 0 rgba(26, 35, 126, 0.25)',
    },
    CA: {
        primary: '#1b5e20',
        secondary: '#2e7d32',
        light: '#bbf7d0',
        gradient: 'linear-gradient(135deg, #1b5e20 0%, #064e3b 100%)',
        shadow: '0 4px 14px 0 rgba(27, 94, 32, 0.25)',
    },
    RD: {
        primary: '#e65100',
        secondary: '#ef6c00',
        light: '#fed7aa',
        gradient: 'linear-gradient(135deg, #e65100 0%, #7c2d12 100%)',
        shadow: '0 4px 14px 0 rgba(230, 81, 0, 0.25)',
    },
    FD: {
        primary: '#4a148c',
        secondary: '#6a1b9a',
        light: '#e9d5ff',
        gradient: 'linear-gradient(135deg, #4a148c 0%, #4c1d95 100%)',
        shadow: '0 4px 14px 0 rgba(74, 20, 140, 0.25)',
    },
    PIGMY: {
        primary: '#f57f17',
        secondary: '#fbc02d',
        light: '#fef08a',
        gradient: 'linear-gradient(135deg, #f57f17 0%, #b45309 100%)',
        shadow: '0 4px 14px 0 rgba(245, 127, 23, 0.25)',
    },
    MIS: {
        primary: '#006064',
        secondary: '#00838f',
        light: '#99f6e4',
        gradient: 'linear-gradient(135deg, #006064 0%, #164e63 100%)',
        shadow: '0 4px 14px 0 rgba(0, 96, 100, 0.25)',
    }
};

const UserAccountOpening = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const memberId = TokenService.getMemberId() || '';
  const [showBalance, setShowBalance] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Self Transfer State
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [targetAccountNo, setTargetAccountNo] = useState('');

  // Map route param to account type
  const rawType = type?.toUpperCase() || 'SB';
  const accountType = rawType === 'CUR' || rawType === 'CA' ? 'CA' : (rawType === 'PIGMY' ? 'PIGMY' : rawType);
  const theme = ACCOUNT_THEMES[accountType] || ACCOUNT_THEMES.SB;

  const { data: myAccountsData, isLoading: loadingMyAccounts } = MemberQueries.useGetMyAccounts();
  const accountGroup = myAccountsData?.data?.accountTypes?.find((acc: any) => acc.account_group_name === accountType);
  const existingAccount = accountGroup?.accounts?.[0];

  // Dynamically update body class for the entire page
  useEffect(() => {
    const className = `theme-${accountType.toLowerCase()}`;
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, [accountType]);

  // All accounts for self-transfer destination
  const allMyAccounts = useMemo(() => {
    const accounts: any[] = [];
    myAccountsData?.data?.accountTypes?.forEach((group: any) => {
        group.accounts?.forEach((acc: any) => {
            if (acc.status?.toLowerCase() === 'active') {
                accounts.push({
                    ...acc,
                    groupName: group.account_group_name
                });
            }
        });
    });
    return accounts;
  }, [myAccountsData]);

  const transferMoneyMutation = useTransferMoney();

  // Fetch transactions for statement if account exists
  const { data: txData, isLoading: loadingTx } = useGetTransactionDetails('all', accountGroup?.account_type || accountType);
  const transactions = txData?.data || [];

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter((tx: any) => 
      Object.values(tx).some(val => val?.toString().toLowerCase().includes(query))
    );
  }, [transactions, searchQuery]);

  const handleDownloadStatement = () => {
    if (!existingAccount) {
      toast.error('No active account found to download statement');
      return;
    }

    if (loadingTx) {
      toast.info('Fetching transaction history, please wait...');
      return;
    }

    const transactions = txData?.data || [];
    if (transactions.length === 0) {
      toast.info('No transaction history found for this account');
      return;
    }

    exportToExcel({
      fileName: `${accountType}_Statement_${existingAccount.account_no}`,
      title: `${accountType} Account Statement - ${existingAccount.account_no}`,
      columns: [
        { header: 'Date', key: 'transaction_date', width: 20 },
        { header: 'Transaction ID', key: 'transaction_id', width: 20 },
        { header: 'Type', key: 'transaction_type', width: 15 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Credit (₹)', key: 'credit', width: 15 },
        { header: 'Debit (₹)', key: 'debit', width: 15 },
        { header: 'Balance (₹)', key: 'balance', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      data: transactions.map((tx: any) => ({
        ...tx,
        transaction_date: tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('en-GB') : (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB') : ''),
        credit: tx.credit || tx.ew_credit || 0,
        debit: tx.debit || tx.ew_debit || 0,
        balance: tx.balance || tx.net_amount || tx.previous_balance || 0
      })),
      statusField: 'status'
    });

    toast.success('Statement downloaded successfully');
  };

  const handleSelfTransfer = async () => {
    if (!existingAccount) return;
    if (!targetAccountNo) {
        toast.error('Please select a target account');
        return;
    }
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
    }

    const targetAccount = allMyAccounts.find(acc => acc.account_no === targetAccountNo);
    if (!targetAccount) return;

    if (targetAccount.account_no === existingAccount.account_no) {
        toast.error('Cannot transfer to the same account');
        return;
    }

    try {
        await transferMoneyMutation.mutateAsync({
            from: {
                member_id: memberId,
                account_id: existingAccount.account_id || existingAccount._id,
                account_no: existingAccount.account_no,
                account_type: existingAccount.account_type || accountType
            },
            to: {
                member_id: memberId,
                account_id: targetAccount.account_id || targetAccount._id,
                account_no: targetAccount.account_no,
                account_type: targetAccount.account_type || targetAccount.groupName
            },
            amount: parseFloat(transferAmount)
        });
        setTransferDialogOpen(false);
        setTransferAmount('');
        setTargetAccountNo('');
    } catch (error) {
        // Error handled in mutation
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'transparent', 
      pt: { xs: 2, md: 4 },
      pb: 8,
      px: { xs: 1, sm: 2 },
      transition: 'background 0.3s ease'
    }}>
      <Container maxWidth="lg">
        {/* Top Header with Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/user/dashboard')}
            sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', '&:hover': { bgcolor: '#f1f5f9' } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 900, color: theme.primary }}>
            Back to Dashboard
          </Typography>
        </Box>

        {/* Main Form Card */}
        <Paper elevation={0} sx={{ 
          p: { xs: 1.5, sm: 3, md: 4 }, 
          borderRadius: '24px',
          border: `1px solid ${theme.primary}15`,
          boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{ mt: 2 }}>
            {loadingMyAccounts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : existingAccount ? (
              <Box>
                {/* Account Overview Header */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ 
                      p: 3, 
                      borderRadius: '24px', 
                      background: theme.gradient,
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: theme.shadow
                    }}>
                      {/* Decorative Circle */}
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -40, 
                        right: -40, 
                        width: 150, 
                        height: 150, 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.1)' 
                      }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Account Type
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {existingAccount.account_group_name}
                          </Typography>
                        </Box>
                        <AccountBalanceWalletIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 40 }} />
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Account Number
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '1px' }}>
                          {existingAccount.account_no === 'NaN' || !existingAccount.account_no ? existingAccount.account_id : existingAccount.account_no}
                        </Typography>
                      </Box>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Available Balance
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                              {showBalance ? `₹${Number(existingAccount.account_amount || 0).toLocaleString('en-IN')}` : '••••••••'}
                            </Typography>
                            <IconButton onClick={() => setShowBalance(!showBalance)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {showBalance ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          px: 2, 
                          py: 0.5, 
                          borderRadius: '12px', 
                          bgcolor: existingAccount.status?.toLowerCase() === 'active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                          color: existingAccount.status?.toLowerCase() === 'active' ? '#4ade80' : '#f87171',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          {existingAccount.status || 'Active'}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ 
                      p: 3, 
                      borderRadius: '24px', 
                      bgcolor: theme.light,
                      border: `1px solid ${theme.primary}20`,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 2
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: theme.primary, mb: 1 }}>
                        Actions
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CompareArrowsIcon />}
                        onClick={() => setTransferDialogOpen(true)}
                        sx={{ 
                          borderRadius: '12px', 
                          py: 1.5, 
                          bgcolor: theme.primary, 
                          '&:hover': { bgcolor: theme.secondary },
                          boxShadow: theme.shadow
                        }}
                      >
                        Self Transfer
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadStatement}
                        disabled={loadingTx}
                        sx={{ 
                          borderRadius: '12px', 
                          py: 1.5, 
                          bgcolor: '#1e293b', 
                          '&:hover': { bgcolor: '#0f172a' }
                        }}
                      >
                        Statement
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => navigate(`/user/transactions?type=${existingAccount.account_type}`)}
                        sx={{ 
                          borderRadius: '12px', 
                          py: 1.5,
                          borderColor: theme.primary,
                          color: theme.primary,
                          '&:hover': { borderColor: theme.secondary, color: theme.secondary, bgcolor: `${theme.primary}0a` }
                        }}
                      >
                        Full History
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Transactions Section */}
                <Box sx={{ mt: 6 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon sx={{ color: theme.primary }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Recent Transactions
                      </Typography>
                    </Box>
                    <TextField
                      placeholder="Search transactions..."
                      size="small"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ 
                        width: 250,
                        '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' }
                      }}
                    />
                  </Box>
                  
                  <Paper elevation={0} sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <DataTable
                      columns={getTransactionColumns()}
                      data={filteredTransactions}
                      pagination
                      customStyles={DASHBOARD_CUTSOM_STYLE}
                      paginationPerPage={10}
                      highlightOnHover
                      progressPending={loadingTx}
                    />
                  </Paper>
                </Box>
              </Box>
            ) : (
              <AccountOpeningForm 
                defaultAccountType={accountType} 
                title={`${accountType} Account Opening`}
                prefillMemberId={memberId || undefined}
                readOnlyMemberId={true}
                isUser={true}
              />
            )}
          </Box>
        </Paper>
      </Container>

      {/* Self Transfer Dialog */}
      <Dialog 
        open={transferDialogOpen} 
        onClose={() => setTransferDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: theme.primary, pb: 1 }}>
            Self Transfer
        </DialogTitle>
        <DialogContent>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                Transfer funds from your <strong>{accountType}</strong> account to another of your accounts.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <FormControl fullWidth>
                    <InputLabel>Transfer To Account</InputLabel>
                    <Select
                        value={targetAccountNo}
                        label="Transfer To Account"
                        onChange={(e) => setTargetAccountNo(e.target.value)}
                        sx={{ borderRadius: '12px' }}
                    >
                        {allMyAccounts
                            .filter(acc => acc.account_no !== existingAccount?.account_no)
                            .map((acc) => (
                                <MenuItem key={acc._id} value={acc.account_no}>
                                    {acc.groupName} - {acc.account_no} (Bal: ₹{acc.account_amount?.toLocaleString()})
                                </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Amount (₹)"
                    fullWidth
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setTransferDialogOpen(false)} sx={{ color: '#64748b' }}>
                Cancel
            </Button>
            <Button 
                variant="contained" 
                onClick={handleSelfTransfer}
                disabled={transferMoneyMutation.isPending || !transferAmount || !targetAccountNo}
                sx={{ 
                    borderRadius: '12px', 
                    bgcolor: theme.primary,
                    '&:hover': { bgcolor: theme.secondary },
                    px: 3
                }}
            >
                {transferMoneyMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Transfer Now'}
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserAccountOpening;
