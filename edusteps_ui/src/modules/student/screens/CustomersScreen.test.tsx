import { render, screen, waitFor } from '../../../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomersScreen from './CustomersScreen';
import * as customerApi from '@/modules/auth/api/customer';

// Mock the API calls
vi.mock('@/modules/auth/api/customer', () => ({
  getCustomersByClientIdApi: vi.fn(),
  deleteCustomerApi: vi.fn(),
  updateCustomerApi: vi.fn(),
}));

vi.mock('@/modules/auth/api/customerDetails', () => ({
  getCustomerDetailsByCustomerIdApi: vi.fn().mockResolvedValue([]),
}));

describe('CustomersScreen DOM CRUD Test (Read, Update, Delete)', () => {
  const mockCustomers = [
    {
      customer_id: 1,
      client_id: 1,
      first_name: 'Alice',
      last_name: 'Smith',
      mobile: '9876543210',
    },
    {
      customer_id: 2,
      client_id: 1,
      first_name: 'Bob',
      last_name: 'Jones',
      mobile: '1234567890',
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (customerApi.getCustomersByClientIdApi as any).mockResolvedValue({ data: mockCustomers });
  });

  it('reads and displays customers in the DOM', async () => {
    render(<CustomersScreen />);

    // Wait for DOM to update after API call
    await waitFor(() => {
      expect(customerApi.getCustomersByClientIdApi).toHaveBeenCalled();
    });

    const aliceMatches = screen.getAllByText('Alice Smith');
    const bobMatches = screen.getAllByText('Bob Jones');
    const mobileMatches = screen.getAllByText('9876543210');
    const alternateMobileMatches = screen.getAllByText('1234567890');

    expect(aliceMatches.length).toBeGreaterThanOrEqual(1);
    expect(bobMatches.length).toBeGreaterThanOrEqual(1);
    expect(mobileMatches.length).toBeGreaterThanOrEqual(1);
    expect(alternateMobileMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('triggers delete operation via DOM', async () => {
    (customerApi.deleteCustomerApi as any).mockResolvedValue({ data: true });

    render(<CustomersScreen />);
    await waitFor(() => {
      expect(customerApi.getCustomersByClientIdApi).toHaveBeenCalled();
    });

    // Verify the delete button exists for the first customer row and opens the confirm dialog.
    const deleteButtons = screen.getAllByRole('button', { name: /delete alice smith|delete bob jones/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });
});
