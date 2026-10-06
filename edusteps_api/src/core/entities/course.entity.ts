export class Course {
  courseId: bigint;
  clientId: bigint;
  courseName: string;
  description?: string;
  rate: number;
  rateType: 'per_hour' | 'per_session' | 'per_course' | 'per_month';
  priorityNo: number;
  createdId: string;
  updatedId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    courseId: bigint,
    clientId: bigint,
    courseName: string,
    rate: number,
    rateType: 'per_hour' | 'per_session' | 'per_course' | 'per_month',
    priorityNo: number,
    createdId: string,
    updatedId: string,
    description?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.courseId = courseId;
    this.clientId = clientId;
    this.courseName = courseName;
    this.description = description;
    this.rate = rate;
    this.rateType = rateType;
    this.priorityNo = priorityNo;
    this.createdId = createdId;
    this.updatedId = updatedId;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}