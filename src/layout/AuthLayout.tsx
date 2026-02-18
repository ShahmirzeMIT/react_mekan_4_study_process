
import React, { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-auth-background">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg auth-card-shadow">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
