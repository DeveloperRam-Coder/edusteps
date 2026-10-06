import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useNotification } from '../../../core/components/NotificationProvider';
import ConfirmDialog from '../../../core/components/ConfirmDialog';
import { getCoursesByClientIdApi, createCourseApi, updateCourseApi, deleteCourseApi, CourseRateType } from '../api/course';
import { EmptyState, Skeleton } from '@/components';
import { Edit, Search, Trash2 } from 'lucide-react';

export default function CoursesScreen() {
  const { businessDetails } = useAuth();
  const notification = useNotification();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });

  const [courseData, setCourseData] = useState({
    courseName: '',
    description: '',
    rate: 0,
    rateType: 'per_month' as CourseRateType,
    priorityNo: 1,
  });

  useEffect(() => {
    if (businessDetails?.client_id) fetchCourses();
  }, [businessDetails?.client_id]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getCoursesByClientIdApi(businessDetails?.client_id as string);
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      notification.toast('Failed to load courses', 'error');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCourseData({ courseName: '', description: '', rate: 0, rateType: 'per_month', priorityNo: 1 });
    setEditingCourse(null);
    setShowForm(false);
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setCourseData({
      courseName: course.course_name || course.courseName,
      description: course.description || '',
      rate: parseFloat(course.rate) || 0,
      rateType: course.rate_type || course.rateType || 'per_month',
      priorityNo: parseInt(course.priority_no || course.priorityNo) || 1,
    });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deleteCourseApi(deleteDialog.id);
      notification.toast('Course deleted successfully', 'success');
      fetchCourses();
    } catch {
      notification.toast('Error deleting course', 'error');
    } finally {
      setLoading(false);
      setDeleteDialog({ isOpen: false, id: '' });
    }
  };

  const validateForm = () =>
    courseData.courseName.length >= 2 && courseData.rate >= 0 && courseData.priorityNo >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      notification.toast('Please fill all required fields correctly', 'error');
      return;
    }
    setLoading(true);
    try {
      if (editingCourse) {
        const id = editingCourse.course_id || editingCourse.courseId;
        await updateCourseApi(id, {
          courseName: courseData.courseName,
          description: courseData.description,
          rate: courseData.rate,
          rateType: courseData.rateType,
          priorityNo: courseData.priorityNo,
        });
        notification.toast('Course updated successfully', 'success');
      } else {
        await createCourseApi({
          clientId: businessDetails?.client_id as string,
          courseName: courseData.courseName,
          description: courseData.description,
          rate: courseData.rate,
          rateType: courseData.rateType,
          priorityNo: courseData.priorityNo,
        });
        notification.toast('Course created successfully', 'success');
      }
      resetForm();
      fetchCourses();
    } catch (error: any) {
      notification.toast(error?.response?.data?.message || error?.message || 'Error saving course', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (course.course_name || course.courseName || '').toLowerCase().includes(term) ||
      (course.description || '').toLowerCase().includes(term)
    );
  });

  if (loading && !showForm && courses.length === 0) {
    return (
      <div className="content-sequence space-y-5 animate-in fade-in duration-500">
        <div className="saas-card p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-10 w-32 rounded-2xl" />
          </div>
          <div className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" variant="text" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: '' })}
      />
      <div className="content-sequence space-y-5 animate-in fade-in duration-500">
        <section className="saas-card relative overflow-hidden bg-card border-border/80 p-6 sm:p-8 shadow-sm hover-lift">
          <div className="absolute inset-0 pattern-grid opacity-[0.08] pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Curriculum operations</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">Course Management</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Create and assign subjects across your platform</p>
            </div>
            <button
              type="button"
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:opacity-90"
            >
              {showForm ? 'Back to list' : 'Add course'}
            </button>
          </div>
        </section>
      </div>
      {!showForm && (
        <div className="saas-card relative flex flex-wrap items-center gap-6 overflow-hidden border-border/80 bg-card px-5 py-3 shadow-sm">
          <div className="absolute inset-0 pattern-dots opacity-[0.03] pointer-events-none" />
          <span className="relative z-10 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Total active courses</span>
          <span className="relative z-10 text-3xl font-black leading-none text-purple-600 dark:text-purple-400">{courses.length}</span>
        </div>
      )}

      {showForm ? (
        <div className="surface-elevated rounded-2xl p-6 md:p-8 bg-card border border-border/60 relative overflow-hidden">
          <div className="absolute inset-0 pattern-dots opacity-[0.01] pointer-events-none" />
          <form onSubmit={handleSubmit} className="form-sequence relative z-10">
            <div className="form-sequence">
              <h2 className="mb-4 text-xl font-bold text-foreground border-b border-border/60 pb-2">
                {editingCourse ? 'Edit Course' : 'Create Course'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="field-label font-bold text-xs uppercase text-muted-foreground mb-1.5 block">Course Name *</label>
                  <input
                    type="text"
                    value={courseData.courseName}
                    onChange={(e) => setCourseData({ ...courseData, courseName: e.target.value })}
                    className="input-modern w-full rounded-xl bg-card/60"
                    placeholder="e.g. Advanced Mathematics"
                    required
                  />
                </div>
                <div>
                  <label className="field-label font-bold text-xs uppercase text-muted-foreground mb-1.5 block">Priority Number *</label>
                  <input
                    type="number"
                    min="1"
                    value={courseData.priorityNo}
                    onChange={(e) => setCourseData({ ...courseData, priorityNo: parseInt(e.target.value) || 1 })}
                    className="input-modern w-full rounded-xl bg-card/60"
                    required
                  />
                </div>
                <div>
                  <label className="field-label font-bold text-xs uppercase text-muted-foreground mb-1.5 block">Default Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={courseData.rate}
                    onChange={(e) => setCourseData({ ...courseData, rate: parseFloat(e.target.value) || 0 })}
                    className="input-modern w-full rounded-xl bg-card/60"
                    required
                  />
                </div>
                <div>
                  <label className="field-label font-bold text-xs uppercase text-muted-foreground mb-1.5 block">Rate Type *</label>
                  <select
                    value={courseData.rateType}
                    onChange={(e) => setCourseData({ ...courseData, rateType: e.target.value as CourseRateType })}
                    className="input-modern w-full rounded-xl bg-card/60"
                    required
                  >
                    <option value="per_hour">Per Hour</option>
                    <option value="per_session">Per Session</option>
                    <option value="per_course">Per Course</option>
                    <option value="per_month">Per Month</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="field-label font-bold text-xs uppercase text-muted-foreground mb-1.5 block">Description</label>
                <textarea
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/80 transition-all"
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-4 border-t border-border/60 pt-6 mt-6">
              <button
                type="submit"
                disabled={!validateForm() || loading}
                className="btn-modern flex-1 rounded-xl font-bold h-11 text-sm shadow-md"
              >
                {loading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-border bg-card/60 px-6 py-3 font-bold text-sm text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern w-full rounded-xl pl-10"
            />
          </div>
          {filteredCourses.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="No courses found"
                description={searchTerm ? 'Try adjusting your search' : 'Get started by creating your first course'}
                action={
                  !searchTerm ? (
                    <button onClick={() => setShowForm(true)} className="btn-modern rounded-xl px-6">
                      Create Course
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
              <div className="surface-elevated overflow-hidden rounded-2xl border border-border/60 bg-card min-w-[800px] relative">
                <div
                  className="hidden md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.75fr)_minmax(0,0.9fr)_minmax(0,4rem)_minmax(0,8rem)] md:items-center md:border-b md:border-border/60 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-slate-50/95 dark:bg-slate-900/95 md:px-4 md:py-3.5"
                  role="row"
                >
                  <span className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Course</span>
                  <span className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Rate</span>
                  <span className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</span>
                  <span className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority</span>
                  <span className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</span>
                </div>
                <div className="divide-y divide-border/60">
                  {filteredCourses.map((course) => {
                    const courseId = (course.course_id || course.courseId).toString();
                    const name = course.course_name || course.courseName;
                    const desc = (course.description || '').trim();
                    return (
                      <div
                        key={courseId}
                        className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.75fr)_minmax(0,0.9fr)_minmax(0,4rem)_minmax(0,8rem)] md:items-center md:gap-2 md:px-4 md:py-3.5 hover:bg-muted/15 transition-colors"
                        role="row"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-foreground text-sm" title={desc ? `${name} — ${desc}` : name}>
                              {name}
                            </p>
                            {desc ? <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">{desc}</p> : null}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-foreground md:text-left tabular-nums">
                          ₹{parseFloat(String(course.rate)).toFixed(2)}
                        </div>
                        <div className="text-xs font-semibold px-2 py-0.5 rounded bg-muted/50 w-max text-muted-foreground uppercase tracking-wide md:text-left">
                          {(course.rate_type || course.rateType).replace(/_/g, ' ')}
                        </div>
                        <div className="flex justify-start md:justify-center">
                          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {course.priority_no || course.priorityNo}
                          </span>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(course)}
                            className="rounded-lg h-9 w-9 p-0 flex items-center justify-center transition-all bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:scale-95 border border-blue-500/10"
                            aria-label="Edit course"
                          >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteDialog({ isOpen: true, id: courseId })}
                            className="rounded-lg h-9 w-9 p-0 flex items-center justify-center transition-all bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 active:scale-95 border border-rose-500/10"
                            aria-label="Delete course"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>);
};
