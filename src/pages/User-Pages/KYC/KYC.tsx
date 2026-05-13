import React, { useContext, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import UserContext from '../../../context/user/userContext';
import { LoadingComponent } from '../../../App';
import { useSubmitKYC } from '../../../api/Memeber';
import { toast } from 'react-toastify';


const KYC: React.FC = () => {
  const { user } = useContext(UserContext);

  const [formData, setFormData] = useState({
    accountName: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
  });

  const submitKYC = useSubmitKYC();

  useEffect(() => {
    if (user) {
      setFormData({
        accountName: user.Name,
        account_number: user.account_number || '',
        ifsc_code: user.ifsc_code || '',
        bank_name: user.bank_name || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Validate bank details
    if (!formData.account_number || !formData.ifsc_code || !formData.bank_name) {
      toast.error('Please fill all bank account details');
      return;
    }

    submitKYC.mutate({
      ref_no: user.Member_id,
      bankAccount: formData.account_number,
      ifsc: formData.ifsc_code,
      bankName: formData.bank_name,
    });
  };


  return (
    <Card sx={{ margin: '2rem', mt: 10, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <CardContent>
        {/* Bank Account Details */}
        <Accordion
          defaultExpanded
          sx={{
            boxShadow: 'none',
            '&.MuiAccordion-root': {
              backgroundColor: '#fff',
            },
            mb: 2,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: '#0a2558',
              color: '#fff',
              '& .MuiSvgIcon-root': {
                color: '#fff',
              },
            }}
          >
            Update Identity and Bank Account Details
          </AccordionSummary>
          <AccordionDetails sx={{ padding: '2rem' }}>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <TextField
                label="Account Name"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                placeholder="Enter account holder name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#0a2558' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#0a2558',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0a2558',
                    },
                  },
                }}
              />
              <TextField
                label="Account Number"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                placeholder="Enter account number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceWalletIcon sx={{ color: '#0a2558' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#0a2558',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0a2558',
                    },
                  },
                }}
              />
              <TextField
                label="IFSC Code"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                placeholder="Enter IFSC code"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ConfirmationNumberIcon sx={{ color: '#0a2558' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#0a2558',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0a2558',
                    },
                  },
                }}
              />
              <TextField
                label="Bank Name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                placeholder="Enter bank name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceIcon sx={{ color: '#0a2558' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#0a2558',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0a2558',
                    },
                  },
                }}
              />
            </form>
          </AccordionDetails>
        </Accordion>

        {/* KYC Document uploads moved to Profile page */}
        {/* <Accordion
          defaultExpanded
          sx={{
            boxShadow: 'none',
            '&.MuiAccordion-root': {
              backgroundColor: '#fff',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: '#0a2558',
              color: '#fff',
              '& .MuiSvgIcon-root': {
                color: '#fff',
              },
            }}
          >
            Upload KYC Documents (All Mandatory)
          </AccordionSummary>
          <AccordionDetails sx={{ padding: '2rem' }}>
            <Grid container spacing={3}>
              {documentConfigs.map((config) => (
                <Grid item xs={12} sm={6} md={4} key={config.key}>
                  <DocumentUpload
                    label={config.label}
                    icon={config.icon}
                    value={documents[config.key as keyof typeof documents]}
                    onUpload={(file) => handleDocumentUpload(config.key, file)}
                    onDelete={() => handleDocumentDelete(config.key)}
                    uploading={uploadingDoc === config.key}
                  />
                </Grid>
              ))}
            </Grid>

            <Box mt={3}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitKYC.isPending}
                fullWidth
                sx={{
                  backgroundColor: '#0a2558',
                  padding: '12px',
                  '&:hover': {
                    backgroundColor: '#581c87',
                  },
                }}
              >
                {submitKYC.isPending ? 'Submitting...' : 'Submit KYC'}
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion> */}

        {/* Submit button for bank details */}
        <Box mt={3} px={1}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitKYC.isPending}
            fullWidth
            sx={{
              backgroundColor: '#0a2558',
              padding: '12px',
              '&:hover': { backgroundColor: '#581c87' },
            }}
          >
            {submitKYC.isPending ? 'Submitting...' : 'Submit KYC'}
          </Button>
        </Box>
      </CardContent>
      {submitKYC.isPending && <LoadingComponent />}
    </Card>
  );
};

export default KYC;
