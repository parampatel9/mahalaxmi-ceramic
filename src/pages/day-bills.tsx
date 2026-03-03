import { CONFIG } from 'src/config-global';

import { DayBillsView } from 'src/sections/client-history/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Day Bills - ${CONFIG.appName}`}</title>
      <DayBillsView />
    </>
  );
}

