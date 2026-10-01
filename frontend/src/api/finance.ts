import { api } from './client';

export interface ExpenseCategoryDto {
  id: string;
  eventId: string;
  name: string;
  color: string;
  icon?: string | null;
  totalAmount: number;
  totalPaid: number;
}

export interface ExpenseDto {
  id: string;
  eventId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  description: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate?: string | null;
  vendorName?: string | null;
  notes?: string | null;
}

export interface FinanceMetricsDto {
  totalBudget: number;
  totalPaid: number;
  toPay: number;
  totalGiftsReceived: number;
  generalBalance: number;
  expensesByCategory: { name: string; value: number; color: string }[];
  paidVsPlanned: { name: string; planned: number; paid: number }[];
}

export const financeApi = {
  getMetrics: async (eventId: string): Promise<FinanceMetricsDto> => {
    const { data } = await api.get<FinanceMetricsDto>(`/events/${eventId}/finances/metrics`);
    return data;
  },

  getCategories: async (eventId: string): Promise<ExpenseCategoryDto[]> => {
    const { data } = await api.get<ExpenseCategoryDto[]>(`/events/${eventId}/expense-categories`);
    return data;
  },

  createCategory: async (eventId: string, payload: { name: string; color?: string; icon?: string }): Promise<ExpenseCategoryDto> => {
    const { data } = await api.post<ExpenseCategoryDto>(`/events/${eventId}/expense-categories`, payload);
    return data;
  },

  deleteCategory: async (eventId: string, id: string): Promise<void> => {
    await api.delete(`/events/${eventId}/expense-categories/${id}`);
  },

  getExpenses: async (eventId: string): Promise<ExpenseDto[]> => {
    const { data } = await api.get<ExpenseDto[]>(`/events/${eventId}/expenses`);
    return data;
  },

  createExpense: async (eventId: string, payload: any): Promise<ExpenseDto> => {
    const { data } = await api.post<ExpenseDto>(`/events/${eventId}/expenses`, payload);
    return data;
  },

  updateExpense: async (eventId: string, id: string, payload: any): Promise<ExpenseDto> => {
    const { data } = await api.put<ExpenseDto>(`/events/${eventId}/expenses/${id}`, payload);
    return data;
  },

  deleteExpense: async (eventId: string, id: string): Promise<void> => {
    await api.delete(`/events/${eventId}/expenses/${id}`);
  }
};
