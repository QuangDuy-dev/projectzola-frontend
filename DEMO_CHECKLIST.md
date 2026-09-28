# KỊCH BẢN KIỂM THỬ VÀ DEMO CHI TIẾT (DEMO CHECKLIST)
## MySocialApp — React Web Demo Client (Phase 8)

Tài liệu này cung cấp kịch bản từng bước (Step-by-Step) để người đánh giá hoặc giảng viên có thể kiểm tra toàn diện 100% tính năng của hệ thống MySocialApp từ Phase 1 đến Phase 7 thông qua giao diện Web React Client.

---

### Bước 0: Chuẩn Bị & Khởi Động

1. **Khởi động Backend ASP.NET Core**:
   ```bash
   cd "d:\Projectzola\sever\src\MySocialApp.Api"
   dotnet run
   ```
   *Đảm bảo backend phản hồi tại `http://localhost:5114`.*

2. **Khởi động Frontend Web App**:
   ```bash
   cd "d:\Projectzola\client\web app"
   npm run dev
   ```
   *Mở trình duyệt tại `http://localhost:5173`.*

---

### Kịch Bản 1: Kiểm Tra Kết Nối Hệ Thống & Chẩn Đoán (/dev/api)
- **Truy cập**: Click vào mục **"Chẩn Đoán API (/dev/api)"** trên thanh menu trái.
- **Quan sát**:
  1. Kiểm tra trạng thái **ASP.NET Core API**: Hiển thị badge xanh `Active` với Base URL `http://localhost:5114`.
  2. Bấm nút **"Thử gọi /api/categories"**: Nhận kết quả JSON danh mục thành công.
  3. Kiểm tra trạng thái **SignalR ChatHub**: Hiển thị `Connected`.
  4. Kiểm tra trạng thái **Ollama AI**: Hiển thị dịch vụ khả dụng (`Healthy`) với model `qwen3.5:4b`.
  5. Thử công cụ **Kiểm tra phân giải Media URL**: Nhập đường dẫn tương đối `/media/sample.jpg`, kết quả phân giải thành `http://localhost:5114/media/sample.jpg` (không rò rỉ ổ đĩa vật lý `D:\...`).

---

### Kịch Bản 2: Đăng Nhập & Chuyển Đổi Tài Khoản Phân Quyền
1. Truy cập trang `/login` (hoặc Đăng xuất).
2. Tại màn hình Đăng nhập, có sẵn **4 nút chuyển nhanh tài khoản Seed**:
   - Bấm **"User (user1)"** → Tự động điền `user1` / `User@123` và đăng nhập ngay.
   - Quan sát menu: Chỉ hiển thị các mục cơ bản cho Người dùng.
3. Thử đăng nhập lại với **"ShopOwner (shopowner1)"**:
   - Menu xuất hiện thêm mục **"Quản Trị Bán Hàng -> Kênh Chủ Shop"**.
4. Thử đăng nhập với **"Shipper (shipper1)"**:
   - Menu xuất hiện thêm mục **"Giao Vận -> Bảng Tin Shipper"**.
5. Thử đăng nhập với **"Admin (admin)"**:
   - Menu xuất hiện đầy đủ các kênh quản trị và **"Quản Trị Hệ Thống -> Admin Dashboard"**.

---

### Kịch Bản 3: Mạng Xã Hội (Social Feed & Bài Đăng)
- **Tài khoản**: `user1`
- **Truy cập**: `/feed`
- **Các bước**:
  1. **Xem Bảng tin**: Cuộn xuống dưới, quan sát hiệu ứng tải thêm bài viết mượt mà bằng Cursor Pagination.
  2. **Tương tác**: Bấm nút **Thích (Like)** hoặc **Không thích (Dislike)** trên một bài viết. Số lượng đếm thay đổi ngay lập tức trên giao diện.
  3. **Bình luận**: Nhập nội dung bình luận vào bài viết và nhấn Gửi. Bình luận xuất hiện ngay bên dưới bài viết.
  4. **Tạo bài viết mới**:
     - Bấm nút **"Tạo bài viết mới"**.
     - Nhập nội dung bài đăng.
     - Chọn ảnh (tối đa 10 ảnh) hoặc 1 video (thời lượng ≤ 60 giây).
     - Nhấn **Đăng bài**. Bài viết mới xuất hiện ngay đầu Bảng tin với ảnh đã được tối ưu hóa WebP từ backend.

---

### Kịch Bản 4: Video Ngắn (Shorts Feed)
- **Truy cập**: `/shorts`
- **Quan sát**:
  1. Giao diện dạng khung dọc chuẩn 9:16 (kiểu TikTok / Reels).
  2. Video đang xem tự động phát; các video khác ở trạng thái dừng và preload trước metadata.
  3. Bấm vào màn hình video để Tạm dừng / Tiếp tục phát.
  4. Bấm nút Bật / Tắt tiếng (Mute/Unmute).
  5. Bấm nút cuộn Lên / Xuống hoặc Thả tim trực tiếp trên video.

---

### Kịch Bản 5: Mua Sắm & Tìm Kiếm Thời Gian Thực (Shopping)
- **Truy cập**: `/shop`
- **Các bước**:
  1. **Tìm kiếm sản phẩm**: Gõ từ khóa vào ô tìm kiếm (ví dụ: "Áo", "Giày", "Công nghệ").
     - Quan sát cơ chế **Debounce 300ms**: Hệ thống không spam API mỗi lần gõ phím mà chỉ gửi request sau khi người dùng ngừng gõ 300ms.
  2. **Bộ lọc & Phân trang**:
     - Chọn danh mục sản phẩm từ danh sách.
     - Lọc theo khoảng giá tối thiểu / tối đa.
     - Sắp xếp theo "Giá tăng dần", "Giá giảm dần" hoặc "Mới nhất".
  3. **Tìm kiếm Cửa hàng**: Chuyển sang ô tìm kiếm Shop để tra cứu gian hàng.
  4. **Xem chi tiết**: Bấm vào một sản phẩm để xem chi tiết ảnh, giá tiền VND, mô tả và nút "Thêm vào giỏ hàng".

---

### Kịch Bản 6: Giỏ Hàng & Đặt Hàng Đa Shop (Multi-Shop Checkout)
- **Tài khoản**: `user1`
- **Truy cập**: `/cart`
- **Các bước**:
  1. Thêm 2-3 sản phẩm thuộc các shop khác nhau vào giỏ.
  2. Mở `/cart`:
     - Các sản phẩm được **tự động phân nhóm theo từng Cửa hàng (Shop)** rõ ràng.
     - Thay đổi số lượng sản phẩm (+ / -), kiểm tra tổng tiền tính đúng thời gian thực.
  3. Nhập địa chỉ nhận hàng (ví dụ: "123 Đường Lê Lợi, Quận 1, TP.HCM").
  4. Nhấn **"Tiến hành đặt hàng"**:
     - Hệ thống gọi `POST /api/orders/checkout`.
     - Tự động tách thành các đơn hàng độc lập cho từng Shop.
     - Giỏ hàng được xóa sạch và tự động chuyển hướng đến trang `/orders`.

---

### Kịch Bản 7: Quản Lý Đơn Hàng & Luật Hủy Đơn (Buyer Orders)
- **Tài khoản**: `user1`
- **Truy cập**: `/orders`
- **Quan sát**:
  1. Danh sách đơn hàng hiển thị cùng tiến trình trạng thái trực quan: `Chờ duyệt` → `Đã nhận` → `Chuẩn bị` → `Chờ lấy` → `Đang giao` → `Hoàn thành`.
  2. **Kiểm tra luật hủy đơn**:
     - Đơn hàng ở trạng thái **`Pending` (Chờ duyệt)**: Nút **"Hủy đơn hàng"** hiển thị màu đỏ. Bấm thử → Đơn chuyển sang `Cancelled` (Đã hủy).
     - Đối với các đơn hàng ở trạng thái khác (`Confirmed`, `Preparing`, v.v.): **Tuyệt đối không có nút Hủy đơn**.

---

### Kịch Bản 8: Quy Trình Chủ Shop Xử Lý Đơn & Doanh Thu (Shop Owner)
- **Đăng nhập**: `shopowner1` (mật khẩu: `Shop@123`)
- **Truy cập**: `/shop-owner`
- **Các bước**:
  1. **Tab Đơn hàng**:
     - Tìm đơn hàng mới ở trạng thái `Pending` → Bấm nút **"Xác nhận đơn"** (chuyển sang `Confirmed`).
     - Bấm tiếp nút **"Bắt đầu chuẩn bị hàng"** (chuyển sang `Preparing`).
     - Bấm tiếp nút **"Hàng đã sẵn sàng (Chờ Shipper)"** (chuyển sang `WaitingForPickup`).
  2. **Tab Quản lý sản phẩm**:
     - Thêm sản phẩm mới với tên, giá, số lượng tồn kho.
     - Upload ảnh sản phẩm.
  3. **Tab Doanh thu**:
     - Chọn khoảng ngày từ đầu tháng đến hiện tại.
     - Hệ thống tính tổng doanh thu **chỉ từ các đơn hàng có trạng thái `Delivered` kèm `DeliveredAt` hợp lệ**.

---

### Kịch Bản 9: Quy Trình Giao Vận & Xử Lý Tranh Chấp (Shipper)
- **Đăng nhập**: `shipper1` (mật khẩu: `Shipper@123`)
- **Truy cập**: `/shipper`
- **Các bước**:
  1. **Tab Đơn chờ nhận**:
     - Hiển thị danh sách các đơn hàng ở trạng thái `WaitingForPickup`.
     - Bấm nút **"Nhận giao đơn này"**: Đơn được gán cho `shipper1` và chuyển sang tab "Đơn của tôi".
     - *Kiểm tra tính an toàn (Concurrency 409)*: Nếu 2 shipper cùng bấm nhận 1 đơn, hệ thống backend từ chối đơn thứ hai với mã lỗi `409 Conflict`, giao diện hiển thị thông báo lỗi rõ ràng và cập nhật lại danh sách.
  2. **Tab Đơn của tôi**:
     - Đơn hàng đang ở trạng thái `WaitingForPickup`: Bấm nút **"Đã lấy hàng từ Shop (Bắt đầu giao)"** → Trạng thái chuyển sang `Shipping`.
     - Bấm tiếp **"Đã giao đến tay khách (Hoàn tất)"** → Trạng thái chuyển sang `Delivered`.
  3. **Tab Thu nhập Shipper**:
     - Xem tổng số đơn đã giao thành công và tổng tiền công vận chuyển.

---

### Kịch Bản 10: Quản Trị Hệ Thống (Admin Dashboard)
- **Đăng nhập**: `admin` (mật khẩu: `Admin@123`)
- **Truy cập**: `/admin`
- **Các bước**:
  1. **Tab Người dùng**: Xem danh sách tài khoản người dùng, vai trò, số điện thoại/email, trạng thái hoạt động. Thử bấm Khóa/Mở khóa tài khoản.
  2. **Tab Bài viết**: Xem danh sách bài viết trên mạng xã hội, xóa bài viết có nội dung vi phạm.
  3. **Tab Doanh thu sàn**: Xem tổng doanh thu của toàn bộ nền tảng.
  4. **Tab Danh mục**: Tạo thêm danh mục sản phẩm mới cho sàn thương mại.

---

### Kịch Bản 11: Trò Chuyện Thời Gian Thực (SignalR Chat)
1. Mở 2 cửa sổ trình duyệt (hoặc 1 cửa sổ thường + 1 cửa sổ ẩn danh):
   - Cửa sổ A: Đăng nhập `user1`.
   - Cửa sổ B: Đăng nhập `shopowner1`.
2. Ở cửa sổ A, vào mục **"Trò chuyện"** (`/chat`), bấm **"Cuộc trò chuyện mới"**, nhập mã User ID của `shopowner1`.
3. Nhập tin nhắn "Xin chào Shop, sản phẩm này còn hàng không?" và nhấn Gửi.
4. **Quan sát ở cửa sổ B**: Tin nhắn hiển thị ngay tức thì mà không cần tải lại trang.

---

### Kịch Bản 12: Thông Báo Thời Gian Thực (Realtime Notifications)
1. Ở cửa sổ A (`user1`), vào `/orders` hoặc tương tác Like/Follow tài khoản ở cửa sổ B.
2. **Quan sát cửa sổ B**:
   - Biểu tượng **Chuông thông báo** trên Header và Sidebar nhảy số đếm chưa đọc (`badge`) ngay lập tức thông qua SignalR.
   - Vào trang `/notifications`: Hiển thị thông báo chi tiết vừa phát sinh (ví dụ: "Có người theo dõi bạn", "Đơn hàng của bạn đã được cập nhật").
   - Bấm nút **"Đánh dấu tất cả đã đọc"** → Badge về 0.

---

### Kịch Bản 13: Trợ Lý AI Chatbot Cục Bộ (Ollama SSE Streaming)
- **Truy cập**: `/assistant`
- **Các bước**:
  1. Nhập câu hỏi, ví dụ: *"Tư vấn cho tôi cách phối đồ mùa hè năng động"* hoặc *"MySocialApp có những tính năng gì?"*.
  2. Nhấn Gửi.
  3. **Quan sát hiệu ứng**:
     - Trạng thái ban đầu: Hiển thị badge **"Đang suy nghĩ..."** kèm biểu tượng loading.
     - Khi token đầu tiên về: Từng từ được render tuần tự mượt mà ra giao diện qua SSE `POST /api/chatbot/chat/stream`.
     - Khi hoàn thành: Hiển thị chỉ số thời gian xử lý và tổng số tokens.
  4. Bấm nút **"Xóa ngữ cảnh hội thoại"**: Phiên hội thoại trượt 5 phút được làm mới hoàn toàn.

---

### Kịch Bản 14: Trang Cá Nhân & Đổi Ảnh Đại Diện (Profile)
- **Truy cập**: `/profile`
- **Các bước**:
  1. Xem thông tin cá nhân: Tên hiển thị, username, vai trò, bio, ngày tham gia, danh sách bài viết đã đăng.
  2. Bấm **"Chỉnh sửa thông tin"**: Sửa tên hiển thị hoặc bio → Nhấn Lưu thay đổi.
  3. Bấm vào biểu tượng **Máy ảnh** trên avatar: Chọn một file ảnh từ máy tính → Hệ thống upload và tự động chuyển đổi sang định dạng WebP, avatar cập nhật ngay trên Header và trang cá nhân.
