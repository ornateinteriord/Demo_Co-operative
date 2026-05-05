import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Grid,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { toast } from 'react-toastify';
import * as AdminQueries from '../../queries/admin';
import * as MemberQueries from '../../queries/Member';

export type AccountType = 'SB' | 'CA' | 'RD' | 'FD' | 'PIGMY' | 'MIS' | string;

interface Props {
  defaultAccountType?: AccountType;
  title?: string;
  prefillMemberId?: string;
  readOnlyMemberId?: boolean;
  isUser?: boolean;
}

// Modern Input Styles - Blue Theme (Member Section)
const memberInputStyle = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    borderRadius: 2,
    fontWeight: 500,
    '& fieldset': {
      borderColor: 'rgba(26, 35, 126, 0.25)',
      borderWidth: '1.5px',
    },
    '&:hover fieldset': {
      borderColor: '#1a237e',
      borderWidth: '1.5px',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1a237e',
      borderWidth: '2.5px',
      boxShadow: '0 0 0 3px rgba(26, 35, 126, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#1a237e',
      fontWeight: 600,
    },
  },
};

// Read-only Input Style
const readOnlyInputStyle = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#f8fafc',
    borderRadius: 2,
    '& fieldset': {
      borderColor: 'rgba(26, 35, 126, 0.15)',
      borderWidth: '1.5px',
      borderStyle: 'dashed',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    color: 'rgba(0,0,0,0.5)',
  },
};

// Modern Input Styles - Green Theme (Account Section)
const accountInputStyle = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    borderRadius: 2,
    fontWeight: 500,
    '& fieldset': {
      borderColor: 'rgba(22, 101, 52, 0.25)',
      borderWidth: '1.5px',
    },
    '&:hover fieldset': {
      borderColor: '#166534',
      borderWidth: '1.5px',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#166534',
      borderWidth: '2.5px',
      boxShadow: '0 0 0 3px rgba(22, 101, 52, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#166534',
      fontWeight: 600,
    },
  },
};

const AccountOpeningForm: React.FC<Props> = ({ 
  defaultAccountType = 'SB', 
  title,
  prefillMemberId,
  readOnlyMemberId = false,
  isUser = false
}) => {
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState('');
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [accountGroupId, setAccountGroupId] = useState<string>('');

  // State for introducer auto-population
  const [introducerCode, setIntroducerCode] = useState<string>('');
  const [shouldFetchAgent, setShouldFetchAgent] = useState<boolean>(false);
  const [agentError, setAgentError] = useState<boolean>(false);

  // Auto-fetch member info if prefilled
  useEffect(() => {
    if (prefillMemberId && !memberInfo) {
      setMemberId(prefillMemberId);
    }
  }, [prefillMemberId, memberInfo]);

  useEffect(() => {
    if (prefillMemberId && memberId === prefillMemberId && !memberInfo) {
      handleGetInfo(true); // Fetch silently on initial load
    }
  }, [memberId, prefillMemberId, memberInfo]);

  const [form, setForm] = useState<any>({
    accountType: defaultAccountType?.toUpperCase() || 'SB',
    accountOperation: 'Single',
    openingDate: new Date().toISOString().split('T')[0],
    amount: '',
    interestSlab: '',
    interestRate: '',
    duration: '',
    maturityDate: '',
    maturityValue: '',
    introducer: '',
    introducerName: '',
    agent: '',
    agentName: '',
    jointMember: '',
  });

  // Fetch account groups (Admin or Member)
  const adminAccountGroups = AdminQueries.useGetAccountGroups(undefined, !isUser);
  const memberAccountGroups = MemberQueries.useGetMemberAccountGroups(isUser); 
  const accountGroupsData = isUser ? memberAccountGroups.data : adminAccountGroups.data;

  // Fetch all agents for dropdown (Admin only)
  const { data: agentsData } = AdminQueries.useGetAllAgents(!isUser); // We'll ignore this for users

  // Fetch member info when requested
  // Admin version
  const { isLoading: loadingMemberAdmin, refetch: fetchMemberAdmin } = AdminQueries.useGetMemberById(
    memberId,
    false
  );
  // Member version
  const { isLoading: loadingMemberUser, refetch: fetchMemberUser } = MemberQueries.useGetMemberById(
    memberId,
    false
  );

  const loadingMember = isUser ? loadingMemberUser : loadingMemberAdmin;
  const fetchMember = isUser ? fetchMemberUser : fetchMemberAdmin;

  // Fetch interests based on account group ID
  const adminInterests = AdminQueries.useGetInterestsByAccountGroup(
    accountGroupId,
    !isUser && !!accountGroupId
  );
  const memberInterests = MemberQueries.useGetMemberInterestsByAccountGroup(
    accountGroupId,
    isUser && !!accountGroupId
  );
  const interestsData = isUser ? memberInterests.data : adminInterests.data;
  const loadingInterests = isUser ? memberInterests.isLoading : adminInterests.isLoading;

  // Fetch agent data when introducer code is entered and onBlur triggered (Admin only)
  const { data: agentData, isLoading: isLoadingAgent, isError: isAgentError } = AdminQueries.useGetAgentById(
    introducerCode,
    !isUser && shouldFetchAgent && !!introducerCode && introducerCode.length > 0
  );

  // Create account mutation
  const adminCreateAccount = AdminQueries.useCreateAccount();
  const memberCreateAccount = MemberQueries.useCreateMemberAccount();
  const createAccountMutation = isUser ? memberCreateAccount : adminCreateAccount;

  console.log('AccountOpeningForm Debug:', { isUser, accountGroupId, defaultAccountType });
  console.log('Account Groups Data:', accountGroupsData);
  console.log('Interests Data:', interestsData);

  // Map account type name to account_group_id
  useEffect(() => {
    if (accountGroupsData?.data) {
      const search = defaultAccountType?.toUpperCase() || '';
      const matchingGroup = accountGroupsData.data.find((group: any) => {
        const name = group.account_group_name?.toUpperCase() || '';
        const id = group.account_group_id?.toUpperCase() || '';
        
        // 1. Try exact match first (Highest Priority)
        if (name === search || id === search) return true;

        // 2. Try specific keyword matches for certain types
        if (search === 'SB') {
            return name === 'SAVING' || name === 'SAVINGS' || name === 'SAVINGS ACCOUNT' || name === 'SAVINGS BANK';
        }
        
        return name.startsWith(search) ||
               (search === 'RD' && name.includes('RECURRING')) ||
               (search === 'FD' && name.includes('FIXED')) ||
               (search === 'CA' && name.includes('CURRENT')) ||
               (search === 'CUR' && name.includes('CURRENT')) ||
               (search === 'MIS' && name.includes('MONTHLY')) ||
               (search === 'PIGMY' && (name.includes('DAILY') || name === 'PIGMI'));
      });
      
      if (matchingGroup) {
        console.log('Found matching group:', matchingGroup);
        setAccountGroupId(matchingGroup.account_group_id || matchingGroup._id);
      } else {
        console.log('No matching group found for:', defaultAccountType);
      }
    }
  }, [accountGroupsData, defaultAccountType]);

  // Auto-populate introducer name when agent data is fetched
  useEffect(() => {
    if (agentData?.data?.name) {
      setForm((prev: any) => ({
        ...prev,
        introducerName: agentData.data.name || '',
        agentName: agentData.data.name || ''
      }));
      setAgentError(false);
      // Reset fetch trigger after successful fetch
      setShouldFetchAgent(false);
    } else if (isAgentError && shouldFetchAgent) {
      // Agent not found
      setAgentError(true);
      setForm((prev: any) => ({
        ...prev,
        introducerName: ''
      }));
      setShouldFetchAgent(false);
    }
  }, [agentData, isAgentError, shouldFetchAgent]);

  // Handle member info fetch
  const handleGetInfo = async (silent = false) => {
    if (!memberId) {
      if (!silent) toast.error('Please enter a member ID');
      return;
    }

    if (!memberId) return;
    try {
      const result = await fetchMember();
      
      // Check if data exists in the result
      const data = result.data?.data || result.data || (result as any).data;
      const success = result.data?.success || (result as any).success;

      if (success && data) {
        setMemberInfo(data);

        // Auto-populate fields from member data
        setForm((prev: any) => ({
          ...prev,
          introducer: data.introducer || data.Sponsor_code || '',
          introducerName: data.introducer_name || data.Sponsor_name || '',
          agent: data.agent_id || '',
          agentName: data.agent_name || ''
        }));

        if (!silent) toast.success('Member information loaded successfully');
      } else {
        if (!silent) toast.error('Member not found');
        setMemberInfo(null);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to fetch member information');
      setMemberInfo(null);
    }
  };

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));

    // If introducer code is changed, update the introducer code state
    if (field === 'introducer') {
      setIntroducerCode(value);
      setAgentError(false); // Clear error when user types
      // Clear introducer name and stop fetching if code is cleared
      if (!value) {
        setShouldFetchAgent(false);
        setForm((prev: any) => ({
          ...prev,
          introducerName: ''
        }));
      }
    }
  };

  // Handle onBlur for introducer field to trigger API call
  const handleIntroducerBlur = () => {
    if (form.introducer && form.introducer.trim().length > 0) {
      setIntroducerCode(form.introducer.trim());
      setShouldFetchAgent(true);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string | Date): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Check if member is senior citizen (60+ years)
  const isSeniorCitizen = memberInfo?.dob ? calculateAge(memberInfo.dob) >= 60 : false;

  // Handle interest slab selection
  const handleInterestSlabChange = (interestId: string) => {
    setForm((prev: any) => ({ ...prev, interestSlab: interestId }));

    if (interestsData?.data) {
      const interest = interestsData.data.find((i: any) => (i.interest_id || i._id) === interestId);
      if (interest) {

        // Auto-select rate based on member age (Senior Citizen if 60+ years)
        const interestRate = isSeniorCitizen
          ? (interest.interest_rate_senior || interest.interest_rate_general || interest.interest_rate || 0)
          : (interest.interest_rate_general || interest.interest_rate || 0);
        const duration = interest.duration || 0;

        // Calculate maturity date (opening date + duration months)
        let maturityDate = '';
        if (form.openingDate && duration > 0) {
          const openDate = new Date(form.openingDate);
          openDate.setMonth(openDate.getMonth() + duration);
          maturityDate = openDate.toISOString().split('T')[0];
        }

        setForm((prev: any) => ({
          ...prev,
          interestRate: interestRate.toString(),
          duration: duration.toString(),
          maturityDate,
          isSeniorCitizen: isSeniorCitizen, // Store for reference
          maturityValue: '', // Placeholder for now
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!memberInfo) {
      toast.error('Please fetch member information first');
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (form.accountOperation === 'Any two' && !form.jointMember) {
      toast.error('Please enter joint member details');
      return;
    }

    try {
      const accountData = {
        branch_id: memberInfo.branch_id,
        date_of_opening: form.openingDate,
        member_id: memberId,
        account_type: accountGroupId, // Send account_group_id
        account_operation: form.accountOperation,
        introducer: form.introducer,
        entered_by: memberInfo.entered_by || '', // From logged-in user
        ref_id: form.interestSlab, // interest_id
        interest_rate: parseFloat(form.interestRate) || 0,
        duration: parseInt(form.duration) || 0,
        date_of_maturity: form.maturityDate || null,
        assigned_to: form.agent,
        account_amount: parseFloat(form.amount),
        joint_member: form.accountOperation === 'Any two' ? form.jointMember : null,
      };

      const result = await createAccountMutation.mutateAsync(accountData);

      if (result?.success) {
        toast.success('Account created successfully!');
        // Reset form
        setMemberId('');
        setMemberInfo(null);
        setForm({
          accountType: defaultAccountType,
          accountOperation: 'Single',
          openingDate: new Date().toISOString().split('T')[0],
          interestSlab: '',
          interestRate: '',
          duration: '',
          amount: '',
          maturityDate: '',
          maturityValue: '',
          introducer: '',
          introducerName: '',
          agent: '',
          jointMember: '',
        });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create account');
    }
  };

  const showInterestFields = ['SB', 'RD', 'FD', 'PIGMY', 'MIS', 'CA'].includes(form.accountType);
  const interests = interestsData?.data || [];

  return (
    <Box sx={{ mt: 2, px: { xs: 1.5, sm: 2, md: 3 }, pb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: '#1a237e',
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
        }}
      >
        {title ?? `${form.accountType} Account Opening`}
      </Typography>
      <Card sx={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderRadius: '16px',
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Grid container spacing={4}>
            {/* Member Information Section */}
            <Grid item xs={12} md={6}>
              <Box sx={{
                bgcolor: '#f0f7ff',
                p: 3,
                borderRadius: 2,
                border: '1px solid #e3f2fd',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <PersonIcon sx={{ color: '#6366f1', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
                    Member Information
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      placeholder="Member ID"
                      size="small"
                      fullWidth
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      label="Member ID"
                      disabled={readOnlyMemberId}
                      sx={memberInputStyle}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="contained"
                      size="medium"
                      fullWidth
                      onClick={() => handleGetInfo()}
                      disabled={loadingMember || !memberId}
                      sx={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                        fontWeight: 600,
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)',
                          boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
                        },
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      {loadingMember ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Get Info'}
                    </Button>
                  </Grid>

                  {/* Display member info when loaded */}
                  {memberInfo && (
                    <>
                      <Grid item xs={12}>
                        <TextField
                          label="Member Name"
                          fullWidth
                          size="small"
                          value={memberInfo.name || memberInfo.Name || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Gender"
                          fullWidth
                          size="small"
                          value={memberInfo.gender || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Date Of Birth"
                          fullWidth
                          size="small"
                          value={memberInfo.dob ? new Date(memberInfo.dob).toLocaleDateString('en-GB') : ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Email ID"
                          fullWidth
                          size="small"
                          value={memberInfo.emailid || memberInfo.email || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Contact No"
                          fullWidth
                          size="small"
                          value={memberInfo.contactno || memberInfo.mobileno || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Address"
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          value={memberInfo.address || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Pan No"
                          fullWidth
                          size="small"
                          value={memberInfo.pan_no || memberInfo.Pan_no || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Aadharcard No"
                          fullWidth
                          size="small"
                          value={memberInfo.aadharcard_no || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Branch Code"
                          fullWidth
                          size="small"
                          value={memberInfo.branch_id || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Receipt No"
                          fullWidth
                          size="small"
                          value={memberInfo.receipt_no || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Nominee"
                          fullWidth
                          size="small"
                          value={memberInfo.nominee || memberInfo.Nominee_name || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Relation"
                          fullWidth
                          size="small"
                          value={memberInfo.relation || memberInfo.Nominee_Relation || ''}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </Grid>

            {/* Account Information Section */}
            <Grid item xs={12} md={6}>
              <Box sx={{
                bgcolor: '#f0fdf4',
                p: 3,
                borderRadius: 2,
                border: '1px solid #dcfce7',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <AccountBalanceIcon sx={{ color: '#10b981', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
                    Account Information
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small" sx={readOnlyInputStyle}>
                      <InputLabel id="account-type-label">Account Type</InputLabel>
                      <Select
                        labelId="account-type-label"
                        label="Account Type"
                        value={form.accountType || defaultAccountType?.toUpperCase() || ''}
                        onChange={(e) => {
                          if (!isUser) handleChange('accountType', e.target.value);
                          else navigate(`/user/account-opening/${e.target.value.toLowerCase()}`);
                        }}
                        readOnly={isUser}
                        inputProps={{ readOnly: isUser }}
                      >
                        <MenuItem value="SB">SB</MenuItem>
                        <MenuItem value="CA">CA</MenuItem>
                        <MenuItem value="RD">RD</MenuItem>
                        <MenuItem value="FD">FD</MenuItem>
                        <MenuItem value="PIGMY">PIGMY</MenuItem>
                        <MenuItem value="MIS">MIS</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small" sx={accountInputStyle}>
                      <InputLabel id="account-op-label">Account Operation</InputLabel>
                      <Select
                        labelId="account-op-label"
                        label="Account Operation"
                        value={form.accountOperation}
                        onChange={(e) => handleChange('accountOperation', e.target.value)}
                      >
                        <MenuItem value="Single">Single</MenuItem>
                        <MenuItem value="Any two">Any two</MenuItem>
                        <MenuItem value="Anyone">Anyone</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Conditional Joint Member Field */}
                  {form.accountOperation === 'Any two' && (
                    <Grid item xs={12}>
                      <TextField
                        label="Joint Member"
                        fullWidth
                        size="small"
                        value={form.jointMember}
                        onChange={(e) => handleChange('jointMember', e.target.value)}
                        placeholder="Joint member"
                        sx={accountInputStyle}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Opening Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={form.openingDate}
                      onChange={(e) => handleChange('openingDate', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={accountInputStyle}
                    />
                  </Grid>

                  {showInterestFields && (
                    <>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small" sx={accountInputStyle}>
                          <InputLabel id="interest-slab-label">Interest Slab</InputLabel>
                          <Select
                            labelId="interest-slab-label"
                            label="Interest Slab"
                            value={form.interestSlab}
                            onChange={(e) => handleInterestSlabChange(e.target.value)}
                            disabled={loadingInterests || interests.length === 0}
                          >
                            <MenuItem value="">Select Interest Slab</MenuItem>
                             {interests.map((interest: any) => (
                               <MenuItem key={interest.interest_id || interest._id} value={interest.interest_id || interest._id}>
                                 {interest.interest_name || `${interest.duration} Months`} - Gen: {interest.interest_rate_general ?? interest.interest_rate ?? 0}% | Sr: {interest.interest_rate_senior ?? '-'}%
                               </MenuItem>
                             ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Interest Rate (General)"
                          fullWidth
                          size="small"
                          value={form.interestRate}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Duration"
                          fullWidth
                          size="small"
                          value={form.duration}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Amount"
                      fullWidth
                      size="small"
                      type="number"
                      value={form.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                      sx={accountInputStyle}
                    />
                  </Grid>

                  {showInterestFields && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Maturity Date"
                          type="date"
                          fullWidth
                          size="small"
                          value={form.maturityDate}
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Maturity Value"
                          fullWidth
                          size="small"
                          value={form.maturityValue}
                          InputProps={{ readOnly: true }}
                          sx={readOnlyInputStyle}
                        />
                      </Grid>
                    </>
                  )}

                   {/* Introducer & Agent Section - Now visible but Read-Only for Members */}
                   <Grid item xs={12} md={6}>
                     <TextField
                       label="Introducer Code"
                       fullWidth
                       size="small"
                       value={form.introducer}
                       onChange={(e) => !isUser && handleChange('introducer', e.target.value)}
                       onBlur={!isUser ? handleIntroducerBlur : undefined}
                       error={agentError}
                       helperText={agentError ? 'Agent not found' : ''}
                       InputProps={{
                         readOnly: isUser,
                         endAdornment: isLoadingAgent ? (
                           <InputAdornment position="end">
                             <CircularProgress size={20} />
                           </InputAdornment>
                         ) : null,
                       }}
                       sx={isUser ? readOnlyInputStyle : accountInputStyle}
                     />
                   </Grid>

                   <Grid item xs={12} md={6}>
                     <TextField
                       label="Introducer Name"
                       fullWidth
                       size="small"
                       value={form.introducerName}
                       InputProps={{ readOnly: true }}
                       sx={readOnlyInputStyle}
                     />
                   </Grid>

                   <Grid item xs={12} md={6}>
                     {isUser ? (
                       <TextField
                         label="Agent Name"
                         fullWidth
                         size="small"
                         value={form.agentName || form.agent || ''}
                         InputProps={{ readOnly: true }}
                         sx={readOnlyInputStyle}
                       />
                     ) : (
                       <FormControl fullWidth size="small" sx={accountInputStyle}>
                         <InputLabel>Select Agent</InputLabel>
                         <Select
                           label="Select Agent"
                           value={form.agent}
                           onChange={(e) => setForm({ ...form, agent: e.target.value })}
                         >
                           {agentsData?.data?.map((agent: any) => (
                             <MenuItem key={agent._id} value={agent.agent_id}>
                               {agent.name} ({agent.agent_id})
                             </MenuItem>
                           ))}
                         </Select>
                       </FormControl>
                     )}
                   </Grid>

                   {!isUser && (
                     <Grid item xs={12} md={6}>
                       <TextField
                         label="Agent Name (Display)"
                         fullWidth
                         size="small"
                         value={form.agentName || ''}
                         InputProps={{ readOnly: true }}
                         sx={readOnlyInputStyle}
                       />
                     </Grid>
                   )}

                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={!memberInfo || createAccountMutation.isPending}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                          },
                        }}
                      >
                        {createAccountMutation.isPending ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box >
  );
};

export default AccountOpeningForm;
