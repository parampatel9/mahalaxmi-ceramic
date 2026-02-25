import type { Customer } from 'src/redux/apis/customersApis';
import type { ClientItem } from 'src/redux/apis/clientItemsApis';

import { useState, useEffect } from 'react';

import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';

// ----------------------------------------------------------------------

type CustomerFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerName: string;
    billNumber: number;
    itemNumber: string;
    boxQuantity: number;
    size: string;
    sellPrice: number;
  }) => void;
  customer: Customer | null;
  title: string;
  submitLabel: string;
  clientItems: ClientItem[];
};

export function CustomerFormDialog({
  open,
  onClose,
  onSubmit,
  customer,
  title,
  submitLabel,
  clientItems,
}: CustomerFormDialogProps) {
  const [selectedItemNumber, setSelectedItemNumber] = useState('');
  const [itemNumberError, setItemNumberError] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedItemNumber(customer?.itemNumber ?? '');
      setItemNumberError(false);
    }
  }, [open, customer]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const customerName = (form.elements.namedItem('customerName') as HTMLInputElement)?.value?.trim() ?? '';
    const billNumber = parseInt((form.elements.namedItem('billNumber') as HTMLInputElement)?.value || '0', 10);
    const boxQuantity = parseInt((form.elements.namedItem('boxQuantity') as HTMLInputElement)?.value || '0', 10);
    const size = (form.elements.namedItem('size') as HTMLInputElement)?.value?.trim() ?? '';
    const sellPrice = parseFloat((form.elements.namedItem('sellPrice') as HTMLInputElement)?.value || '0');

    if (!selectedItemNumber) {
      setItemNumberError(true);
      return;
    }

    if (customerName && billNumber > 0 && boxQuantity > 0 && sellPrice >= 0) {
      onSubmit({
        customerName,
        billNumber,
        itemNumber: selectedItemNumber,
        boxQuantity,
        size,
        sellPrice,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form key={customer?._id ?? 'new'} onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            name="customerName"
            label="Customer Name"
            fullWidth
            required
            defaultValue={customer?.customerName ?? ''}
            sx={{ mt: 1 }}
          />
          <TextField
            name="billNumber"
            label="Bill Number"
            type="number"
            fullWidth
            required
            inputProps={{ min: 1 }}
            defaultValue={customer?.billNumber ?? ''}
          />
          <FormControl fullWidth required error={itemNumberError}>
            <InputLabel id="item-number-label">Item (from client items)</InputLabel>
            <Select
              labelId="item-number-label"
              value={selectedItemNumber}
              label="Item (from client items)"
              onChange={(e) => {
                setSelectedItemNumber(e.target.value);
                setItemNumberError(false);
              }}
            >
              {clientItems.map((item) => (
                <MenuItem key={item._id} value={item.itemNumber}>
                  {item.itemNumber}
                  {typeof item.actualPrice === 'number' ? ` — ₹${item.actualPrice}` : ''}
                </MenuItem>
              ))}
            </Select>
            {itemNumberError && (
              <FormHelperText>Select a valid item from the client item list.</FormHelperText>
            )}
          </FormControl>
          <TextField
            name="boxQuantity"
            label="Box Quantity"
            type="number"
            fullWidth
            required
            inputProps={{ min: 1 }}
            defaultValue={customer?.boxQuantity ?? ''}
          />
          <TextField
            name="size"
            label="Size (optional)"
            fullWidth
            placeholder="e.g. 24x24"
            defaultValue={customer?.size ?? ''}
          />
          <TextField
            name="sellPrice"
            label="Sell Price"
            type="number"
            fullWidth
            required
            inputProps={{ min: 0, step: 0.01 }}
            defaultValue={customer?.sellPrice ?? ''}
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
