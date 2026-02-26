import { CONFIG } from 'src/config-global';

import { CustomerNewView } from 'src/sections/customer/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`New Sale - ${CONFIG.appName}`}</title>
      <CustomerNewView />
    </>
  );
}
