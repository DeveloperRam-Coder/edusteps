import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarRange, IndianRupee, TrendingUp, Users } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components';
import { formatCurrency } from '@/lib/utils';
import { getCourseAnalyticsApi, type CourseAnalytics } from '../api/course';
import { useNotification } from '@/core/components/NotificationProvider';

export default function CourseAnalyticsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notification = useNotification();
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/courses');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await getCourseAnalyticsApi(id);
        setAnalytics(response.data);
      } catch (error: any) {
        notification.toast(
          error?.response?.data?.message || error?.message || 'Failed to load course analytics',
          'error',
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, navigate, notification]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <EmptyState
          title="Course analytics not found"
          description="The selected course could not be loaded."
          action={
            <button onClick={() => navigate('/courses')} className="btn-modern rounded-xl px-6">
              Back to Courses
            </button>
          }
        />
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Active Students',
      value: analytics.metrics.active_students,
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.metrics.course_revenue),
      icon: <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      title: 'Attendance Rate',
      value: `${analytics.metrics.attendance_rate}%`,
      icon: <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
    },
    {
      title: 'Batch Sessions',
      value: analytics.metrics.total_sessions,
      icon: <CalendarRange className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
  ];

  return (
    <div className="content-sequence space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {analytics.course.course_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {analytics.course.description || 'Live course analytics for students, revenue, and batch activity.'}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Base Fee</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(analytics.course.rate)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metricCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.title}</p>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Linked Students</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {analytics.students.length} records
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {analytics.students.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No students are currently linked to this course.</p>
            ) : (
              analytics.students.map((student) => (
                <button
                  key={student.cd_id}
                  type="button"
                  onClick={() => navigate(`/customers/${student.customer_id}`)}
                  className="w-full rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{student.student_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Parent: {student.parent_name}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        student.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>Fee: {formatCurrency(student.amount)}</span>
                    <span>Paid: {formatCurrency(student.total_paid)}</span>
                    <span>Due: {formatCurrency(student.balance_due)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
