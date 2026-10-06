export class Enrollment {
  constructor(
    public enrollmentId: bigint,
    public customerId: bigint,
    public courseId: bigint,
    public enrolledAt: Date,
    public status: string,
    public clientId: bigint,
    public createdId: string,
    public updatedId: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) { }
}
