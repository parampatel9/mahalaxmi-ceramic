import axios from 'axios';

// ----------------------------------------------------------------------

export type Customer = {
  _id: string;
  customerName: string;
  billNumber: number;
  itemNumber: string;
  boxQuantity: number;
  size?: string;
  sellPrice: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CustomerResponse = {
  data: Customer[];
  pagination: Pagination;
};

export type CustomerPayload = {
  customerName: string;
  billNumber: number;
  itemNumber: string;
  boxQuantity: number;
  size?: string;
  sellPrice: number;
};

export const getCustomers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  billNumber?: number;
}): Promise<CustomerResponse> => {
  const response = await axios.get<CustomerResponse>('/customers', { params });
  const body = response.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination: body?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
  };
};

export const getCustomer = async (id: string): Promise<Customer> => {
  const response = await axios.get<Customer>(`/customers/${id}`);
  return response.data;
};

export const addCustomer = async (data: CustomerPayload): Promise<Customer> => {
  const response = await axios.post<Customer>('/customers', data);
  return response.data;
};

export const updateCustomer = async (id: string, data: Partial<CustomerPayload>): Promise<Customer> => {
  const response = await axios.put<Customer>(`/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await axios.delete(`/customers/${id}`);
};
