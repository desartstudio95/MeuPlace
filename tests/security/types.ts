export type UserRole = 
  | 'anonymous' 
  | 'user' 
  | 'owner' 
  | 'agent' 
  | 'agency_admin' 
  | 'moderator' 
  | 'admin' 
  | 'super_admin';

export interface TestAuth {
  uid: string;
  email?: string;
  email_verified?: boolean;
  role?: string;
  token?: Record<string, any>;
}

export type OperationType = 'read' | 'create' | 'update' | 'delete' | 'list';

export interface TestCase {
  id: string;
  category: string;
  role: UserRole;
  auth: TestAuth | null;
  target: string;
  operation: OperationType;
  existingData?: Record<string, any> | null;
  incomingData?: Record<string, any>;
  expectedResult: 'ALLOWED' | 'DENIED';
  description: string;
}

export interface TestResult {
  id: string;
  category: string;
  role: UserRole;
  target: string;
  operation: OperationType;
  expectedResult: 'ALLOWED' | 'DENIED';
  actualResult: 'ALLOWED' | 'DENIED';
  status: 'PASS' | 'FAIL' | 'NOT TESTABLE';
  details?: string;
}

export interface StorageTestCase {
  id: string;
  category: string;
  role: UserRole;
  auth: TestAuth | null;
  path: string;
  operation: 'read' | 'write' | 'delete';
  contentType?: string;
  sizeBytes?: number;
  expectedResult: 'ALLOWED' | 'DENIED';
  description: string;
}

export interface StorageTestResult {
  id: string;
  category: string;
  role: UserRole;
  path: string;
  operation: 'read' | 'write' | 'delete';
  expectedResult: 'ALLOWED' | 'DENIED';
  actualResult: 'ALLOWED' | 'DENIED';
  status: 'PASS' | 'FAIL' | 'NOT TESTABLE';
  details?: string;
}
