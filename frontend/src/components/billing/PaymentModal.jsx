import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Paper,
  InputAdornment,
  useTheme,
} from "@mui/material";
import {
  PhoneAndroid,
  CreditCard,
  Payments,
  CheckCircle,
  Close,
  Lock,
} from "@mui/icons-material";
import billingApi from "../../api/billing";

const PaymentModal = ({ open, onClose, invoice, onSuccess, isStaff = false }) => {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0); // 0: MoMo, 1: Airtel, 2: Card, 3: Cash
  const [amount, setAmount] = useState(invoice ? invoice.balance_rwf : 0);
  const [phone, setPhone] = useState(invoice?.patient?.phone || "+250 788 500 001");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [loading, setLoading] = useState(false);
  const [ussdSimulating, setUssdSimulating] = useState(false);
  const [error, setError] = useState("");

  // Sync state when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.balance_rwf);
      if (invoice.patient?.phone) {
        setPhone(invoice.patient.phone);
      }
      setError("");
    }
  }, [invoice]);

  if (!invoice) {
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError("");
    if (newValue === 0 && !phone.startsWith("+250 78") && !phone.startsWith("+250 79")) {
      setPhone("+250 788 500 001");
    } else if (newValue === 1) {
      setPhone("+250 728 500 002");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payAmount = Number(amount);
    if (!payAmount || payAmount < 100) {
      setError("Payment amount must be at least 100 RWF.");
      return;
    }

    if (payAmount > Number(invoice.balance_rwf)) {
      setError(`Payment cannot exceed remaining balance of ${Number(invoice.balance_rwf).toLocaleString()} RWF.`);
      return;
    }

    let method = "momo";
    if (activeTab === 1) method = "airtel_money";
    else if (activeTab === 2) method = "card";
    else if (activeTab === 3) method = "cash";

    if (["momo", "airtel_money"].includes(method)) {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      const phoneRegex = /^(\+?250|0)7[2389]\d{7}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setError("Please enter a valid Rwandan phone number (e.g. +250 788 123 456).");
        return;
      }
    }

    try {
      setLoading(true);

      // Mobile money USSD simulation delay for high-fidelity experience
      if (["momo", "airtel_money"].includes(method)) {
        setUssdSimulating(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setUssdSimulating(false);
      }

      const res = await billingApi.processPayment({
        invoice_id: invoice.id,
        amount_rwf: payAmount,
        payment_method: method,
        payer_phone: ["momo", "airtel_money"].includes(method) ? phone : undefined,
      });

      setLoading(false);
      onClose();
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      setUssdSimulating(false);
      setLoading(false);
      setError(err.response?.data?.message || "Payment processing failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Checkout & Settle Invoice
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Invoice: <strong>{invoice.invoice_number}</strong> &bull; Patient: {invoice.patient?.name}
          </Typography>
        </Box>
        <Button size="small" onClick={onClose} sx={{ minWidth: 0, p: 0.5 }}>
          <Close fontSize="small" />
        </Button>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Balance Overview Box */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Remaining Co-Pay Balance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
                  {Number(invoice.balance_rwf).toLocaleString()} RWF
                </Typography>
              </Box>
              <Chip
                label={invoice.status?.toUpperCase()}
                color={invoice.status === "paid" ? "success" : "warning"}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            {invoice.insurance_covered_rwf > 0 && (
              <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 0.5, fontWeight: 600 }}>
                ✓ {Number(invoice.insurance_covered_rwf).toLocaleString()} RWF covered by {invoice.patient?.insurance_provider?.name || "Insurance"}
              </Typography>
            )}
          </Paper>

          {/* Amount to Pay */}
          <TextField
            label="Payment Amount (RWF)"
            type="number"
            fullWidth
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 100, max: invoice.balance_rwf }}
            helperText={`Enter full balance or partial payment (min: 100 RWF).`}
            sx={{ mb: 2.5 }}
          />

          {/* Payment Method Tabs */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Select Payment Method:
          </Typography>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: 2.5,
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": { fontWeight: 700, textTransform: "none" },
            }}
          >
            <Tab icon={<PhoneAndroid />} iconPosition="start" label="MTN MoMo" />
            <Tab icon={<PhoneAndroid />} iconPosition="start" label="Airtel Money" />
            <Tab icon={<CreditCard />} iconPosition="start" label="Bank Card" />
            {isStaff && <Tab icon={<Payments />} iconPosition="start" label="Cash Desk" />}
          </Tabs>

          {/* Tab 0: MTN MoMo */}
          {activeTab === 0 && (
            <Box sx={{ p: 1 }}>
              <TextField
                label="MTN Phone Number"
                fullWidth
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 788 000 000"
                helperText="A *182# prompt will be sent to the subscriber's phone for PIN authorization."
                sx={{ mb: 1.5 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => setPhone("+250 788 500 001")}
                sx={{ fontSize: "0.75rem", borderRadius: 1.5 }}
              >
                Use Registered MTN (+250 788 500 001)
              </Button>
            </Box>
          )}

          {/* Tab 1: Airtel Money */}
          {activeTab === 1 && (
            <Box sx={{ p: 1 }}>
              <TextField
                label="Airtel Phone Number"
                fullWidth
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 728 000 000"
                helperText="A *182# prompt will be sent to the subscriber's phone for PIN authorization."
                sx={{ mb: 1.5 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => setPhone("+250 728 500 002")}
                sx={{ fontSize: "0.75rem", borderRadius: 1.5 }}
              >
                Use Registered Airtel (+250 728 500 002)
              </Button>
            </Box>
          )}

          {/* Tab 2: Bank Card */}
          {activeTab === 2 && (
            <Stack spacing={2} sx={{ p: 1 }}>
              <TextField
                label="Card Number"
                fullWidth
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Lock fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Expires"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  sx={{ width: "50%" }}
                />
                <TextField
                  label="CVV"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  sx={{ width: "50%" }}
                />
              </Stack>
            </Stack>
          )}

          {/* Tab 3: Cash Desk */}
          {activeTab === 3 && (
            <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2, textAlign: "center" }}>
              <Payments sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Physical Cash Desk Settlement
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confirming physical bank notes received at the hospital cashier counter. Official receipt will be issued immediately.
              </Typography>
            </Box>
          )}

          {/* USSD Push Notification Authorization State */}
          {ussdSimulating && (
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mt: 2,
                bgcolor: "warning.light",
                color: "warning.contrastText",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <CircularProgress size={24} color="inherit" sx={{ mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Pushing USSD payment prompt to {phone}...
              </Typography>
              <Typography variant="caption">
                Enter your MoMo PIN on your mobile device (*182#)
              </Typography>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "space-between" }}>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || Number(amount) <= 0}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {loading ? "Processing..." : `Pay ${Number(amount).toLocaleString()} RWF`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentModal;
