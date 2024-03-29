import Pagination from '@/app/dashboard/customers/components/pagination';
import Search from '@/app/components/search';
import Table from '@/app/dashboard/customers/components/table';
import { CreateCustomer } from '@/app/dashboard/customers/components/buttons';
import { CustomersTableSkeleton } from '@/app/components/skeletons';
import { Suspense } from 'react';
import { fetchCustomerPages } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Customers',
};

export default async function Page({
    searchParams,
}: {
    searchParams?: {
        query?: string;
        page?: string;
    };
}) {
    const query = searchParams?.query || '';
    const currentPage = Number(searchParams?.page) || 1;

    const totalPages = await fetchCustomerPages(query);
    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`text-2xl`}>Customers</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Search placeholder="Search customers..." />
                <CreateCustomer />
            </div>
            <Suspense key={query + currentPage} fallback={<CustomersTableSkeleton />}>
                <Table query={query} currentPage={currentPage} />
            </Suspense>
            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}