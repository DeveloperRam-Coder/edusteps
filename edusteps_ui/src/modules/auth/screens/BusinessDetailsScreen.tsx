import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Card from '../../../components/Card/Card';
import { useAuth } from '../../../auth/AuthContext';
import { LuBuilding, LuSmartphone, LuMail, LuMapPin } from 'react-icons/lu';
import { useNotification } from '../../../core/components/NotificationProvider';
import { getErrorMessage } from '../../../core/utils/error';

export default function BusinessDetailsScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { createBusinessDetails } = auth;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const notification = useNotification();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    } else if (formData.name.trim().length < 5) {
      newErrors.name = 'Business name must be at least 5 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await createBusinessDetails({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
      });
      // Navigate to Add Customer screen after successful creation
      navigate('/add-customer');
    } catch (err: unknown) {
      console.error('Error creating business details:', err);
      const msg = getErrorMessage(err);
      notification.toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-5">
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-5 mb-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <LuBuilding className="w-5 h-5 text-blue-600" />
            Business Profile Setup
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            Welcome! Let&apos;s set up your business profile. This information will be displayed across your dashboard and helps us personalize your experience. You can update these details anytime from your profile settings.
          </p>
        </div>

        {/* Form Container */}
        <form className="mb-4" onSubmit={onSubmit}>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name"
                placeholder="Enter your business name (min 5 characters)"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('name', e.target.value)
                }
                disabled={loading}
                error={errors.name}
                icon={<LuBuilding className="w-5 h-5 text-slate-300" />}
              />

              <Input
                label="Phone Number"
                placeholder="Enter 10-digit phone number"
                type="tel"
                maxLength={10}
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('phone', e.target.value.replace(/\D/g, ''))
                }
                disabled={loading}
                error={errors.phone}
                icon={<LuSmartphone className="w-5 h-5 text-slate-300" />}
              />

              <Input
                label="Email (Optional)"
                placeholder="Enter business email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('email', e.target.value)
                }
                disabled={loading}
                error={errors.email}
                icon={<LuMail className="w-5 h-5 text-slate-300" />}
              />

              <Input
                label="Address (Optional)"
                placeholder="Enter business address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('address', e.target.value)
                }
                disabled={loading}
                error={errors.address}
                icon={<LuMapPin className="w-5 h-5 text-slate-300" />}
              />
            </div>
          </Card>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            title={loading ? 'Saving...' : 'Continue'}
            onClick={onSubmit}
            disabled={loading}
            variant="primary"
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}

