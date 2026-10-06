# EduSteps Web Application

A React web application that mirrors the mobile app functionality, built with Vite, React, TypeScript, and React Router.

## Project Structure

```
src/
├── auth/              # Authentication context
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components (Button, Input, Card, etc.)
│   ├── layout/       # Layout components (PageContainer, PageHeader)
│   ├── FormField.tsx # Unified form field (merged FormInput + FormField)
│   ├── FormScreen.tsx# Standardized form layout wrapper
│   ├── DataTable.tsx # Data table component
│   └── ... (Breadcrumb, HelpTooltip, ActivityLog, etc.)
├── core/
│   ├── api/          # API client configuration
│   ├── components/   # Core components (Avatar, Badge, Divider, etc.)
│   ├── hooks/        # Custom React hooks
│   │   ├── useForm.ts        # Form state management
│   │   ├── useValidation.ts  # Form validation state
│   │   └── useApi.ts         # API call management with retry/timeout
│   ├── utils/        # Utility functions
│   │   ├── validators.ts     # Centralized validation rules
│   │   └── storage.ts        # Local storage utilities
│   ├── theme/        # Theme configuration
│   └── layouts/      # Layout components
├── modules/          # Feature modules
│   ├── admin/        # Admin dashboard
│   ├── auth/         # Authentication screens and API
│   ├── instructor/   # Instructor dashboard
│   └── user/         # User dashboard
├── router/           # Routing configuration
├── styles/           # Global styles
└── types/            # TypeScript type definitions
```

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Start Development Server**
   ```bash
   npm run dev,
   npx vite --port 8081

   ```

   The application will be available at `http://localhost:5173`

## API Connection

The application connects to the NestJS backend API. Ensure:
- The API server is running on port 3000 (or update `.env` accordingly)
- CORS is properly configured in the API to allow requests from `http://localhost:5173`

## Features

- ✅ User Authentication (Login/Register)
- ✅ Business Details Setup
- ✅ Customer Management
- ✅ Sub-Customer Management
- ✅ Course Management
- ✅ Role-based Dashboards (Admin, Instructor, User)
- ✅ Profile Management
- ✅ **NEW: Unified Form Pattern** (useForm + useValidation + useApi)
- ✅ **NEW: Centralized Validation** (validators.ts)
- ✅ **NEW: Layout Components** (PageContainer, PageHeader)
- ✅ **NEW: Business Logic Components** (Breadcrumb, ActivityLog, Onboarding, etc.)

## New Architecture & Patterns

### Modern Form Handling
All forms now follow a unified pattern using three core hooks:

```typescript
import { useForm, useValidation, useApi } from '@/core/hooks';
import { validateLoginForm } from '@/core/utils/validators';
import { FormField } from '@/components/FormField';

export default function LoginScreen() {
  const { values, handleChange, handleSubmit } = useForm({ email: '', password: '' });
  const { errors, addError, clearErrors } = useValidation();
  const { loading, executeApiCall } = useApi(null);

  const onSubmit = handleSubmit(async (data) => {
    clearErrors();
    const validation = validateLoginForm(data);
    if (!validation.isValid) {
      validation.errors.forEach(err => addError(err.field, err.message));
      return;
    }
    await executeApiCall(() => login(data.email, data.password));
  });

  return (
    <form onSubmit={onSubmit}>
      <FormField
        id="email"
        label="Email"
        value={values.email}
        onChange={(value) => {
          handleChange({ target: { name: 'email', value } } as any);
          if (errors.email) clearError('email');
        }}
        error={errors.email}
        required
      />
      {/* More fields... */}
      <button type="submit" disabled={loading}>Sign In</button>
    </form>
  );
}
```

See [FORM_PATTERN_QUICK_REFERENCE.md](FORM_PATTERN_QUICK_REFERENCE.md) for complete guide.

### Centralized Validation
All validation logic is centralized in `src/core/utils/validators.ts`:
- Email, password, phone, name validation functions
- Form-level validators (login, register, customer, business)
- Consistent error messaging

### Layout Components
Standardized layout components for consistency:
- `PageContainer` - Provides padding, max-width, and centering
- `PageHeader` - Page title, description, and actions
- `FormScreen` - Complete form layout wrapper

### Data Fetching
The `useApi` hook provides:
- Automatic loading/error/data state management
- Built-in timeout handling (default 10s)
- Retry logic for network failures
- Error normalization

---## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Axios** - HTTP client
- **CSS Modules** - Component styling

