import { CustomerFormPageView } from './customer-form-page-view';

// ----------------------------------------------------------------------

type CustomerEditViewProps = {
  customerId: string;
};

export function CustomerEditView({ customerId }: CustomerEditViewProps) {
  return <CustomerFormPageView mode="edit" customerId={customerId} />;
}
