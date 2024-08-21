import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formOneSchema = z.object({
    upfront: z.literal(100),
});

type FormOneValues = z.infer<typeof formOneSchema>;

const FullPayment: React.FC = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormOneValues>({
        resolver: zodResolver(formOneSchema),
        defaultValues: {
            upfront: 100,
        },
    });

    const onSubmit = async (data: FormOneValues) => {
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
                            checks: null,
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
                <input id="upfront" type="number" {...register('upfront')} readOnly />
                {errors.upfront && <p>{errors.upfront.message}</p>}
            </div>
            <button type="submit">Create Transaction</button>
        </form>
    );
};

export default FullPayment;
