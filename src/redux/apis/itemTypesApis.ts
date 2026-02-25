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

export const getItemTypes = async (params?: {
  page?: number;
  limit?: number;
  searchFields?: string;
}): Promise<ItemTypeResponse> => {
  const res = await axios.get<ItemTypeResponse>('/item-types', {
    params,
  });
  const body = res.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination:
      body?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
  };
};

export const addItemType = async (
  data: ItemTypePayload
): Promise<ItemType> => {
  const response = await axios.post<ItemType>('/item-types', data);
  return response.data;
};

export const updateItemType = async (
  id: string,
  data: ItemTypePayload
): Promise<ItemType> => {
  const response = await axios.put<ItemType>(`/item-types/${id}`, data);
  return response.data;
};

export const getItemType = async (id: string): Promise<ItemType> => {
  const response = await axios.get<ItemType>(`/item-types/${id}`);
  return response.data;
};

export const deleteItemType = async (id: string): Promise<void> => {
  await axios.delete(`/item-types/${id}`);
};
