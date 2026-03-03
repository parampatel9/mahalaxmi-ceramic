import axios from 'axios';

// ----------------------------------------------------------------------

export type PopulatedItemType = {
  _id: string;
  itemType: string;
};

export type ClientItem = {
  _id: string;
  itemNumber: string;
  oldItemName?: string;
  actualPrice: number;
  itemTypeId?: string | PopulatedItemType;
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientItemPayload = {
  itemNumber: string;
  oldItemName?: string;
  actualPrice: number;
  itemTypeId: string;
};

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ClientItemMutationResponse = ApiResponse<ClientItem | string | null>;

function normalizeMutationResponse(payload: any): ClientItemMutationResponse {
  if (
    payload &&
    typeof payload === 'object' &&
    typeof payload.status === 'number' &&
    typeof payload.message === 'string' &&
    'data' in payload
  ) {
    return payload as ClientItemMutationResponse;
  }

  return {
    status: typeof payload?.status === 'number' ? payload.status : 200,
    message: typeof payload?.message === 'string' ? payload.message : '',
    data: payload?.data ?? payload ?? null,
  };
}

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
  const res = await axios.post<ClientItemResponse>(`/clients/${clientId}/items/list`, {
    searchFields: params?.searchFields ?? '',
    page: params?.page ?? 1,
    limit: params?.limit ?? 15,
  });
  const body = res.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination:
      body?.pagination ?? { total: 0, page: 1, limit: 15, totalPages: 0 },
  };
};

export const addClientItem = async (
  clientId: string,
  data: ClientItemPayload
): Promise<ClientItemMutationResponse> => {
  const response = await axios.post(`/clients/${clientId}/items`, data);
  return normalizeMutationResponse(response.data);
};

export const updateClientItem = async (
  clientId: string,
  itemId: string,
  data: ClientItemPayload
): Promise<ClientItemMutationResponse> => {
  const response = await axios.put(
    `/clients/${clientId}/items/${itemId}`,
    data
  );
  return normalizeMutationResponse(response.data);
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
): Promise<ClientItemMutationResponse> => {
  const response = await axios.delete(`/clients/${clientId}/items/${itemId}`);
  return normalizeMutationResponse(response.data);
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
