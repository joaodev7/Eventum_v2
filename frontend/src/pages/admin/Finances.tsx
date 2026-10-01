import { useState } from 'react';
import { useEvent } from '@/contexts/EventContext';
import { useGuests } from '@/hooks/useGuests';
import {
  useExpenses,
  useExpenseCategories,
  useExpenseMetrics,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  defaultCategories,
  expenseStatusLabels,
  expenseStatusColors,
} from '@/hooks/useExpenses';
import { Expense, ExpenseCategory, ExpenseStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FeatureGuard } from '@/components/common/FeatureGuard';

import { FeatureGuard } from '@/components/common/FeatureGuard';

export default function FinancesPage() {
  const { currentEvent } = useEvent();
  const eventId = currentEvent?.id;
  
  const { data: expenses, isLoading: isLoadingExpenses } = useExpenses(eventId);
  const { data: categories, isLoading: isLoadingCategories } = useExpenseCategories(eventId);
  const { data: metrics } = useExpenseMetrics(eventId);
  const { data: guests } = useGuests(eventId);
  
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const createCategory = useCreateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();
  
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ExpenseCategory | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    amount: '',
    paid_amount: '',
    status: 'pending' as ExpenseStatus,
    due_date: '',
    vendor_name: '',
    notes: '',
  });
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  
  const confirmedGuests = guests?.filter(g => g.status === 'accepted').reduce((sum, g) => sum + 1 + (g.companions || 0), 0) || 0;
  const costPerGuest = confirmedGuests > 0 && metrics ? metrics.totalBudget / confirmedGuests : 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const handleOpenExpenseDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category_id: expense.category_id || '',
        description: expense.description,
        amount: String(expense.amount),
        paid_amount: String(expense.paid_amount),
        status: expense.status,
        due_date: expense.due_date || '',
        vendor_name: expense.vendor_name || '',
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category_id: '',
        description: '',
        amount: '',
        paid_amount: '',
        status: 'pending',
        due_date: '',
        vendor_name: '',
        notes: '',
      });
    }
    setIsExpenseDialogOpen(true);
  };
  
  const handleSaveExpense = async () => {
    if (!eventId || !formData.description || !formData.amount) return;
    
    const expenseData = {
      event_id: eventId,
      category_id: formData.category_id || undefined,
      description: formData.description,
      amount: parseFloat(formData.amount),
      paid_amount: parseFloat(formData.paid_amount) || 0,
      status: formData.status,
      due_date: formData.due_date || undefined,
      vendor_name: formData.vendor_name || undefined,
      notes: formData.notes || undefined,
    };
    
    if (editingExpense) {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        eventId,
        ...expenseData,
      });
    } else {
      await createExpense.mutateAsync(expenseData);
    }
    
    setIsExpenseDialogOpen(false);
  };
  
  const handleDeleteExpense = async () => {
    if (!eventId || !deletingExpense) return;
    await deleteExpense.mutateAsync({ id: deletingExpense.id, eventId });
    setDeletingExpense(null);
  };
  
  const handleMarkAsPaid = async (expense: Expense) => {
    if (!eventId) return;
    await updateExpense.mutateAsync({
      id: expense.id,
      eventId,
      paid_amount: expense.amount,
      status: 'paid',
      paid_at: new Date().toISOString(),
    });
  };
  
  const handleCreateCategory = async () => {
    if (!eventId || !newCategoryName) return;
    await createCategory.mutateAsync({
      event_id: eventId,
      name: newCategoryName,
      color: newCategoryColor,
    });
    setNewCategoryName('');
    setNewCategoryColor('#6B7280');
  };
  
  const handleDeleteCategory = async () => {
    if (!eventId || !deletingCategory) return;
    await deleteCategory.mutateAsync({ id: deletingCategory.id, eventId });
    setDeletingCategory(null);
  };
  
  const handleAddDefaultCategories = async () => {
    if (!eventId) return;
    for (const cat of defaultCategories) {
      await createCategory.mutateAsync({
        event_id: eventId,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      });
    }
  };
  

  return (
    <FeatureGuard feature="relatorios_financeiros">
      {isLoadingExpenses || isLoadingCategories ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-serif">Finanças</h1>
              <p className="text-muted-foreground">Controle financeiro do evento</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                <Tag className="w-4 h-4 mr-2" />
                Categorias
              </Button>
              <Button onClick={() => handleOpenExpenseDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Gasto
              </Button>
            </div>
          </div>
          {/* ...resto da página... */}
        </div>
      )}
    </FeatureGuard>
  );
}
