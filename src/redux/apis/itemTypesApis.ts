import axios from 'axios';

// ----------------------------------------------------------------------

export type ItemType = {
  _id: string;
  itemType: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ItemTypeResponse = {
  data: ItemType[];
  pagination: Pagination;
};

export type ItemTypePayload = {
  itemType: string;
};

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ItemTypeMutationResponse = ApiResponse<ItemType | string | null>;

function normalizeMutationResponse(payload: any): ItemTypeMutationResponse {
  if (
    payload &&
    typeof payload === 'object' &&
    typeof payload.status === 'number' &&
    typeof payload.message === 'string' &&
    'data' in payload
  ) {
    return payload as ItemTypeMutationResponse;
  }

  return {
    status: typeof payload?.status === 'number' ? payload.status : 200,
    message: typeof payload?.message === 'string' ? payload.message : '',
    data: payload?.data ?? payload ?? null,
  };
}

export const getItemTypes = async (params?: {
  page?: number;
  limit?: number;
  searchFields?: string;
}): Promise<ItemTypeResponse> => {
  const res = await axios.post<ItemTypeResponse>('/item-types/list', {
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

export const addItemType = async (
  data: ItemTypePayload
): Promise<ItemTypeMutationResponse> => {
  const response = await axios.post('/item-types', data);
  return normalizeMutationResponse(response.data);
};

export const updateItemType = async (
  id: string,
  data: ItemTypePayload
): Promise<ItemTypeMutationResponse> => {
  const response = await axios.put(`/item-types/${id}`, data);
  return normalizeMutationResponse(response.data);
};

export const getItemType = async (id: string): Promise<ItemType> => {
  const response = await axios.get<ItemType>(`/item-types/${id}`);
  return response.data;
};

export const deleteItemType = async (id: string): Promise<ItemTypeMutationResponse> => {
  const response = await axios.delete(`/item-types/${id}`);
  return normalizeMutationResponse(response.data);
};
