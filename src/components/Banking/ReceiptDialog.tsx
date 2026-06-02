import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormLabel,
    Grid,
    MenuItem,
    Paper,
    Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { toast } from 'react-toastify';
import { useGetReceiptById, useCreateReceipt, useUpdateReceipt } from '../../queries/banking';
import { useGetMemberBasicInfo, useGetMemberAccountsPublic } from '../../queries/transfer';
import TokenService from '../../queries/token/tokenService';

interface ReceiptDialogProps {
    open: boolean;
    onClose: () => void;
    receiptId?: string | null;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ open, onClose, receiptId }) => {
    const branch_code = TokenService.getBranchCode() || 'BRN001';
    const entered_by = TokenService.getUserId() || '';

    const [formData, setFormData] = useState({
        receipt_date: new Date().toISOString().split('T')[0],
        received_from: '',
        member_id: '',
        member_name: '',
        selected_account: '',
        receipt_details: '',
        amount: '',
        mode_of_payment_received: 'Cash',
        branch_code: branch_code,
        entered_by: entered_by,
    });

    const [fetchMemberInfo, setFetchMemberInfo] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { data: receiptData, isLoading: loadingReceipt } = useGetReceiptById(receiptId || '', !!receiptId);
    const createMutation = useCreateReceipt();
    const updateMutation = useUpdateReceipt();

    // Member lookup hooks
    const { data: memberInfo, isLoading: loadingMember, isError: memberError } = useGetMemberBasicInfo(
        formData.member_id,
        fetchMemberInfo
    );
    const { data: memberAccounts, isLoading: loadingAccounts } = useGetMemberAccountsPublic(
        formData.member_id,
        fetchMemberInfo && !!memberInfo?.success
    );

    useEffect(() => {
        if (receiptId && receiptData?.success) {
            const receipt = receiptData.data;
            setFormData({
                receipt_date: receipt.receipt_date ? new Date(receipt.receipt_date).toISOString().split('T')[0] : '',
                received_from: receipt.received_from || '',
                member_id: receipt.member_id || '',
                member_name: '',
                selected_account: receipt.account_details?.account_id || '',
                receipt_details: receipt.receipt_details || '',
                amount: receipt.amount?.toString() || '',
                mode_of_payment_received: receipt.mode_of_payment_received || 'Cash',
                branch_code: receipt.branch_code || branch_code,
                entered_by: receipt.entered_by || entered_by,
            });
            // If there's a member_id, trigger fetch
            if (receipt.member_id) {
                setFetchMemberInfo(true);
            }
        } else if (!receiptId) {
            setFormData({
                receipt_date: new Date().toISOString().split('T')[0],
                received_from: '',
                member_id: '',
                member_name: '',
                selected_account: '',
                receipt_details: '',
                amount: '',
                mode_of_payment_received: 'Cash',
                branch_code: branch_code,
                entered_by: entered_by,
            });
            setFetchMemberInfo(false);
        }
    }, [receiptId, receiptData, branch_code, entered_by]);

    // Auto-populate member name when info is fetched
    useEffect(() => {
        if (memberInfo?.success && memberInfo.data) {
            setFormData(prev => ({
                ...prev,
                member_name: memberInfo.data.name || '',
                received_from: memberInfo.data.name || prev.received_from,
            }));
        }
    }, [memberInfo]);

    const handleChange = (field: string, value: string) => {
        if (field === 'amount') {
            // Allow only numbers and one decimal point
            if (!/^\d*\.?\d*$/.test(value)) {
                return;
            }
        }

        setFormData(prev => ({ ...prev, [field]: value }));
        // Reset fetch when member_id changes
        if (field === 'member_id') {
            setFetchMemberInfo(false);
            setFormData(prev => ({
                ...prev,
                [field]: value,
                member_name: '',
                selected_account: '',
            }));
        }
    };

    const handleGetMemberInfo = () => {
        if (!formData.member_id.trim()) {
            toast.error('Please enter a Member ID');
            return;
        }
        setFetchMemberInfo(true);
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.received_from || !formData.amount || !formData.receipt_details || !formData.selected_account) {
            toast.error('Please fill all required fields, including Bank Account');
            return;
        }

        // Get selected account details
        const selectedAcc = memberAccounts?.data?.find((acc: any) => acc._id === formData.selected_account);

        const submitData = {
            receipt_date: formData.receipt_date,
            received_from: formData.received_from,
            receipt_details: formData.receipt_details,
            amount: parseFloat(formData.amount),
            mode_of_payment_received: formData.mode_of_payment_received,
            branch_code: formData.branch_code,
            entered_by: formData.entered_by,
            member_id: formData.member_id || undefined,
            account_details: selectedAcc ? {
                account_no: selectedAcc.account_no,
                account_type: selectedAcc.account_type,
                account_id: selectedAcc._id,
            } : undefined,
        };

        try {
            setFormError(null);
            if (receiptId) {
                await updateMutation.mutateAsync({
                    receiptId: receiptId,
                    data: submitData
                });
                toast.success('Receipt updated successfully');
            } else {
                await createMutation.mutateAsync(submitData);
                toast.success('Receipt created successfully');
            }
            onClose();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Operation failed';
            setFormError(errorMessage);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                }
            }}
        >
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2
            }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {receiptId ? 'Modify Receipt Voucher' : 'Add Receipt Voucher'}
                </Typography>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent >
                {loadingReceipt ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={2} sx={{ mt: 3 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Date Of Receipt"
                                value={formData.receipt_date}
                                onChange={(e) => handleChange('receipt_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Member ID with Get Info Button */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Member ID"
                                    value={formData.member_id}
                                    onChange={(e) => handleChange('member_id', e.target.value)}
                                    placeholder="Enter member ID"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleGetMemberInfo}
                                    disabled={loadingMember || !formData.member_id}
                                    sx={{
                                        minWidth: '120px',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                    }}
                                    startIcon={loadingMember ? <CircularProgress size={20} color="inherit" /> : <PersonSearchIcon />}
                                >
                                    Get Info
                                </Button>
                            </Box>
                        </Grid>

                        {/* Member Info Display */}
                        {memberInfo?.success && (
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {memberInfo.data.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Member ID: {memberInfo.data.member_id}
                                    </Typography>
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                        Contact: {memberInfo.data.contactno}
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}

                        {/* Member Not Found */}
                        {!loadingMember && fetchMemberInfo && (memberError || (memberInfo && !memberInfo.success)) && (
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#dc2626' }}>
                                        Member not found
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Please check the Member ID and try again
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}

                        {/* Account Selection Dropdown - Loading State */}
                        {loadingAccounts && memberInfo?.success && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    disabled
                                    value=""
                                    label="Select Account"
                                    InputProps={{
                                        startAdornment: <CircularProgress size={20} sx={{ mr: 1 }} />
                                    }}
                                    placeholder="Fetching accounts..."
                                    helperText="Fetching accounts..."
                                />
                            </Grid>
                        )}

                        {/* Account Selection Dropdown - No Accounts Found */}
                        {!loadingAccounts && memberAccounts?.success && memberAccounts.data.length === 0 && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    disabled
                                    value=""
                                    label="Select Account"
                                    error
                                    helperText="No bank account found for this member"
                                />
                            </Grid>
                        )}

                        {/* Account Selection Dropdown - With Accounts */}
                        {!loadingAccounts && memberAccounts?.success && memberAccounts.data.length > 0 && (
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    fullWidth
                                    value={formData.selected_account}
                                    onChange={(e) => handleChange('selected_account', e.target.value)}
                                    label="Select Account"
                                >
                                    <MenuItem value="">Select Account</MenuItem>
                                    {memberAccounts.data.map((acc: any) => (
                                        <MenuItem key={acc._id} value={acc._id}>
                                            {acc.account_group_name}{acc.account_no && String(acc.account_no) !== 'NaN' && String(acc.account_no).trim() !== '' ? ` - ${acc.account_no}` : ''}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Received From"
                                value={formData.received_from}
                                onChange={(e) => handleChange('received_from', e.target.value)}
                                placeholder="Enter received from"
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Receipt Towards"
                                value={formData.receipt_details}
                                onChange={(e) => handleChange('receipt_details', e.target.value)}
                                placeholder="Enter receipt details"
                                required
                                multiline
                                rows={2}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="text"
                                label="Amount Received (Rs.)"
                                value={formData.amount}
                                onChange={(e) => handleChange('amount', e.target.value)}
                                placeholder="0.00"
                                required
                                disabled={!!receiptId}
                                helperText={receiptId ? "Amount cannot be modified" : ""}
                                InputProps={{
                                    startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                                }}
                            />
                        </Grid>

                        {formError && (
                            <Grid item xs={12}>
                                <Alert severity="error" onClose={() => setFormError(null)}>
                                    {formError}
                                </Alert>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <FormLabel component="legend" sx={{ mb: 1, color: '#374151', fontWeight: 600 }}>
                                Receipt Mode
                            </FormLabel>
                            <RadioGroup
                                row
                                value={formData.mode_of_payment_received}
                                onChange={(e) => handleChange('mode_of_payment_received', e.target.value)}
                            >
                                <FormControlLabel value="Cash" control={<Radio />} label="Cash" />
                                <FormControlLabel value="Cheque" control={<Radio />} label="Cheque" />
                                <FormControlLabel value="Net Banking" control={<Radio />} label="Net Banking" />
                            </RadioGroup>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    disabled={isSubmitting}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        px: 3,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isSubmitting || loadingReceipt}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        px: 3,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    }}
                >
                    {isSubmitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptDialog;
