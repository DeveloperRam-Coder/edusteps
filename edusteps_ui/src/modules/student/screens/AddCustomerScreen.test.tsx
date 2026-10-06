import { render, screen, waitFor } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddCustomerScreen from './AddCustomerScreen';
import * as customerApi from '@/modules/auth/api/customer';
import { NotificationProvider } from '@/core/components/NotificationProvider';

// Mock the API calls
vi.mock('@/modules/auth/api/customer', () => ({
  createCustomerApi: vi.fn(),
  getCustomersByClientIdApi: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/modules/auth/api/course', () => ({
  getCoursesByClientIdApi: vi.fn().mockResolvedValue([]),
}));

describe('AddCustomerScreen DOM CRUD Test (Create)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the customer form and creates a customer on submit', async () => {
    // Mock successful creation
    (customerApi.createCustomerApi as any).mockResolvedValue({
      data: {
        id: 999,
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    const user = userEvent.setup();
    render(<AddCustomerScreen />);

    // 1. Verify DOM elements for Create Operation are present
    expect(screen.getByText('Add Customer')).toBeInTheDocument();
    
    // Find inputs (testing the DOM structure)
    // Since the label wraps the input: <label><FieldLabel>First name</FieldLabel><input/></label>
    // We can use getByRole or getByLabelText if RTL detects it, otherwise we fallback to generic queries.
    // To be safe, we'll query by the input's placeholder or just find them by label text.
    const firstNameLabel = screen.getByText('First name');
    const firstNameInput = firstNameLabel.parentElement?.querySelector('input');
    expect(firstNameInput).toBeInTheDocument();

    const mobileLabel = screen.getByText('Mobile');
    const mobileInput = mobileLabel.parentElement?.querySelector('input');
    expect(mobileInput).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /create customer/i });
    expect(submitBtn).toBeInTheDocument();

    // 2. Simulate User Input in the DOM
    await user.type(firstNameInput!, 'John');
    await user.type(mobileInput!, '9876543210');

    // 3. Submit the form
    await user.click(submitBtn);

    // 4. Verify API was called with the values entered in the DOM
    await waitFor(() => {
      expect(customerApi.createCustomerApi).toHaveBeenCalledWith({
        clientId: 1, // from mockAuthValue
        firstName: 'John',
        lastName: '',
        mobile: '9876543210',
        email: undefined,
        address: undefined,
      });
    });

    // 5. Verify the DOM moves to Step 2 (Student Profile) after successful customer creation
    await waitFor(() => {
      expect(screen.getByText('Student Profile')).toBeInTheDocument();
    });
  });

  it('shows DOM validation error when fields are empty', async () => {
    const user = userEvent.setup();
    render(<AddCustomerScreen />);

    const submitBtn = screen.getByRole('button', { name: /create customer/i });
    
    // Submit without typing
    await user.click(submitBtn);

    // Verify API is not called
    expect(customerApi.createCustomerApi).not.toHaveBeenCalled();

    // The validation shows a toast via NotificationProvider. We check if the toast appears in the DOM.
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });
});
