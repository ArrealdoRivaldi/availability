import React from 'react';
import { AuthGuard } from './AuthGuard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
};

// Higher-order component untuk halaman dashboard yang membutuhkan autentikasi
export const withDashboardAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <DashboardLayout>
      <Component {...props} />
    </DashboardLayout>
  );
  
  WrappedComponent.displayName = `withDashboardAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
