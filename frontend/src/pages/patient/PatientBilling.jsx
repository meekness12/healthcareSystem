import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import {
  ReceiptLong,
  Payment,
  CheckCircle,
  Warning,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Download,
  Print,
  Shield,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import billingApi from "../../api/billing";
import PaymentModal from "../../components/billing/PaymentModal";
import ReceiptModal from "../../components/billing/ReceiptModal";

const PatientBilling = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  // Modals state
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError("");
      const [invRes, payRes] = await Promise.all([
        billingApi.getInvoices(),
        billingApi.getPayments(),
      ]);
      setInvoices(invRes.data || []);
      setPayments(payRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load billing records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const totalOutstanding = invoices.reduce(
    (acc, inv) => acc + (Number(inv.balance_rwf) || 0),
    0
  );

  const handlePaymentSuccess = (newPayment) => {
    loadBillingData();
    // Open receipt modal automatically
    setActiveReceipt(newPayment);
  };

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await billingApi.getReceipt(paymentId);
      setActiveReceipt(res.data);
    } catch (err) {
      console.error("Failed to load receipt:", err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          My Invoices & Payments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review medical bills, insurance coverage deductions, and settle co-pay balances via Mobile Money or Card.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Outstanding Balance
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: totalOutstanding > 0 ? "error.main" : "success.main",
                  }}
                >
                  {totalOutstanding.toLocaleString()} RWF
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <ReceiptLong color="info" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Invoices Issued
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {invoices.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Shield color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Insurance Co-Pay Coverage
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {invoices[0]?.patient?.insurance_provider?.name || "Active Insurance"}
                </Typography>
                {invoices[0]?.patient?.insurance_provider?.coverage_percentage && (
                  <Chip
                    label={`${invoices[0].patient.insurance_provider.coverage_percentage}% Covered`}
                    size="small"
                    color="success"
                    sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, mt: 0.5 }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoices List Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 4 }}>
        <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Medical Bills & Invoices
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Expand rows to inspect itemized breakdown of consultation, lab, and pharmacy charges.
            </Typography>
          </Box>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : invoices.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <ReceiptLong sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography variant="subtitle1" color="text.secondary">
              No invoices generated yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ width: 48 }}></TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Insurance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Patient Co-Pay</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Balance Due</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  const isPaid = inv.status === "paid";

                  return (
                    <React.Fragment key={inv.id}>
                      <TableRow hover sx={{ "& > *": { borderBottom: "unset" } }}>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                          >
                            {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{inv.invoice_number}</TableCell>
                        <TableCell>{inv.due_date || inv.created_at?.slice(0, 10)}</TableCell>
                        <TableCell>{Number(inv.subtotal_rwf).toLocaleString()} RWF</TableCell>
                        <TableCell sx={{ color: "success.main", fontWeight: 600 }}>
                          -{Number(inv.insurance_covered_rwf).toLocaleString()} RWF
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {Number(inv.total_amount_rwf).toLocaleString()} RWF
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: inv.balance_rwf > 0 ? "error.main" : "success.main",
                          }}
                        >
                          {Number(inv.balance_rwf).toLocaleString()} RWF
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={inv.status?.toUpperCase()}
                            size="small"
                            color={isPaid ? "success" : inv.status === "partially_paid" ? "warning" : "error"}
                            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Download PDF Invoice">
                              <IconButton
                                size="small"
                                onClick={() => billingApi.downloadInvoicePdf(inv.id)}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!isPaid && (
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<Payment />}
                                onClick={() => setSelectedInvoiceForPayment(inv)}
                                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
                              >
                                Pay Now
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Expandable Line Items */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2, p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                Itemized Breakdown
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Item Description</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Qty</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Total Price</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {inv.items?.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.item_description}</TableCell>
                                      <TableCell sx={{ textTransform: "capitalize" }}>{item.item_type}</TableCell>
                                      <TableCell align="center">{item.quantity}</TableCell>
                                      <TableCell align="right">{Number(item.unit_price_rwf).toLocaleString()} RWF</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                                        {Number(item.total_price_rwf).toLocaleString()} RWF
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Payment History Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Settled Transactions & Receipts
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Verified mobile money, card, and cash checkout receipts.
          </Typography>
        </Box>
        <Divider />

        {payments.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No transactions recorded yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Transaction Ref</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payer Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount Settled</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Receipt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                      {p.transaction_reference}
                    </TableCell>
                    <TableCell>{p.formatted_paid_at || p.paid_at?.slice(0, 16)}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.payment_method?.toUpperCase()}
                        size="small"
                        color={p.payment_method === "momo" ? "warning" : "primary"}
                        sx={{ fontWeight: 700, fontSize: "0.65rem" }}
                      />
                    </TableCell>
                    <TableCell>{p.payer_phone || "N/A"}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>
                      {Number(p.amount_rwf).toLocaleString()} RWF
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Print />}
                        onClick={() => handleOpenReceipt(p.id)}
                        sx={{ borderRadius: 1.5, fontSize: "0.75rem", textTransform: "none" }}
                      >
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Payment Dialog Modal */}
      {selectedInvoiceForPayment && (
        <PaymentModal
          open={Boolean(selectedInvoiceForPayment)}
          onClose={() => setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Thermal Printable Modal */}
      {activeReceipt && (
        <ReceiptModal
          open={Boolean(activeReceipt)}
          onClose={() => setActiveReceipt(null)}
          receiptData={activeReceipt}
        />
      )}
    </Container>
  );
};

export default PatientBilling;
