import type { ClientItem } from 'src/redux/apis/clientItemsApis';
import type { Customer, CustomerItemPayload } from 'src/redux/apis/customersApis';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';

// ----------------------------------------------------------------------

type FormItem = {
  itemNumber: string;
  boxQuantity: string;
  returnBoxQuantity: string;
  size: string;
  sellPrice: string;
};

const EMPTY_ITEM: FormItem = {
  itemNumber: '',
  boxQuantity: '',
  returnBoxQuantity: '0',
  size: '',
  sellPrice: '',
};

type CustomerFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerName: string;
    billNumber: number;
    items: CustomerItemPayload[];
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
  const [customerName, setCustomerName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ ...EMPTY_ITEM }]);
  const [itemsError, setItemsError] = useState(false);

  useEffect(() => {
    if (open) {
      setCustomerName(customer?.customerName ?? '');
      setBillNumber(customer?.billNumber ? String(customer.billNumber) : '');
      const initialItems =
        customer?.items && customer.items.length > 0
          ? customer.items.map((item) => ({
              itemNumber: item.itemNumber ?? '',
              boxQuantity: item.boxQuantity ? String(item.boxQuantity) : '',
              returnBoxQuantity:
                item.returnBoxQuantity !== undefined ? String(item.returnBoxQuantity) : '0',
              size: item.size ?? '',
              sellPrice: item.sellPrice !== undefined ? String(item.sellPrice) : '',
            }))
          : [
              {
                itemNumber: customer?.itemNumber ?? '',
                boxQuantity: customer?.boxQuantity ? String(customer.boxQuantity) : '',
                returnBoxQuantity: '0',
                size: customer?.size ?? '',
                sellPrice: customer?.sellPrice !== undefined ? String(customer.sellPrice) : '',
              },
            ];
      setItems(initialItems);
      setItemsError(false);
    }
  }, [open, customer]);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedBillNumber = parseInt(billNumber || '0', 10);
    const parsedItems: CustomerItemPayload[] = items
      .map((item) => {
        const boxQuantityNum = parseInt(item.boxQuantity || '0', 10);
        const returnBoxQuantityNum = parseInt(item.returnBoxQuantity || '0', 10);
        const sellPriceNum = parseFloat(item.sellPrice || '0');
        const normalized: CustomerItemPayload = {
          itemNumber: item.itemNumber.trim(),
          boxQuantity: boxQuantityNum,
          returnBoxQuantity: returnBoxQuantityNum,
          sellPrice: sellPriceNum,
        };
        if (item.size.trim()) normalized.size = item.size.trim();
        return normalized;
      })
      .filter(
        (item) =>
          item.itemNumber &&
          item.boxQuantity > 0 &&
          (item.returnBoxQuantity ?? 0) >= 0 &&
          item.sellPrice >= 0
      );

    if (parsedItems.length !== items.length) {
      setItemsError(true);
      return;
    }

    if (customerName.trim() && parsedBillNumber > 0 && parsedItems.length > 0) {
      onSubmit({ customerName: customerName.trim(), billNumber: parsedBillNumber, items: parsedItems });
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
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            sx={{ mt: 1 }}
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
          />

          {items.map((item, index) => (
            <Box
              key={`item-row-${index}`}
              sx={{
                p: 2,
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
                  disabled={items.length === 1}
                  size="small"
                >
                  Remove
                </Button>
              </Box>

              <Autocomplete
                options={clientItems}
                value={clientItems.find((clientItem) => clientItem.itemNumber === item.itemNumber) ?? null}
                onChange={(_, newValue) => handleItemChange(index, 'itemNumber', newValue?.itemNumber ?? '')}
                getOptionLabel={(option) => option.itemNumber ?? ''}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    {option.itemNumber}
                    {typeof option.actualPrice === 'number' ? ` — ₹${option.actualPrice}` : ''}
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Item (from client items)"
                    fullWidth
                    required
                    error={itemsError && !item.itemNumber}
                  />
                )}
              />

              <TextField
                label="Box Quantity"
                type="number"
                fullWidth
                required
                inputProps={{ min: 1 }}
                value={item.boxQuantity}
                error={itemsError && (!item.boxQuantity || parseInt(item.boxQuantity, 10) <= 0)}
                onChange={(e) => handleItemChange(index, 'boxQuantity', e.target.value.replace(/\D/g, ''))}
              />

              <TextField
                label="Return Box Quantity"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                value={item.returnBoxQuantity}
                error={itemsError && parseInt(item.returnBoxQuantity || '0', 10) < 0}
                onChange={(e) =>
                  handleItemChange(index, 'returnBoxQuantity', e.target.value.replace(/\D/g, ''))
                }
              />

              <TextField
                label="Size (optional)"
                fullWidth
                placeholder="e.g. 24x24"
                value={item.size}
                onChange={(e) => handleItemChange(index, 'size', e.target.value)}
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
              />

              <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'right' }}>
                Item Total: ₹{getItemTotal(item).toFixed(2)}
              </Typography>
            </Box>
          ))}

          <Button variant="outlined" onClick={handleAddItem}>
            Add More Item
          </Button>

          {itemsError && (
            <FormHelperText error>
              Please fill all item fields correctly (item number, box quantity, return box quantity, and sell price).
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
            <Typography variant="subtitle1">Grand Total</Typography>
            <Typography variant="h6">₹{grandTotal.toFixed(2)}</Typography>
          </Box>
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
