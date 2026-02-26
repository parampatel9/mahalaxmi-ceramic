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
import { addClient, getClient, updateClient } from 'src/redux/apis/clientsApis';

// ----------------------------------------------------------------------

type ClientFormPageViewProps = {
  mode: 'new' | 'edit';
  clientId?: string;
};

export function ClientNewView({ mode, clientId }: ClientFormPageViewProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [initialValues, setInitialValues] = useState<{ clientName: string; totalItem: number }>({
    clientName: '',
    totalItem: 0,
  });
  const [submitError, setSubmitError] = useState('');
  const [loadingForm, setLoadingForm] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);

  const validationSchema = Yup.object({
    clientName: Yup.string().trim().required('Client Name is required'),
    totalItem: Yup.number().required(),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      setSubmitError('');
      if (mode === 'edit' && !clientId) return;

      setSubmitting(true);
      try {
        const payload = {
          clientName: values.clientName.trim(),
          totalItem: values.totalItem,
        };
        const response =
          mode === 'edit' && clientId ? await updateClient(clientId, payload) : await addClient(payload);

        const successMessage =
          (typeof response.data === 'string' && response.data.trim()) ||
          (typeof response.message === 'string' && response.message.trim()) ||
          '';

        if (successMessage) {
          toast.success(successMessage);
          dispatch(showAlert({ message: successMessage, severity: 'success' }));
        }

        navigate('/clients');
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

    if (mode === 'edit' && clientId) {
      const loadClient = async () => {
        setLoadingForm(true);
        try {
          const response = await getClient(clientId);
          if (mounted) {
            setInitialValues({
              clientName: response.clientName ?? '',
              totalItem: response.totalItem ?? 0,
            });
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
      loadClient();
    } else {
      setSubmitError('');
      if (mounted) {
        setInitialValues({ clientName: '', totalItem: 0 });
        setLoadingForm(false);
      }
    }

    return () => {
      mounted = false;
    };
  }, [clientId, mode]);

  if (mode === 'edit' && !clientId) {
    return (
      <DashboardContent>
        <Typography color="text.secondary">Invalid client</Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {mode === 'edit' ? 'Edit Client' : 'New Client'}
      </Typography>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={2.5}>
              {loadingForm && <Alert severity="info">Loading client...</Alert>}
              {submitError && <Alert severity="error">{submitError}</Alert>}

              <TextField
                name="clientName"
                label="Client Name"
                value={formik.values.clientName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.clientName && Boolean(formik.errors.clientName)}
                helperText={formik.touched.clientName ? formik.errors.clientName : ''}
                fullWidth
                disabled={loadingForm || submitting}
              />

              <Stack direction="row" spacing={1.5}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/clients')}
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
