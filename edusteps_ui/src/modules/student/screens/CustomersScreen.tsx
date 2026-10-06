import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Eye, Mail, Phone, Plus, Search, Trash2, Users, X } from 'lucide-react';

import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import { EmptyState, Skeleton } from '@/components';
import { cn } from '@/lib/utils';
import {
  deleteCustomerApi,
  getCustomersByClientIdApi,
  updateCustomerApi,
} from '@/modules/auth/api/customer';
import { getCustomerDetailsByCustomerIdApi } from '@/modules/auth/api/customerDetails';
import ConfirmDialog from '@/core/components/ConfirmDialog';
import { CrudModal } from '@/components/CrudModal/CrudModal';

interface CustomerListItem {
  customer_id: string | number;
  client_id: string | number;
  first_name: string;
  last_name?: string | null;
  mobile: string;
  email?: string | null;
  address?: string | null;
  created_at?: string | null;
}

interface CustomerInsight {
  status: 'active' | 'inactive';
  courseCount: number;
  totalAmountSpent: number;
}

interface CustomerForm {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  address: string;
}

const pageSize = 10;

type SortOption =
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'
  | 'spent-desc'
  | 'spent-asc'
  | 'courses-desc'
  | 'courses-asc';

function getCustomerName(customer: CustomerListItem) {
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed customer';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getCustomerCity(customer: CustomerListItem) {
  const address = customer.address || '';
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || 'Unknown';
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  const glowClass =
    label.includes('Total') ? 'card-glow-blue' :
    label.includes('Visible') ? 'card-glow-purple' :
    'card-glow-amber';

  return (
    <div className={cn('saas-card hover-lift relative flex flex-col justify-between overflow-hidden border-border/80 bg-card p-4', glowClass)}>
      <div className="absolute inset-0 pattern-dots opacity-[0.03] pointer-events-none" />
      <p className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="relative z-10 mt-2 text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function CustomerStatusBadge({ status }: { status: 'active' | 'inactive' }) {
  const isActive = status === 'active';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        isActive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function CustomersScreen() {
  const navigate = useNavigate();
  const notification = useNotification();
  const { businessDetails } = useAuth();

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [customerInsights, setCustomerInsights] = useState<Record<string, CustomerInsight>>({});
  const insightCacheRef = useRef<Record<string, CustomerInsight>>({});
  const inflightInsightIds = useRef<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    address: '',
  });

  const clientId = businessDetails?.client_id;

  const loadCustomers = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const response = await getCustomersByClientIdApi(clientId);
      const customerList = Array.isArray(response.data) ? (response.data as CustomerListItem[]) : [];
      setCustomers(customerList);
      insightCacheRef.current = {};
      setCustomerInsights({});
    } catch (error: any) {
      notification.toast(error?.response?.data?.message || error?.message || 'Unable to load customers', 'error');
      setCustomers([]);
      setCustomerInsights({});
      insightCacheRef.current = {};
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [clientId]);

  useEffect(() => {
    setPage(1);
  }, [query, cityFilter, dateFilter, sortBy]);

  const uniqueCities = useMemo(() => {
    return Array.from(
      new Set(customers.map((customer) => getCustomerCity(customer)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const value = query.trim().toLowerCase();

    let result = [...customers];

    if (value) {
      result = result.filter((customer) => {
        const searchable = [
          customer.first_name,
          customer.last_name,
          customer.mobile,
          customer.email,
          customer.address,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(value);
      });
    }

    if (cityFilter !== 'all') {
      result = result.filter((customer) => getCustomerCity(customer) === cityFilter);
    }

    if (dateFilter) {
      result = result.filter((customer) => {
        if (!customer.created_at) return false;
        return customer.created_at.slice(0, 10) === dateFilter;
      });
    }

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
      case 'name-asc':
        result.sort((a, b) => getCustomerName(a).localeCompare(getCustomerName(b)));
        break;
      case 'name-desc':
        result.sort((a, b) => getCustomerName(b).localeCompare(getCustomerName(a)));
        break;
      case 'spent-desc':
        result.sort((a, b) => {
          const aSpent = customerInsights[String(a.customer_id)]?.totalAmountSpent || 0;
          const bSpent = customerInsights[String(b.customer_id)]?.totalAmountSpent || 0;
          return bSpent - aSpent;
        });
        break;
      case 'spent-asc':
        result.sort((a, b) => {
          const aSpent = customerInsights[String(a.customer_id)]?.totalAmountSpent || 0;
          const bSpent = customerInsights[String(b.customer_id)]?.totalAmountSpent || 0;
          return aSpent - bSpent;
        });
        break;
      case 'courses-desc':
        result.sort((a, b) => {
          const aCount = customerInsights[String(a.customer_id)]?.courseCount || 0;
          const bCount = customerInsights[String(b.customer_id)]?.courseCount || 0;
          return bCount - aCount;
        });
        break;
      case 'courses-asc':
        result.sort((a, b) => {
          const aCount = customerInsights[String(a.customer_id)]?.courseCount || 0;
          const bCount = customerInsights[String(b.customer_id)]?.courseCount || 0;
          return aCount - bCount;
        });
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
    }

    return result;
  }, [customers, query, cityFilter, dateFilter, sortBy, customerInsights]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    let isMounted = true;

    const loadVisibleInsights = async () => {
      if (loading || paginatedCustomers.length === 0) return;

      const pendingCustomers = paginatedCustomers.filter((customer) => {
        const id = String(customer.customer_id);
        return !insightCacheRef.current[id] && !inflightInsightIds.current.has(id);
      });

      if (pendingCustomers.length === 0) return;

      for (const customer of pendingCustomers) {
        const customerId = String(customer.customer_id);
        inflightInsightIds.current.add(customerId);

        try {
          const detailsResponse = await getCustomerDetailsByCustomerIdApi(customer.customer_id);
          const detailData = detailsResponse?.data;
          const detailList = Array.isArray(detailData)
            ? detailData
            : Array.isArray((detailData as any)?.data)
              ? (detailData as any).data
              : [];
          const totalAmountSpent = detailList.reduce(
            (sum: number, detail: any) => sum + Number(detail?.amount || 0),
            0
          );
          const courseCount = detailList.length;
          const status: CustomerInsight['status'] = detailList.some(
            (detail: any) => detail?.is_active !== false
          )
            ? 'active'
            : 'inactive';
          const insight: CustomerInsight = { status, courseCount, totalAmountSpent };

          if (!isMounted) return;
          insightCacheRef.current[customerId] = insight;
          setCustomerInsights((current) => ({ ...current, [customerId]: insight }));
        } catch {
          const fallback: CustomerInsight = { status: 'inactive', courseCount: 0, totalAmountSpent: 0 };
          if (!isMounted) return;
          insightCacheRef.current[customerId] = fallback;
          setCustomerInsights((current) => ({ ...current, [customerId]: fallback }));
        } finally {
          inflightInsightIds.current.delete(customerId);
        }

        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    };

    loadVisibleInsights();

    return () => {
      isMounted = false;
    };
  }, [loading, paginatedCustomers]);

  const lastRegistered = useMemo(() => {
    const sorted = [...customers].sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return formatDate(sorted[0]?.created_at);
  }, [customers]);

  const hasActiveFilters = query.trim().length > 0 || cityFilter !== 'all' || !!dateFilter || sortBy !== 'newest';

  const openEditModal = (customer: CustomerListItem) => {
    setEditingCustomer(customer);
    setForm({
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      mobile: customer.mobile || '',
      email: customer.email || '',
      address: customer.address || '',
    });
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setForm({ firstName: '', lastName: '', mobile: '', email: '', address: '' });
  };

  const saveCustomer = async () => {
    if (!editingCustomer) return;
    if (!form.firstName.trim() || !form.mobile.trim()) {
      notification.toast('Name and mobile are required', 'error');
      return;
    }

    try {
      setSaving(true);
      await updateCustomerApi(editingCustomer.customer_id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });

      setCustomers((current) =>
        current.map((customer) =>
          String(customer.customer_id) === String(editingCustomer.customer_id)
            ? {
                ...customer,
                first_name: form.firstName.trim(),
                last_name: form.lastName.trim(),
                mobile: form.mobile.trim(),
                email: form.email.trim(),
                address: form.address.trim(),
              }
            : customer
        )
      );
      notification.toast('Customer updated', 'success');
      closeEditModal();
    } catch (error: any) {
      notification.toast(error?.response?.data?.message || error?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setSaving(true);
      await deleteCustomerApi(deleteId);
      setCustomers((current) => current.filter((customer) => String(customer.customer_id) !== deleteId));
      notification.toast('Customer deleted', 'success');
      setDeleteId(null);
    } catch (error: any) {
      notification.toast(error?.response?.data?.message || error?.message || 'Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    if (filteredCustomers.length === 0) return;

    const headers = ['Customer ID', 'Name', 'Mobile', 'Email', 'Address', 'Registered', 'Status', 'Courses', 'Spent'];
    const rows = filteredCustomers.map((customer) => {
      const insight = customerInsights[String(customer.customer_id)] || { status: 'inactive', courseCount: 0, totalAmountSpent: 0 };
      return [
        customer.customer_id,
        getCustomerName(customer),
        customer.mobile || '',
        customer.email || '',
        customer.address || '',
        customer.created_at || '',
        insight.status,
        insight.courseCount,
        insight.totalAmountSpent,
      ];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete customer"
        message="This will remove the customer and linked records. This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="content-sequence space-y-5 animate-in fade-in duration-500">
        <section className="saas-card p-6 sm:p-8 relative overflow-hidden bg-card border-border/80 shadow-sm hover-lift">
          <div className="absolute inset-0 pattern-grid opacity-[0.08] pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Customers & Students</h1>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
                Start with a customer, then manage student enrollments from their profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportCsv}
                disabled={filteredCustomers.length === 0}
                className="rounded-xl border border-border bg-card/60 px-4 h-10 text-sm font-semibold text-foreground transition-all hover:bg-accent hover:border-border/80 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => navigate('/add-customer')}
                className="btn-modern gap-2 rounded-xl h-10 px-4 font-bold text-sm tracking-wide shadow-sm shadow-primary/10 hover:shadow-primary/20"
              >
                <Plus className="h-4.5 w-4.5" aria-hidden="true" />
                Add Customer
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Total Customers" value={customers.length} />
            <StatTile label="Visible Results" value={filteredCustomers.length} />
            <StatTile label="Last Registered" value={lastRegistered} />
          </div>

          <div className="saas-card p-5 bg-card border-border/80 relative overflow-hidden">
            <div className="absolute inset-0 pattern-dots opacity-[0.02] pointer-events-none" />
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label htmlFor="customer-search" className="sr-only">
                  Search customers
                </label>
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="customer-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, mobile, email, or address"
                    className="input-modern h-11 w-full rounded-lg pl-10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCityFilter('all');
                    setDateFilter('');
                    setSortBy('newest');
                  }}
                  disabled={!hasActiveFilters}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">City</span>
                  <select
                    value={cityFilter}
                    onChange={(event) => setCityFilter(event.target.value)}
                    className="input-modern h-11 rounded-lg"
                    aria-label="Filter by city"
                  >
                    <option value="all">All cities</option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Registration date</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className="input-modern h-11 rounded-lg"
                    aria-label="Filter by registration date"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    className="input-modern h-11 rounded-lg"
                    aria-label="Sort customers"
                  >
                    <option value="newest">Newest to Oldest</option>
                    <option value="oldest">Oldest to Newest</option>
                    <option value="name-asc">Name (A–Z)</option>
                    <option value="name-desc">Name (Z–A)</option>
                    <option value="spent-desc">Spent (High to Low)</option>
                    <option value="spent-asc">Spent (Low to High)</option>
                    <option value="courses-desc">Courses (High to Low)</option>
                    <option value="courses-asc">Courses (Low to High)</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="saas-card">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={`customer-skeleton-${index}`} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : paginatedCustomers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title={query || cityFilter !== 'all' || dateFilter ? 'No matching customers' : 'No customers yet'}
                description={
                  query || cityFilter !== 'all' || dateFilter
                    ? 'Try different search terms or clear the applied filters.'
                    : 'Add a customer to create student enrollments.'
                }
                action={
                  !query && cityFilter === 'all' && !dateFilter ? (
                    <button type="button" onClick={() => navigate('/add-customer')} className="btn-modern rounded-lg">
                      Add First Customer
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin md:block">
                <table className="table-compact relative">
                  <thead className="sticky top-0 z-20 shadow-sm backdrop-blur-md">
                    <tr className="border-b border-border/70 bg-slate-50/95 dark:bg-slate-900/95">
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Customer</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Contact</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Status</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Insights</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Registered</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((customer) => {
                      const insight = customerInsights[String(customer.customer_id)] || {
                        status: 'inactive' as const,
                        courseCount: 0,
                        totalAmountSpent: 0,
                      };

                      return (
                        <tr key={customer.customer_id} className="transition-colors hover:bg-muted/25">
                          <td className="px-5 py-4">
                            <p className="font-medium text-foreground">{getCustomerName(customer)}</p>
                            {customer.address ? <p className="text-xs text-muted-foreground">{customer.address}</p> : null}
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-1 text-sm">
                              <p className="flex items-center gap-2 text-foreground">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                                {customer.mobile || '-'}
                              </p>
                              <p className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                                {customer.email || '-'}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <CustomerStatusBadge status={insight.status} />
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="font-semibold text-foreground">
                                {insight.courseCount} course{insight.courseCount === 1 ? '' : 's'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{formatCurrency(insight.totalAmountSpent)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">{formatDate(customer.created_at)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => navigate(`/customers/${customer.customer_id}`)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-primary transition-colors hover:bg-accent"
                                title="Open profile"
                                aria-label={`View ${getCustomerName(customer)}`}
                              >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(customer)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                title="Edit customer"
                                aria-label={`Edit ${getCustomerName(customer)}`}
                              >
                                <Edit className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(String(customer.customer_id))}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                                title="Delete customer"
                                aria-label={`Delete ${getCustomerName(customer)}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border/50 md:hidden">
                {paginatedCustomers.map((customer) => {
                  const insight = customerInsights[String(customer.customer_id)] || {
                    status: 'inactive' as const,
                    courseCount: 0,
                    totalAmountSpent: 0,
                  };

                  return (
                    <article key={customer.customer_id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{getCustomerName(customer)}</p>
                          <p className="text-xs text-muted-foreground">Registered {formatDate(customer.created_at)}</p>
                        </div>
                        <CustomerStatusBadge status={insight.status} />
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{customer.mobile || '-'}</p>
                        <p>{customer.email || '-'}</p>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Insights</span>
                        <span className="text-sm font-medium text-foreground">
                          {insight.courseCount} course{insight.courseCount === 1 ? '' : 's'} · {formatCurrency(insight.totalAmountSpent)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/customers/${customer.customer_id}`)}
                          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-primary"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(customer)}
                          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(String(customer.customer_id))}
                          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredCustomers.length > pageSize ? (
                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * pageSize + 1, filteredCustomers.length)}-
                    {Math.min(page * pageSize, filteredCustomers.length)} of {filteredCustomers.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      className={cn('rounded-lg border border-border px-3 py-2 text-sm font-medium', page <= 1 && 'opacity-50')}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      className={cn('rounded-lg border border-border px-3 py-2 text-sm font-medium', page >= totalPages && 'opacity-50')}
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <CrudModal
        isOpen={!!editingCustomer}
        title={editingCustomer ? `Edit ${getCustomerName(editingCustomer)}` : 'Edit customer'}
        description="Update basic customer contact details."
        type="update"
        loading={saving}
        onConfirm={saveCustomer}
        onCancel={closeEditModal}
        confirmText="Save"
        cancelText="Cancel"
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">First name</span>
              <input className="input-modern rounded-lg" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Last name</span>
              <input className="input-modern rounded-lg" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Mobile</span>
            <input className="input-modern rounded-lg" value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input className="input-modern rounded-lg" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Address</span>
            <input className="input-modern rounded-lg" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
          </label>
        </div>
      </CrudModal>
    </>
  );
}
