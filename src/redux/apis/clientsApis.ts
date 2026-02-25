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

export type ClientPayload = {
  clientName: string;
  totalItem: number;
};

export const getClients = async (params?: {
  page?: number;
  limit?: number;
  searchFields?: string;
}): Promise<ClientResponse> => {
  const response = await axios.get<ClientResponse>('/clients', {
    params,
  });
  return response.data;
};

export const addClient = async (data: ClientPayload): Promise<Client> => {
  const response = await axios.post<Client>('/clients', data);
  return response.data;
};

export const updateClient = async (id: string, data: ClientPayload): Promise<Client> => {
  const response = await axios.put<Client>(`/clients/${id}`, data);
  return response.data;
};

export const getClient = async (id: string): Promise<Client> => {
  const response = await axios.get<Client>(`/clients/${id}`);
  return response.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await axios.delete(`/clients/${id}`);
};
