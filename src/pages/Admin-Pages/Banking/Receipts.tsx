import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Button,
  Typography,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { useReactToPrint } from 'react-to-print';
import AdminReusableTable from '../../../utils/AdminReusableTable';
import { useGetReceipts, useDeleteReceipt, useGetReceiptById, Receipt as ReceiptType } from '../../../queries/banking';
import { toast } from 'react-toastify';
import ReceiptDialog from '../../../components/Banking/ReceiptDialog';
import ConfirmDialog from '../../../components/Shared/ConfirmDialog';
import ReceiptPrint from '../../../components/Print-components/Receipts/receipt';
import ReceiptsTablePrint from '../../../components/Print-components/Receipts/receipts';

interface Receipt {
  id: string;
  receipt_id: string;
  date: string;
  received_from: string;
  description: string;
  mode_of_payment_received: string;
  amount: number;
  status: 'active' | 'inactive';
  rowNumber?: number;
  member_id?: string;
  account_no?: string;
}

const Receipts: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<string | null>(null);
  const [tablePrintDialogOpen, setTablePrintDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const tablePrintRef = useRef<HTMLDivElement>(null);

  const { data: receiptsData, isLoading } = useGetReceipts(page, 10, searchQuery);
  // Fetch all receipts for printing (without pagination)
  const { data: allReceiptsData } = useGetReceipts(1, 9999, '', undefined, undefined);
  const deleteReceiptMutation = useDeleteReceipt();
  const { data: receiptToPrintData } = useGetReceiptById(receiptToPrint || '', !!receiptToPrint);

  // Transform API data to table format
  const receipts: Receipt[] = receiptsData?.data?.map((receipt: ReceiptType, index: number) => ({
    id: receipt._id || '',
    receipt_id: receipt.receipt_id,
    date: receipt.receipt_date
      ? new Date(receipt.receipt_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      : '-',
    received_from: receipt.received_from || 'N/A',
    description: receipt.receipt_details || '-',
    mode_of_payment_received: receipt.mode_of_payment_received || '-',
    amount: receipt.amount || 0,
    status: receipt.status as 'active' | 'inactive',
    rowNumber: (page - 1) * 10 + index + 1,
    member_id: receipt.member_id || '-',
    account_no: receipt.account_details?.account_no || '-',
  })) || [];

  const columns = [
    {
      id: 'excel',
      label: 'Excel',
      minWidth: 80,
      align: 'center' as const,
      renderCell: (row: Receipt) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          {row.rowNumber || 1}
        </Typography>
      ),
    },
    {
      id: 'receipt_id',
      label: 'Voucher No',
      sortable: true,
      minWidth: 120,
      renderCell: (row: Receipt) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6366f1' }}>
          {row.receipt_id}
        </Typography>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      sortable: true,
      minWidth: 130,
    },
    {
      id: 'received_from',
      label: 'Received From',
      sortable: true,
      minWidth: 150,
    },
    {
      id: 'member_id',
      label: 'Member ID',
      minWidth: 120,
      renderCell: (row: Receipt) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
          {row.member_id}
        </Typography>
      ),
    },
    {
      id: 'account_no',
      label: 'Account No',
      minWidth: 130,
      renderCell: (row: Receipt) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
          {row.account_no && String(row.account_no) !== 'NaN' ? row.account_no : '-'}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 180,
    },
    {
      id: 'mode_of_payment_received',
      label: 'Mode Of Receipt',
      minWidth: 140,
      renderCell: (row: Receipt) => (
        <Chip
          label={row.mode_of_payment_received}
          size="small"
          sx={{
            backgroundColor:
              row.mode_of_payment_received === 'Cash' ? '#dbeafe' :
                row.mode_of_payment_received === 'Cheque' ? '#fef3c7' : '#d1fae5',
            color:
              row.mode_of_payment_received === 'Cash' ? '#1e40af' :
                row.mode_of_payment_received === 'Cheque' ? '#92400e' : '#065f46',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      minWidth: 120,
      align: 'right' as const,
      renderCell: (row: Receipt) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
          ₹{row.amount.toFixed(2)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      minWidth: 100,
      align: 'center' as const,
      renderCell: (row: Receipt) => (
        <Chip
          label={row.status}
          size="small"
          sx={{
            backgroundColor: row.status === 'active' ? '#d1fae5' : '#f1f5f9',
            color: row.status === 'active' ? '#065f46' : '#64748b',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        />
      ),
    },
    {
      id: 'modify',
      label: 'Modify',
      minWidth: 100,
      align: 'center' as const,
      renderCell: (row: Receipt) => (
        <Button
          variant="contained"
          size="small"
          startIcon={<EditIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleModifyClick(row.receipt_id);
          }}
          sx={{
            textTransform: 'none',
            backgroundColor: '#fbbf24',
            color: 'white',
            fontSize: '0.75rem',
            px: 2,
            '&:hover': {
              backgroundColor: '#f59e0b',
            }
          }}
        >
          Modify
        </Button>
      ),
    },
    {
      id: 'delete',
      label: 'Delete',
      minWidth: 100,
      align: 'center' as const,
      renderCell: (row: Receipt) => (
        <Button
          variant="contained"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(row.receipt_id);
          }}
          sx={{
            textTransform: 'none',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '0.75rem',
            px: 2,
            '&:hover': {
              backgroundColor: '#dc2626',
            }
          }}
        >
          Delete
        </Button>
      ),
    },
    {
      id: 'display',
      label: 'Display',
      minWidth: 140,
      align: 'center' as const,
      renderCell: (row: Receipt) => (
        <Button
          variant="contained"
          size="small"
          startIcon={<PrintIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handlePrintPreview(row.receipt_id);
          }}
          sx={{
            textTransform: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '0.75rem',
            px: 2,
            '&:hover': {
              backgroundColor: '#2563eb',
            }
          }}
        >
          Print Preview
        </Button>
      ),
    },
  ];

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleModifyClick = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    setDialogOpen(true);
  };

  const handleAddReceipt = () => {
    setSelectedReceiptId(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (receiptId: string) => {
    setReceiptToDelete(receiptId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (receiptToDelete) {
      deleteReceiptMutation.mutate(receiptToDelete, {
        onSuccess: () => {
          toast.success('Receipt deleted successfully');
          setReceiptToDelete(null);
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to delete receipt');
          setReceiptToDelete(null);
        }
      });
    }
  };

  const handlePrintPreview = (receiptId: string) => {
    setReceiptToPrint(receiptId);
    setPrintDialogOpen(true);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleTablePrint = useReactToPrint({
    contentRef: tablePrintRef,
  });

  const handleExport = () => {
    toast.info('Excel export feature will be implemented soon');
  };

  const tableActions = (
    <Stack direction="row" spacing={1}>
      <Button
        variant="contained"
        startIcon={<PrintIcon />}
        onClick={() => setTablePrintDialogOpen(true)}
        sx={{
          textTransform: 'none',
          backgroundColor: '#6366f1',
          '&:hover': { backgroundColor: '#4f46e5' }
        }}
      >
        Print
      </Button>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddReceipt}
        sx={{
          textTransform: 'none',
          backgroundColor: '#10b981',
          '&:hover': { backgroundColor: '#059669' }
        }}
      >
        Add Receipts
      </Button>
    </Stack>
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, mt: { xs: 7, sm: 8 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
          List of Receipts
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          CREATE, PRINT NON ADMIN TEMPLATE
        </Typography>
      </Box>

      <AdminReusableTable<Receipt>
        columns={columns}
        data={receipts}
        title="Receipt Management"
        isLoading={isLoading}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        searchQuery={searchInput}
        paginationPerPage={10}
        actions={tableActions}
        onExport={handleExport}
        emptyMessage="No receipts found"
        totalCount={receiptsData?.pagination?.total}
        currentPage={page - 1}
        onPageChange={(newPage) => setPage(newPage + 1)}
      />

      <ReceiptDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedReceiptId(null);
        }}
        receiptId={selectedReceiptId}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Receipt"
        message="Are you sure you want to delete this receipt? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      {/* Print Preview Dialog */}
      <Dialog
        open={printDialogOpen}
        onClose={() => {
          setPrintDialogOpen(false);
          setReceiptToPrint(null);
        }}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: '16px' }
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Receipt Print Preview
          </Typography>
          <IconButton
            onClick={() => {
              setPrintDialogOpen(false);
              setReceiptToPrint(null);
            }}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, backgroundColor: '#f3f4f6' }}>
          {receiptToPrintData?.data && (
            <Box sx={{ maxHeight: '70vh', overflow: 'auto', p: 2 }}>
              <ReceiptPrint
                ref={printRef}
                receiptData={{
                  receipt_id: receiptToPrintData.data.receipt_id,
                  receipt_date: receiptToPrintData.data.receipt_date,
                  received_from: receiptToPrintData.data.received_from,
                  receipt_details: receiptToPrintData.data.receipt_details,
                  mode_of_payment_received: receiptToPrintData.data.mode_of_payment_received,
                  amount: receiptToPrintData.data.amount,
                  branch_code: receiptToPrintData.data.branch_code,
                  entered_by: receiptToPrintData.data.entered_by,
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setPrintDialogOpen(false);
              setReceiptToPrint(null);
            }}
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
            onClick={handlePrint}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table Print Preview Dialog */}
      <Dialog
        open={tablePrintDialogOpen}
        onClose={() => setTablePrintDialogOpen(false)}
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
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Receipts Table Print Preview
          </Typography>
          <IconButton
            onClick={() => setTablePrintDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, backgroundColor: '#f3f4f6' }}>
          <Box sx={{ maxHeight: '70vh', overflow: 'auto', p: 2 }}>
            <ReceiptsTablePrint
              ref={tablePrintRef}
              receipts={(allReceiptsData?.data || []).map((receipt: ReceiptType) => ({
                receipt_id: receipt.receipt_id,
                receipt_date: receipt.receipt_date,
                received_from: receipt.received_from,
                receipt_details: receipt.receipt_details,
                mode_of_payment_received: receipt.mode_of_payment_received,
                amount: receipt.amount,
                status: receipt.status,
              }))}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setTablePrintDialogOpen(false)}
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
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Receipts;