import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import { useAttendance } from '@/contexts/AttendanceContext';
import { getAttendanceApi, markAttendanceApi, type AttendanceRecord } from '../api/attendance';
import { getCustomersByClientIdApi } from '@/modules/auth/api/customer';
import {
  Calendar,
  CheckCircle,
  CheckCheck,
  ClipboardCheck,
  Clock,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { Skeleton } from '@/components';
import { cn } from '@/lib/utils';

type AttendanceStatus = AttendanceRecord['status'];

type AttendanceFilter = 'all' | AttendanceStatus | 'unmarked';

interface HistoryItem {
  customerId: number;
  previousStatus: AttendanceStatus | null;
  nextStatus: AttendanceStatus;
}

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late'];

const getTodayDate = () => new Date().toISOString().split('T')[0];

const formatDateForInput = (value: Date) => value.toISOString().split('T')[0];

const getStatusLabel = (status?: AttendanceStatus | null) => {
  if (status === 'present') return 'Present';
  if (status === 'absent') return 'Absent';
  if (status === 'late') return 'Late';
  return 'Unmarked';
};

const getStatusClasses = (status?: AttendanceStatus | null) => {
  if (status === 'present') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  }
  if (status === 'absent') {
    return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
  }
  if (status === 'late') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};

export default function AttendanceScreen() {
  const { businessDetails } = useAuth();
  const notification = useNotification();
  const { updateStats } = useAttendance();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marking, setMarking] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [timingFilter, setTimingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<AttendanceFilter>('all');
  const [pendingChanges, setPendingChanges] = useState<Record<number, AttendanceStatus>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadError, setLoadError] = useState('');

  const fetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const today = useMemo(() => getTodayDate(), []);

  const fetchData = useCallback(async () => {
    if (!businessDetails?.client_id || fetchingRef.current) return;

    fetchingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setLoadError('');

      const clientId = Number(businessDetails.client_id);
      const [customersRes, attendanceData] = await Promise.all([
        getCustomersByClientIdApi(businessDetails.client_id),
        getAttendanceApi(clientId, selectedDate),
      ]);

      const customerData = Array.isArray(customersRes.data) ? customersRes.data : [];
      const records: AttendanceRecord[] = Array.isArray(attendanceData) ? attendanceData : [];

      setCustomers(customerData);
      setAttendance(records);
      setPendingChanges({});
      setHistory([]);

      const presentCount = records.filter((item) => item.status === 'present').length;
      const absentCount = records.filter((item) => item.status === 'absent').length;
      const lateCount = records.filter((item) => item.status === 'late').length;
      const totalRecords = records.length;
      const attendanceRate = totalRecords > 0
        ? Math.round(((presentCount + lateCount) / totalRecords) * 10000) / 100
        : 0;

      updateStats({
        total_records: totalRecords,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        excused_count: records.filter((item) => item.status === 'excused').length,
        attendance_rate: attendanceRate,
      });
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.name === 'CanceledError') return;
      if (error?.response?.status !== 429) {
        setLoadError('Unable to load attendance records for this date.');
        notification?.toast('Failed to load attendance data', 'error');
      }
      setCustomers([]);
      setAttendance([]);
      setPendingChanges({});
      setHistory([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [businessDetails?.client_id, notification, selectedDate, updateStats]);

  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  useEffect(() => {
    if (businessDetails?.client_id) {
      fetchData();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [businessDetails?.client_id, fetchData]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const getBaseStatus = (customerId: number) =>
    attendance.find((item) => item.customer_id === customerId)?.status ?? null;

  const getEffectiveStatus = (customerId: number): AttendanceStatus | null => {
    const pending = pendingChanges[customerId];
    if (pending) return pending;
    return getBaseStatus(customerId);
  };

  const getCustomerField = (customer: any, keys: string[]) => {
    for (const key of keys) {
      const value = customer?.[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };

  const handleSelectStatus = (customerId: number, status: AttendanceStatus) => {
    const baseStatus = getBaseStatus(customerId);
    const currentStatus = pendingChanges[customerId] ?? baseStatus;

    if (currentStatus === status) return;

    setPendingChanges((prev) => {
      const next = { ...prev };
      if (status === baseStatus) {
        delete next[customerId];
      } else {
        next[customerId] = status;
      }
      return next;
    });

    setHistory((prev) => [
      ...prev.slice(-9),
      {
        customerId,
        previousStatus: currentStatus ?? null,
        nextStatus: status,
      },
    ]);
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    const nextChanges = { ...pendingChanges };
    filteredCustomers.forEach((customer) => {
      const baseStatus = getBaseStatus(customer.customer_id);
      if (baseStatus !== status) {
        nextChanges[customer.customer_id] = status;
      } else {
        delete nextChanges[customer.customer_id];
      }
    });
    setPendingChanges(nextChanges);
    setHistory((prev) => [
      ...prev.slice(-9),
      {
        customerId: filteredCustomers[0]?.customer_id ?? 0,
        previousStatus: null,
        nextStatus: status,
      },
    ]);
  };

  const clearAllSelections = () => {
    setPendingChanges({});
    setHistory([]);
  };

  const undoLastAction = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setPendingChanges((current) => {
        const next = { ...current };
        if (last.previousStatus === null) {
          delete next[last.customerId];
        } else {
          next[last.customerId] = last.previousStatus;
        }
        return next;
      });
      return prev.slice(0, -1);
    });
  };

  const saveAttendance = async () => {
    if (!businessDetails?.client_id || !Object.keys(pendingChanges).length) return;

    try {
      setSaving(true);
      const clientId = Number(businessDetails.client_id);
      const results = await Promise.all(
        Object.entries(pendingChanges).map(([customerId, status]) =>
          markAttendanceApi({
            customer_id: Number(customerId),
            client_id: clientId,
            date: selectedDate,
            status,
          })
        )
      );

      // Update local state: update existing records and add new ones
      setAttendance((prev) => {
        const updated = prev.map((record) => {
          const updatedStatus = pendingChanges[record.customer_id];
          return updatedStatus ? { ...record, status: updatedStatus } : record;
        });
        const existingCustomerIds = new Set(prev.map((r) => r.customer_id));
        const newRecords = results.filter(
          (r) => r && !existingCustomerIds.has(r.customer_id)
        ) as AttendanceRecord[];
        return [...updated, ...newRecords];
      });
      setPendingChanges({});
      setHistory([]);
      notification?.toast('Attendance saved successfully', 'success');
    } catch (error: any) {
      notification?.toast(
        error?.response?.data?.message || error?.message || 'Failed to save attendance',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return customers.filter((customer) => {
      const searchFields = [
        customer.first_name,
        customer.last_name,
        customer.email,
        customer.email_address,
        customer.mobile,
        customer.roll_number,
        customer.rollNo,
        getCustomerField(customer, ['batch_name', 'batchName', 'batch', 'class_batch']),
        getCustomerField(customer, ['course_name', 'courseName', 'course']),
        getCustomerField(customer, ['batch_timing', 'class_timing', 'timing', 'schedule']),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (term && !searchFields.includes(term)) {
        const matches = searchFields.split(' ').some((piece) => piece.startsWith(term));
        if (!matches && !searchFields.includes(term)) return false;
      }

      const batchValue = getCustomerField(customer, ['batch_name', 'batchName', 'batch', 'class_batch']);
      const courseValue = getCustomerField(customer, ['course_name', 'courseName', 'course']);
      const timingValue = getCustomerField(customer, ['batch_timing', 'class_timing', 'timing', 'schedule']);
      const statusValue = getEffectiveStatus(customer.customer_id);

      if (batchFilter !== 'all' && batchValue !== batchFilter) return false;
      if (courseFilter !== 'all' && courseValue !== courseFilter) return false;
      if (timingFilter !== 'all' && timingValue !== timingFilter) return false;
      if (statusFilter !== 'all' && statusFilter !== 'unmarked' && statusValue !== statusFilter) return false;
      if (statusFilter === 'unmarked' && statusValue) return false;

      return true;
    });
  }, [batchFilter, courseFilter, customers, searchTerm, statusFilter, timingFilter, getEffectiveStatus]);

  const batchOptions = useMemo(
    () =>
      Array.from(
        new Set(
          customers
            .map((customer) => getCustomerField(customer, ['batch_name', 'batchName', 'batch', 'class_batch']))
            .filter(Boolean)
        )
      ).sort(),
    [customers]
  );

  const courseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          customers
            .map((customer) => getCustomerField(customer, ['course_name', 'courseName', 'course']))
            .filter(Boolean)
        )
      ).sort(),
    [customers]
  );

  const timingOptions = useMemo(
    () =>
      Array.from(
        new Set(
          customers
            .map((customer) => getCustomerField(customer, ['batch_timing', 'class_timing', 'timing', 'schedule']))
            .filter(Boolean)
        )
      ).sort(),
    [customers]
  );

  const presentCount = customers.reduce(
    (sum, customer) => sum + (getEffectiveStatus(customer.customer_id) === 'present' ? 1 : 0),
    0
  );
  const absentCount = customers.reduce(
    (sum, customer) => sum + (getEffectiveStatus(customer.customer_id) === 'absent' ? 1 : 0),
    0
  );
  const lateCount = customers.reduce(
    (sum, customer) => sum + (getEffectiveStatus(customer.customer_id) === 'late' ? 1 : 0),
    0
  );
  const unmarkedCount = customers.length - presentCount - absentCount - lateCount;

  if (loading) {
    return (
      <div className="content-sequence space-y-5 animate-in fade-in duration-500">
        <div className="saas-card p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-16 w-full mb-3 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="content-sequence space-y-5 animate-in fade-in duration-500">
      <div className="saas-card relative overflow-hidden border-border/80 bg-card p-4 sm:p-6 shadow-sm hover-lift">
        <div className="absolute inset-0 pattern-grid opacity-[0.08] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Daily operations</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Attendance Tracker</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Mark and track daily student attendance</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                max={today}
                className="bg-transparent text-sm focus:outline-none"
                aria-label="Select attendance date"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(formatDateForInput(yesterday));
                }}
                className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  const last7Days = new Date();
                  last7Days.setDate(last7Days.getDate() - 6);
                  setSelectedDate(formatDateForInput(last7Days));
                }}
                className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                Last 7 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="saas-card p-4">
          <p className="text-sm text-muted-foreground">Total Students</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{customers.length}</p>
        </div>
        <div className="saas-card p-4">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">Present</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900 dark:text-emerald-300">{presentCount}</p>
        </div>
        <div className="saas-card p-4">
          <p className="text-sm text-red-700 dark:text-red-400">Absent</p>
          <p className="mt-2 text-3xl font-semibold text-red-900 dark:text-red-300">{absentCount}</p>
        </div>
        <div className="saas-card p-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">Late</p>
          <p className="mt-2 text-3xl font-semibold text-amber-900 dark:text-amber-300">{lateCount}</p>
        </div>
        <div className="saas-card p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">Unmarked</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{unmarkedCount}</p>
        </div>
      </div>

      <div className="saas-card p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, roll number, or phone"
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none ring-0 focus:border-primary"
              aria-label="Search students"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBulkMark('present')}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleBulkMark('absent')}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <XCircle className="h-4 w-4" />
              Mark All Absent
            </button>
            <button
              type="button"
              onClick={() => clearAllSelections()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              Clear All
            </button>
            <button
              type="button"
              onClick={() => undoLastAction()}
              disabled={history.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Undo Last
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Batch</span>
            <select
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="all">All batches</option>
              {batchOptions.map((batch) => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Course</span>
            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="all">All courses</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Class timing</span>
            <select
              value={timingFilter}
              onChange={(event) => setTimingFilter(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="all">All timings</option>
              {timingOptions.map((timing) => (
                <option key={timing} value={timing}>{timing}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AttendanceFilter)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="unmarked">Unmarked</option>
            </select>
          </label>
        </div>
      </div>

      <div className="saas-card">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {filteredCustomers.length} Student{filteredCustomers.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <button
            type="button"
            onClick={saveAttendance}
            disabled={!hasUnsavedChanges || saving}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>

        {loadError ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">Unable to load attendance</p>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
            <table className="table-compact relative min-w-[800px]">
              <thead className="sticky top-0 z-20 shadow-sm backdrop-blur-md">
                <tr className="border-b border-border/70 bg-slate-50/95 dark:bg-slate-900/95">
                  <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Student</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hidden xl:table-cell">Roll / Course</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Status</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredCustomers.map((customer) => {
                  const status = getEffectiveStatus(customer.customer_id);
                  const isMarking = marking === customer.customer_id;
                  const rollNumber = customer.roll_number || customer.rollNo || '-';
                  const courseName = getCustomerField(customer, ['course_name', 'courseName', 'course']) || 'General';
                  const batchName = getCustomerField(customer, ['batch_name', 'batchName', 'batch', 'class_batch']) || '—';

                  return (
                    <tr key={customer.customer_id} className="transition-colors duration-150 hover:bg-muted/20">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-foreground">
                          {customer.first_name} {customer.last_name || ''}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{customer.mobile || 'N/A'}</p>
                      </td>
                      <td className="hidden px-3 py-2.5 xl:table-cell">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Roll: {rollNumber}</p>
                          <p>{courseName} · {batchName}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide', getStatusClasses(status))}>
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-2">
                          {STATUS_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setMarking(customer.customer_id);
                                handleSelectStatus(customer.customer_id, option);
                                setTimeout(() => setMarking(null), 150);
                              }}
                              disabled={isMarking}
                              className={cn(
                                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                                status === option
                                  ? option === 'present'
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : option === 'absent'
                                      ? 'border-red-600 bg-red-600 text-white'
                                      : 'border-amber-600 bg-amber-600 text-white'
                                  : option === 'present'
                                    ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300'
                                    : option === 'absent'
                                      ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300'
                                      : 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300'
                              )}
                            >
                              {option === 'present' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : option === 'absent' ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                              <span className="capitalize">{option}</span>
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium text-foreground">
              {searchTerm || batchFilter !== 'all' || courseFilter !== 'all' || timingFilter !== 'all' || statusFilter !== 'all'
                ? 'No students found'
                : 'No attendance records available'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || batchFilter !== 'all' || courseFilter !== 'all' || timingFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Select a date to load the attendance list.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
