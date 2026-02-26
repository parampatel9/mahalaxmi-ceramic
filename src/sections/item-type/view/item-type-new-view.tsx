import type { AxiosError } from 'axios';

import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useAppDispatch } from 'src/redux/hooks';
import { showAlert } from 'src/redux/slices/alertSlice';
import { DashboardContent } from 'src/layouts/dashboard';
import { addItemType, getItemType, updateItemType } from 'src/redux/apis/itemTypesApis';


// ----------------------------------------------------------------------

type ItemTypeFormPageViewProps = {
  mode: 'new' | 'edit';
  itemTypeId?: string;
};

export function ItemTypeNewView({ mode, itemTypeId }: ItemTypeFormPageViewProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [initialValues, setInitialValues] = useState<{ itemType: string }>({ itemType: '' });
  const [submitError, setSubmitError] = useState('');
  const [loadingForm, setLoadingForm] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);

  const validationSchema = Yup.object({
    itemType: Yup.string().trim().required('Item Type is required'),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      setSubmitError('');
      if (mode === 'edit' && !itemTypeId) return;

      setSubmitting(true);
      try {
        const value = values.itemType.trim();
        const response =
          mode === 'edit' && itemTypeId
            ? await updateItemType(itemTypeId, { itemType: value })
            : await addItemType({ itemType: value });
        const successMessage =
          (typeof response.data === 'string' && response.data.trim()) ||
          (typeof response.message === 'string' && response.message.trim()) ||
          '';

        if (successMessage) {
          toast.success(successMessage);
          dispatch(showAlert({ message: successMessage, severity: 'success' }));
        }
        navigate('/item-types');
      } catch (err) {
        console.error(err);
        const axiosError = err as AxiosError<{ message?: string; data?: string }>;
        const errorMessage =
          axiosError?.response?.data?.message ||
          axiosError?.response?.data?.data ||
          axiosError?.message ||
          '';
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

  useEffect(() => {
    let mounted = true;
    if (mode === 'edit' && itemTypeId) {
      const loadItemType = async () => {
        setLoadingForm(true);
        try {
          const response = await getItemType(itemTypeId);
          if (mounted) {
            setInitialValues({ itemType: response.itemType ?? '' });
          }
        } catch (err) {
          console.error(err);
          const axiosError = err as AxiosError<{ message?: string; data?: string }>;
          const errorMessage =
            axiosError?.response?.data?.message ||
            axiosError?.response?.data?.data ||
            axiosError?.message ||
            '';
          if (mounted) {
            setSubmitError(errorMessage);
          }
        } finally {
          if (mounted) {
            setLoadingForm(false);
          }
        }
      };
      loadItemType();
    } else {
      setSubmitError('');
      if (mounted) {
        setInitialValues({ itemType: '' });
        setLoadingForm(false);
      }
    }
    return () => {
      mounted = false;
    };
  }, [itemTypeId, mode]);

  if (mode === 'edit' && !itemTypeId) {
    return (
      <DashboardContent>
        <Typography color="text.secondary">Invalid item type</Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      {/* <Box sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/item-types"
          color="text.secondary"
          variant="body2"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ transform: 'rotate(180deg)' }} />
          Back to item types
        </Link>
      </Box> */}

      <Typography variant="h4" sx={{ mb: 3 }}>
        {mode === 'edit' ? 'Edit Item Type' : 'New Item Type'}
      </Typography>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={2.5}>
              {loadingForm && <Alert severity="info">Loading item type...</Alert>}
              {submitError && <Alert severity="error">{submitError}</Alert>}

              <TextField
                name="itemType"
                label="Item Type"
                value={formik.values.itemType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.itemType && Boolean(formik.errors.itemType)}
                helperText={formik.touched.itemType ? formik.errors.itemType : ''}
                fullWidth
                disabled={loadingForm || submitting}
              />

              <Stack direction="row" spacing={1.5}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/item-types')}
                  disabled={loadingForm || submitting}
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
