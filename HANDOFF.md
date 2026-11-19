# HANDOFF: WebRTC Voice & Video Call 1-1 UI & UX (Dev 2 Worker)

Tài liệu bàn giao nhiệm vụ phát triển giao diện Cuộc gọi Thoại & Video Call 1-1 chuẩn Zalo cho **Dev 2 (Worker)**.
Toàn bộ Lõi Backend, Database Migration, SignalR Hub, WebRTC Media Engine, Call State Machine (`CallContext`, `useCall`, `useWebRTC`, `ringtoneService`) đã được **Dev 1 (Lead)** hoàn thành và kiểm thử 100% xanh trên `main`.

---

## 1. Thông Tin Môi Trường & Quy Định Thực Thi
- **Thư mục làm việc:** `D:\Projectzola\client\web app-worker`
- **Branch:** `worker/tasks` (Đã được fast-forward đồng bộ mới nhất từ `main`)
- **Quy tắc bất di bất dịch:**
  - Không sửa đổi database hay backend API (phần này Dev 1 đã chốt và test pass).
  - Không sửa đổi core logic trong `src/features/call/contexts/CallContext.tsx` hoặc `src/features/call/hooks/useWebRTC.ts` trừ khi cần gắn thêm state UI.
  - Sử dụng toàn bộ các hook và hàm có sẵn từ `useCall()`:
    `callState`, `activeSession`, `callType`, `durationSeconds`, `isMinimized`, `partnerInfo`, `localStream`, `remoteStream`, `isMuted`, `isVideoOff`, `isScreenSharing`, `startCall`, `acceptCall`, `rejectCall`, `endCall`, `toggleMute`, `toggleVideo`, `toggleScreenShare`, `toggleMinimize`.
  - Giữ vững tiêu chuẩn sản phẩm thương mại: Hiệu ứng chuyển động mượt mà, hỗ trợ Dark/Light theme, có đầy đủ tooltip và trạng thái kéo thả.

---

## 2. Danh Sách Milestone Cần Thực Hiện

### Milestone 1: Hoàn thiện `IncomingCallDialog.tsx`
- **File:** `src/features/call/components/IncomingCallDialog.tsx`
- **Nhiệm vụ:**
  - Hiển thị thông báo cuộc gọi đến ở góc trên-phải (hoặc giữa màn hình dạng card nổi z-index 99999).
  - Avatar người gọi có hiệu ứng vòng tròn tỏa sóng xung động (pulse/ripple wave animation) tạo cảm giác chuông reo sinh động.
  - Tên người gọi, nhãn phân loại rõ ràng: "Cuộc gọi thoại đến..." hoặc "Cuộc gọi video đến...".
  - Nút **Từ chối** (đỏ) và nút **Trả lời** (xanh lá) có icon và nhãn tiếng Việt rõ ràng, hiệu ứng hover/active sắc nét.
  - Khi bấm Trả lời -> gọi `acceptCall()`; khi bấm Từ chối -> gọi `rejectCall()`.

### Milestone 2: Hoàn thiện `ActiveCallWindow.tsx` (Floating PiP & Draggable Window)
- **File:** `src/features/call/components/ActiveCallWindow.tsx`
- **Nhiệm vụ:**
  - **Trạng thái Mở rộng (Expanded):**
    - Khung video chính: `video` element phát `remoteStream` (objectFit: cover, bo góc đẹp).
    - Khung video nhỏ của bản thân (PiP preview): Nằm ở góc trên phải của video chính, phát `localStream`, có hiệu ứng lật gương (`transform: scaleX(-1)`), bo góc và viền nổi.
    - Cuộc gọi thoại (Voice Call): Hiển thị Avatar lớn của đối phương, hiệu ứng sóng âm thanh nhẹ nhàng (equalizer wave effect), tên đối phương và đồng hồ đếm giây đàm thoại (`00:xx`).
    - Nút header: Có thanh kéo (drag handle) hoặc header bar để người dùng có thể kéo thả cửa sổ nổi quanh màn hình.
  - **Trạng thái Thu nhỏ (Minimized PiP Pill):**
    - Khi người dùng bấm nút Thu nhỏ (`isMinimized === true`), cửa sổ co lại thành một viên thuốc (pill) thanh lịch ở góc dưới phải màn hình (`bottom: 1.5rem, right: 1.5rem`).
    - Hiển thị avatar nhỏ, tên người gọi, thời lượng cuộc gọi đang chạy, icon mic gạch chéo nếu đang tắt mic, và nút phóng to để trở lại cửa sổ đầy đủ bất cứ lúc nào.
    - Click vào pill -> mở rộng lại (`toggleMinimize()`).

### Milestone 3: Hoàn thiện `CallControlsBar.tsx`
- **File:** `src/features/call/components/CallControlsBar.tsx`
- **Nhiệm vụ:**
  - Thanh công cụ nổi bo tròn (pill style), nền bán trong suốt `rgba(15, 23, 42, 0.85)` kèm `backdropFilter: 'blur(8px)'`.
  - Các nút điều khiển tròn 42x42px:
    1. **Bật/Tắt Mic:** `toggleMute()`. Khi tắt mic, đổi sang màu đỏ (`#ef4444`) với icon `MicOff`.
    2. **Bật/Tắt Camera:** `toggleVideo()` (chỉ hiện khi `callType === 'Video'`). Khi tắt cam, đổi sang màu đỏ với icon `VideoOff`.
    3. **Chia sẻ màn hình:** `toggleScreenShare()`. Khi đang chia sẻ, đổi sang màu xanh dương (`#0284c7`).
    4. **Thu nhỏ / Mở rộng:** `toggleMinimize()`. Icon `Minimize2` / `Maximize2`.
    5. **Kết thúc cuộc gọi:** `endCall()`. Nút tròn màu đỏ đậm (`#dc2626`) với icon `PhoneOff`.
  - Có tooltip tiếng Việt cho từng nút khi rê chuột.

### Milestone 4: Hoàn thiện `CallLogMessageBubble.tsx` & Nút gọi trong Chat Header
- **Files:**
  - `src/features/call/components/CallLogMessageBubble.tsx`
  - `src/features/chat/ChatPage.tsx`
- **Nhiệm vụ:**
  - Tinh chỉnh bong bóng nhật ký cuộc gọi trong danh sách tin nhắn:
    - Cuộc gọi thành công: Icon điện thoại xanh, thời lượng đàm thoại (`02:15`), nền sáng nhẹ.
    - Cuộc gọi nhỡ hoặc từ chối: Icon điện thoại đỏ gạch chéo (`PhoneMissed`), chữ đỏ "Cuộc gọi thoại nhỡ" / "Cuộc gọi video nhỡ".
    - Nút **"Gọi lại"** nhanh bên cạnh bong bóng: Khi người dùng bấm -> gọi ngay hàm `startCall(...)` với người đối diện tương ứng loại cuộc gọi (Voice hoặc Video).
  - Kiểm tra 2 nút Gọi thoại (`Phone`) và Gọi video (`Video`) trên Thread Header của `ChatPage.tsx` hiển thị cân đối, có hiệu ứng hover đổi màu thương hiệu Zalo.

### Milestone 5: Kiểm Thử & Nghiệm Thu
- Chạy kiểm thử tự động:
  ```powershell
  npm test
  npm run build
  ```
- Đảm bảo toàn bộ 20+ test suite pass 100%, TypeScript build 0 errors, 0 warnings nghiêm trọng.
- Commit toàn bộ thay đổi lên branch `worker/tasks` với commit message rõ ràng:
  `feat(call-ui): complete incoming dialog, draggable pip window, controls bar and call log bubble`

---

## 3. Lệnh Bắt Đầu Dành Cho Dev 2
Khi mở cửa sổ Dev 2, dán lệnh sau để tiến hành:
```
làm theo HANDOFF.md
```

---

## 4. Báo Cáo Nghiệm Thu Của Dev 2 (Worker Report)

### 1. Tiến độ hoàn thành các Milestone
- **Milestone 1 (IncomingCallDialog.tsx):**
  - Hiển thị card thông báo cuộc gọi đến nổi bật với concentric pulsing ripple wave animation (`callRipple`), badge loại cuộc gọi (Voice/Video).
  - Tên người gọi, nhãn phân loại rõ ràng: "Cuộc gọi thoại đến..." / "Cuộc gọi video đến...".
  - Nút Từ chối (đỏ `#ef4444`) và Trả lời (xanh `#22c55e`) kèm icon và hover transition chuẩn Zalo, gọi `rejectCall()` và `acceptCall()`.
- **Milestone 2 (ActiveCallWindow.tsx):**
  - Cửa sổ nổi có khả năng kéo thả tự do quanh màn hình bằng chuột và cảm ứng (`onPointerDown/Move/Up` với `setPointerCapture`), tự động clamp trong phạm vi viewport.
  - Video Call: Stream đối phương toàn màn hình, PiP preview của bản thân ở góc trên-phải có hiệu ứng lật gương (`scaleX(-1)`), border bo góc và shadow nổi bật, badge người gọi kèm timer (`00:xx`).
  - Voice Call: Avatar lớn (96px) với ripple waves, tên người gọi, equalizer wave dạng cột sóng âm thanh nhảy nhịp nhàng (`@keyframes eqWave1..5`), hiển thị thời lượng đàm thoại live.
  - Minimized PiP Pill: Khi thu nhỏ (`isMinimized === true`), co lại thành pill sang trọng ở góc dưới phải (`bottom: 1.5rem, right: 1.5rem`), hiển thị avatar nhỏ, tên, timer, icon mic gạch chéo đỏ nếu đang tắt mic, và nút phóng to (`Maximize2`).
- **Milestone 3 (CallControlsBar.tsx):**
  - Thanh công cụ nổi bo tròn dạng pill (`rgba(15, 23, 42, 0.85)` + `backdropFilter: 'blur(8px)'`), các nút tròn 42x42px với hover scale và shadow.
  - Bật/Tắt Mic (`toggleMute()` -> đổi đỏ `#ef4444` và icon `MicOff`).
  - Bật/Tắt Camera (`toggleVideo()` -> đổi đỏ `#ef4444` và icon `VideoOff` khi tắt cam).
  - Chia sẻ màn hình (`toggleScreenShare()` -> đổi xanh dương `#0284c7`).
  - Thu nhỏ / Mở rộng (`toggleMinimize()` -> `Minimize2` / `Maximize2`).
  - Kết thúc cuộc gọi (`endCall('UserHangup')` -> nút đỏ đậm `#dc2626` với `PhoneOff`).
  - Đầy đủ tooltip tiếng Việt cho từng nút.
- **Milestone 4 (CallLogMessageBubble.tsx & Chat Header):**
  - `CallLogMessageBubble.tsx`: Hiển thị bong bóng nhật ký cuộc gọi trong chat stream. Phân biệt cuộc gọi thành công (icon xanh, thời lượng `02:15`) và cuộc gọi nhỡ/từ chối (icon `PhoneMissed` đỏ, nền đỏ nhẹ, chữ đỏ). Nút "Gọi lại" nhanh gọi `startCall(...)` tương ứng Voice hoặc Video.
  - `ChatPage.tsx`: Tinh chỉnh 2 nút Gọi thoại (`Phone`) và Gọi video (`Video`) trên Thread Header của cuộc trò chuyện 1-1 với hiệu ứng hover xanh thương hiệu Zalo (`rgba(2, 132, 199, 0.12)`), bo tròn, tooltip tiếng Việt rõ ràng.
- **Milestone 5 (Kiểm thử & Nghiệm thu):**
  - Tạo test suite chuyên sâu `src/features/call/__tests__/callUiComponents.test.tsx` (13 unit tests) kiểm thử toàn diện các component M1 -> M4.
  - Đảm bảo 100% test pass và build production không lỗi.

### 2. Kết quả Verification Commands
1. **`npm test`**
   - **Kết quả:** `Exit code 0`
   - **Chi tiết:** 21/21 test files passed, 108/108 unit tests passed (13 test mới trong `callUiComponents.test.tsx` pass toàn bộ).
2. **`npm run build`**
   - **Kết quả:** `Exit code 0`
   - **Chi tiết:** `tsc -b && vite build` biên dịch thành công 2,109 modules trong 748ms, 0 lỗi TypeScript, 0 lỗi build.

