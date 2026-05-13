import React, { useState } from 'react';
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
    InputAdornment,
    MenuItem,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useCreatePaymentOrder } from '../../queries/Wallet/useWallet';
import { useGetMemberById, useGetMyAccounts } from '../../queries/Member';
import TokenService from '../../queries/token/tokenService';
import { toast } from 'react-toastify';

interface AddMoneyDialogProps {
    open: boolean;
    onClose: () => void;
    selectedAccount?: any; // Pre-selected account object
}

const AddMoneyDialog: React.FC<AddMoneyDialogProps> = ({ open, onClose, selectedAccount: preSelectedAccount }) => {
    const [amount, setAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');

    const userId = TokenService.getMemberId();
    const { data: memberData } = useGetMemberById(userId || '');
    const { data: accountsData, isLoading: accountsLoading } = useGetMyAccounts();
    const { mutate: createOrder, isPending } = useCreatePaymentOrder();

    // Note: Cashfree SDK is initialized dynamically in handleAddMoney 
    // after receiving cashfree_env from backend response

    // Flatten accounts for dropdown
    const allAccounts = accountsData?.data?.accountTypes?.flatMap((accType: any) =>
        accType.accounts.map((acc: any) => ({
            ...acc,
            account_type: accType.account_type,
            account_group_name: accType.account_group_name
        }))
    ) || [];

    // Filter to show ONLY ACTIVE accounts
    let myAccounts = allAccounts.filter((acc: any) => acc.status?.toLowerCase() === 'active');

    // If a pre-selected account is provided, show ONLY that account
    if (preSelectedAccount && myAccounts.length > 0) {
        myAccounts = myAccounts.filter(acc => {
            const matchNo = preSelectedAccount.account_no && acc.account_no === preSelectedAccount.account_no;
            const matchId = preSelectedAccount._id && acc._id === preSelectedAccount._id;
            const matchAccId = preSelectedAccount.account_id && acc.account_id === preSelectedAccount.account_id;
            
            return matchNo || matchId || matchAccId;
        });
    }

    // Auto-select account
    React.useEffect(() => {
        if (open && myAccounts.length > 0) {
            // Priority 1: Match by ID if pre-selected
            if (preSelectedAccount) {
                const match = myAccounts.find(acc => 
                    (preSelectedAccount.account_no && acc.account_no === preSelectedAccount.account_no) || 
                    (preSelectedAccount._id && acc._id === preSelectedAccount._id) ||
                    (preSelectedAccount.account_id && acc.account_id === preSelectedAccount.account_id)
                );
                if (match) {
                    console.log("DEBUG: Auto-selecting matched account:", match._id || match.account_id);
                    setSelectedAccountId(match._id || match.account_id || '');
                    return;
                }
            }
            
            // Priority 2: If only one account remains, select it
            if (myAccounts.length === 1) {
                console.log("DEBUG: Auto-selecting only available account:", myAccounts[0]._id || myAccounts[0].account_id);
                setSelectedAccountId(myAccounts[0]._id || myAccounts[0].account_id || '');
            }
        }
    }, [open, preSelectedAccount, myAccounts]);

    const handleClose = () => {
        setAmount('');
        setSelectedAccountId('');
        onClose();
    };

    const handleAddMoney = () => {
        const finalAmount = parseFloat(amount);
        if (finalAmount > 0 && selectedAccountId) {
            // Find the selected account object to get all details
            const accountDetails = myAccounts.find((acc: any) => 
                (acc._id === selectedAccountId) || (acc.account_id === selectedAccountId)
            );

            if (!accountDetails) {
                toast.error("Selected account not found. Please try again.");
                return;
            }

            const request = {
                member_id: memberData?.data?.member_id || memberData?.data?.Member_id || userId,
                amount: finalAmount,
                mobileno: memberData?.data?.contactno || memberData?.data?.mobileno,
                Name: memberData?.data?.name || memberData?.data?.Name,
                email: memberData?.data?.emailid || memberData?.data?.email,
                account_id: accountDetails._id || accountDetails.account_id,
                account_no: accountDetails.account_no,
                account_type: accountDetails.account_type,
                account_group_name: accountDetails.account_group_name, // used for correct return URL
            };

            if (!request.member_id) {
                toast.error("Missing member identification. Please try logging in again.");
                return;
            }

            createOrder(request, {
                onSuccess: (data: any) => {
                    if (data?.payment_session_id && (window as any).Cashfree) {
                        // Verify the payment session ID format
                        if (typeof data.payment_session_id !== 'string' || data.payment_session_id.trim() === '') {
                            toast.error("Invalid payment session ID received");
                            return;
                        }

                        // Initialize Cashfree with mode from backend response (like BICCSL-Server)
                        const cashfreeMode = data.cashfree_env || "sandbox";
                        console.log("Initializing Cashfree in", cashfreeMode, "mode");

                        const cashfreeInstance = new (window as any).Cashfree({
                            mode: cashfreeMode,
                        });

                        cashfreeInstance.checkout({
                            paymentSessionId: data.payment_session_id
                        });
                        handleClose();
                    } else {
                        if (!(window as any).Cashfree) {
                            toast.error("Payment gateway not properly initialized. Please reload the page.");
                        } else {
                            toast.error("Failed to initialize payment gateway");
                        }
                    }
                },
                onError: (error: any) => {
                    console.error("❌ Order creation failed:", error);
                    console.error("Response data:", error?.response?.data);
                    toast.error(error?.response?.data?.message || "Failed to create payment order");
                }
            });
        } else {
            toast.error("Please enter a valid amount and select an account");
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                }
            }}
        >
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon />
                    <Typography variant="h6">Add Money to Wallet</Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        select
                        fullWidth
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        label="Select Account"
                        disabled={accountsLoading || !!preSelectedAccount}
                        InputProps={{
                            readOnly: !!preSelectedAccount
                        }}
                    >
                        {accountsLoading ? (
                            <MenuItem disabled>
                                <CircularProgress size={20} sx={{ mr: 1 }} /> Fetching accounts...
                            </MenuItem>
                        ) : myAccounts.length === 0 ? (
                            <MenuItem disabled>
                                No bank account found
                            </MenuItem>
                        ) : (
                            myAccounts.map((acc: any) => (
                                <MenuItem key={acc._id || acc.account_id} value={acc._id || acc.account_id}>
                                    {acc.account_group_name} - ₹{acc.account_amount.toFixed(2)} ({acc.account_no})
                                </MenuItem>
                            ))
                        )}
                    </TextField>
                    {!accountsLoading && myAccounts.length === 0 && (
                        <Typography variant="caption" color="error">
                            No bank account found for this member
                        </Typography>
                    )}

                    <TextField
                        label="Enter Amount"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        InputProps={{
                            inputProps: { min: 1 },
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: '8px' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleAddMoney}
                    variant="contained"
                    disabled={isPending || !amount || !selectedAccountId || parseFloat(amount) <= 0}
                    sx={{
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        px: 4
                    }}
                >
                    {isPending ? <CircularProgress size={24} color="inherit" /> : 'Add Money'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddMoneyDialog;
