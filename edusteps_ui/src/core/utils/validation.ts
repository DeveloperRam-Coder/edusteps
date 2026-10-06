// Comprehensive validation utilities for CRUD operations
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface CustomerData {
  firstName: string;
  lastName?: string;
  mobile: string;
  email?: string;
  address?: string;
}

export interface CourseData {
  courseName: string;
  description?: string;
  rate: string | number;
  rateType: string;
  priorityNo: string | number;
}

// Customer validation
export const validateCustomer = (data: CustomerData): ValidationResult => {
  const errors: Record<string, string> = {};

  // First name validation
  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  } else if (data.firstName.trim().length > 50) {
    errors.firstName = 'First name must not exceed 50 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(data.firstName.trim())) {
    errors.firstName = 'First name can only contain letters and spaces';
  }

  // Last name validation (optional)
  if (data.lastName && data.lastName.trim()) {
    if (data.lastName.trim().length > 50) {
      errors.lastName = 'Last name must not exceed 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(data.lastName.trim())) {
      errors.lastName = 'Last name can only contain letters and spaces';
    }
  }

  // Mobile validation
  if (!data.mobile?.trim()) {
    errors.mobile = 'Mobile number is required';
  } else {
    const cleanMobile = data.mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      errors.mobile = 'Mobile number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(cleanMobile)) {
      errors.mobile = 'Mobile number must start with 6, 7, 8, or 9';
    }
  }

  // Email validation (optional)
  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address';
    } else if (data.email.trim().length > 100) {
      errors.email = 'Email must not exceed 100 characters';
    }
  }

  // Address validation (optional)
  if (data.address && data.address.trim() && data.address.trim().length > 255) {
    errors.address = 'Address must not exceed 255 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Course validation
export const validateCourse = (data: CourseData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Course name validation
  if (!data.courseName?.trim()) {
    errors.courseName = 'Course name is required';
  } else if (data.courseName.trim().length < 3) {
    errors.courseName = 'Course name must be at least 3 characters';
  } else if (data.courseName.trim().length > 100) {
    errors.courseName = 'Course name must not exceed 100 characters';
  }

  // Description validation (optional)
  if (data.description && data.description.trim() && data.description.trim().length > 500) {
    errors.description = 'Description must not exceed 500 characters';
  }

  // Rate validation
  const rate = typeof data.rate === 'string' ? parseFloat(data.rate) : data.rate;
  if (!data.rate && data.rate !== 0) {
    errors.rate = 'Rate is required';
  } else if (isNaN(rate) || rate < 0) {
    errors.rate = 'Rate must be a positive number';
  } else if (rate > 999999.99) {
    errors.rate = 'Rate must not exceed 999,999.99';
  }

  // Rate type validation
  const validRateTypes = ['per_hour', 'per_session', 'per_course', 'per_month'];
  if (!data.rateType) {
    errors.rateType = 'Rate type is required';
  } else if (!validRateTypes.includes(data.rateType)) {
    errors.rateType = 'Invalid rate type selected';
  }

  // Priority validation
  const priority = typeof data.priorityNo === 'string' ? parseInt(data.priorityNo) : data.priorityNo;
  if (!data.priorityNo && data.priorityNo !== 0) {
    errors.priorityNo = 'Priority is required';
  } else if (isNaN(priority) || priority < 1) {
    errors.priorityNo = 'Priority must be a positive number';
  } else if (priority > 999) {
    errors.priorityNo = 'Priority must not exceed 999';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitize data before sending to API
export const sanitizeCustomerData = (data: CustomerData): CustomerData => ({
  firstName: data.firstName?.trim() || '',
  lastName: data.lastName?.trim() || undefined,
  mobile: data.mobile?.replace(/\D/g, '') || '',
  email: data.email?.trim() || undefined,
  address: data.address?.trim() || undefined,
});

export const sanitizeCourseData = (data: CourseData) => ({
  courseName: data.courseName?.trim() || '',
  description: data.description?.trim() || undefined,
  rate: typeof data.rate === 'string' ? parseFloat(data.rate) : data.rate,
  rateType: data.rateType,
  priorityNo: typeof data.priorityNo === 'string' ? parseInt(data.priorityNo) : data.priorityNo,
});

// Check for duplicate data
export const checkDuplicateCustomer = (newCustomer: CustomerData, existingCustomers: any[]): string | null => {
  const cleanMobile = newCustomer.mobile.replace(/\D/g, '');
  
  const duplicateMobile = existingCustomers.find(customer => 
    customer.mobile?.replace(/\D/g, '') === cleanMobile
  );
  
  if (duplicateMobile) {
    return 'A customer with this mobile number already exists';
  }

  if (newCustomer.email?.trim()) {
    const duplicateEmail = existingCustomers.find(customer => 
      customer.email?.toLowerCase() === newCustomer.email?.toLowerCase()
    );
    
    if (duplicateEmail) {
      return 'A customer with this email address already exists';
    }
  }

  return null;
};

export const checkDuplicateCourse = (newCourse: CourseData, existingCourses: any[]): string | null => {
  const duplicateName = existingCourses.find(course => 
    (course.course_name || course.courseName)?.toLowerCase() === newCourse.courseName?.toLowerCase()
  );
  
  if (duplicateName) {
    return 'A course with this name already exists';
  }

  return null;
};
