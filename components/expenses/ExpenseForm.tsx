'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Calendar, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CATEGORIES, getTodayISO } from '@/lib/utils';
import { Expense, ExpenseFormData } from '@/lib/types';

const schema = z.object({
  amount: z
    .number({ message: 'Enter a valid amount' })
    .positive('Amount must be greater than 0')
    .max(1_000_000, 'Amount seems too large'),
  category: z.enum(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other']),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description too long'),
  date: z.string().min(1, 'Date is required'),
});

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel?: () => void;
  initialData?: Expense;
  isSubmitting?: boolean;
}

const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: c }));

export function ExpenseForm({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
}: ExpenseFormProps) {
  // Let TypeScript infer types from zodResolver to avoid version-skew issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      amount: initialData?.amount,
      category: initialData?.category ?? 'Food',
      description: initialData?.description ?? '',
      date: initialData?.date ?? getTodayISO(),
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        amount: initialData.amount,
        category: initialData.category,
        description: initialData.description,
        date: initialData.date,
      });
    }
  }, [initialData, reset]);

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values as ExpenseFormData))}
      className="p-6 flex flex-col gap-5"
    >
      {/* Amount */}
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        required
        leftIcon={<DollarSign size={14} />}
        error={errors.amount?.message as string | undefined}
        {...register('amount', { valueAsNumber: true })}
      />

      {/* Category */}
      <Select
        label="Category"
        required
        options={categoryOptions}
        error={errors.category?.message as string | undefined}
        {...register('category')}
      />

      {/* Description */}
      <Input
        label="Description"
        type="text"
        placeholder="What did you spend on?"
        required
        leftIcon={<FileText size={14} />}
        error={errors.description?.message as string | undefined}
        {...register('description')}
      />

      {/* Date */}
      <Input
        label="Date"
        type="date"
        required
        leftIcon={<Calendar size={14} />}
        error={errors.date?.message as string | undefined}
        {...register('date')}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="flex-1"
        >
          {initialData ? 'Save Changes' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
