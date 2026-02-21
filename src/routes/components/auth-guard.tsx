import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------

type AuthGuardProps = {
    children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();

    const [isChecking, setIsChecking] = useState(true);

    const checkToken = useCallback(() => {
        const token = localStorage.getItem('jwtToken');

        if (!token) {
            router.replace('/sign-in');
        } else {
            setIsChecking(false);
        }
    }, [router]);

    useEffect(() => {
        checkToken();
    }, [checkToken]);

    if (isChecking) {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
}
