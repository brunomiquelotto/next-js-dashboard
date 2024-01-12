import { fetchCustomerById } from '@/app/lib/data';
import Form from '@/app/dashboard/customers/components/edit-form';
import Breadcrumbs from '@/app/components/breadcrumbs';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Edit Customer',
};

export default async function Page({ params }: { params: { id: string } }) {
    const id = params.id;
    const customer = await fetchCustomerById(id);

    if (!customer) {
        notFound();
    }

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Customers', href: '/dashboard/customers' },
                    {
                        label: 'Edit Customer',
                        href: `/dashboard/customers/${params.id}/edit`,
                        active: true,
                    },
                ]}
            />
            <Form customer={customer} />
        </main>
    );
}