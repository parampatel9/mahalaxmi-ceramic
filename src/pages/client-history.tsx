import { CONFIG } from 'src/config-global';

import { ClientHistoryView } from 'src/sections/client-history/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Bill Report - ${CONFIG.appName}`}</title>
      <ClientHistoryView />
    </>
  );
}
