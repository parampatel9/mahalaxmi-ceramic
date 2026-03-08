import { CONFIG } from 'src/config-global';

import { ClientPendingPaymentView } from 'src/sections/client/view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Pending Payments - ${CONFIG.appName}`}</title>
            <ClientPendingPaymentView />
        </>
    );
}
