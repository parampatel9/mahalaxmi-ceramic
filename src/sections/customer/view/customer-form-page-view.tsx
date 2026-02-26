import type { AxiosError } from 'axios';

import { toast } from 'react-toastify';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import FormHelperText from '@mui/material/FormHelperText';

import { useAppDispatch } from 'src/redux/hooks';
import { showAlert } from 'src/redux/slices/alertSlice';
import { DashboardContent } from 'src/layouts/dashboard';
import { fetchNextBillNumber } from 'src/redux/slices/customerSlice';
import { type ClientItem, getAllClientItems } from 'src/redux/apis/clientItemsApis';
import {
  addCustomer,
  getCustomer,
  updateCustomer,
  type CustomerItemPayload,
  type CustomerMutationResponse,
} from 'src/redux/apis/customersApis';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type FormItem = {
  itemNumber: string;
  boxQuantity: string;
  size: string;
  sellPrice: string;
};

const EMPTY_ITEM: FormItem = {
  itemNumber: '',
  boxQuantity: '',
  size: '',
  sellPrice: '',
};

function getApiMessage(response: { message?: string; data?: unknown } | null | undefined) {
  if (!response) return '';
  if (typeof response.data === 'string' && response.data.trim()) return response.data;
  if (typeof response.message === 'string' && response.message.trim()) return response.message;
  return '';
}

function getApiErrorMessage(err: unknown) {
  const axiosError = err as AxiosError<{ message?: string; data?: string }>;
  const backendMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.data;
  if (typeof backendMessage === 'string' && backendMessage.trim()) return backendMessage;
  if (typeof axiosError?.message === 'string' && axiosError.message.trim()) return axiosError.message;
  return '';
}

type CustomerFormPageViewProps = {
  mode: 'new' | 'edit';
  customerId?: string;
};

export function CustomerFormPageView({ mode, customerId }: CustomerFormPageViewProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ ...EMPTY_ITEM }]);
  const [itemsError, setItemsError] = useState(false);
  const [clientItems, setClientItems] = useState<ClientItem[]>([]);
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFormData = useCallback(async () => {
    setLoadingForm(true);
    setSubmitError('');
    try {
      const clientItemsRes = await getAllClientItems({ limit: 500 });
      setClientItems(clientItemsRes.data);

      if (mode === 'edit' && customerId) {
        const customer = await getCustomer(customerId);
        setCustomerName(customer.customerName ?? '');
        setBillNumber(customer.billNumber ? String(customer.billNumber) : '');

        const initialItems =
          customer.items && customer.items.length > 0
            ? customer.items.map((item) => ({
                itemNumber: item.itemNumber ?? '',
                boxQuantity: item.boxQuantity ? String(item.boxQuantity) : '',
                size: item.size ?? '',
                sellPrice: item.sellPrice !== undefined ? String(item.sellPrice) : '',
              }))
            : [
                {
                  itemNumber: customer.itemNumber ?? '',
                  boxQuantity: customer.boxQuantity ? String(customer.boxQuantity) : '',
                  size: customer.size ?? '',
                  sellPrice: customer.sellPrice !== undefined ? String(customer.sellPrice) : '',
                },
              ];

        setItems(initialItems);
      } else if (mode === 'new') {
        const billNumberResponse = await dispatch(fetchNextBillNumber()).unwrap();
        setBillNumber(String(billNumberResponse.nextBillNumber ?? ''));
      }
    } catch (err) {
      console.error(err);
      const errorMessage = getApiErrorMessage(err) || 'Failed to load form data.';
      setSubmitError(errorMessage);
      if (errorMessage) {
        toast.error(errorMessage);
        dispatch(showAlert({ message: errorMessage, severity: 'error' }));
      }
    } finally {
      setLoadingForm(false);
    }
  }, [customerId, dispatch, mode]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleItemChange = (index: number, key: keyof FormItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    setItemsError(false);
  };

  const getItemTotal = (item: FormItem) => {
    const qty = parseInt(item.boxQuantity || '0', 10);
    const price = parseFloat(item.sellPrice || '0');
    if (Number.isNaN(qty) || Number.isNaN(price)) return 0;
    return qty * price;
  };

  const grandTotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitError('');

      if (mode === 'edit' && !customerId) return;

      const parsedBillNumber = parseInt(billNumber || '0', 10);
      const parsedItems: CustomerItemPayload[] = items
        .map((item) => {
          const boxQuantityNum = parseInt(item.boxQuantity || '0', 10);
          const sellPriceNum = parseFloat(item.sellPrice || '0');
          const normalized: CustomerItemPayload = {
            itemNumber: item.itemNumber.trim(),
            boxQuantity: boxQuantityNum,
            sellPrice: sellPriceNum,
            // grandTotal: boxQuantityNum * sellPriceNum, 
          };
          if (item.size.trim()) normalized.size = item.size.trim();
          return normalized;
        })
        .filter((item) => item.itemNumber && item.boxQuantity > 0 && item.sellPrice >= 0);

      if (parsedItems.length !== items.length) {
        setItemsError(true);
        return;
      }

      if (!customerName.trim() || parsedBillNumber <= 0 || parsedItems.length === 0) return;

      setSubmitting(true);
      try {
        const payload = {
          customerName: customerName.trim(),
          billNumber: parsedBillNumber,
          items: parsedItems,
        };

        const response:
          | CustomerMutationResponse
          | null
          | undefined =
          mode === 'edit' && customerId
            ? await updateCustomer(customerId, payload)
            : await addCustomer(payload);

        const successMessage = getApiMessage(response);
        if (successMessage) {
          toast.success(successMessage);
          dispatch(showAlert({ message: successMessage, severity: 'success' }));
        }
        navigate('/customers');
      } catch (err) {
        console.error(err);
        const errorMessage =
          getApiErrorMessage(err) || (mode === 'edit' ? 'Failed to update sale.' : 'Failed to create sale.');
        setSubmitError(errorMessage);
        if (errorMessage) {
          toast.error(errorMessage);
          dispatch(showAlert({ message: errorMessage, severity: 'error' }));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [billNumber, customerId, customerName, dispatch, items, mode, navigate]
  );

  if (mode === 'edit' && !customerId) {
    return (
      <DashboardContent>
        <Typography color="text.secondary">Invalid sale</Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent
      maxWidth={false}
      sx={{
        px: {
          xs: 2,
          sm: 3,
          md: 4,
          lg: 5,
          xl: 6,
        },
        pb: { xs: 3, md: 4 },
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          to="/customers"
          color="text.secondary"
          variant="body2"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ transform: 'rotate(180deg)' }} />
          Back to sales
        </Link>
      </Box>

      <Typography variant="h4" sx={{ mb: 3 }}>
        {mode === 'edit' ? 'Edit Sale' : 'New Sale'}
      </Typography>

      <Card sx={{ width: '100%', maxWidth: 1200 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {(submitError || loadingForm) && (
                <Alert severity={submitError ? 'error' : 'info'}>
                  {submitError || 'Loading form data...'}
                </Alert>
              )}

              <TextField
                name="customerName"
                label="Customer Name"
                fullWidth
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={loadingForm || submitting}
              />

              <TextField
                name="billNumber"
                label="Bill Number"
                type="number"
                fullWidth
                required
                inputProps={{ min: 1 }}
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value.replace(/\D/g, ''))}
                disabled={loadingForm || submitting}
              />

              {items.map((item, index) => (
                <Box
                  key={`item-row-${index}`}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormHelperText sx={{ m: 0 }}>Item #{index + 1}</FormHelperText>
                    <Button
                      type="button"
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1 || loadingForm || submitting}
                      size="small"
                    >
                      Remove
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '1fr 1fr',
                      },
                      gap: 2,
                    }}
                  >
                    <FormControl
                      fullWidth
                      required
                      error={itemsError && !item.itemNumber}
                      disabled={loadingForm || submitting}
                    >
                      <InputLabel id={`item-number-label-${index}`}>Item (from client items)</InputLabel>
                      <Select
                        labelId={`item-number-label-${index}`}
                        value={item.itemNumber}
                        label="Item (from client items)"
                        onChange={(e) => handleItemChange(index, 'itemNumber', e.target.value)}
                      >
                        {clientItems.map((clientItem) => (
                          <MenuItem key={clientItem._id} value={clientItem.itemNumber}>
                            {clientItem.itemNumber}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Size (optional)"
                      fullWidth
                      placeholder="e.g. 24x24"
                      value={item.size}
                      onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                      disabled={loadingForm || submitting}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '1fr 1fr',
                      },
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Box Quantity"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 1 }}
                      value={item.boxQuantity}
                      error={itemsError && (!item.boxQuantity || parseInt(item.boxQuantity, 10) <= 0)}
                      onChange={(e) => handleItemChange(index, 'boxQuantity', e.target.value.replace(/\D/g, ''))}
                      disabled={loadingForm || submitting}
                    />

                    <TextField
                      label="Sell Price"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                      value={item.sellPrice}
                      error={itemsError && (item.sellPrice === '' || parseFloat(item.sellPrice) < 0)}
                      onChange={(e) => handleItemChange(index, 'sellPrice', e.target.value)}
                      disabled={loadingForm || submitting}
                    />
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'right' }}>
                    Item Total: ₹{getItemTotal(item).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Button
                variant="outlined"
                onClick={handleAddItem}
                disabled={loadingForm || submitting}
                type="button"
              >
                Add More Item
              </Button>

              {itemsError && (
                <FormHelperText error>
                  Please fill all item fields correctly (item number, box quantity, and sell price).
                </FormHelperText>
              )}

              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="subtitle1">All Items Total</Typography>
                <Typography variant="h6">₹{grandTotal.toFixed(2)}</Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/customers')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loadingForm || submitting}>
                  {submitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : mode === 'edit' ? 'Update' : 'Create'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
