import type { AxiosError } from 'axios';

import dayjs from 'dayjs';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { getIn, useFormik } from 'formik';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';
import TableContainer from '@mui/material/TableContainer';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { printPdfFromUrl } from 'src/utils/printPdf';

import { useAppDispatch } from 'src/redux/hooks';
import { showAlert } from 'src/redux/slices/alertSlice';
import { DashboardContent } from 'src/layouts/dashboard';
import { type ClientItem } from 'src/redux/apis/clientItemsApis';
import { fetchNextBillNumber } from 'src/redux/slices/customerSlice';
import { fetchAllClientItems } from 'src/redux/slices/clientItemSlice';
import {
  addCustomer,
  getCustomer,
  updateCustomer,
  addCustomerPayment,
  checkCustomerMobile,
  getCustomerPayments,
  type CustomerPayment,
  type CustomerPayload,
  type CustomerItemPayload,
  type CustomerMutationResponse,
  type CheckCustomerMobileRecentBill,
} from 'src/redux/apis/customersApis';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type FormItem = {
  itemNumber: string;
  boxQuantity: string;
  returnBoxQuantity: string;
  size: string;
  sellPrice: string;
  returnEnabled: boolean;
};

type FormValues = {
  customerName: string;
  address: string;
  mobileNumber: string;
  note: string;
  vehicleNumber: string;
  saleDate: string;
  billNumber: string;
  paymentStatus: 'paid' | 'unpaid';
  paidAmount: string;
  items: FormItem[];
};

const SIZE_OPTIONS = ['2*2', '2*4', '4*4'] as const;
type SizeOption = (typeof SIZE_OPTIONS)[number];

const EMPTY_ITEM: FormItem = {
  itemNumber: '',
  boxQuantity: '',
  returnBoxQuantity: '0',
  size: SIZE_OPTIONS[0],
  sellPrice: '',
  returnEnabled: false,
};

const DEFAULT_SALE_DATE_FORMAT = 'YYYY-MM-DD';

function normalizeSize(value: string | null | undefined): SizeOption {
  if (value && SIZE_OPTIONS.includes(value as SizeOption)) return value as SizeOption;
  return SIZE_OPTIONS[0];
}

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

function formatRs(amount: number) {
  return `Rs ${amount.toFixed(2)}`;
}

function getPaymentDisplayDate(payment: CustomerPayment) {
  const source = payment.paymentDate || payment.date || payment.createdAt;
  if (!source || !dayjs(source).isValid()) return '-';
  return dayjs(source).format('DD MMM YYYY');
}

function getItemTotal(item: FormItem) {
  const qty = parseInt(item.boxQuantity || '0', 10);
  const price = parseFloat(item.sellPrice || '0');
  if (Number.isNaN(qty) || Number.isNaN(price)) return 0;
  return qty * price;
}

function getItemReturnTotal(item: FormItem) {
  const returnQty = parseInt(item.returnBoxQuantity || '0', 10);
  const price = parseFloat(item.sellPrice || '0');
  if (Number.isNaN(returnQty) || Number.isNaN(price)) return 0;
  return returnQty * price;
}

function getItemsGrandTotal(items: FormItem[]) {
  return items.reduce((sum, item) => sum + getItemTotal(item), 0);
}

function getItemsReturnGrandTotal(items: FormItem[]) {
  return items.reduce((sum, item) => sum + getItemReturnTotal(item), 0);
}

function buildItemPayload(mode: 'new' | 'edit', item: FormItem): CustomerItemPayload {
  const boxQuantityNum = parseInt(item.boxQuantity || '0', 10);
  const sellPriceNum = parseFloat(item.sellPrice || '0');
  const normalized: CustomerItemPayload = {
    itemNumber: item.itemNumber.trim(),
    boxQuantity: boxQuantityNum,
    sellPrice: sellPriceNum,
    size: normalizeSize(item.size),
  };

  if (mode === 'edit') {
    normalized.returnBoxQuantity = item.returnEnabled
      ? parseInt(item.returnBoxQuantity || '0', 10)
      : 0;
  }

  return normalized;
}

export function CustomerFormPageView({ mode, customerId }: CustomerFormPageViewProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isEditMode = mode === 'edit';

  const [clientItems, setClientItems] = useState<ClientItem[]>([]);
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [checkingExistingMobile, setCheckingExistingMobile] = useState(false);
  const [existingMobileBills, setExistingMobileBills] = useState<CheckCustomerMobileRecentBill[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<CustomerPayment[]>([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState('');
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [addPaymentAmount, setAddPaymentAmount] = useState('');
  const [addPaymentError, setAddPaymentError] = useState('');
  const [submittingAddPayment, setSubmittingAddPayment] = useState(false);
  const [initialValues, setInitialValues] = useState<FormValues>({
    customerName: '',
    address: '',
    mobileNumber: '',
    note: '',
    vehicleNumber: '',
    saleDate: dayjs().format(DEFAULT_SALE_DATE_FORMAT),
    billNumber: '',
    paymentStatus: 'paid',
    paidAmount: '',
    items: [{ ...EMPTY_ITEM }],
  });

  const validationSchema = useMemo(
    () =>
      Yup.object({
        customerName: Yup.string().trim().required('Customer Name is required'),
        address: Yup.string().trim().required('Address is required'),
        mobileNumber: Yup.string()
          .required('Mobile Number is required')
          .matches(/^\d{10}$/, 'Enter a valid 10-digit mobile number.'),
        saleDate: Yup.string()
          .required('Sale Date is required')
          .test('valid-date', 'Sale Date is required', (value) =>
            Boolean(value && dayjs(value).isValid())
          ),
        billNumber: Yup.string()
          .required('Bill Number is required')
          .matches(/^\d+$/, 'Bill Number must be a number')
          .test('bill-positive', 'Bill Number must be greater than 0', (value) => {
            if (!value) return false;
            return parseInt(value, 10) > 0;
          }),
        paymentStatus: Yup.mixed<'paid' | 'unpaid'>()
          .oneOf(['paid', 'unpaid'], 'Payment Status is required')
          .required('Payment Status is required'),
        paidAmount: Yup.string().when('paymentStatus', {
          is: 'unpaid',
          then: (schema) => schema.notRequired(),
          otherwise: (schema) => schema.notRequired(),
        }),
        note: Yup.string(),
        vehicleNumber: Yup.string(),
        items: Yup.array()
          .of(
            Yup.object({
              itemNumber: Yup.string().trim().required('Item is required'),
              size: Yup.string()
                .oneOf([...SIZE_OPTIONS], 'Size is required')
                .required('Size is required'),
              boxQuantity: Yup.string()
                .required('Box Quantity is required')
                .matches(/^\d+$/, 'Box Quantity must be a number')
                .test('box-positive', 'Box Quantity must be greater than 0', (value) => {
                  if (!value) return false;
                  return parseInt(value, 10) > 0;
                }),
              sellPrice: Yup.string()
                .required('Sell Price is required')
                .test('sell-number', 'Sell Price must be a valid number', (value) => {
                  if (!value) return false;
                  const parsed = Number(value);
                  return Number.isFinite(parsed);
                })
                .test('sell-non-negative', 'Sell Price must be non-negative', (value) => {
                  if (!value) return false;
                  const parsed = Number(value);
                  return Number.isFinite(parsed) && parsed >= 0;
                }),
              returnEnabled: Yup.boolean(),
              returnBoxQuantity: Yup.string().when('returnEnabled', {
                is: (returnEnabled: boolean) => isEditMode && returnEnabled,
                then: (schema) =>
                  schema
                    .required('Return Box Quantity is required')
                    .matches(/^\d+$/, 'Return Box Quantity must be a number')
                    .test('return-non-negative', 'Return Box Quantity must be non-negative', (value) => {
                      if (!value) return false;
                      return parseInt(value, 10) >= 0;
                    }),
                otherwise: (schema) => schema.notRequired(),
              }),
            })
          )
          .min(1, 'At least one item is required'),
      }),
    [isEditMode]
  );

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitError('');

      if (isEditMode && !customerId) return;

      const grossTotal = getItemsGrandTotal(values.items);
      const returnGrandTotal = getItemsReturnGrandTotal(values.items);
      const finalGrandTotal = grossTotal - returnGrandTotal;
      const payableAmount = Math.max(finalGrandTotal, 0);
      const historyPaidAmount = paymentHistory.reduce((sum, payment) => {
        const amount = Number(payment.amount ?? 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);
      const boundedPaidAmount = isEditMode
        ? Math.min(Math.max(historyPaidAmount, 0), payableAmount)
        : 0;
      const unpaidAmount = Math.max(payableAmount - boundedPaidAmount, 0);

      const payload: CustomerPayload = {
        customerName: values.customerName.trim(),
        address: values.address.trim(),
        mobileNumber: values.mobileNumber.replace(/\D/g, '').slice(0, 10),
        note: values.note.trim() || undefined,
        vehicleNumber: values.vehicleNumber.trim() || undefined,
        date: values.saleDate,
        billNumber: parseInt(values.billNumber || '0', 10),
        paymentStatus: values.paymentStatus,
        items: values.items.map((item) => buildItemPayload(mode, item)),
      };
      if (values.paymentStatus === 'paid') {
        payload.paidAmount = payableAmount;
        payload.unpaidAmount = 0;
      } else {
        payload.paidAmount = boundedPaidAmount;
        payload.unpaidAmount = unpaidAmount;
      }

      setSubmitting(true);
      try {
        const response: CustomerMutationResponse | null | undefined =
          isEditMode && customerId
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
          getApiErrorMessage(err) || (isEditMode ? 'Failed to update sale.' : 'Failed to create sale.');
        setSubmitError(errorMessage);
        if (errorMessage) {
          toast.error(errorMessage);
          dispatch(showAlert({ message: errorMessage, severity: 'error' }));
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fetchFormData = useCallback(async () => {
    setLoadingForm(true);
    setSubmitError('');

    try {
      const clientItemsRes = await dispatch(fetchAllClientItems()).unwrap();
      setClientItems(clientItemsRes.data);

      if (isEditMode && customerId) {
        const customer = await getCustomer(customerId);

        const mappedItems =
          customer.items && customer.items.length > 0
            ? customer.items.map((item) => {
              const returnQty = item.returnBoxQuantity ?? 0;
              return {
                itemNumber: item.itemNumber ?? '',
                boxQuantity: item.boxQuantity ? String(item.boxQuantity) : '',
                returnBoxQuantity: String(returnQty),
                size: normalizeSize(item.size),
                sellPrice: item.sellPrice !== undefined ? String(item.sellPrice) : '',
                returnEnabled: returnQty > 0,
              };
            })
            : [
              {
                itemNumber: customer.itemNumber ?? '',
                boxQuantity: customer.boxQuantity ? String(customer.boxQuantity) : '',
                returnBoxQuantity: '0',
                size: normalizeSize(customer.size),
                sellPrice: customer.sellPrice !== undefined ? String(customer.sellPrice) : '',
                returnEnabled: false,
              },
            ];

        setInitialValues({
          customerName: customer.customerName ?? '',
          address: customer.address ?? '',
          mobileNumber: (customer.mobileNumber ?? '').replace(/\D/g, '').slice(0, 10),
          note: customer.note ?? '',
          vehicleNumber: customer.vehicleNumber ?? '',
          saleDate: customer.date && dayjs(customer.date).isValid()
            ? dayjs(customer.date).format(DEFAULT_SALE_DATE_FORMAT)
            : dayjs().format(DEFAULT_SALE_DATE_FORMAT),
          billNumber: customer.billNumber ? String(customer.billNumber) : '',
          paymentStatus: customer.paymentStatus === 'unpaid' ? 'unpaid' : 'paid',
          paidAmount:
            customer.paymentStatus === 'unpaid'
              ? String(
                typeof customer.paidAmount === 'number'
                  ? customer.paidAmount
                  : typeof customer.unpaidAmount === 'number'
                    ? Math.max((customer.grandTotal ?? getItemsGrandTotal(mappedItems)) - customer.unpaidAmount, 0)
                    : 0
              )
              : '',
          items: mappedItems,
        });
      } else if (!isEditMode) {
        const billNumberResponse = await dispatch(fetchNextBillNumber()).unwrap();
        setPaymentHistory([]);
        setPaymentHistoryError('');
        setInitialValues({
          customerName: '',
          address: '',
          mobileNumber: '',
          note: '',
          vehicleNumber: '',
          saleDate: dayjs().format(DEFAULT_SALE_DATE_FORMAT),
          billNumber: String(billNumberResponse.nextBillNumber ?? ''),
          paymentStatus: 'paid',
          paidAmount: '',
          items: [{ ...EMPTY_ITEM }],
        });
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
  }, [customerId, dispatch, isEditMode]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const fetchPaymentHistory = useCallback(async () => {
    if (!isEditMode || !customerId) {
      setPaymentHistory([]);
      return;
    }

    setLoadingPaymentHistory(true);
    setPaymentHistoryError('');
    try {
      const payments = await getCustomerPayments(customerId);
      setPaymentHistory(payments);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err) || 'Failed to load payment history.';
      setPaymentHistory([]);
      setPaymentHistoryError(errorMessage);
    } finally {
      setLoadingPaymentHistory(false);
    }
  }, [customerId, isEditMode]);

  useEffect(() => {
    void fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  useEffect(() => {
    const normalizedMobile = formik.values.mobileNumber.replace(/\D/g, '');
    if (isEditMode || normalizedMobile.length !== 10) {
      setExistingMobileBills([]);
      setCheckingExistingMobile(false);
      return () => {};
    }

    let cancelled = false;
    setCheckingExistingMobile(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await checkCustomerMobile(normalizedMobile, 5);
        if (cancelled) return;
        setExistingMobileBills(response.recentBills ?? []);
      } catch {
        if (!cancelled) setExistingMobileBills([]);
      } finally {
        if (!cancelled) setCheckingExistingMobile(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [formik.values.mobileNumber, isEditMode]);

  const handleAddItem = useCallback(() => {
    formik.setFieldValue('items', [...formik.values.items, { ...EMPTY_ITEM }]);
  }, [formik]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      if (formik.values.items.length === 1) return;
      const nextItems = formik.values.items.filter((_, itemIndex) => itemIndex !== index);
      formik.setFieldValue('items', nextItems);
    },
    [formik]
  );

  const handleToggleReturn = useCallback(
    (index: number) => {
      if (!isEditMode) return;
      const current = formik.values.items[index]?.returnEnabled;
      const next = !current;
      formik.setFieldValue(`items.${index}.returnEnabled`, next);
      if (!next) {
        formik.setFieldValue(`items.${index}.returnBoxQuantity`, '0');
      }
    },
    [formik, isEditMode]
  );

  const shouldShowError = useCallback(
    (fieldName: string) => {
      const touched = getIn(formik.touched, fieldName);
      const error = getIn(formik.errors, fieldName);
      return Boolean(error && (touched || formik.submitCount > 0));
    },
    [formik.errors, formik.submitCount, formik.touched]
  );

  const getErrorText = useCallback(
    (fieldName: string) => {
      if (!shouldShowError(fieldName)) return '';
      const error = getIn(formik.errors, fieldName);
      return typeof error === 'string' ? error : '';
    },
    [formik.errors, shouldShowError]
  );

  const grandTotal = getItemsGrandTotal(formik.values.items);
  const grandReturnTotal = getItemsReturnGrandTotal(formik.values.items);
  const finalGrandTotal = grandTotal - grandReturnTotal;
  const payableAmount = Math.max(finalGrandTotal, 0);
  const paymentHistoryTotalPaid = paymentHistory.reduce((sum, payment) => {
    const amount = Number(payment.amount ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const paymentHistoryRemainingUnpaid = Math.max(payableAmount - paymentHistoryTotalPaid, 0);
  const currentPaidAmount =
    formik.values.paymentStatus === 'paid'
      ? payableAmount
      : isEditMode
        ? Math.min(paymentHistoryTotalPaid, payableAmount)
        : 0;
  const currentUnpaidAmount =
    formik.values.paymentStatus === 'paid' ? 0 : Math.max(payableAmount - currentPaidAmount, 0);

  const handleOpenAddPayment = useCallback(() => {
    setAddPaymentAmount('');
    setAddPaymentError('');
    setAddPaymentOpen(true);
  }, []);

  const handleCloseAddPayment = useCallback(() => {
    if (submittingAddPayment) return;
    setAddPaymentOpen(false);
    setAddPaymentAmount('');
    setAddPaymentError('');
  }, [submittingAddPayment]);

  const handleSubmitAddPayment = useCallback(async () => {
    if (!customerId) return;

    const amount = Number(addPaymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAddPaymentError('Payment Amount must be greater than 0.');
      return;
    }

    if (amount > paymentHistoryRemainingUnpaid) {
      setAddPaymentError(
        `Payment Amount cannot be greater than remaining unpaid (${formatRs(paymentHistoryRemainingUnpaid)}).`
      );
      return;
    }

    setSubmittingAddPayment(true);
    setAddPaymentError('');
    try {
      const response = await addCustomerPayment(customerId, amount);
      const successMessage = getApiMessage(response) || 'Payment added successfully.';
      toast.success(successMessage);
      dispatch(showAlert({ message: successMessage, severity: 'success' }));
      await fetchPaymentHistory();
      handleCloseAddPayment();
    } catch (err) {
      const errorMessage = getApiErrorMessage(err) || 'Failed to add payment.';
      setAddPaymentError(errorMessage);
      toast.error(errorMessage);
      dispatch(showAlert({ message: errorMessage, severity: 'error' }));
    } finally {
      setSubmittingAddPayment(false);
    }
  }, [
    addPaymentAmount,
    customerId,
    dispatch,
    fetchPaymentHistory,
    handleCloseAddPayment,
    paymentHistoryRemainingUnpaid,
  ]);

  const handlePrintBill = useCallback(async () => {
    if (!customerId) return;
    const printUrl = `http://localhost:3003/api/bills/print/${customerId}`;
    try {
      await printPdfFromUrl(printUrl);
    } catch {
      window.open(printUrl, '_blank');
    }
  }, [customerId]);

  if (isEditMode && !customerId) {
    return (
      <DashboardContent>
        <Typography color="text.secondary">Invalid sale</Typography>
      </DashboardContent>
    );
  }

  return (
    <>
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
        {isEditMode ? 'Edit Sale' : 'New Sale'}
      </Typography>

      <Card sx={{ width: '100%', maxWidth: 1200 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box component="form" onSubmit={formik.handleSubmit}>
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
                value={formik.values.customerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={shouldShowError('customerName')}
                helperText={getErrorText('customerName')}
                disabled={loadingForm || formik.isSubmitting}
              />

              <TextField
                name="address"
                label="Address"
                fullWidth
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={shouldShowError('address')}
                helperText={getErrorText('address')}
                disabled={loadingForm || formik.isSubmitting}
              />

              <TextField
                name="mobileNumber"
                label="Mobile Number"
                fullWidth
                value={formik.values.mobileNumber}
                error={shouldShowError('mobileNumber')}
                helperText={getErrorText('mobileNumber')}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                onBlur={formik.handleBlur}
                onChange={(e) => {
                  const normalized = e.target.value.replace(/\D/g, '').slice(0, 10);
                  formik.setFieldValue('mobileNumber', normalized);
                }}
                disabled={loadingForm || formik.isSubmitting}
              />
              {!isEditMode && formik.values.mobileNumber.length === 10 && checkingExistingMobile && (
                <Alert severity="info">Checking existing bills for this mobile number...</Alert>
              )}
              {!isEditMode && formik.values.mobileNumber.length === 10 && !checkingExistingMobile && existingMobileBills.length > 0 && (
                <Alert severity="warning">
                  This mobile number already has {existingMobileBills.length} bill(s). Recent bill numbers:
                  {' '}
                  {existingMobileBills
                    .slice(0, 5)
                    .map((entry) => `${entry.billNumber}`)
                    .join(', ')}
                </Alert>
              )}

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Sale Date"
                  value={formik.values.saleDate ? dayjs(formik.values.saleDate) : null}
                  onChange={(newValue) => {
                    formik.setFieldValue(
                      'saleDate',
                      newValue?.isValid() ? newValue.format(DEFAULT_SALE_DATE_FORMAT) : ''
                    );
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      onBlur: () => formik.setFieldTouched('saleDate', true),
                      error: shouldShowError('saleDate'),
                      helperText: getErrorText('saleDate'),
                    },
                  }}
                  disabled={loadingForm || formik.isSubmitting}
                />
              </LocalizationProvider>

              <TextField
                name="billNumber"
                label="Bill Number"
                type="number"
                fullWidth
                inputProps={{ min: 1 }}
                value={formik.values.billNumber}
                onBlur={formik.handleBlur}
                onChange={(e) => formik.setFieldValue('billNumber', e.target.value.replace(/\D/g, ''))}
                error={shouldShowError('billNumber')}
                helperText={getErrorText('billNumber')}
                disabled={loadingForm || formik.isSubmitting}
              />

              <TextField
                select
                name="paymentStatus"
                label="Payment Status"
                fullWidth
                value={formik.values.paymentStatus}
                onBlur={formik.handleBlur}
                onChange={(e) => {
                  const nextStatus = e.target.value as 'paid' | 'unpaid';
                  formik.setFieldValue('paymentStatus', nextStatus);
                  if (nextStatus === 'paid') {
                    formik.setFieldValue('paidAmount', '');
                  }
                }}
                error={shouldShowError('paymentStatus')}
                helperText={getErrorText('paymentStatus')}
                disabled={loadingForm || formik.isSubmitting}
              >
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
              </TextField>

              {formik.values.paymentStatus === 'unpaid' && (
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Payment History</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleOpenAddPayment}
                      disabled={
                        !isEditMode ||
                        !customerId ||
                        loadingPaymentHistory ||
                        formik.isSubmitting ||
                        submittingAddPayment ||
                        paymentHistoryRemainingUnpaid <= 0
                      }
                    >
                      Add Payment
                    </Button>
                  </Box>

                  {!isEditMode && (
                    <Alert severity="info">
                      Payment history will be available after creating this sale.
                    </Alert>
                  )}

                  {paymentHistoryError && <Alert severity="error">{paymentHistoryError}</Alert>}

                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Payment Date</TableCell>
                          <TableCell align="right">Payment Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loadingPaymentHistory ? (
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              Loading payment history...
                            </TableCell>
                          </TableRow>
                        ) : paymentHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              No payments found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paymentHistory.map((payment, index) => (
                            <TableRow key={payment._id ?? `${payment.createdAt ?? 'payment'}-${index}`}>
                              <TableCell>{getPaymentDisplayDate(payment)}</TableCell>
                              <TableCell align="right">{formatRs(Number(payment.amount ?? 0))}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Paid: {formatRs(paymentHistoryTotalPaid)}
                    </Typography>
                    <Typography variant="subtitle2" color="error.main">
                      Remaining Unpaid: {formatRs(paymentHistoryRemainingUnpaid)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {formik.values.items.map((item, index) => (
                <Box
                  key={`item-row-${index}`}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: '#eef6ff',
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
                      disabled={formik.values.items.length === 1 || loadingForm || formik.isSubmitting}
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
                    <Autocomplete
                      options={clientItems}
                      value={clientItems.find((clientItem) => clientItem.itemNumber === item.itemNumber) ?? null}
                      onChange={(_, newValue) => {
                        formik.setFieldValue(`items.${index}.itemNumber`, newValue?.itemNumber ?? '');
                      }}
                      onBlur={() => formik.setFieldTouched(`items.${index}.itemNumber`, true)}
                      getOptionLabel={(option) => option.itemNumber ?? ''}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      disabled={loadingForm || formik.isSubmitting}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Item (from client items)"
                          error={shouldShowError(`items.${index}.itemNumber`)}
                          helperText={getErrorText(`items.${index}.itemNumber`)}
                        />
                      )}
                    />

                    <Autocomplete
                      options={[...SIZE_OPTIONS]}
                      value={SIZE_OPTIONS.includes(item.size as SizeOption) ? (item.size as SizeOption) : null}
                      onChange={(_, newValue) => formik.setFieldValue(`items.${index}.size`, newValue ?? '')}
                      onBlur={() => formik.setFieldTouched(`items.${index}.size`, true)}
                      disabled={loadingForm || formik.isSubmitting}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Size"
                          fullWidth
                          error={shouldShowError(`items.${index}.size`)}
                          helperText={getErrorText(`items.${index}.size`)}
                        />
                      )}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: isEditMode && item.returnEnabled ? '1fr 1fr 1fr' : '1fr 1fr',
                      },
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Box Quantity"
                      type="number"
                      fullWidth
                      inputProps={{ min: 1 }}
                      value={item.boxQuantity}
                      error={shouldShowError(`items.${index}.boxQuantity`)}
                      helperText={getErrorText(`items.${index}.boxQuantity`)}
                      onBlur={formik.handleBlur}
                      onChange={(e) =>
                        formik.setFieldValue(`items.${index}.boxQuantity`, e.target.value.replace(/\D/g, ''))
                      }
                      disabled={loadingForm || formik.isSubmitting}
                      name={`items.${index}.boxQuantity`}
                    />

                    <TextField
                      label="Sell Price"
                      type="number"
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                      value={item.sellPrice}
                      error={shouldShowError(`items.${index}.sellPrice`)}
                      helperText={getErrorText(`items.${index}.sellPrice`)}
                      onBlur={formik.handleBlur}
                      onChange={(e) => formik.setFieldValue(`items.${index}.sellPrice`, e.target.value)}
                      disabled={loadingForm || formik.isSubmitting}
                      name={`items.${index}.sellPrice`}
                    />

                    {isEditMode && item.returnEnabled && (
                      <TextField
                        label="Return Box Quantity"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={item.returnBoxQuantity}
                        error={shouldShowError(`items.${index}.returnBoxQuantity`)}
                        helperText={getErrorText(`items.${index}.returnBoxQuantity`)}
                        onBlur={formik.handleBlur}
                        onChange={(e) =>
                          formik.setFieldValue(
                            `items.${index}.returnBoxQuantity`,
                            e.target.value.replace(/\D/g, '')
                          )
                        }
                        disabled={loadingForm || formik.isSubmitting}
                        name={`items.${index}.returnBoxQuantity`}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    {isEditMode ? (
                      <Button
                        type="button"
                        size="small"
                        variant={item.returnEnabled ? 'contained' : 'outlined'}
                        onClick={() => handleToggleReturn(index)}
                        disabled={loadingForm || formik.isSubmitting}
                      >
                        {item.returnEnabled ? 'Hide Return' : 'Add Return'}
                      </Button>
                    ) : (
                      <span />
                    )}

                    <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'right' }}>
                      Item Total: Rs {getItemTotal(item).toFixed(2)}
                    </Typography>
                    {isEditMode && item.returnEnabled && (
                      <Typography variant="subtitle2" color="warning.main" sx={{ textAlign: 'right' }}>
                        Return Total: Rs {getItemReturnTotal(item).toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}

              <Button
                variant="outlined"
                onClick={handleAddItem}
                disabled={loadingForm || formik.isSubmitting}
                type="button"
              >
                Add More Item
              </Button>

              {getErrorText('items') && <FormHelperText error>{getErrorText('items')}</FormHelperText>}

              <TextField
                name="vehicleNumber"
                label="Vehicle Number (Optional)"
                fullWidth
                value={formik.values.vehicleNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loadingForm || formik.isSubmitting}
              />

              <TextField
                name="note"
                label="Note (Optional)"
                fullWidth
                multiline
                minRows={2}
                value={formik.values.note}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loadingForm || formik.isSubmitting}
              />

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
                <Typography variant="subtitle1">Bill Summary</Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    All Items Total: Rs {grandTotal.toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle2" color="warning.main">
                    Return Total: Rs {grandReturnTotal.toFixed(2)}
                  </Typography>
                  <Typography variant="h6">Final Grand Total: Rs {finalGrandTotal.toFixed(2)}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Paid Amount: Rs {currentPaidAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle2" color="error.main">
                    Unpaid Amount: Rs {currentUnpaidAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/customers')}
                  disabled={formik.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loadingForm || formik.isSubmitting}
                >
                  {formik.isSubmitting
                    ? isEditMode
                      ? 'Updating...'
                      : 'Creating...'
                    : isEditMode
                      ? 'Update'
                      : 'Create'}
                </Button>
                {isEditMode && customerId && (
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={<Iconify icon="solar:share-bold" />}
                    onClick={() => {
                      void handlePrintBill();
                    }}
                  >
                    Print Bill
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
      </DashboardContent>
      {isEditMode && customerId && formik.values.paymentStatus === 'unpaid' && (
        <Dialog open={addPaymentOpen} onClose={handleCloseAddPayment} fullWidth maxWidth="xs">
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Remaining Unpaid: {formatRs(paymentHistoryRemainingUnpaid)}
            </Typography>
            <TextField
              autoFocus
              fullWidth
              type="number"
              label="Payment Amount"
              inputProps={{ min: 0, step: 0.01 }}
              value={addPaymentAmount}
              onChange={(e) => {
                setAddPaymentAmount(e.target.value);
                if (addPaymentError) setAddPaymentError('');
              }}
              error={Boolean(addPaymentError)}
              helperText={addPaymentError}
              disabled={submittingAddPayment}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddPayment} disabled={submittingAddPayment}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                void handleSubmitAddPayment();
              }}
              disabled={submittingAddPayment}
            >
              {submittingAddPayment ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
