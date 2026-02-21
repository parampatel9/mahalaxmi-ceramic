import type { LoginData } from 'src/utils/types';

import axios from 'axios';

import { decodeToken, setLocalStorage } from 'src/utils/appUtils';

export const loginUser = async (data: LoginData) => {
    try {
        const response = await axios.post('/auth/login', data, { withCredentials: true });
        const { token } = response.data;

        if (token) {
            setLocalStorage('jwtToken', token);
            const decode = decodeToken(token);
            // Based on the new response format, we extract info from the decoded token
            setLocalStorage('email', decode?.email);
            setLocalStorage('user_id', JSON.stringify(decode?.id || decode?.user_id || decode?.sub));

            // If the response also contains other fields, we can store them
            if (response.data.fullName) {
                setLocalStorage('U_name', response.data.fullName);
            }
        }
        return response;
    } catch (error: any) {
        throw error?.response || error;
    }
};

export const logoutUser = async () => {
    try {
        const response = await axios.post('/auth/logout', {}, { withCredentials: true });
        return response;
    } catch (error: any) {
        throw error?.response || error;
    }
};
