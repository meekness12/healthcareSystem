import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Divider,
  InputAdornment,
  useTheme,
} from "@mui/material";
import {
  AccountBalanceWallet,
  ReceiptLong,
  Payment,
  CheckCircle,
  Warning,
  Search,
  Add,
  Delete,
  Print,
  Download,
  Shield,
  FactCheck,
  TrendingUp,
  CreditCard,
  PhoneAndroid,
  Payments,
  DoneAll,
  ThumbDown,
  Close,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import billingApi from "../../api/billing";
import PaymentModal from "../../components/billing/PaymentModal";
import ReceiptModal from "../../components/billing/ReceiptModal";

const BillingDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0); // 0: Invoices, 1: Payments Ledger, 2: Insurance Claims
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [claims, setClaims] = useState([]);
  const [claimStats, setClaimStats] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [claimStatusFilter, setClaimStatusFilter] = useState("all");

  // Create Invoice Dialog State
  const [openCreateInvoice, setOpenCreateInvoice] = useState(false);
  const [newInvoicePatientId, setNewInvoicePatientId] = useState("");
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [newInvoiceItems, setNewInvoiceItems] = useState([
    { item_description: "", item_type: "consultation", quantity: 1, unit_price_rwf: 5000 },
  ]);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Auto-Bill Encounter Dialog State
  const [openAutoBill, setOpenAutoBill] = useState(false);
  const [autoBillAppointmentId, setAutoBillAppointmentId] = useState("");
  const [submittingAutoBill, setSubmittingAutoBill] = useState(false);

  // Claim Adjudication Dialog State
  const [adjudicateClaim, setAdjudicateClaim] = useState(null);
  const [adjudicateAction, setAdjudicateAction] = useState(""); // 'approved' or 'rejected'
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingClaimAction, setSubmittingClaimAction] = useState(false);

  // Payment & Receipt Modals State
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const loadAllBillingData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes, claimRes, statsRes] = await Promise.allSettled([
        billingApi.getInvoices({ status: statusFilter !== "all" ? statusFilter : undefined, search: searchQuery || undefined }),
        billingApi.getPayments({ payment_method: methodFilter !== "all" ? methodFilter : undefined }),
        billingApi.getClaims({ status: claimStatusFilter !== "all" ? claimStatusFilter : undefined }),
        billingApi.getClaimsStats(),
      ]);

      if (invRes.status === "fulfilled") setInvoices(invRes.value.data || []);
      if (payRes.status === "fulfilled") setPayments(payRes.value.data || []);
      if (claimRes.status === "fulfilled") setClaims(claimRes.value.data || []);
      if (statsRes.status === "fulfilled") setClaimStats(statsRes.value.data || null);
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to load billing records." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBillingData();
  }, [statusFilter, searchQuery, methodFilter, claimStatusFilter]);

  // Calculations for KPI Cards
  const totalCollectedRwf = payments.reduce((acc, p) => acc + (Number(p.amount_rwf) || 0), 0);
  const totalBalanceDueRwf = invoices.reduce((acc, inv) => acc + (Number(inv.balance_rwf) || 0), 0);
  const pendingClaimsCount = claimStats?.pending_claims ?? claims.filter((c) => ["submitted", "under_review"].includes(c.claim_status)).length;
  const pendingClaimsAmount = claims
    .filter((c) => ["submitted", "under_review"].includes(c.claim_status))
    .reduce((acc, c) => acc + (Number(c.claimed_amount_rwf) || 0), 0);

  // Add Item Line in Create Invoice
  const handleAddItemRow = () => {
    setNewInvoiceItems([
      ...newInvoiceItems,
      { item_description: "", item_type: "consultation", quantity: 1, unit_price_rwf: 1000 },
    ]);
  };

  const handleRemoveItemRow = (index) => {
    setNewInvoiceItems(newInvoiceItems.filter((_, i) => i !== index));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...newInvoiceItems];
    updated[index][field] = value;
    setNewInvoiceItems(updated);
  };

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!newInvoicePatientId) {
      setFeedback({ type: "error", message: "Patient ID is required." });
      return;
    }

    try {
      setSubmittingInvoice(true);
      await billingApi.createInvoice({
        patient_id: Number(newInvoicePatientId),
        due_date: newInvoiceDueDate,
        items: newInvoiceItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price_rwf: Number(item.unit_price_rwf),
        })),
      });

      setSubmittingInvoice(false);
      setOpenCreateInvoice(false);
      setFeedback({ type: "success", message: "Invoice created successfully with insurance co-pay calculation!" });
      loadAllBillingData();
    } catch (err) {
      setSubmittingInvoice(false);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to create invoice." });
    }
  };

  const handleAutoBillSubmit = async (e) => {
    e.preventDefault();
    if (!autoBillAppointmentId) {
      setFeedback({ type: "error", message: "Appointment ID is required." });
      return;
    }

    try {
      setSubmittingAutoBill(true);
      await billingApi.generateFromAppointment(autoBillAppointmentId);
      setSubmittingAutoBill(false);
      setOpenAutoBill(false);
      setFeedback({ type: "success", message: "Encounter auto-billed successfully!" });
      loadAllBillingData();
    } catch (err) {
      setSubmittingAutoBill(false);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to auto-bill encounter." });
    }
  };

  const handleClaimAdjudicationSubmit = async (e) => {
    e.preventDefault();
    if (!adjudicateClaim) return;

    try {
      setSubmittingClaimAction(true);
      await billingApi.updateClaimStatus(adjudicateClaim.id, {
        claim_status: adjudicateAction,
        approved_amount_rwf: adjudicateAction === "approved" ? Number(approvedAmount) : undefined,
        rejection_reason: adjudicateAction === "rejected" ? rejectionReason : undefined,
      });

      setSubmittingClaimAction(false);
      setAdjudicateClaim(null);
      setFeedback({ type: "success", message: `Claim updated to ${adjudicateAction.toUpperCase()}!` });
      loadAllBillingData();
    } catch (err) {
      setSubmittingClaimAction(false);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to adjudicate claim." });
    }
  };

  const handleMarkUnderReview = async (claimId) => {
    try {
      await billingApi.updateClaimStatus(claimId, { claim_status: "under_review" });
      setFeedback({ type: "info", message: "Claim marked under review." });
      loadAllBillingData();
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to update claim status." });
    }
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Console Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Billing & Revenue Console
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revenue cycle management &bull; Itemized invoicing, Mobile Money settlements, and Multi-provider Insurance Claims.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FactCheck />}
            onClick={() => setOpenAutoBill(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Auto-Bill Encounter
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setOpenCreateInvoice(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            New Invoice
          </Button>
        </Stack>
      </Box>

      {feedback.message && (
        <Alert
          severity={feedback.type || "info"}
          onClose={() => setFeedback({ type: "", message: "" })}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* KPI Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TrendingUp color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Revenue Collected
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
                  {totalCollectedRwf.toLocaleString()} RWF
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <AccountBalanceWallet color="error" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Outstanding Patient Balances
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "error.main" }}>
                  {totalBalanceDueRwf.toLocaleString()} RWF
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Shield color="warning" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pending Insurance Claims
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {pendingClaimsCount}{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    ({pendingClaimsAmount.toLocaleString()} RWF)
                  </Typography>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <ReceiptLong color="info" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Invoices in System
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {invoices.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs Navigation */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { fontWeight: 700, textTransform: "none", fontSize: "0.95rem" },
        }}
      >
        <Tab icon={<ReceiptLong />} iconPosition="start" label={`Invoices Ledger (${invoices.length})`} />
        <Tab icon={<Payments />} iconPosition="start" label={`Settled Payments (${payments.length})`} />
        <Tab icon={<Shield />} iconPosition="start" label={`Insurance Claims (${claims.length})`} />
      </Tabs>

      {/* TAB 0: INVOICES LEDGER */}
      {activeTab === 0 && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
          <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search by invoice # or patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />

            <Stack direction="row" spacing={1}>
              {["all", "unpaid", "partially_paid", "paid", "overdue"].map((st) => (
                <Chip
                  key={st}
                  label={st.toUpperCase().replace("_", " ")}
                  clickable
                  color={statusFilter === st ? "primary" : "default"}
                  onClick={() => setStatusFilter(st)}
                  sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                />
              ))}
            </Stack>
          </Box>
          <Divider />

          {loading ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : invoices.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No matching invoices found.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Insurance Covered</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient Co-Pay</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Remaining Due</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => {
                    const isPaid = inv.status === "paid";
                    return (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{inv.invoice_number}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {inv.patient?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {inv.patient?.patient_number} &bull; {inv.patient?.insurance_provider?.code || "Private"}
                          </Typography>
                        </TableCell>
                        <TableCell>{inv.due_date || "Immediate"}</TableCell>
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
                            label={inv.status?.toUpperCase().replace("_", " ")}
                            size="small"
                            color={isPaid ? "success" : inv.status === "partially_paid" ? "warning" : "error"}
                            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Download PDF Invoice">
                              <IconButton size="small" onClick={() => billingApi.downloadInvoicePdf(inv.id)}>
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
                                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5 }}
                              >
                                Collect
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* TAB 1: PAYMENTS & SETTLED TRANSACTIONS LEDGER */}
      {activeTab === 1 && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
          <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Settlement Ledger & Transactions
            </Typography>

            <Stack direction="row" spacing={1}>
              {["all", "momo", "airtel_money", "card", "cash"].map((method) => (
                <Chip
                  key={method}
                  label={method.toUpperCase().replace("_", " ")}
                  clickable
                  color={methodFilter === method ? "primary" : "default"}
                  onClick={() => setMethodFilter(method)}
                  sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                />
              ))}
            </Stack>
          </Box>
          <Divider />

          {payments.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No recorded payment transactions found.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Transaction Ref</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date/Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payer Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount Settled</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Thermal Receipt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                        {p.transaction_reference}
                      </TableCell>
                      <TableCell>{p.formatted_paid_at || p.paid_at?.slice(0, 16)}</TableCell>
                      <TableCell>{p.patient?.name || "Patient"}</TableCell>
                      <TableCell>
                        <Chip
                          label={p.payment_method?.toUpperCase().replace("_", " ")}
                          size="small"
                          color={p.payment_method === "momo" ? "warning" : "primary"}
                          sx={{ fontWeight: 700, fontSize: "0.65rem" }}
                        />
                      </TableCell>
                      <TableCell>{p.payer_phone || "Desk Counter"}</TableCell>
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
                          Print Slip
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* TAB 2: INSURANCE CLAIMS ADJUDICATION */}
      {activeTab === 2 && (
        <Box>
          {/* Claims Status Filter */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}>
            <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Claims Adjudication Workflow
              </Typography>
              <Stack direction="row" spacing={1}>
                {["all", "submitted", "under_review", "approved", "rejected", "paid"].map((st) => (
                  <Chip
                    key={st}
                    label={st.toUpperCase().replace("_", " ")}
                    clickable
                    color={claimStatusFilter === st ? "primary" : "default"}
                    onClick={() => setClaimStatusFilter(st)}
                    sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                  />
                ))}
              </Stack>
            </Box>
          </Card>

          {/* Claims Table */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            {claims.length === 0 ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No insurance claims match the current criteria.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Claim Ref</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Claimed Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Approved Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Submitted At</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Adjudicate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {claims.map((c) => {
                      const isPending = ["submitted", "under_review"].includes(c.claim_status);
                      return (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                            {c.claim_reference}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={c.provider?.code || c.provider?.name}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {c.patient?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Policy: {c.patient?.insurance_number || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {Number(c.claimed_amount_rwf).toLocaleString()} RWF
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: c.approved_amount_rwf > 0 ? "success.main" : "text.secondary" }}>
                            {Number(c.approved_amount_rwf).toLocaleString()} RWF
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={c.claim_status?.toUpperCase().replace("_", " ")}
                              size="small"
                              color={
                                c.claim_status === "approved" || c.claim_status === "paid"
                                  ? "success"
                                  : c.claim_status === "rejected"
                                  ? "error"
                                  : "warning"
                              }
                              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                            />
                            {c.rejection_reason && (
                              <Typography variant="caption" color="error.main" sx={{ display: "block", fontSize: "0.7rem" }}>
                                {c.rejection_reason}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{c.formatted_submitted_at || c.submitted_at?.slice(0, 10)}</TableCell>
                          <TableCell align="right">
                            {isPending && (
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                {c.claim_status === "submitted" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleMarkUnderReview(c.id)}
                                    sx={{ fontSize: "0.75rem", textTransform: "none" }}
                                  >
                                    Review
                                  </Button>
                                )}
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<DoneAll fontSize="small" />}
                                  onClick={() => {
                                    setAdjudicateClaim(c);
                                    setAdjudicateAction("approved");
                                    setApprovedAmount(c.claimed_amount_rwf);
                                  }}
                                  sx={{ fontSize: "0.75rem", textTransform: "none" }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<ThumbDown fontSize="small" />}
                                  onClick={() => {
                                    setAdjudicateClaim(c);
                                    setAdjudicateAction("rejected");
                                    setRejectionReason("");
                                  }}
                                  sx={{ fontSize: "0.75rem", textTransform: "none" }}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      )}

      {/* DIALOG 1: CREATE NEW MANUAL INVOICE */}
      <Dialog
        open={openCreateInvoice}
        onClose={() => setOpenCreateInvoice(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Create New Itemized Invoice
          </Typography>
          <Button size="small" onClick={() => setOpenCreateInvoice(false)} sx={{ minWidth: 0 }}>
            <Close fontSize="small" />
          </Button>
        </DialogTitle>

        <form onSubmit={handleCreateInvoiceSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Patient ID"
                  required
                  fullWidth
                  type="number"
                  value={newInvoicePatientId}
                  onChange={(e) => setNewInvoicePatientId(e.target.value)}
                  placeholder="e.g. 1 (Keza Divine)"
                  helperText="Enter patient ID to apply insurance co-pay rates."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Due Date"
                  required
                  fullWidth
                  type="date"
                  value={newInvoiceDueDate}
                  onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Invoice Line Items
              </Typography>
              <Button size="small" startIcon={<Add />} onClick={handleAddItemRow} sx={{ textTransform: "none" }}>
                Add Item
              </Button>
            </Box>

            {newInvoiceItems.map((item, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{ p: 1.5, mb: 1.5, bgcolor: "action.hover", borderRadius: 2, display: "flex", gap: 1.5, alignItems: "center" }}
              >
                <TextField
                  label="Description"
                  required
                  size="small"
                  value={item.item_description}
                  onChange={(e) => handleItemFieldChange(idx, "item_description", e.target.value)}
                  sx={{ flex: 3 }}
                />
                <TextField
                  select
                  label="Type"
                  size="small"
                  value={item.item_type}
                  onChange={(e) => handleItemFieldChange(idx, "item_type", e.target.value)}
                  sx={{ flex: 1.5 }}
                >
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="lab_test">Lab Test</MenuItem>
                  <MenuItem value="medicine">Medicine</MenuItem>
                  <MenuItem value="procedure">Procedure</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
                <TextField
                  label="Qty"
                  type="number"
                  required
                  size="small"
                  value={item.quantity}
                  onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value)}
                  inputProps={{ min: 1 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Unit Price (RWF)"
                  type="number"
                  required
                  size="small"
                  value={item.unit_price_rwf}
                  onChange={(e) => handleItemFieldChange(idx, "unit_price_rwf", e.target.value)}
                  inputProps={{ min: 0 }}
                  sx={{ flex: 1.5 }}
                />
                {newInvoiceItems.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => handleRemoveItemRow(idx)}>
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Paper>
            ))}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setOpenCreateInvoice(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submittingInvoice}>
              {submittingInvoice ? "Generating..." : "Generate Invoice"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 2: AUTO-BILL ENCOUNTER */}
      <Dialog
        open={openAutoBill}
        onClose={() => setOpenAutoBill(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Auto-Bill Clinical Encounter
          </Typography>
          <Button size="small" onClick={() => setOpenAutoBill(false)} sx={{ minWidth: 0 }}>
            <Close fontSize="small" />
          </Button>
        </DialogTitle>

        <form onSubmit={handleAutoBillSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Bundles the doctor's consultation fee, ordered lab diagnostics, and prescribed medicines for an appointment into an invoice with automated insurance co-pay calculations.
            </Typography>
            <TextField
              label="Appointment ID"
              required
              fullWidth
              type="number"
              value={autoBillAppointmentId}
              onChange={(e) => setAutoBillAppointmentId(e.target.value)}
              placeholder="e.g. 1"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setOpenAutoBill(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submittingAutoBill}>
              {submittingAutoBill ? "Processing..." : "Generate Invoice"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 3: CLAIM ADJUDICATION (APPROVE / REJECT) */}
      {adjudicateClaim && (
        <Dialog
          open={Boolean(adjudicateClaim)}
          onClose={() => setAdjudicateClaim(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {adjudicateAction === "approved" ? "Approve Insurance Claim" : "Reject Insurance Claim"}
            </Typography>
            <Button size="small" onClick={() => setAdjudicateClaim(null)} sx={{ minWidth: 0 }}>
              <Close fontSize="small" />
            </Button>
          </DialogTitle>

          <form onSubmit={handleClaimAdjudicationSubmit}>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Claim Ref: <strong>{adjudicateClaim.claim_reference}</strong> &bull; Provider: {adjudicateClaim.provider?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Claimed Amount: <strong>{Number(adjudicateClaim.claimed_amount_rwf).toLocaleString()} RWF</strong>
              </Typography>

              {adjudicateAction === "approved" ? (
                <TextField
                  label="Approved Amount (RWF)"
                  type="number"
                  required
                  fullWidth
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  inputProps={{ min: 0, max: adjudicateClaim.claimed_amount_rwf }}
                />
              ) : (
                <TextField
                  label="Rejection Reason"
                  required
                  fullWidth
                  multiline
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Policy not active, non-covered specialized procedure..."
                />
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="outlined" color="inherit" onClick={() => setAdjudicateClaim(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color={adjudicateAction === "approved" ? "success" : "error"}
                disabled={submittingClaimAction}
              >
                {submittingClaimAction ? "Saving..." : adjudicateAction === "approved" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Payment Processing Modal */}
      {selectedInvoiceForPayment && (
        <PaymentModal
          open={Boolean(selectedInvoiceForPayment)}
          onClose={() => setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
          isStaff={true}
          onSuccess={(newPayment) => {
            loadAllBillingData();
            setActiveReceipt(newPayment);
          }}
        />
      )}

      {/* Official Thermal Receipt Modal */}
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

export default BillingDashboard;
