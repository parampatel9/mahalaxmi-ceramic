import { CONFIG } from 'src/config-global';

import { CustomersView } from 'src/sections/customer/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Sales (Customers) - ${CONFIG.appName}`}</title>
      <CustomersView />
    </>
  );
}
