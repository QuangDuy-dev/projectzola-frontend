import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Feature Pages
import { LoginPage } from '../../features/auth/LoginPage';
import { RegisterPage } from '../../features/auth/RegisterPage';
import { SocialFeedPage } from '../../features/feed/SocialFeedPage';
import { ShortsFeedPage } from '../../features/shorts/ShortsFeedPage';
import { ShoppingHomePage } from '../../features/shopping/ShoppingHomePage';
import { ProductDetailPage } from '../../features/shopping/ProductDetailPage';
import { ShopDetailPage } from '../../features/shopping/ShopDetailPage';
import { CartPage } from '../../features/cart/CartPage';
import { BuyerOrdersPage } from '../../features/orders/BuyerOrdersPage';
import { ChatPage } from '../../features/chat/ChatPage';
import { NotificationsPage } from '../../features/notifications/NotificationsPage';
import { AssistantPage } from '../../features/chatbot/AssistantPage';
import { ProfilePage } from '../../features/profile/ProfilePage';
import { ShopOwnerDashboardPage } from '../../features/shop-owner/ShopOwnerDashboardPage';
import { ShipperDashboardPage } from '../../features/shipper/ShipperDashboardPage';
import { AdminDashboardPage } from '../../features/admin/AdminDashboardPage';
import { ApiDebugPanel } from '../../features/dev/ApiDebugPanel';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes inside Main Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<SocialFeedPage />} />
          <Route path="/shorts" element={<ShortsFeedPage />} />
          <Route path="/shop" element={<ShoppingHomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/shops/:id" element={<ShopDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<BuyerOrdersPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/users/:userId" element={<ProfilePage />} />
          <Route path="/dev/api" element={<ApiDebugPanel />} />

          {/* Role-Protected Routes */}
          <Route element={<RoleRoute allowedRoles={['ShopOwner', 'Admin']} />}>
            <Route path="/shop-owner" element={<ShopOwnerDashboardPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['Shipper', 'Admin']} />}>
            <Route path="/shipper" element={<ShipperDashboardPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
};
