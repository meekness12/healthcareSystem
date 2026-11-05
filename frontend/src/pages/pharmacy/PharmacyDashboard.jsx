import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import {
  LocalPharmacy,
  CheckCircle,
  Schedule,
  Warning,
  Person,
  ReceiptLong,
  Inventory,
  History,
  Medication,
  Print,
  Search,
  FilterList,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import pharmacyApi from "../../api/pharmacy";

const PharmacyDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0); // 0: Queue, 1: Inventory, 2: History
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Dispense Action Dialog State
  const [dispensePrescription, setDispensePrescription] = useState(null);
  const [dispenseItems, setDispenseItems] = useState([]);
  const [dispenseNotes, setDispenseNotes] = useState("");
  const [submittingDispense, setSubmittingDispense] = useState(false);

  // Completed Dispensation Receipt Modal State
  const [completedDispensation, setCompletedDispensation] = useState(null);

  // Search filter for inventory
  const [inventorySearch, setInventorySearch] = useState("");

  const loadAllPharmacyData = async () => {
    try {
      setLoading(true);
      const [rxRes, invRes, histRes] = await Promise.allSettled([
        pharmacyApi.getPrescriptionsQueue(),
        pharmacyApi.getInventory(),
        pharmacyApi.getHistory(),
      ]);

      if (rxRes.status === "fulfilled" && rxRes.value.success) {
        setPrescriptions(rxRes.value.data || []);
      }
      if (invRes.status === "fulfilled" && invRes.value.success) {
        setInventory(invRes.value.data || []);
        setLowStockCount(invRes.value.low_stock_count || 0);
      }
      if (histRes.status === "fulfilled" && histRes.value.success) {
        setHistory(histRes.value.data || []);
      }
    } catch (err) {
      console.error("Failed to load pharmacy data:", err);
      setFeedback({ type: "error", message: "Failed to retrieve pharmacy records." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPharmacyData();
  }, []);

  const handleOpenDispenseModal = (rx) => {
    setDispensePrescription(rx);
    setDispenseNotes("Patient counseled on complete regimen adherence and hydration.");

    // Prepopulate items with remaining quantities
    const items = (rx.items || []).map((item) => {
      const remaining = Math.max(0, (item.quantity_prescribed || 0) - (item.quantity_dispensed || 0));
      return {
        prescription_item_id: item.id,
        medicine_name: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        quantity_prescribed: item.quantity_prescribed,
        already_dispensed: item.quantity_dispensed || 0,
        remaining_quantity: remaining,
        quantity_dispensed: remaining, // default to remaining
        unit_price_rwf: item.unit_price_rwf,
      };
    });

    setDispenseItems(items);
  };

  const handleQuantityChange = (itemId, val) => {
    setDispenseItems((prev) =>
      prev.map((item) =>
        item.prescription_item_id === itemId
          ? { ...item, quantity_dispensed: Math.max(0, Number(val) || 0) }
          : item
      )
    );
  };

  const handleSubmitDispense = async (e) => {
    e.preventDefault();
    if (!dispensePrescription) return;

    // Filter items with quantity > 0
    const activeItems = dispenseItems
      .filter((i) => i.quantity_dispensed > 0)
      .map((i) => ({
        prescription_item_id: i.prescription_item_id,
        quantity_dispensed: i.quantity_dispensed,
      }));

    if (activeItems.length === 0) {
      setFeedback({ type: "error", message: "Please specify at least 1 unit to dispense." });
      return;
    }

    try {
      setSubmittingDispense(true);
      const res = await pharmacyApi.dispenseMedications({
        prescription_id: dispensePrescription.id,
        notes: dispenseNotes,
        items: activeItems,
      });

      if (res.success && res.data) {
        setCompletedDispensation(res.data);
        setDispensePrescription(null);
        setFeedback({ type: "success", message: "Medications dispensed and inventory decremented successfully." });
        loadAllPharmacyData();
      }
    } catch (err) {
      console.error("Dispense error:", err);
      const msg = err.response?.data?.message || "Failed to dispense medications.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSubmittingDispense(false);
    }
  };

  // Filter inventory
  const filteredInventory = inventory.filter((med) => {
    if (!inventorySearch) return true;
    const term = inventorySearch.toLowerCase();
    return (
      med.medicine_name.toLowerCase().includes(term) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(term)) ||
      med.category.toLowerCase().includes(term)
    );
  });

  return (
    <Box sx={{ py: 4, bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50", minHeight: "90vh" }}>
      <Container maxWidth="xl">
        {/* Header Banner */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <LocalPharmacy color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Hospital Pharmacy & Dispensary
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Prescription Fulfillment, Warehouse Stock Control & Dispensation Management • Pharmacist: {user?.name || "Staff"}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="primary"
            onClick={loadAllPharmacyData}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Refresh Dispensary Data
          </Button>
        </Box>

        {feedback.message && (
          <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback({ type: "", message: "" })}>
            {feedback.message}
          </Alert>
        )}

        {/* 4 KPI Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    ACTIVE QUEUE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "primary.main" }}>
                    {prescriptions.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "primary.lighter", color: "primary.main", width: 48, height: 48 }}>
                  <Schedule />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    CATALOGUE ITEMS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "info.main" }}>
                    {inventory.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "info.lighter", color: "info.main", width: 48, height: 48 }}>
                  <Inventory />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    LOW STOCK ALERTS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: lowStockCount > 0 ? "error.main" : "success.main" }}>
                    {lowStockCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: lowStockCount > 0 ? "error.lighter" : "success.lighter", color: lowStockCount > 0 ? "error.main" : "success.main", width: 48, height: 48 }}>
                  <Warning />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    DISPENSATIONS RECORDED
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                    {history.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.lighter", color: "success.main", width: 48, height: 48 }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem" },
            }}
          >
            <Tab icon={<LocalPharmacy />} iconPosition="start" label={`Prescriptions Queue (${prescriptions.length})`} />
            <Tab icon={<Inventory />} iconPosition="start" label={`Medicine Stock Inventory (${inventory.length})`} />
            <Tab icon={<History />} iconPosition="start" label={`Dispensation History (${history.length})`} />
          </Tabs>
        </Box>

        {/* TAB 0: Prescriptions Queue */}
        {activeTab === 0 && (
          <Box>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : prescriptions.length === 0 ? (
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 5, textAlign: "center", borderRadius: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No pending doctor prescriptions in the queue. All prescriptions have been fulfilled.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={3}>
                {prescriptions.map((rx) => (
                  <Card
                    key={rx.id}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      p: 3,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                            {rx.prescription_number}
                          </Typography>
                          <Chip
                            label={rx.status.toUpperCase()}
                            size="small"
                            color={rx.status === "partially_dispensed" ? "warning" : "primary"}
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Issued: {rx.prescription_date} • Prescriber: Dr. {rx.doctor?.name} ({rx.doctor?.license_number})
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<LocalPharmacy />}
                        onClick={() => handleOpenDispenseModal(rx)}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 3 }}
                      >
                        Dispense Medications
                      </Button>
                    </Box>

                    {/* Patient Demographic Strip */}
                    <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50", borderRadius: 2, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            PATIENT NAME:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {rx.patient?.name} (#{rx.patient?.patient_number})
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            INSURANCE PROVIDER:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {rx.patient?.insurance_provider ? `${rx.patient.insurance_provider} (${rx.patient.coverage_percentage}%)` : "Self Pay"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            CONTACT:
                          </Typography>
                          <Typography variant="body2">
                            {rx.patient?.phone}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Itemized Medications Table */}
                    <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Medication</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Dosage / Frequency</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Prescribed</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Already Dispensed</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Remaining to Dispense</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Instructions (Sig)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rx.items?.map((item) => {
                            const remaining = Math.max(0, (item.quantity_prescribed || 0) - (item.quantity_dispensed || 0));
                            return (
                              <TableRow key={item.id}>
                                <TableCell sx={{ fontWeight: 700 }}>{item.medicine_name}</TableCell>
                                <TableCell>{item.dosage} • {item.frequency}</TableCell>
                                <TableCell>{item.quantity_prescribed}</TableCell>
                                <TableCell>{item.quantity_dispensed || 0}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: remaining > 0 ? "warning.main" : "success.main" }}>
                                  {remaining} units
                                </TableCell>
                                <TableCell>{item.instructions || "Standard dose"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* TAB 1: Medicine Stock Inventory */}
        {activeTab === 1 && (
          <Box>
            {/* Search Bar */}
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 2.5, mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search warehouse inventory by medicine name, generic molecule, or category..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Card>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 2.5 }}>
              <TableContainer component={Paper} elevation={0}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Medicine Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Generic Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Dosage Form</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Unit Price (RWF)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Warehouse Stock</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInventory.map((med) => (
                      <TableRow key={med.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{med.medicine_name}</TableCell>
                        <TableCell color="text.secondary">{med.generic_name || "N/A"}</TableCell>
                        <TableCell>{med.category}</TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>{med.dosage_form}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{Number(med.unit_price_rwf).toLocaleString()} RWF</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: med.is_low_stock ? "error.main" : "text.primary" }}>
                            {med.stock_quantity} units
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Reorder level: {med.reorder_level}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={med.is_low_stock ? "LOW STOCK" : "IN STOCK"}
                            size="small"
                            color={med.is_low_stock ? "error" : "success"}
                            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        )}

        {/* TAB 2: Dispensation History */}
        {activeTab === 2 && (
          <Box>
            {history.length === 0 ? (
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 5, textAlign: "center", borderRadius: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No dispensation transactions recorded yet.
                </Typography>
              </Card>
            ) : (
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 2.5 }}>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="medium">
                    <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Dispensation Ref</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Prescription Ref</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Dispensed At</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Pharmacist</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Dispensed Items</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((disp) => (
                        <TableRow key={disp.id} hover>
                          <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>
                            {disp.dispensation_reference}
                          </TableCell>
                          <TableCell>{disp.prescription_number}</TableCell>
                          <TableCell>{disp.patient?.name} (#{disp.patient?.patient_number})</TableCell>
                          <TableCell>{disp.dispensed_at?.slice(0, 16)}</TableCell>
                          <TableCell>{disp.pharmacist?.name}</TableCell>
                          <TableCell>
                            {disp.items?.map((item, idx) => (
                              <Typography key={idx} variant="caption" sx={{ display: "block" }}>
                                • {item.medicine_name}: {item.quantity_dispensed} units
                              </Typography>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </Box>
        )}
      </Container>

      {/* Dispense Medications Action Dialog */}
      <Dialog
        open={Boolean(dispensePrescription)}
        onClose={() => setDispensePrescription(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Dispense Prescription Medications
        </DialogTitle>
        <form onSubmit={handleSubmitDispense}>
          <DialogContent>
            {dispensePrescription && (
              <Box sx={{ mb: 3, p: 2, bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50", borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">
                  PRESCRIPTION REF: {dispensePrescription.prescription_number} • PATIENT: {dispensePrescription.patient?.name}
                </Typography>
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Specify Quantity to Dispense per Medicine:
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Medicine</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Prescribed</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Already Dispensed</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Remaining</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "120px" }}>Dispense Now</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dispenseItems.map((item) => (
                    <TableRow key={item.prescription_item_id}>
                      <TableCell sx={{ fontWeight: 700 }}>{item.medicine_name}</TableCell>
                      <TableCell>{item.quantity_prescribed}</TableCell>
                      <TableCell>{item.already_dispensed}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "warning.main" }}>{item.remaining_quantity}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          inputProps={{ min: 0, max: item.remaining_quantity }}
                          value={item.quantity_dispensed}
                          onChange={(e) => handleQuantityChange(item.prescription_item_id, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TextField
              label="Pharmacist Clinical Notes & Counseling Log"
              fullWidth
              multiline
              rows={2}
              value={dispenseNotes}
              onChange={(e) => setDispenseNotes(e.target.value)}
              placeholder="e.g. Advised patient to avoid taking with milk; full course must be finished..."
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setDispensePrescription(null)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submittingDispense}
              startIcon={submittingDispense ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {submittingDispense ? "Processing..." : "Confirm Dispensation"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Completed Dispensation Receipt Dialog */}
      <Dialog
        open={Boolean(completedDispensation)}
        onClose={() => setCompletedDispensation(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <CheckCircle color="success" sx={{ fontSize: 50, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Medications Dispensed Successfully!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Warehouse inventory decremented • Dispensation reference recorded
          </Typography>
        </DialogTitle>

        <DialogContent>
          {completedDispensation && (
            <Box sx={{ p: 2, bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50", borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800, mb: 1 }}>
                Reference: {completedDispensation.dispensation_reference}
              </Typography>
              <Typography variant="body2">
                Prescription: {completedDispensation.prescription_number} ({completedDispensation.prescription_status?.toUpperCase()})
              </Typography>
              <Typography variant="body2">
                Patient: {completedDispensation.patient?.name} (#{completedDispensation.patient?.patient_number})
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Dispensed Medication Items:
              </Typography>
              {completedDispensation.items?.map((item, idx) => (
                <Typography key={idx} variant="body2" sx={{ mt: 0.5 }}>
                  • {item.medicine_name} — {item.quantity_dispensed} units
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={() => setCompletedDispensation(null)} sx={{ borderRadius: 2 }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Print Dispensation Slip
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PharmacyDashboard;
