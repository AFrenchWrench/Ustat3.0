import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formTwoSchema = z.object({
  upfront: z.enum(['30', '40', '50', '60']),
  checks: z.enum(['2', '8']),
});

type FormTwoValues = z.infer<typeof formTwoSchema>;

const Installment: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormTwoValues>({
    resolver: zodResolver(formTwoSchema),
  });

  const onSubmit = async (data: FormTwoValues) => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CreateTransaction($input: CreateTransactionInput!) {
              createTransaction(input: $input) {
                errors
                success
              }
            }
          `,
          variables: {
            input: {
              order: null,
              upfront: data.upfront,
              checks: data.checks,
            },
          },
        }),
      });

      const result = await response.json();

      if (result.data.createTransaction.success) {
        alert('Transaction created successfully!');
      } else {
        alert('Transaction failed to create.');
        console.log(result.data.createTransaction.errors);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="upfront">Upfront</label>
        <select id="upfront" {...register('upfront')}>
          <option value="30">30</option>
          <option value="40">40</option>
          <option value="50">50</option>
          <option value="60">60</option>
        </select>
        {errors.upfront && <p>{errors.upfront.message}</p>}
      </div>
      <div>
        <label htmlFor="checks">Checks</label>
        <select id="checks" {...register('checks')}>
          <option value="2">2</option>
          <option value="8">8</option>
        </select>
        {errors.checks && <p>{errors.checks.message}</p>}
      </div>
      <button type="submit">Create Transaction</button>
    </form>
  );
};

export default Installment;
