import axios from 'axios';

// ----------------------------------------------------------------------

export type ClientHistory = {
  _id: string;
  billNumber: number;
  itemNumber: string;
  boxQuantity: number;
  actualPrice: number;
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ClientHistoryResponse = {
  data: ClientHistory[];
  pagination: Pagination;
};

export const getClientHistory = async (params?: {
  page?: number;
  limit?: number;
  billNumber?: number;
  search?: string;
  sort?: string;
}): Promise<ClientHistoryResponse> => {
  const response = await axios.get<ClientHistoryResponse>('/client-history', { params });
  const body = response.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination: body?.pagination ?? { total: 0, page: 1, limit: 100, totalPages: 0 },
  };
};

export const getClientHistoryByClient = async (
  clientId: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
  }
): Promise<ClientHistoryResponse> => {
  const response = await axios.get<ClientHistoryResponse>(`/clients/${clientId}/history`, {
    params,
  });
  const body = response.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination: body?.pagination ?? { total: 0, page: 1, limit: 15, totalPages: 0 },
  };
};

export const getClientHistoryOne = async (id: string): Promise<ClientHistory> => {
  const response = await axios.get<ClientHistory>(`/client-history/${id}`);
  return response.data;
};

export const deleteClientHistory = async (id: string): Promise<void> => {
  await axios.delete(`/client-history/${id}`);
};
