import type { AxiosError } from 'axios';

import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';

import { useAppDispatch } from 'src/redux/hooks';
import { showAlert } from 'src/redux/slices/alertSlice';
import { DashboardContent } from 'src/layouts/dashboard';
import { fetchClient } from 'src/redux/slices/clientSlice';
import { type ItemType } from 'src/redux/apis/itemTypesApis';
import { fetchItemTypes } from 'src/redux/slices/itemTypeSlice';
import { type ClientItem } from 'src/redux/apis/clientItemsApis';
import { editClientItem, fetchClientItem, createClientItem } from 'src/redux/slices/clientItemSlice';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type ClientItemNewViewProps = {
  clientId: string;
  itemId?: string;
};

type FormValues = {
  itemNumber: string;
  oldItemName: string;
  actualPrice: string;
  itemTypeId: string;
};

function getItemTypeId(item: ClientItem): string {
  if (!item.itemTypeId) return '';
  if (typeof item.itemTypeId === 'string') return item.itemTypeId;
  return item.itemTypeId._id;
}

export function ClientItemNewView({ clientId, itemId }: ClientItemNewViewProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditMode = Boolean(itemId);
  const [clientName, setClientName] = useState<string>('');
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [initialValues, setInitialValues] = useState<FormValues>({
    itemNumber: '',
    oldItemName: '',
    actualPrice: '',
    itemTypeId: '',
  });
  const [submitError, setSubmitError] = useState<string>('');
  const [loadingForm, setLoadingForm] = useState(isEditMode);

  const validationSchema = Yup.object({
    itemNumber: Yup.string().trim().required('Item Number is required'),
    actualPrice: Yup.string()
      .trim()
      .required('Actual Price is required'),
      // .test('is-number', 'Actual Price must be a valid number.', (value) => {
      //   if (!value) return false;
      //   const parsed = Number(value);
      //   return Number.isFinite(parsed);
      // })
      // .test('non-negative', 'Actual Price must be a non-negative number.', (value) => {
      //   if (!value) return false;
      //   const parsed = Number(value);
      //   return Number.isFinite(parsed) && parsed >= 0;
      // }),
    itemTypeId: Yup.string().trim().required('Item Type is required'),
  });

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitError('');
      const parsedActualPrice = parseFloat(values.actualPrice || '');

      setSubmitting(true);
      try {
        const payload = {
          itemNumber: values.itemNumber.trim(),
          oldItemName: values.oldItemName.trim() || undefined,
          actualPrice: parsedActualPrice,
          itemTypeId: values.itemTypeId,
        };
        const response =
          isEditMode && itemId
            ? await dispatch(editClientItem({ clientId, itemId, data: payload })).unwrap()
            : await dispatch(createClientItem({ clientId, data: payload })).unwrap();
        const successMessage =
          (typeof response.data === 'string' && response.data.trim()) ||
          (typeof response.message === 'string' && response.message.trim()) ||
          '';
        if (successMessage) {
          toast.success(successMessage);
          dispatch(showAlert({ message: successMessage, severity: 'success' }));
        }
        navigate(`/clients/${clientId}/items`);
      } catch (err) {
        console.error(err);
        const axiosError = err as AxiosError<{ message?: string; data?: string }>;
        const errorMessage =
          axiosError?.response?.data?.message ||
          axiosError?.response?.data?.data ||
          axiosError?.message ||
          (isEditMode ? 'Failed to update item.' : 'Failed to create item.');
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
    if (!clientId) return;
    setLoadingForm(true);
    try {
      if (isEditMode && itemId) {
        const [clientRes, itemTypesRes, itemRes] = await Promise.all([
          dispatch(fetchClient(clientId)).unwrap(),
          dispatch(fetchItemTypes({ limit: 1000 })).unwrap(),
          dispatch(fetchClientItem({ clientId, itemId })).unwrap(),
        ]);
        setClientName(clientRes.clientName);
        setItemTypes(itemTypesRes.data);
        setInitialValues({
          itemNumber: itemRes.itemNumber ?? '',
          oldItemName: itemRes.oldItemName ?? '',
          actualPrice: String(itemRes.actualPrice ?? 0),
          itemTypeId: getItemTypeId(itemRes),
        });
      } else {
        const [clientRes, itemTypesRes] = await Promise.all([
          dispatch(fetchClient(clientId)).unwrap(),
          dispatch(fetchItemTypes({ limit: 1000 })).unwrap(),
        ]);
        setClientName(clientRes.clientName);
        setItemTypes(itemTypesRes.data);
        setInitialValues({
          itemNumber: '',
          oldItemName: '',
          actualPrice: '',
          itemTypeId: '',
        });
      }
    } catch (err) {
      console.error(err);
      setSubmitError(isEditMode ? 'Failed to load item details.' : 'Failed to load form data.');
    } finally {
      setLoadingForm(false);
    }
  }, [clientId, dispatch, isEditMode, itemId]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  if (!clientId) {
    return (
      <DashboardContent>
        <Typography color="text.secondary">Invalid client</Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to={`/clients/${clientId}/items`}
          color="text.secondary"
          variant="body2"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ transform: 'rotate(180deg)' }} />
          Back to items
        </Link>
      </Box>

      <Typography variant="h4" sx={{ mb: 3 }}>
        {isEditMode ? 'Edit Item' : 'New Item'} {clientName ? `for ${clientName}` : ''}
      </Typography>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={2.5}>
              {loadingForm && <Alert severity="info">Loading item details...</Alert>}
              {submitError && <Alert severity="error">{submitError}</Alert>}

              <TextField
                name="itemNumber"
                label="Item Number"
                value={formik.values.itemNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.itemNumber && Boolean(formik.errors.itemNumber)}
                helperText={formik.touched.itemNumber ? formik.errors.itemNumber : ''}
                fullWidth
                disabled={loadingForm || formik.isSubmitting}
              />

              <TextField
                name="oldItemName"
                label="Old Item Name"
                value={formik.values.oldItemName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                fullWidth
                disabled={loadingForm || formik.isSubmitting}
              />

              <TextField
                name="actualPrice"
                label="Actual Price"
                type="number"
                value={formik.values.actualPrice}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.actualPrice && Boolean(formik.errors.actualPrice)}
                helperText={formik.touched.actualPrice ? formik.errors.actualPrice : ''}
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
                disabled={loadingForm || formik.isSubmitting}
              />

              <Autocomplete
                options={itemTypes}
                value={itemTypes.find((it) => it._id === formik.values.itemTypeId) ?? null}
                onChange={(_, newValue) => {
                  formik.setFieldValue('itemTypeId', newValue?._id ?? '');
                }}
                onBlur={() => {
                  formik.setFieldTouched('itemTypeId', true, true);
                }}
                getOptionLabel={(option) => option.itemType ?? ''}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                disabled={loadingForm || formik.isSubmitting}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="itemTypeId"
                    label="Item Type"
                    fullWidth
                    error={formik.touched.itemTypeId && Boolean(formik.errors.itemTypeId)}
                    helperText={formik.touched.itemTypeId ? formik.errors.itemTypeId : ''}
                  />
                )}
              />

              <Stack direction="row" spacing={1.5}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate(`/clients/${clientId}/items`)}
                  disabled={loadingForm || formik.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loadingForm || formik.isSubmitting}>
                  {formik.isSubmitting
                    ? isEditMode
                      ? 'Updating...'
                      : 'Creating...'
                    : isEditMode
                      ? 'Update'
                      : 'Create'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
