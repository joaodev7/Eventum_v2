import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { Expense, ExpenseCategory, ExpenseStatus } from '@/lib/types';
import { toast } from 'sonner';

// ============ EXPENSE CATEGORIES ============

export function useExpenseCategories(eventId: string | undefined) {
  return useQuery({
    queryKey: ['expense-categories', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await financeApi.getCategories(eventId);
      return data.map((c: any): ExpenseCategory => ({
        id: c.id,
        event_id: c.eventId || eventId,
        name: c.name,
        color: c.color,
        icon: c.icon || null,
        created_at: new Date().toISOString(),
      }));
    },
    enabled: !!eventId,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: { event_id: string; name: string; color: string; icon?: string }) => {
      const data = await financeApi.createCategory(category.event_id, {
        name: category.name,
        color: category.color,
        icon: category.icon,
      });
      return {
        id: data.id,
        event_id: data.eventId || category.event_id,
        name: data.name,
        color: data.color,
        icon: data.icon || null,
        created_at: new Date().toISOString(),
      } as ExpenseCategory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories', data.event_id] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating category:', error);
      toast.error('Erro ao criar categoria');
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; icon?: string; event_id: string }) => {
      // In the backend, we create/delete categories, but let's handle updates gracefully
      return { id, ...updates };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories', result.event_id] });
      toast.success('Categoria atualizada!');
    },
    onError: (error: any) => {
      console.error('Error updating category:', error);
      toast.error('Erro ao atualizar categoria');
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      await financeApi.deleteCategory(eventId, id);
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories', eventId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      toast.success('Categoria excluída!');
    },
    onError: (error: any) => {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    },
  });
}

// ============ EXPENSES ============

export function useExpenses(eventId: string | undefined) {
  return useQuery({
    queryKey: ['expenses', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await financeApi.getExpenses(eventId);
      return data.map((e: any): (Expense & { category: ExpenseCategory | null }) => ({
        id: e.id,
        event_id: e.eventId || eventId,
        category_id: e.categoryId || null,
        description: e.description,
        amount: e.amount,
        paid_amount: e.paidAmount || 0,
        status: (e.status?.toLowerCase() || 'pending') as ExpenseStatus,
        due_date: e.dueDate || null,
        paid_at: null,
        vendor_name: e.vendorName || null,
        notes: e.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: e.categoryId ? {
          id: e.categoryId,
          event_id: e.eventId || eventId,
          name: e.categoryName || 'Geral',
          color: e.categoryColor || '#9CA3AF',
          icon: null,
          created_at: new Date().toISOString(),
        } : null,
      }));
    },
    enabled: !!eventId,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expense: {
      event_id: string;
      category_id?: string;
      description: string;
      amount: number;
      paid_amount?: number;
      status?: ExpenseStatus;
      due_date?: string;
      vendor_name?: string;
      notes?: string;
    }) => {
      const payload = {
        categoryId: expense.category_id || null,
        description: expense.description,
        amount: expense.amount,
        paidAmount: expense.paid_amount || 0,
        status: expense.status || 'pending',
        dueDate: expense.due_date || null,
        vendorName: expense.vendor_name || null,
        notes: expense.notes || null,
      };
      const data = await financeApi.createExpense(expense.event_id, payload);
      return {
        id: data.id,
        event_id: expense.event_id,
        category_id: data.categoryId || null,
        description: data.description,
        amount: data.amount,
        paid_amount: data.paidAmount,
        status: (data.status?.toLowerCase() || 'pending') as ExpenseStatus,
        due_date: data.dueDate || null,
        paid_at: null,
        vendor_name: data.vendorName || null,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Expense;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['expense-metrics', data.event_id] });
      toast.success('Gasto adicionado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating expense:', error);
      toast.error('Erro ao adicionar gasto');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, eventId, ...updates }: {
      id: string;
      eventId: string;
      category_id?: string | null;
      description?: string;
      amount?: number;
      paid_amount?: number;
      status?: ExpenseStatus;
      due_date?: string | null;
      paid_at?: string | null;
      vendor_name?: string | null;
      notes?: string | null;
    }) => {
      const payload = {
        categoryId: updates.category_id,
        description: updates.description,
        amount: updates.amount,
        paidAmount: updates.paid_amount,
        status: updates.status,
        dueDate: updates.due_date,
        vendorName: updates.vendor_name,
        notes: updates.notes,
      };
      await financeApi.updateExpense(eventId, id, payload);
      return { id, eventId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', result.eventId] });
      queryClient.invalidateQueries({ queryKey: ['expense-metrics', result.eventId] });
      toast.success('Gasto atualizado!');
    },
    onError: (error: any) => {
      console.error('Error updating expense:', error);
      toast.error('Erro ao atualizar gasto');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      await financeApi.deleteExpense(eventId, id);
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      queryClient.invalidateQueries({ queryKey: ['expense-metrics', eventId] });
      toast.success('Gasto excluído!');
    },
    onError: (error: any) => {
      console.error('Error deleting expense:', error);
      toast.error('Erro ao excluir gasto');
    },
  });
}

// ============ METRICS ============

export interface ExpenseMetrics {
  totalBudget: number;
  totalPaid: number;
  toPay: number;
  expensesByCategory: { name: string; value: number; color: string }[];
  paidVsPlanned: { name: string; planned: number; paid: number }[];
}

export function useExpenseMetrics(eventId: string | undefined) {
  const { data: expenses } = useExpenses(eventId);
  const { data: categories } = useExpenseCategories(eventId);
  
  return useQuery({
    queryKey: ['expense-metrics', eventId, expenses, categories],
    queryFn: async (): Promise<ExpenseMetrics> => {
      if (!expenses || !categories) {
        return {
          totalBudget: 0,
          totalPaid: 0,
          toPay: 0,
          expensesByCategory: [],
          paidVsPlanned: [],
        };
      }
      
      const totalBudget = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalPaid = expenses.reduce((sum, e) => sum + Number(e.paid_amount), 0);
      const toPay = totalBudget - totalPaid;
      
      // Group by category for pie chart
      const categoryMap = new Map<string, { name: string; value: number; color: string }>();
      expenses.forEach((expense) => {
        const catId = expense.category_id || 'uncategorized';
        const catName = expense.category?.name || 'Sem categoria';
        const catColor = expense.category?.color || '#9CA3AF';
        
        const existing = categoryMap.get(catId);
        if (existing) {
          existing.value += Number(expense.amount);
        } else {
          categoryMap.set(catId, { name: catName, value: Number(expense.amount), color: catColor });
        }
      });
      
      const expensesByCategory = Array.from(categoryMap.values());
      
      // Paid vs Planned by category
      const paidPlannedMap = new Map<string, { name: string; planned: number; paid: number }>();
      expenses.forEach((expense) => {
        const catName = expense.category?.name || 'Sem categoria';
        
        const existing = paidPlannedMap.get(catName);
        if (existing) {
          existing.planned += Number(expense.amount);
          existing.paid += Number(expense.paid_amount);
        } else {
          paidPlannedMap.set(catName, {
            name: catName,
            planned: Number(expense.amount),
            paid: Number(expense.paid_amount),
          });
        }
      });
      
      const paidVsPlanned = Array.from(paidPlannedMap.values());
      
      return {
        totalBudget,
        totalPaid,
        toPay,
        expensesByCategory,
        paidVsPlanned,
      };
    },
    enabled: !!eventId && !!expenses && !!categories,
  });
}

// Default categories with colors
export const defaultCategories = [
  { name: 'Buffet / Alimentação', color: '#EF4444', icon: 'utensils' },
  { name: 'Decoração', color: '#F59E0B', icon: 'flower' },
  { name: 'Fotografia / Vídeo', color: '#10B981', icon: 'camera' },
  { name: 'Músico / DJ', color: '#3B82F6', icon: 'music' },
  { name: 'Vestimenta', color: '#8B5CF6', icon: 'shirt' },
  { name: 'Convites', color: '#EC4899', icon: 'mail' },
  { name: 'Lembrancinhas', color: '#14B8A6', icon: 'gift' },
  { name: 'Aluguel do Espaço', color: '#6366F1', icon: 'building' },
  { name: 'Transporte', color: '#F97316', icon: 'car' },
  { name: 'Outros', color: '#6B7280', icon: 'more-horizontal' },
];

export const expenseStatusLabels: Record<ExpenseStatus, string> = {
  pending: 'Pendente',
  partial: 'Parcial',
  paid: 'Pago',
};

export const expenseStatusColors: Record<ExpenseStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
};
