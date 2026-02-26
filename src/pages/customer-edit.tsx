import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { CustomerEditView } from 'src/sections/customer/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { customerId } = useParams<{ customerId: string }>();

  return (
    <>
      <title>{`Edit Sale - ${CONFIG.appName}`}</title>
      <CustomerEditView customerId={customerId ?? ''} />
    </>
  );
}
