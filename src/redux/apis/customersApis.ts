import axios from 'axios';

// ----------------------------------------------------------------------

export type Customer = {
  _id: string;
  customerName: string;
  address?: string;
  mobileNumber?: string;
  date?: string;
  billNumber: number;
  itemNumber?: string;
  boxQuantity?: number;
  size?: string;
  sellPrice?: number;
  grandTotal?: number;
  items?: CustomerItemPayload[];
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
  address: string;
  mobileNumber: string;
  date: string;
  billNumber: number;
  items: CustomerItemPayload[];
};

export type CustomerItemPayload = {
  itemNumber: string;
  boxQuantity: number;
  size?: string;
  sellPrice: number;
  grandTotal?: number;
};

export type NextBillNumberResponse = {
  maxBillNumber: number;
  nextBillNumber: number;
};

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type CustomerMutationResponse = ApiResponse<Customer | string | null>;

function normalizeMutationResponse(payload: any): CustomerMutationResponse {
  if (
    payload &&
    typeof payload === 'object' &&
    typeof payload.status === 'number' &&
    typeof payload.message === 'string' &&
    'data' in payload
  ) {
    return payload as CustomerMutationResponse;
  }

  return {
    status: typeof payload?.status === 'number' ? payload.status : 200,
    message: typeof payload?.message === 'string' ? payload.message : '',
    data: payload?.data ?? payload ?? null,
  };
}

export const getCustomers = async (params?: {
  page?: number;
  limit?: number;
  searchFields?: string;
  sort?: string;
  billNumber?: number;
}): Promise<CustomerResponse> => {
  const payload: Record<string, unknown> = {
    searchFields: params?.searchFields ?? '',
    page: params?.page ?? 1,
    limit: params?.limit ?? 15,
  };
  if (params?.sort) payload.sort = params.sort;
  if (typeof params?.billNumber === 'number') payload.billNumber = params.billNumber;
  const response = await axios.post<CustomerResponse>('/customers/list', payload);
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

export const addCustomer = async (data: CustomerPayload): Promise<CustomerMutationResponse> => {
  const response = await axios.post('/customers', data);
  return normalizeMutationResponse(response.data);
};

export const updateCustomer = async (
  id: string,
  data: Partial<CustomerPayload>
): Promise<CustomerMutationResponse> => {
  const response = await axios.put(`/customers/${id}`, data);
  return normalizeMutationResponse(response.data);
};

export const deleteCustomer = async (id: string): Promise<CustomerMutationResponse> => {
  const response = await axios.delete(`/customers/${id}`);
  return normalizeMutationResponse(response.data);
};

export const getNextBillNumber = async (): Promise<NextBillNumberResponse> => {
  const response = await axios.get<NextBillNumberResponse>('/customers/next-bill-number');
  return response.data;
};
