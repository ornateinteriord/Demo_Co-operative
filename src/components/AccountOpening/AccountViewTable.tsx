import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Chip,
    InputAdornment,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Divider,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useReactToPrint } from 'react-to-print';
import { useGetAccounts, useGetAccountGroups, type Account } from '../../queries/admin';
import TransactionDialog from '../Dialogs/TransactionDialog';
import TablePDF, { PrintColumn } from '../Print-components/TablePDF';

export type AccountType = 'SB' | 'CA' | 'RD' | 'FD' | 'PIGMY' | 'MIS';

interface Props {
    accountType: AccountType;
    title: string;
}

const ACCOUNT_THEMES: Record<string, any> = {
    SB: {
        primary: '#1a237e',
        secondary: '#0d47a1',
        light: '#bfdbfe',
        gradient: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
        shadow: '0 4px 14px 0 rgba(26, 35, 126, 0.25)',
        chip: { backgroundColor: '#bfdbfe', color: '#1a237e' }
    },
    CA: {
        primary: '#1b5e20',
        secondary: '#2e7d32',
        light: '#bbf7d0',
        gradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
        shadow: '0 4px 14px 0 rgba(27, 94, 32, 0.25)',
        chip: { backgroundColor: '#bbf7d0', color: '#1b5e20' }
    },
    RD: {
        primary: '#e65100',
        secondary: '#ef6c00',
        light: '#fed7aa',
        gradient: 'linear-gradient(135deg, #e65100 0%, #fb8c00 100%)',
        shadow: '0 4px 14px 0 rgba(230, 81, 0, 0.25)',
        chip: { backgroundColor: '#fed7aa', color: '#e65100' }
    },
    FD: {
        primary: '#4a148c',
        secondary: '#6a1b9a',
        light: '#e9d5ff',
        gradient: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
        shadow: '0 4px 14px 0 rgba(74, 20, 140, 0.25)',
        chip: { backgroundColor: '#e9d5ff', color: '#4a148c' }
    },
    PIGMY: {
        primary: '#f57f17',
        secondary: '#fbc02d',
        light: '#fef08a',
        gradient: 'linear-gradient(135deg, #f57f17 0%, #fbc02d 100%)',
        shadow: '0 4px 14px 0 rgba(245, 127, 23, 0.25)',
        chip: { backgroundColor: '#fef08a', color: '#f57f17' }
    },
    MIS: {
        primary: '#006064',
        secondary: '#00838f',
        light: '#99f6e4',
        gradient: 'linear-gradient(135deg, #006064 0%, #0097a7 100%)',
        shadow: '0 4px 14px 0 rgba(0, 96, 100, 0.25)',
        chip: { backgroundColor: '#99f6e4', color: '#006064' }
    }
};

const AccountViewTable: React.FC<Props> = ({ accountType, title }) => {
    const theme = ACCOUNT_THEMES[accountType] || ACCOUNT_THEMES.SB;

    // Dynamically update body class for the entire page
    useEffect(() => {
        const type = (accountType || 'SB').toLowerCase();
        const className = `theme-${type}`;
        document.body.classList.add(className);
        return () => {
            document.body.classList.remove(className);
        };
    }, [accountType]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [accountGroupId, setAccountGroupId] = useState<string>('');
    const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedAccountType, setSelectedAccountType] = useState('');
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const tablePrintRef = useRef<HTMLDivElement>(null);

    // Fetch account groups to map account type name to ID
    const { data: accountGroupsData } = useGetAccountGroups();

    // Map account type to account_group_id
    useEffect(() => {
        if (accountGroupsData?.data) {
            const matchingGroup = accountGroupsData.data.find(
                (group: any) => group.account_group_name === accountType
            );
            if (matchingGroup) {
                setAccountGroupId(matchingGroup.account_group_id);
            }
        }
    }, [accountGroupsData, accountType]);

    // Fetch accounts with filters
    const { data: accountsData, isLoading, isError } = useGetAccounts(
        page + 1,
        rowsPerPage,
        searchQuery || undefined,
        statusFilter === 'all' ? undefined : statusFilter,
        accountGroupId || undefined
    );

    // Fetch all accounts for printing (without pagination)
    const { data: allAccountsData } = useGetAccounts(
        1,
        9999,
        undefined,
        undefined,
        accountGroupId || undefined
    );

    const accounts = accountsData?.data || [];
    const totalAccounts = accountsData?.pagination?.total || 0;

    // Print columns configuration
    const printColumns: PrintColumn[] = [
        { id: 'account_no', label: 'Account No', width: '12%' },
        { id: 'member_name', label: 'Member', width: '15%' },
        { id: 'opening_date', label: 'Opening Date', width: '12%' },
        { id: 'amount', label: 'Amount', width: '12%', align: 'right' },
        { id: 'interest_rate', label: 'Interest', width: '10%', align: 'center' },
        { id: 'duration', label: 'Duration', width: '10%', align: 'center' },
        { id: 'maturity_date', label: 'Maturity Date', width: '12%' },
        { id: 'status', label: 'Status', width: '10%', align: 'center' },
    ];

    // Transform all accounts data for printing
    const allAccountsForPrint = (allAccountsData?.data || []).map((account: Account) => ({
        id: account._id,
        account_no: account.account_no || '-',
        member_name: account.memberDetails?.name
            ? `${account.memberDetails.name} (${account.member_id})`
            : account.member_id || '-',
        opening_date: account.date_of_opening
            ? new Date(account.date_of_opening).toLocaleDateString('en-GB')
            : '-',
        amount: account.account_amount
            ? `₹${account.account_amount.toLocaleString('en-IN')}`
            : '-',
        interest_rate: account.interest_rate ? `${account.interest_rate}%` : '-',
        duration: account.duration ? `${account.duration} months` : '-',
        maturity_date: account.date_of_maturity
            ? new Date(account.date_of_maturity).toLocaleDateString('en-GB')
            : '-',
        status: account.status || 'unknown',
    }));

    const handleTablePrint = useReactToPrint({
        contentRef: tablePrintRef,
    });

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        setPage(0);
    };

    const handleStatusFilterChange = (event: any) => {
        setStatusFilter(event.target.value);
        setPage(0);
    };

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB');
    };

    const getStatusColor = (status: string | undefined) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return { backgroundColor: '#dcfce7', color: '#166534' };
            case 'pending':
                return { backgroundColor: '#fef3c7', color: '#92400e' };
            case 'closed':
                return { backgroundColor: '#fee2e2', color: '#dc2626' };
            default:
                return { backgroundColor: '#f1f5f9', color: '#475569' };
        }
    };

    return (
        <Box sx={{ 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            minHeight: '100vh',
            background: `linear-gradient(180deg, ${theme.light} 0%, #f8fafc 500px, #f8fafc 100%)`,
            transition: 'background 0.3s ease'
        }}>
            {/* Page Header */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
                sx={{ mb: 3 }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        color: theme.primary,
                        fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' },
                    }}
                >
                    {title}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                        icon={<AccountBalanceIcon sx={{ color: `${theme.primary} !important` }} />}
                        label={`Total: ${totalAccounts} accounts`}
                        sx={{
                            backgroundColor: theme.light,
                            color: theme.primary,
                            fontWeight: 500,
                        }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => setPrintDialogOpen(true)}
                        disabled={totalAccounts === 0}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            background: theme.gradient,
                            boxShadow: theme.shadow,
                            '&:hover': {
                                background: theme.secondary,
                            },
                            '&:disabled': {
                                background: '#94a3b8',
                                color: '#fff',
                            },
                        }}
                    >
                        Print
                    </Button>
                </Stack>
            </Stack>

            {/* Filters Section */}
            <Paper
                elevation={0}
                sx={{
                    border: `1px solid ${theme.primary}15`,
                    borderRadius: 3,
                    p: { xs: 2, sm: 2.5 },
                    mb: 3,
                    background: `linear-gradient(135deg, ${theme.light}66 0%, rgba(255, 255, 255, 0.8) 100%)`,
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', md: 'center' }}
                >
                    <TextField
                        placeholder="Search by Account No, Member ID..."
                        size="small"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        sx={{
                            flex: 1,
                            backgroundColor: '#fff',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '& fieldset': {
                                    borderColor: '#e2e8f0',
                                },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                            label="Status"
                            sx={{
                                backgroundColor: '#fff',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#e2e8f0',
                                },
                            }}
                        >
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Table Container */}
            <Paper
                elevation={0}
                sx={{
                    border: `1px solid ${theme.primary}15`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6 }}>
                        <CircularProgress sx={{ color: '#6366f1' }} />
                    </Box>
                ) : isError ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography color="error">Failed to load accounts</Typography>
                    </Box>
                ) : accounts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <AccountBalanceIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                        <Typography color="text.secondary">No accounts found</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer sx={{ maxHeight: { xs: 400, sm: 500, md: 600 } }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {[
                                            'Account No',
                                            'Member',
                                            'Opening Date',
                                            'Operation',
                                            'Amount',
                                            'Interest Rate',
                                            'Duration',
                                            'Maturity Date',
                                            'Status',
                                            'Transactions',
                                        ].map((head) => (
                                            <TableCell
                                                key={head}
                                                sx={{
                                                    fontWeight: 700,
                                                    color: '#334155',
                                                    backgroundColor: '#f8fafc',
                                                    borderBottom: '2px solid #e2e8f0',
                                                    whiteSpace: 'nowrap',
                                                    py: 1.5,
                                                    ...(head === 'Amount' && { textAlign: 'right' }),
                                                    ...(head === 'Transactions' && { textAlign: 'center' }),
                                                }}
                                            >
                                                {head}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {accounts.map((account: Account, index: number) => (
                                        <TableRow
                                            key={account._id}
                                            hover
                                            sx={{
                                                backgroundColor: index % 2 === 0 ? '#fff' : '#fafbfc',
                                                '&:hover': { backgroundColor: '#f0f9ff' },
                                                transition: 'background-color 0.2s',
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {account.account_no || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>
                                                {account.memberDetails?.name
                                                    ? `${account.memberDetails.name} (${account.member_id})`
                                                    : account.member_id || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>
                                                {formatDate(account.date_of_opening)}
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>
                                                {account.account_operation || '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                {account.account_amount
                                                    ? `₹${account.account_amount.toLocaleString('en-IN')}`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>
                                                {account.interest_rate ? `${account.interest_rate}%` : '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>
                                                {account.duration ? `${account.duration} months` : '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>
                                                {formatDate(account.date_of_maturity)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={account.status || 'unknown'}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 500,
                                                        fontSize: '0.75rem',
                                                        ...getStatusColor(account.status),
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedMemberId(account.member_id || '');
                                                        setSelectedAccountType(accountGroupId);
                                                        setTransactionDialogOpen(true);
                                                    }}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        borderRadius: 2,
                                                        borderColor: theme.primary,
                                                        color: theme.primary,
                                                        '&:hover': {
                                                            borderColor: theme.secondary,
                                                            backgroundColor: `${theme.primary}0a`,
                                                        },
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider />

                        {/* Pagination */}
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={totalAccounts}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{
                                borderTop: '1px solid #e2e8f0',
                                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                },
                            }}
                        />
                    </>
                )}
            </Paper>

            {/* Transaction Dialog */}
            <TransactionDialog
                open={transactionDialogOpen}
                onClose={() => setTransactionDialogOpen(false)}
                memberId={selectedMemberId}
                accountType={selectedAccountType}
            />

            {/* Print Preview Dialog */}
            <Dialog
                open={printDialogOpen}
                onClose={() => setPrintDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { borderRadius: '16px' }
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {title} - Print Preview
                    </Typography>
                    <IconButton
                        onClick={() => setPrintDialogOpen(false)}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0, backgroundColor: '#f3f4f6' }}>
                    <Box sx={{ maxHeight: '70vh', overflow: 'auto', p: 2 }}>
                        <TablePDF
                            ref={tablePrintRef}
                            title={`${accountType} Account Register`}
                            columns={printColumns}
                            data={allAccountsForPrint}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button
                        onClick={() => setPrintDialogOpen(false)}
                        variant="outlined"
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            px: 3,
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleTablePrint}
                        variant="contained"
                        startIcon={<PrintIcon />}
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            px: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                    >
                        Print
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AccountViewTable;
