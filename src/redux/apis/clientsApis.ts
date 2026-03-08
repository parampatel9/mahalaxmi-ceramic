import axios from 'axios';

// ----------------------------------------------------------------------

export type Client = {
  _id: string;
  clientName: string;
  totalItem: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ClientResponse = {
  data: Client[];
  pagination: Pagination;
};

export type ClientLedgerSummary = {
  _id: string;
  clientName: string;
  totalSale: number;
  totalReturn: number;
  totalPurchase: number;
  totalPaid: number;
  pendingAmount: number;
};

export type ClientLedgerListResponse = {
  data: ClientLedgerSummary[];
  pagination: Pagination;
};

export type ClientPayload = {
  clientName: string;
  totalItem: number;
};

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ClientMutationResponse = ApiResponse<Client | string | null>;

function normalizeMutationResponse(payload: any): ClientMutationResponse {
  if (
    payload &&
    typeof payload === 'object' &&
    typeof payload.status === 'number' &&
    typeof payload.message === 'string' &&
    'data' in payload
  ) {
    return payload as ClientMutationResponse;
  }

  return {
    status: typeof payload?.status === 'number' ? payload.status : 200,
    message: typeof payload?.message === 'string' ? payload.message : '',
    data: payload?.data ?? payload ?? null,
  };
}

export const getClients = async (params?: {
  page?: number;
  limit?: number;
  searchFields?: string;
}): Promise<ClientResponse> => {
  const response = await axios.post<ClientResponse>('/clients/list', {
    searchFields: params?.searchFields ?? '',
    page: params?.page ?? 1,
    limit: params?.limit ?? 15,
  });
  const body = response.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination: body?.pagination ?? { total: 0, page: 1, limit: 15, totalPages: 0 },
  };
};

export const addClient = async (data: ClientPayload): Promise<ClientMutationResponse> => {
  const response = await axios.post('/clients', data);
  return normalizeMutationResponse(response.data);
};

export const updateClient = async (id: string, data: ClientPayload): Promise<ClientMutationResponse> => {
  const response = await axios.put(`/clients/${id}`, data);
  return normalizeMutationResponse(response.data);
};

export const getClient = async (id: string): Promise<Client> => {
  const response = await axios.get<Client>(`/clients/${id}`);
  return response.data;
};

export const deleteClient = async (id: string): Promise<ClientMutationResponse> => {
  const response = await axios.delete(`/clients/${id}`);
  return normalizeMutationResponse(response.data);
};

export const getClientLedgerList = async (params?: {
  page?: number;
  limit?: number;
  searchFields?: string;
}): Promise<ClientLedgerListResponse> => {
  const response = await axios.post<ClientLedgerListResponse>('/clients/list-ledger', {
    searchFields: params?.searchFields ?? '',
    page: params?.page ?? 1,
    limit: params?.limit ?? 15,
  });
  const body = response.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination: body?.pagination ?? { total: 0, page: 1, limit: 15, totalPages: 0 },
  };
};
