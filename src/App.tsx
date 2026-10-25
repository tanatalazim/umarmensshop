import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { StoreLayout } from './layouts/StoreLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { StaffLayout } from './layouts/StaffLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { HomePage } from './pages/store/HomePage';
import { CatalogPage } from './pages/store/CatalogPage';
import { ProductDetailPage } from './pages/store/ProductDetailPage';
import { CheckoutPage } from './pages/store/CheckoutPage';
import { OrderSuccessPage } from './pages/store/OrderSuccessPage';
import { TrackOrderPage } from './pages/store/TrackOrderPage';
import { InfoPages } from './pages/store/InfoPages';
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { StaffPortal } from './pages/staff/StaffPortal';
import { AdminPortal } from './pages/admin/AdminPortal';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AccessDeniedPage } from './pages/auth/AccessDeniedPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  // Pushstate and popstate handling
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans space-y-4">
        <img
          src="/assets/aistudio/_____cecc8cff.jpg"
          alt="UMAR MENS SHOP"
          className="h-12 w-auto bg-black p-2 rounded"
        />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
          Загрузка системы UMAR MENS SHOP...
        </p>
      </div>
    );
  }

  // =========================================================================
  // ZONE D: ADMIN LAYOUT (OWNER ONLY)
  // =========================================================================
  if (currentPath.startsWith('/admin')) {
    if (!user || !user.roles.includes('OWNER')) {
      return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
    }

    let adminSection: 'analytics' | 'inventory' | 'products' | 'employees' | 'integrations' | 'audit-log' | 'security' = 'analytics';
    if (currentPath === '/admin/inventory') adminSection = 'inventory';
    else if (currentPath === '/admin/products') adminSection = 'products';
    else if (currentPath === '/admin/employees') adminSection = 'employees';
    else if (currentPath === '/admin/integrations') adminSection = 'integrations';
    else if (currentPath === '/admin/audit-log') adminSection = 'audit-log';
    else if (currentPath === '/admin/security') adminSection = 'security';

    return (
      <AdminLayout activePath={currentPath} onNavigate={navigate}>
        <AdminPortal section={adminSection} onNavigate={navigate} />
      </AdminLayout>
    );
  }

  // =========================================================================
  // ZONE C: STAFF LAYOUT (OWNER, MANAGER, WAREHOUSE)
  // =========================================================================
  if (currentPath.startsWith('/staff')) {
    if (!user) {
      return <LoginPage onNavigate={navigate} />;
    }

    const isStaffMember = user.roles.includes('OWNER') || user.roles.includes('MANAGER') || user.roles.includes('WAREHOUSE');
    if (!isStaffMember) {
      return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
    }

    let staffSection: 'orders' | 'warehouse' | 'receive' | 'pickups' | 'sku' | 'history' | 'communications' = 'orders';
    
    if (currentPath === '/staff/warehouse') {
      if (!user.permissions.includes('inventory:read') && !user.roles.includes('OWNER')) {
        return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
      }
      staffSection = 'warehouse';
    } else if (currentPath === '/staff/warehouse/receive') {
      if (!user.permissions.includes('inventory:receive') && !user.roles.includes('OWNER')) {
        return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
      }
      staffSection = 'receive';
    } else if (currentPath === '/staff/warehouse/history') {
      if (!user.permissions.includes('inventory:read') && !user.roles.includes('OWNER')) {
        return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
      }
      staffSection = 'history';
    } else if (currentPath === '/staff/pickups') {
      if (!user.permissions.includes('orders:fulfill') && !user.roles.includes('OWNER')) {
        return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
      }
      staffSection = 'pickups';
    } else if (currentPath === '/staff/sku') {
      if (!user.permissions.includes('inventory:read') && !user.roles.includes('OWNER')) {
        return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
      }
      staffSection = 'sku';
    } else if (currentPath === '/staff/communications') {
      if (!user.permissions.includes('conversations:manage') && !user.roles.includes('OWNER')) {
        return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
      }
      staffSection = 'communications';
    } else {
      // Default /staff landing route based on role
      if (user.roles.includes('WAREHOUSE') && !user.roles.includes('MANAGER') && !user.roles.includes('OWNER')) {
        staffSection = 'warehouse';
      } else {
        if (!user.permissions.includes('orders:read_all') && !user.roles.includes('OWNER')) {
          staffSection = 'warehouse';
        } else {
          staffSection = 'orders';
        }
      }
    }

    return (
      <StaffLayout activePath={currentPath} onNavigate={navigate}>
        <StaffPortal section={staffSection} onNavigate={navigate} />
      </StaffLayout>
    );
  }

  // =========================================================================
  // ZONE B: CUSTOMER PRIVATE PORTAL (AUTHENTICATED CUSTOMER ONLY)
  // =========================================================================
  if (currentPath.startsWith('/account')) {
    if (!user) {
      return <LoginPage onNavigate={navigate} />;
    }

    // MANDATORY ARCHITECTURE RULE:
    // If OWNER, MANAGER, or WAREHOUSE opens /account, redirect immediately to their designated workplace!
    if (user.roles.includes('OWNER')) {
      navigate('/admin');
      return null;
    }
    if (user.roles.includes('MANAGER')) {
      navigate('/staff/orders');
      return null;
    }
    if (user.roles.includes('WAREHOUSE')) {
      navigate('/staff/warehouse');
      return null;
    }

    let customerSection: 'profile' | 'orders' | 'addresses' | 'favorites' = 'profile';
    let targetOrderId: string | undefined = undefined;

    if (currentPath.startsWith('/account/orders/')) {
      customerSection = 'orders';
      targetOrderId = currentPath.replace('/account/orders/', '');
    } else if (currentPath === '/account/orders') {
      customerSection = 'orders';
    } else if (currentPath === '/account/addresses') {
      customerSection = 'addresses';
    } else if (currentPath === '/account/favorites') {
      customerSection = 'favorites';
    }

    return (
      <CustomerLayout activePath={currentPath} onNavigate={navigate}>
        <CustomerPortal section={customerSection} orderId={targetOrderId} onNavigate={navigate} />
      </CustomerLayout>
    );
  }

  // =========================================================================
  // AUTHENTICATION SCREENS
  // =========================================================================
  if (currentPath === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }

  if (currentPath === '/register') {
    return <RegisterPage onNavigate={navigate} />;
  }

  if (currentPath === '/403') {
    return <AccessDeniedPage attemptedPath={currentPath} onNavigate={navigate} />;
  }

  // =========================================================================
  // ZONE A: PUBLIC STOREFRONT (STORELAYOUT)
  // =========================================================================
  let storeContent = <HomePage onNavigate={navigate} />;

  if (currentPath.startsWith('/catalog/')) {
    const categorySlug = currentPath.replace('/catalog/', '');
    storeContent = <CatalogPage initialCategory={categorySlug} onNavigate={navigate} />;
  } else if (currentPath === '/catalog') {
    storeContent = <CatalogPage onNavigate={navigate} />;
  } else if (currentPath.startsWith('/product/')) {
    const productSlug = currentPath.replace('/product/', '');
    storeContent = <ProductDetailPage slug={productSlug} onNavigate={navigate} />;
  } else if (currentPath === '/checkout') {
    storeContent = <CheckoutPage onNavigate={navigate} />;
  } else if (currentPath.startsWith('/order-success')) {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId') || '';
    const token = params.get('token') || '';
    storeContent = <OrderSuccessPage orderId={orderId} trackingToken={token} onNavigate={navigate} />;
  } else if (currentPath.startsWith('/track-order')) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    storeContent = <TrackOrderPage initialToken={token} onNavigate={navigate} />;
  } else if (currentPath === '/delivery') {
    storeContent = <InfoPages type="delivery" onNavigate={navigate} />;
  } else if (currentPath === '/returns') {
    storeContent = <InfoPages type="returns" onNavigate={navigate} />;
  } else if (currentPath === '/contacts') {
    storeContent = <InfoPages type="contacts" onNavigate={navigate} />;
  } else if (currentPath === '/about') {
    storeContent = <InfoPages type="about" onNavigate={navigate} />;
  } else if (currentPath === '/privacy') {
    storeContent = <InfoPages type="privacy" onNavigate={navigate} />;
  } else if (currentPath === '/terms') {
    storeContent = <InfoPages type="terms" onNavigate={navigate} />;
  }

  return (
    <StoreLayout activePath={currentPath} onNavigate={navigate}>
      {storeContent}
    </StoreLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
