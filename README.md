# MySocialApp — React Web Demo Client (Phase 8)

Ứng dụng web React hoàn chỉnh (Client SPA) dành cho dự án **MySocialApp**, kết nối trực tiếp đến toàn bộ hệ thống ASP.NET Core Web API (Phase 1 → Phase 7).

---

## 1. Kiến Trúc & Công Nghệ

Ứng dụng tuân thủ nghiêm ngặt nguyên lý **Replaceable UI** và phân tách tầng rõ ràng:
- **UI Components & Pages**: Chỉ render giao diện, gọi Custom Hooks hoặc Services; không chứa logic mạng thô, xử lý JWT thủ công hay bóc tách socket/SSE trực tiếp.
- **State Management**: Zustand lưu trữ phiên đăng nhập (`authStore`) và trạng thái giao diện (`uiStore`) với persistence vào `localStorage`.
- **Server Cache & Async Flow**: TanStack Query (React Query) quản lý cache, invalidate tự động, retry và pagination (cả Cursor-based và Page/PageSize).
- **Realtime Integration**:
  - Chat & Thông báo: `@microsoft/signalr` kết nối tới `/hubs/chat` với tự động kết nối lại (`withAutomaticReconnect`).
  - Trợ lý AI (Ollama): Fetch API với `ReadableStream` bóc tách SSE line-by-line từ `POST /api/chatbot/chat/stream`.
- **Media Safety**: `resolveMediaUrl()` tự động chuẩn hóa URL tĩnh `/media/...` từ backend, tuyệt đối không rò rỉ đường dẫn file Windows cục bộ.

### Công Nghệ Sử Dụng
- **React 19** + **TypeScript** + **Vite 8**
- **React Router v7** (Declarative Routing với `ProtectedRoute` & `RoleRoute`)
- **TanStack Query v5**
- **Axios** (kèm interceptor tự động gán Bearer JWT và xử lý 401 unwrap)
- **Zustand v5**
- **@microsoft/signalr v10**
- **Lucide React**
- **Vitest** (Unit tests cho Auth Store, Media Resolver, SSE Parser, Order Status)

---

## 2. Tài Khoản Thử Nghiệm (Seed Accounts)

Hệ thống cung cấp sẵn các tài khoản seed phục vụ kiểm thử phân quyền ngay tại trang Đăng nhập và Bảng chẩn đoán `/dev/api`:

| Vai trò (Role) | Tên đăng nhập (Username) | Mật khẩu (Password) | Quyền hạn & Chức năng |
| :--- | :--- | :--- | :--- |
| **User (Buyer)** | `user1` | `User@123` | Bảng tin, Video Shorts, Mua hàng, Giỏ hàng, Đặt đơn, Hủy đơn Pending, Chat, AI Bot |
| **ShopOwner** | `shopowner1` | `Shop@123` | Kênh Chủ Shop: Duyệt đơn (Confirm → Prepare → Ready), Quản lý sản phẩm, Doanh thu đơn Delivered |
| **Shipper** | `shipper1` | `Shipper@123` | Bảng tin Shipper: Nhận đơn `WaitingForPickup` (khóa lạc quan 409), Lấy hàng, Giao hàng, Doanh thu giao vận |
| **Admin** | `admin` | `Admin@123` | Quản trị toàn hệ thống: Xem người dùng, Khóa/Mở tài khoản, Xóa bài viết vi phạm, Doanh thu sàn, Danh mục |

---

## 3. Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu Môi Trường
- Node.js ≥ 18
- Backend ASP.NET Core đang chạy tại `http://localhost:5114`
- (Tùy chọn) Ollama đang chạy model `qwen3.5:4b` tại `http://localhost:11434`

### Cấu Hình Biến Môi Trường (`.env`)
Tạo file `.env` tại thư mục `client/web app`:
```env
VITE_API_BASE_URL=http://localhost:5114
```

### Các Lệnh Thực Thi
```bash
# Di chuyển vào thư mục client
cd "d:\Projectzola\client\web app"

# Cài đặt thư viện (nếu chưa cài)
npm install

# Chạy môi trường phát triển (HMR)
npm run dev

# Chạy kiểm thử tự động (Vitest)
npm test

# Build ứng dụng sản xuất
npm run build

# Xem thử bản build production
npm run preview
```

---

## 4. Danh Sách Phân Hệ Chức Năng (Modules)

1. **Authentication (`/login`, `/register`)**:
   - Đăng nhập JWT, đăng ký tài khoản.
   - Nút 1-click chuyển nhanh 4 tài khoản mẫu.
2. **Social Feed (`/feed`)**:
   - Phân trang Cursor vô tận (Infinite Scroll).
   - Đăng bài viết hỗ trợ tối đa 10 ảnh hoặc 1 video (≤ 60s).
   - Tương tác Thích (Like), Không thích (Dislike), Bình luận đa cấp.
3. **Shorts Video Feed (`/shorts`)**:
   - Trình phát video dọc tỉ lệ 9:16.
   - Tự động phát video đang xem, tạm dừng video cũ, preload metadata video kế tiếp.
   - Tương tác thả tim, xem tác giả và chuyển video dạng cuộn snap.
4. **Shopping & Search (`/shop`, `/products/:id`, `/shops/:id`)**:
   - Tìm kiếm sản phẩm thời gian thực (Debounce 300ms).
   - Lọc theo danh mục, khoảng giá, sắp xếp giá/thời gian.
   - Tìm kiếm gian hàng và xem chi tiết Shop.
5. **Cart & Multi-Shop Checkout (`/cart`)**:
   - Gom nhóm sản phẩm theo từng Shop riêng biệt.
   - Đặt hàng tách thành các đơn hàng độc lập theo Shop.
6. **Buyer Orders (`/orders`)**:
   - Theo dõi trạng thái đơn hàng: `Pending` → `Confirmed` → `Preparing` → `WaitingForPickup` → `Shipping` → `Delivered`.
   - Nút hủy đơn **chỉ hiển thị và cho phép khi đơn ở trạng thái `Pending`**.
7. **Shop Owner Channel (`/shop-owner`)**:
   - Quy trình chuyển trạng thái đơn hàng: Xác nhận → Chuẩn bị → Sẵn sàng giao.
   - Thêm/sửa/xóa sản phẩm, upload ảnh sản phẩm.
   - Thống kê doanh thu theo khoảng ngày dựa trên đơn `Delivered` có `DeliveredAt`.
8. **Shipper Dashboard (`/shipper`)**:
   - Danh sách đơn hàng khả dụng (`WaitingForPickup`).
   - Nhận đơn an toàn (xử lý xung đột đồng thời 409 khi nhiều shipper cùng nhận).
   - Xác nhận Đã lấy hàng (`Shipping`) → Đã giao thành công (`Delivered`).
   - Thống kê thu nhập giao hàng theo khoảng thời gian.
9. **Admin Dashboard (`/admin`)**:
   - Quản lý người dùng, khóa tài khoản vi phạm.
   - Kiểm duyệt và xóa bài viết.
   - Xem tổng doanh thu toàn sàn và tạo mới danh mục sản phẩm.
10. **Realtime Chat (`/chat`)**:
    - Danh sách hội thoại và chi tiết tin nhắn theo thời gian thực (SignalR).
    - Tạo cuộc trò chuyện mới, gửi tin nhắn tức thời.
11. **Realtime Notifications (`/notifications`)**:
    - Chuông thông báo hiển thị số lượng chưa đọc realtime.
    - Hỗ trợ đầy đủ sự kiện Mạng xã hội (Follow, Like, Comment) và Mua sắm (Đổi trạng thái đơn hàng).
12. **AI Chatbot Assistant (`/assistant`)**:
    - Streaming phản hồi từng token qua Server-Sent Events (SSE).
    - Trạng thái "Đang suy nghĩ...", ngữ cảnh bộ nhớ trượt 5 phút, nút xóa phiên hội thoại.
13. **User Profile (`/profile`, `/profile/:userId`)**:
    - Xem thông tin tài khoản, danh sách bài viết, số lượng follow/following.
    - Cập nhật thông tin cá nhân và tải lên ảnh đại diện WebP.
14. **API Diagnostic Panel (`/dev/api`)**:
    - Kiểm tra sức khỏe kết nối API, SignalR Hub, Ollama Model, giải mã JWT Claims, sao chép token, kiểm tra phân giải URL media.
