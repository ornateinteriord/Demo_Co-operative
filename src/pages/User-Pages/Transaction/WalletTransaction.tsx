import DataTable from "react-data-table-component";
import {
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import { exportToExcel } from "../../../utils/excelExport";
import {
  DASHBOARD_CUTSOM_STYLE,
  getTransactionColumns,
} from "../../../utils/DataTableColumnsProvider";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useGetTransactionDetails } from "../../../api/Memeber";

const WalletTransaction = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "all";
  const status = searchParams.get("status") || "all";

  const {
    data: transactionsResponse,
    isLoading,
    isError,
    error,
  } = useGetTransactionDetails(status, type);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState<any[]>([]);

  useEffect(() => {
    if (isError) {
      const err = error as any;
      toast.error(
        err?.response?.data?.message || "Failed to fetch Wallet transactions"
      );
    }
  }, [isError, error]);

  // Safely extract all transactions (no filter)
  useEffect(() => {
    const transactions = transactionsResponse?.data || [];

    if (Array.isArray(transactions)) {
      // Apply search filter only
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchedData = transactions.filter((tx: any) =>
          Object.values(tx).some(value =>
            value?.toString().toLowerCase().includes(query)
          )
        );
        setFilteredData(searchedData);
      } else {
        setFilteredData(transactions);
      }
    } else {
      setFilteredData([]);
    }
  }, [transactionsResponse, searchQuery]);

  const noDataComponent = (
    <Box sx={{ padding: "24px", textAlign: "center" }}>
      <Typography variant="h6" color="textSecondary">
        No wallet transactions available
      </Typography>
    </Box>
  );

  if (isLoading) {
    return (
      <Card sx={{ margin: "2rem", mt: 10, textAlign: "center", p: 3 }}>
        <CircularProgress size={"4rem"} sx={{ color: "#0a2558" }} />
      </Card>
    );
  }

  return (
    <Card sx={{ margin: "2rem", mt: 10 }}>
      <CardContent>
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: "#0a2558",
              color: "#fff",
              "& .MuiSvgIcon-root": { color: "#fff" },
            }}
          >
            {type !== 'all' ? `${type} Account History` : 'Wallet Transactions'}
          </AccordionSummary>
          <AccordionDetails>
            <DataTable
              columns={getTransactionColumns()}
              data={filteredData}
              pagination
              customStyles={DASHBOARD_CUTSOM_STYLE}
              paginationPerPage={25}
              paginationRowsPerPageOptions={[25, 50, 100]}
              highlightOnHover
              progressPending={false}
              noDataComponent={noDataComponent}
              subHeader
              subHeaderComponent={
                <Box sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  p: 1,
                }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Showing {filteredData.length} wallet transactions
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportToExcel({
                        fileName: `Statement_${type}_${new Date().toLocaleDateString('en-GB')}`,
                        title: `${type !== 'all' ? type : 'Wallet'} Statement`,
                        columns: [
                          { header: 'Date', key: 'transaction_date', width: 20 },
                          { header: 'ID', key: 'transaction_id', width: 20 },
                          { header: 'Type', key: 'transaction_type', width: 15 },
                          { header: 'Description', key: 'description', width: 40 },
                          { header: 'Credit', key: 'credit', width: 15 },
                          { header: 'Debit', key: 'debit', width: 15 },
                          { header: 'Balance', key: 'balance', width: 15 },
                          { header: 'Status', key: 'status', width: 12 },
                        ],
                        data: filteredData.map(tx => ({
                          ...tx,
                          transaction_date: tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('en-GB') : (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB') : ''),
                          credit: tx.credit || tx.ew_credit || 0,
                          debit: tx.debit || tx.ew_debit || 0,
                          balance: tx.balance || tx.net_amount || tx.previous_balance || 0
                        })),
                        statusField: 'status'
                      })}
                      sx={{ borderRadius: '8px' }}
                    >
                      Export
                    </Button>
                  </Box>
                  <TextField
                    placeholder="Search wallet transactions..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: '250px' }}
                  />
                </Box>
              }
            />
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default WalletTransaction;