import { useNavigate } from 'react-router-dom';

export const useCustomerNavigation = () => {
  const navigate = useNavigate();

  return {
    toCustomerList: () => navigate('/customers'),
    toCustomerDetails: (id: number | string) => navigate(`/customers/${id}`),
    back: () => navigate(-1)
  };
};
