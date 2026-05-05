import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AccountOpeningForm from '../../../components/AccountOpening/AccountOpeningForm';
import { Box, Paper, Typography, Container, Button, Grid, IconButton, Divider, TextField } from '@mui/material';
import TokenService from '../../../api/token/tokenService';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'react-toastify';
import * as MemberQueries from '../../../queries/Member';
import { CircularProgress } from '@mui/material';
import { useGetTransactionDetails } from '../../../api/Memeber';
import { exportToExcel } from '../../../utils/excelExport';
import DataTable from "react-data-table-component";
import { DASHBOARD_CUTSOM_STYLE, getTransactionColumns } from "../../../utils/DataTableColumnsProvider";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const UserAccountOpening = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const memberId = TokenService.getMemberId();
  const [showBalance, setShowBalance] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Map route param to account type
  const rawType = type?.toUpperCase() || 'SB';
  const accountType = rawType === 'CUR' || rawType === 'CA' ? 'CA' : (rawType === 'PIGMY' ? 'PIGMY' : rawType);

  const { data: myAccountsData, isLoading: loadingMyAccounts } = MemberQueries.useGetMyAccounts();
  const accountGroup = myAccountsData?.data?.accountTypes?.find((acc: any) => acc.account_group_name === accountType);
  const existingAccount = accountGroup?.accounts?.[0];

  // Fetch transactions for statement if account exists
  const { data: txData, isLoading: loadingTx } = useGetTransactionDetails('all', accountGroup?.account_type || accountType);
  const transactions = txData?.data || [];

  const filteredTransactions = React.useMemo(() => {
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

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: '#f4f7f9', 
      pt: { xs: 2, md: 4 },
      pb: 8,
      px: { xs: 1, sm: 2 }
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
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#0a2558' }}>
            Back to Dashboard
          </Typography>
        </Box>

        {/* Main Form Card */}
        <Paper elevation={0} sx={{ 
          p: { xs: 1.5, sm: 3, md: 4 }, 
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 40px rgba(0,0,0,0.03)'
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
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Decorative Circle */}
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -40, 
                        right: -40, 
                        width: 150, 
                        height: 150, 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.05)' 
                      }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Account Type
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {existingAccount.account_group_name}
                          </Typography>
                        </Box>
                        <AccountBalanceWalletIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 40 }} />
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Account Number
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '1px' }}>
                          {existingAccount.account_no === 'NaN' || !existingAccount.account_no ? existingAccount.account_id : existingAccount.account_no}
                        </Typography>
                      </Box>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Available Balance
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                              {showBalance ? `₹${Number(existingAccount.account_amount || 0).toLocaleString('en-IN')}` : '••••••••'}
                            </Typography>
                            <IconButton onClick={() => setShowBalance(!showBalance)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              {showBalance ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          px: 2, 
                          py: 0.5, 
                          borderRadius: '12px', 
                          bgcolor: existingAccount.status?.toLowerCase() === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: existingAccount.status?.toLowerCase() === 'active' ? '#4ade80' : '#f87171',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: '1px solid rgba(255,255,255,0.1)'
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
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 2
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
                        Actions
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadStatement}
                        disabled={loadingTx}
                        sx={{ 
                          borderRadius: '12px', 
                          py: 1.5, 
                          bgcolor: '#7c2d12', 
                          '&:hover': { bgcolor: '#5d2a18' }
                        }}
                      >
                        Download Statement
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => navigate(`/user/transactions?type=${existingAccount.account_type}`)}
                        sx={{ 
                          borderRadius: '12px', 
                          py: 1.5,
                          borderColor: '#e2e8f0',
                          color: '#64748b',
                          '&:hover': { borderColor: '#7c2d12', color: '#7c2d12' }
                        }}
                      >
                        View Full History
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Transactions Section */}
                <Box sx={{ mt: 6 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon sx={{ color: '#7c2d12' }} />
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
    </Box>
  );
};

export default UserAccountOpening;
