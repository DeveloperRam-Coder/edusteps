export class EnrollmentResponseDto {
  enrollment_id: bigint;
  customer_id: bigint;
  course_id: bigint;
  enrolled_at: Date;
  status: string;
  client_id: bigint;
  created_id: string;
  updated_id?: string | null;
  created_at: Date;
  updated_at: Date;
  course_name?: string | null;
  course_description?: string | null;
}

export class CustomerResponseDto {
  customer_id: bigint;
  client_id: bigint;
  first_name: string;
  last_name?: string | null;
  mobile: string;
  email?: string | null;
  address?: string | null;
  created_id: string;
  updated_id?: string | null;
  created_at: Date;
  updated_at: Date;
  enrollments?: EnrollmentResponseDto[];
}
