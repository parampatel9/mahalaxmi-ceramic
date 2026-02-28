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

// ----------------------------------------------------------------------
// Day-wise / Month-wise / Ledger
// ----------------------------------------------------------------------

export type DayWiseEntry = {
  date: string;
  totalAmount?: number;
  totalPrice?: number;
  count?: number;
  [key: string]: unknown;
};

export type MonthWiseEntry = {
  month: number;
  year: number;
  totalAmount?: number;
  totalPrice?: number;
  count?: number;
  [key: string]: unknown;
};

export const getClientHistoryDayWise = async (
  clientId: string,
  params?: { page?: number; limit?: number }
): Promise<{ data: DayWiseEntry[] }> => {
  const response = await axios.get<{ data: DayWiseEntry[] }>(
    `/clients/${clientId}/history/day-wise`,
    { params }
  );
  const body = response.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
  };
};

export const getClientHistoryMonthWise = async (
  clientId: string,
  params?: { page?: number; limit?: number }
): Promise<{ data: MonthWiseEntry[] }> => {
  const response = await axios.get<{ data: MonthWiseEntry[] }>(
    `/clients/${clientId}/history/month-wise`,
    { params }
  );
  const body = response.data;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
  };
};

export type LedgerTransaction = {
  _id: string;
  amount: number;
  type: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ClientLedgerResponse = {
  totalPurchase: number;
  totalPaid: number;
  pendingAmount: number;
  transactions: LedgerTransaction[];
};

export const getClientLedger = async (clientId: string): Promise<ClientLedgerResponse> => {
  const response = await axios.get<ClientLedgerResponse>(`/clients/${clientId}/ledger`);
  const body = response.data;
  return {
    totalPurchase: body?.totalPurchase ?? 0,
    totalPaid: body?.totalPaid ?? 0,
    pendingAmount: body?.pendingAmount ?? 0,
    transactions: Array.isArray(body?.transactions) ? body.transactions : [],
  };
};

export type PostTransactionBody = {
  amount: number;
  type: string;
  note?: string;
};

export const postClientTransaction = async (
  clientId: string,
  body: PostTransactionBody
): Promise<unknown> => {
  const response = await axios.post(`/clients/${clientId}/transactions`, body);
  return response.data;
};
