'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const InvoiceFormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], { invalid_type_error: 'Please select an invoice status.', }),
    date: z.string(),
});

const CustomerFormSchema = z.object({
    id: z.string(),
    name: z.string().min(5, { message: 'Please use a valid name.' }),
    email: z.string().email({ message: 'Please use a valid email.' }),
    imageUrl: z.string().min(5, { message: 'Please use a valid image url.' }),
});


const CreateInvoice = InvoiceFormSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceFormSchema.omit({ id: true, date: true });

const CreateCustomer = CustomerFormSchema.omit({ id: true, date: true });
const UpdateCustomer = CustomerFormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function createCustomer(prevState: State, formData: FormData) {
    const validatedFields = CreateCustomer.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        imageUrl: formData.get('image_url')
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create customer.',
        };
    }
    const { name, email, imageUrl } = validatedFields.data;

    try {
        await sql`
          INSERT INTO customers (name, email, image_url)
          VALUES (${name}, ${email}, ${imageUrl})
        `;
    } catch (error) {
        console.log(error);
        return {
            message: 'Database Error: Failed to Create Customer.',
        };
    }

    revalidatePath('/dashboard/customers');
    redirect('/dashboard/customers');
}


export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
          `;
    } catch (error) {
        return { message: 'Database Error: Failed to Update Invoice.' };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateCustomer(id: string, currentState: any, formData: FormData) {
    console.log({ id, formData });
    const validatedFields = UpdateCustomer.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        imageUrl: formData.get('image_url')
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create customer.',
        };
    }
    const { name, email, imageUrl } = validatedFields.data

    try {
        await sql`
            UPDATE customers
            SET name = ${name}, email = ${email}, image_url = ${imageUrl}
            WHERE id = ${id}
          `;
    } catch (error) {
        return { message: 'Database Error: Failed to Update Customer.' };
    }

    revalidatePath('/dashboard/customers');
    redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
    try {
        await sql`DELETE FROM customers WHERE id = ${id}`;
        revalidatePath('/dashboard/customers');
        return { message: 'Deleted Customer.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Customer.' };
    }
}

export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: 'Deleted Invoice.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Invoice.' };
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}