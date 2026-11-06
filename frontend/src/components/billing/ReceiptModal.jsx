import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  Stack,
  useTheme,
} from "@mui/material";
import {
  Print,
  CheckCircle,
  Download,
  ReceiptLong,
  Close,
} from "@mui/icons-material";
import billingApi from "../../api/billing";

const ReceiptModal = ({ open, onClose, receiptData }) => {
  const theme = useTheme();

  if (!receiptData) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (receiptData.id) {
      try {
        await billingApi.downloadReceiptPdf(receiptData.id);
      } catch (err) {
        console.error("Failed to download PDF receipt:", err);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          "@media print": {
            boxShadow: "none",
            border: "none",
            m: 0,
            p: 0,
            width: "100%",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          "@media print": { display: "none" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReceiptLong color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Official Receipt
          </Typography>
        </Box>
        <Button size="small" onClick={onClose} sx={{ minWidth: 0, p: 0.5 }}>
          <Close fontSize="small" />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* Printable Receipt Paper Container */}
        <Paper
          id="printable-receipt"
          elevation={0}
          sx={{
            p: 2.5,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: theme.palette.mode === "dark" ? "background.default" : "#FAFAFA",
            fontFamily: "monospace",
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
              HEALTHCARE SYSTEM RWANDA
            </Typography>
            <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
              Karongi Provincial Hospital &bull; B.P. 45 Kibuye
            </Typography>
            <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
              TIN: 100234891 &bull; Tel: +250 788 200 001
            </Typography>
            <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mb: 0.5 }}>
              <CheckCircle color="success" sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                PAYMENT RECEIVED
              </Typography>
            </Box>
          </Box>

          {/* Reference & Meta Table */}
          <Table size="small" sx={{ mb: 1.5 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "none", p: 0.5, color: "text.secondary" }}>Txn Reference:</TableCell>
                <TableCell align="right" sx={{ border: "none", p: 0.5, fontWeight: 700 }}>
                  {receiptData.transaction_reference}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: "none", p: 0.5, color: "text.secondary" }}>Payment Method:</TableCell>
                <TableCell align="right" sx={{ border: "none", p: 0.5, fontWeight: 700 }}>
                  <Chip
                    label={receiptData.payment_method?.toUpperCase()}
                    size="small"
                    color={receiptData.payment_method === "momo" ? "warning" : "primary"}
                    sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                  />
                </TableCell>
              </TableRow>
              {receiptData.payer_phone && (
                <TableRow>
                  <TableCell sx={{ border: "none", p: 0.5, color: "text.secondary" }}>Payer Phone:</TableCell>
                  <TableCell align="right" sx={{ border: "none", p: 0.5 }}>
                    {receiptData.payer_phone}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={{ border: "none", p: 0.5, color: "text.secondary" }}>Paid At:</TableCell>
                <TableCell align="right" sx={{ border: "none", p: 0.5 }}>
                  {receiptData.formatted_paid_at || new Date().toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: "none", p: 0.5, color: "text.secondary" }}>Patient:</TableCell>
                <TableCell align="right" sx={{ border: "none", p: 0.5, fontWeight: 600 }}>
                  {receiptData.patient?.name}
                </TableCell>
              </TableRow>
              {receiptData.patient?.patient_number && (
                <TableRow>
                  <TableCell sx={{ border: "none", p: 0.5, color: "text.secondary" }}>Patient ID:</TableCell>
                  <TableCell align="right" sx={{ border: "none", p: 0.5 }}>
                    {receiptData.patient.patient_number}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

          {/* Amount Breakdown */}
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "none", p: 0.5 }}>Billed Patient Co-Pay:</TableCell>
                <TableCell align="right" sx={{ border: "none", p: 0.5 }}>
                  {Number(receiptData.invoice?.patient_co_pay_rwf || receiptData.invoice?.total_amount_rwf || 0).toLocaleString()} RWF
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ border: "none", p: 1, fontWeight: 800, fontSize: "0.95rem" }}>
                  AMOUNT PAID:
                </TableCell>
                <TableCell align="right" sx={{ border: "none", p: 1, fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>
                  {Number(receiptData.amount_rwf || 0).toLocaleString()} RWF
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: "none", p: 0.5, color: "text.secondary" }}>Remaining Balance:</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    border: "none",
                    p: 0.5,
                    fontWeight: 700,
                    color: Number(receiptData.invoice?.balance_remaining_rwf || receiptData.invoice?.balance_rwf || 0) > 0 ? "error.main" : "success.main",
                  }}
                >
                  {Number(receiptData.invoice?.balance_remaining_rwf || receiptData.invoice?.balance_rwf || 0).toLocaleString()} RWF
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Verification Barcode Mock */}
          <Box sx={{ textAlign: "center", my: 2 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                letterSpacing: 4,
                bgcolor: "action.selected",
                py: 0.8,
                borderRadius: 1,
                fontWeight: 700,
              }}
            >
              *{receiptData.transaction_reference}*
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              Digital Signature Verified &bull; Karongi Hospital Cashier Desk
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              color: "text.secondary",
              fontStyle: "italic",
              borderTop: "1px dashed",
              borderColor: "divider",
              pt: 1,
            }}
          >
            Murakoze gukoresha serivisi z'ibitaro bya Karongi &bull; Thank you
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          justifyContent: "space-between",
          "@media print": { display: "none" },
        }}
      >
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
        <Stack direction="row" spacing={1}>
          {receiptData.id && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Download />}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print Receipt
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptModal;
