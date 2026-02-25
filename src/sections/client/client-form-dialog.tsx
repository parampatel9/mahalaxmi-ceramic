import type { Client } from 'src/redux/apis/clientsApis';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// ----------------------------------------------------------------------

type ClientFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (clientName: string, totalItem: number) => void;
  client?: Client | null;
  title: string;
  submitLabel: string;
};

export function ClientFormDialog({
  open,
  onClose,
  onSubmit,
  client,
  title,
  submitLabel,
}: ClientFormDialogProps) {
  const isEdit = !!client;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('clientName') as HTMLInputElement)?.value?.trim();
    const total = parseInt((form.elements.namedItem('totalItem') as HTMLInputElement)?.value || '0', 10);
    if (name) {
      onSubmit(name, total);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form key={client?._id ?? 'new'} onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            name="clientName"
            label="Client Name"
            fullWidth
            required
            defaultValue={client?.clientName ?? ''}
            sx={{ mb: 2 }}
          />
          <TextField
            name="totalItem"
            label="Total Item"
            type="number"
            fullWidth
            required
            inputProps={{ min: 0 }}
            defaultValue={client?.totalItem ?? 0}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
