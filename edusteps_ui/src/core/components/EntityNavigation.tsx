// Navigation utilities for connecting related entities
import { useNavigate } from 'react-router-dom';
import { LuExternalLink, LuUsers, LuBookOpen } from 'react-icons/lu';

export interface EntityNavigationProps {
  customerId?: string | number;
  courseId?: string | number;
  enrollmentId?: string | number;
}

export const useEntityNavigation = () => {
  const navigate = useNavigate();

  const navigateToCustomer = (customerId: string | number) => {
    navigate(`/customers/${customerId}`);
  };

  const navigateToCourse = (courseId: string | number) => {
    navigate(`/courses?highlight=${courseId}`);
  };

  const navigateToEnrollments = (filters?: { courseId?: string | number }) => {
    const params = new URLSearchParams();
    if (filters?.courseId) params.set('course', String(filters.courseId));
    navigate(`/enrollments${params.toString() ? '?' + params.toString() : ''}`);
  };

  return {
    navigateToCustomer,
    navigateToCourse,
    navigateToEnrollments
  };
};

// Quick navigation buttons component
export const EntityNavigationButtons: React.FC<{
  customerId?: string | number;
  courseId?: string | number;
  showLabels?: boolean;
}> = ({ customerId, courseId, showLabels = false }) => {
  const { navigateToCustomer, navigateToCourse, navigateToEnrollments } = useEntityNavigation();

  return (
    <div className="flex items-center gap-2">
      {customerId && (
        <button
          onClick={() => navigateToCustomer(customerId)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          title="View Customer"
        >
          <LuUsers className="w-3 h-3" />
          {showLabels && 'Customer'}
        </button>
      )}

      {courseId && (
        <button
          onClick={() => navigateToCourse(courseId)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          title="View Course"
        >
          <LuBookOpen className="w-3 h-3" />
          {showLabels && 'Course'}
        </button>
      )}

      {courseId && (
        <button
          onClick={() => navigateToEnrollments({ courseId })}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
          title="View Enrollments"
        >
          <LuExternalLink className="w-3 h-3" />
          {showLabels && 'Enrollments'}
        </button>
      )}
    </div>
  );
};

// Breadcrumb component for entity relationships
export const EntityBreadcrumb: React.FC<{
  customer?: { id: string | number; name: string };
  course?: { id: string | number; name: string };
  current?: string;
}> = ({ customer, course, current }) => {
  const { navigateToCustomer, navigateToCourse } = useEntityNavigation();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {customer && (
        <>
          <button
            onClick={() => navigateToCustomer(customer.id)}
            className="hover:text-blue-600 transition-colors"
          >
            {customer.name}
          </button>
          <span>/</span>
        </>
      )}

      {course && (
        <>
          <button
            onClick={() => navigateToCourse(course.id)}
            className="hover:text-purple-600 transition-colors"
          >
            {course.name}
          </button>
          <span>/</span>
        </>
      )}

      {current && (
        <span className="font-medium text-gray-900">{current}</span>
      )}
    </nav>
  );
};
