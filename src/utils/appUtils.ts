import { jwtDecode } from 'jwt-decode';

export const setLocalStorage = (key: string, value: any) => {
    if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
    } else {
        localStorage.setItem(key, value);
    }
};

export const getLocalStorage = (key: string) => {
    const value = localStorage.getItem(key);
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return value;
    }
};

export const clearLocalStorage = () => {
    localStorage.clear();
};

export const decodeToken = (token: string): any => {
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error('Invalid token', error);
        return null;
    }
};
