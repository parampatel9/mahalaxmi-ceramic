import axios from 'axios';

// ----------------------------------------------------------------------

export type PopulatedItemType = {
  _id: string;
  itemType: string;
};

export type ClientItem = {
  _id: string;
  itemNumber: string;
  actualPrice: number;
  itemTypeId?: string | PopulatedItemType;
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientItemPayload = {
  itemNumber: string;
  actualPrice: number;
  itemTypeId: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ClientItemResponse = {
  data: ClientItem[];
  pagination: Pagination;
};

export const getClientItems = async (
  clientId: string,
  params?: { page?: number; limit?: number; searchFields?: string }
): Promise<ClientItemResponse> => {
  const res = await axios.get<ClientItemResponse>(`/clients/${clientId}/items`, {
    params,
  });
  const body = res.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination:
      body?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
  };
};

export const addClientItem = async (
  clientId: string,
  data: ClientItemPayload
): Promise<ClientItem> => {
  const response = await axios.post<ClientItem>(`/clients/${clientId}/items`, data);
  return response.data;
};

export const updateClientItem = async (
  clientId: string,
  itemId: string,
  data: ClientItemPayload
): Promise<ClientItem> => {
  const response = await axios.put<ClientItem>(
    `/clients/${clientId}/items/${itemId}`,
    data
  );
  return response.data;
};

export const getClientItem = async (
  clientId: string,
  itemId: string
): Promise<ClientItem> => {
  const response = await axios.get<ClientItem>(`/clients/${clientId}/items/${itemId}`);
  return response.data;
};

export const deleteClientItem = async (
  clientId: string,
  itemId: string
): Promise<void> => {
  await axios.delete(`/clients/${clientId}/items/${itemId}`);
};

// All client items (for customer/sale form itemNumber dropdown)
export const getAllClientItems = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ClientItemResponse> => {
  const res = await axios.get<ClientItemResponse>('/client-items', {
    params: { page: 1, limit: 500, ...params },
  });
  const body = res.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination:
      body?.pagination ?? { total: 0, page: 1, limit: 500, totalPages: 0 },
  };
};
