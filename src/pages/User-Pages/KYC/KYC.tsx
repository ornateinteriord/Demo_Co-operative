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
  Typography,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import BadgeIcon from '@mui/icons-material/Badge';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import UserContext from '../../../context/user/userContext';
import { LoadingComponent } from '../../../App';
import { useSubmitKYC, useUploadKYCDocument } from '../../../api/Memeber';
import { toast } from 'react-toastify';

interface DocumentUploadProps {
  label: string;
  icon: React.ReactNode;
  value: string | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  uploading: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  icon,
  value,
  onUpload,
  onDelete,
  uploading,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      onUpload(file);
    }
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="subtitle1" fontWeight="bold" ml={1}>
            {label}
          </Typography>
        </Box>

        {value ? (
          <Box>
            <Box
              component="img"
              src={value}
              alt={label}
              sx={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
                borderRadius: 1,
                mb: 1,
              }}
            />
            <Box display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.open(value, '_blank')}
                sx={{ flex: 1, mr: 1 }}
              >
                View
              </Button>
              <IconButton
                color="error"
                size="small"
                onClick={onDelete}
                disabled={uploading}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Box>
            <input
              accept="image/*"
              id={`upload-${label}`}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={uploading}
            />
            <label htmlFor={`upload-${label}`}>
              <Button
                variant="outlined"
                component="span"
                fullWidth
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                sx={{
                  height: '150px',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: '#0a2558',
                    backgroundColor: 'rgba(0, 8, 49, 0.04)',
                  },
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </label>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const KYC: React.FC = () => {
  const { user } = useContext(UserContext);

  const [formData, setFormData] = useState({
    accountName: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    Pan_no: '',
    Aadhar_no: '',
    address: '',
  });

  const [documents, setDocuments] = useState({
    panImage: null as string | null,
    aadhaarImage: null as string | null,
    checkImage: null as string | null,
    passbookImage: null as string | null,
    rationCardImage: null as string | null,
    profileImage: null as string | null,
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        accountName: user.Name,
        account_number: user.account_number || '',
        ifsc_code: user.ifsc_code || '',
        bank_name: user.bank_name || '',
        Pan_no: user.Pan_no || '',
        Aadhar_no: user.aadharcard_no || '',
        address: user.address || '',
      });

      // Load existing document URLs if available
      setDocuments({
        panImage: user.panImage || null,
        aadhaarImage: user.aadhaarImage || null,
        checkImage: user.checkImage || null,
        passbookImage: user.passbookImage || null,
        rationCardImage: user.rationCardImage || null,
        profileImage: user.profile_image || null,
      });
    }
  }, [user]);

  const submitKYC = useSubmitKYC();
  const uploadPanImage = useUploadKYCDocument(user?.Member_id || '', 'pan');
  const uploadAadhaarImage = useUploadKYCDocument(user?.Member_id || '', 'aadhaar');
  const uploadCheckImage = useUploadKYCDocument(user?.Member_id || '', 'check');
  const uploadPassbookImage = useUploadKYCDocument(user?.Member_id || '', 'passbook');
  const uploadRationCardImage = useUploadKYCDocument(user?.Member_id || '', 'rationcard');
  const uploadProfileImage = useUploadKYCDocument(user?.Member_id || '', 'profile');

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentUpload = async (docType: string, file: File) => {
    setUploadingDoc(docType);

    try {
      let result;

      switch (docType) {
        case 'panImage':
          result = await uploadPanImage.mutateAsync(file);
          break;
        case 'aadhaarImage':
          result = await uploadAadhaarImage.mutateAsync(file);
          break;
        case 'checkImage':
          result = await uploadCheckImage.mutateAsync(file);
          break;
        case 'passbookImage':
          result = await uploadPassbookImage.mutateAsync(file);
          break;
        case 'rationCardImage':
          result = await uploadRationCardImage.mutateAsync(file);
          break;
        case 'profileImage':
          result = await uploadProfileImage.mutateAsync(file);
          break;
        default:
          throw new Error('Unknown document type');
      }

      setDocuments((prev) => ({
        ...prev,
        [docType]: result.url,
      }));

      toast.success(`Document uploaded successfully!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocumentDelete = (docType: string) => {
    setDocuments((prev) => ({
      ...prev,
      [docType]: null,
    }));
  };

  const handleSubmit = () => {
    // Validate all documents are uploaded
    const missingDocs = [];
    if (!documents.panImage) missingDocs.push('PAN Image');
    if (!documents.aadhaarImage) missingDocs.push('Aadhaar Image');
    if (!documents.checkImage) missingDocs.push('Check Image');
    if (!documents.passbookImage) missingDocs.push('Passbook Image');
    if (!documents.rationCardImage) missingDocs.push('Ration Card Image');
    if (!documents.profileImage) missingDocs.push('Profile Image');

    if (missingDocs.length > 0) {
      toast.error(`Please upload: ${missingDocs.join(', ')}`);
      return;
    }

    // Validate bank details
    if (!formData.account_number || !formData.ifsc_code || !formData.bank_name || !formData.Pan_no || !formData.Aadhar_no) {
      toast.error('Please fill all identity and bank account details');
      return;
    }

    submitKYC.mutate({
      ref_no: user.Member_id,
      bankAccount: formData.account_number,
      ifsc: formData.ifsc_code,
      pan: formData.Pan_no,
      aadhar_no: formData.Aadhar_no,
      address: formData.address,
      bankName: formData.bank_name,
      panImage: documents.panImage,
      aadhaarImage: documents.aadhaarImage,
      checkImage: documents.checkImage,
      passbookImage: documents.passbookImage,
      rationCardImage: documents.rationCardImage,
      profileImage: documents.profileImage,
    });
  };

  const documentConfigs = [
    { key: 'panImage', label: 'PAN Card', icon: <BadgeIcon sx={{ color: '#0a2558' }} /> },
    { key: 'aadhaarImage', label: 'Aadhaar Card', icon: <PersonIcon sx={{ color: '#0a2558' }} /> },
    { key: 'checkImage', label: 'Cancelled Cheque', icon: <AccountBalanceWalletIcon sx={{ color: '#0a2558' }} /> },
    { key: 'passbookImage', label: 'Bank Passbook', icon: <AccountBalanceIcon sx={{ color: '#0a2558' }} /> },
    { key: 'rationCardImage', label: 'Ration Card', icon: <ConfirmationNumberIcon sx={{ color: '#0a2558' }} /> },
    { key: 'profileImage', label: 'Profile Photo', icon: <ImageIcon sx={{ color: '#0a2558' }} /> },
  ];

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
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="PAN Number"
                    name="Pan_no"
                    value={formData.Pan_no}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter PAN number"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ color: '#0a2558' }} />
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Aadhar Number"
                    name="Aadhar_no"
                    value={formData.Aadhar_no}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter Aadhar number"
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
                </Grid>
              </Grid>
            </form>
          </AccordionDetails>
        </Accordion>

        {/* KYC Documents */}
        <Accordion
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
        </Accordion>
      </CardContent>
      {submitKYC.isPending && <LoadingComponent />}
    </Card>
  );
};

export default KYC;
