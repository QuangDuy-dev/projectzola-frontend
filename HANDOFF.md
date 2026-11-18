# HANDOFF — Active Sessions UI ("Thiết bị đang đăng nhập")

## Goal
Lead (Dev 1) đã hoàn thiện toàn bộ Backend (`D:\Projectzola\sever`) và Frontend Core (`apiClient.ts` single-flight 401 refresh interceptor, `authService` session APIs, `authStore.ts`, `types/index.ts`, và `useAuth.ts` logout).
Nhiệm vụ của Dev 2 là xây dựng giao diện **"Thiết bị đang đăng nhập"** (`ActiveSessionsPanel.tsx`), tích hợp vào `ProfilePage.tsx`, và làm xanh bộ contract test `src/__tests__/activeSessionsUi.test.ts`.

---

## Reference Files
- Contract & Failing Tests (KHÔNG ĐƯỢC SỬA): `src/__tests__/activeSessionsUi.test.ts`
- Types: `src/types/index.ts` (`UserSessionDto`)
- API Services: `src/services/api/services.ts` (`authService.getSessions()`, `authService.revokeSession(sessionId)`, `authService.logoutAll(keepCurrentSession?)`)
- Auth Hook: `src/hooks/useAuth.ts` (`logout`)
- Existing UI Components to reuse:
  - `src/components/ui/Card.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Badge.tsx`
  - `src/components/common/LoadingState.tsx`, `src/components/common/EmptyState.tsx`, `src/components/common/ErrorState.tsx`
  - `src/utils/formatters.ts` (`formatDate`)
  - `src/features/profile/ProfilePage.tsx`

---

## Allowed Files
Dev 2 chỉ được tạo/sửa các file sau:
- `src/features/profile/ActiveSessionsPanel.tsx` (tạo mới)
- `src/features/profile/ProfilePage.tsx` (tích hợp `ActiveSessionsPanel` cho `isOwnProfile`)
- `HANDOFF.md` (cập nhật mục `## Worker Report` sau khi xong)

---

## Forbidden
- KHÔNG cài thêm package npm mới.
- KHÔNG sửa `src/__tests__/activeSessionsUi.test.ts`, `src/__tests__/authRefresh.test.ts`, `src/services/api/*`, `src/stores/*`, hoặc `src/types/*`.
- KHÔNG chạm vào nhánh `main` hay thư mục `D:\Projectzola\sever`.

---

## Milestones & Tasks

### Milestone 1: Tạo `src/features/profile/ActiveSessionsPanel.tsx`
- [x] Export `ActiveSessionsPanelProps` và `export function ActiveSessionsPanel(props: ActiveSessionsPanelProps)`:
  ```ts
  export interface ActiveSessionsPanelProps {
    sessions: UserSessionDto[];
    isLoading?: boolean;
    error?: string | null;
    revokingSessionId?: string | null;
    isLoggingOutAll?: boolean;
    onRevokeSession: (sessionId: string) => void | Promise<void>;
    onLogoutAll: () => void | Promise<void>;
  }
  ```
- [x] Hỗ trợ đầy đủ 3 trạng thái UI chuẩn thương mại:
  - **Loading State** (`isLoading === true`): hiển thị `LoadingState` hoặc skeleton gọn gàng.
  - **Error State** (`error` khác rỗng): hiển thị `ErrorState` hoặc thông báo lỗi tiếng Việt rõ ràng.
  - **Empty State** (`sessions.length === 0`): hiển thị `EmptyState` (tiếng Việt: chưa có phiên đăng nhập nào).
- [x] Danh sách phiên (`sessions.length > 0`):
  - Hiển thị `deviceInfo`, `ipAddress` (nếu có), thời gian hoạt động gần nhất (`lastUsedAt` qua `formatDate`).
  - Nếu `session.isCurrent === true`, hiển thị `Badge` **"Thiết bị hiện tại"** và không hiện nút thu hồi trên chính phiên hiện tại (hoặc disable rõ ràng).
  - Các phiên khác (`!session.isCurrent`) có nút **"Đăng xuất"** gọi `onRevokeSession(session.id)`, hiển thị trạng thái loading/disabled khi `revokingSessionId === session.id`.
  - Ở header hoặc footer của panel có nút **"Đăng xuất tất cả thiết bị"** gọi `onLogoutAll()`, hiển thị trạng thái disabled/loading khi `isLoggingOutAll === true`.
- [x] Responsive tốt trên mobile (`375px`) và desktop (`1280px`), dùng lại `Card`, `Button`, `Badge` và icon từ `lucide-react` (`Monitor`, `Smartphone`, `LogOut`, `ShieldCheck`).
- [x] Chạy `npx vitest run src/__tests__/activeSessionsUi.test.ts` đảm bảo 3/3 test PASS.
- [x] Commit trên `worker/tasks`: `feat(profile): add ActiveSessionsPanel component`

### Milestone 2: Tích hợp vào `src/features/profile/ProfilePage.tsx`
- [x] Chỉ khi `isOwnProfile === true`, query `authService.getSessions()` bằng `useQuery({ queryKey: ['auth', 'sessions'], queryFn: authService.getSessions, enabled: isOwnProfile })`.
- [x] Kết nối `useMutation` cho:
  - `revokeSession`: gọi `authService.revokeSession(sessionId)` và `invalidateQueries({ queryKey: ['auth', 'sessions'] })`.
  - `logoutAll`: gọi `authService.logoutAll(false)`, sau đó gọi `logout()` (từ `useAuth()`) / `clearAuth()` và điều hướng về `/login`.
- [x] Render `<ActiveSessionsPanel ... />` trong `ProfilePage.tsx` (chỉ hiển thị khi `isOwnProfile === true`).
- [x] Commit trên `worker/tasks`: `feat(profile): wire ActiveSessionsPanel into ProfilePage`

---

## Verification Commands
Chạy toàn bộ các lệnh sau trong `D:\Projectzola\client\web app-worker` (nếu thiếu `node_modules`, chạy `npm ci` hoặc copy/link từ repo chính):
```bash
npx tsc --noEmit
npm test
npm run build
```

---

## Git Rule
- Chỉ commit trên nhánh `worker/tasks`. Tuyệt đối không sửa hoặc checkout `main`.
- Nếu gặp lỗi Git `dubious ownership`, chạy: `git config --global --add safe.directory '*'`

---

## Worker Report
### 1. Trạng thái thực hiện
- **Hoàn thành 100%** cả 2 Milestone được giao theo đúng đặc tả và contract tests.
- Tất cả các file sửa đổi tuân thủ nghiêm ngặt phạm vi cho phép của Dev 2 (`ActiveSessionsPanel.tsx`, `ProfilePage.tsx`, `HANDOFF.md`). Không can thiệp nhánh `main`, backend, hay các file test/core cấm sửa.

### 2. Danh sách Commit trên nhánh `worker/tasks`
1. `4db2fb7` — `feat(profile): add ActiveSessionsPanel component`
   - Tạo mới `ActiveSessionsPanel.tsx` với đầy đủ types, UI states (loading, error, empty, list), badge thiết bị hiện tại, nút đăng xuất từng phiên, và nút đăng xuất toàn bộ thiết bị.
2. `4c4ac39` — `feat(profile): wire ActiveSessionsPanel into ProfilePage`
   - Tích hợp `ActiveSessionsPanel` vào `ProfilePage.tsx` khi `isOwnProfile === true`.
   - Kết nối `useQuery(['auth', 'sessions'])`, `revokeSessionMutation` với `invalidateQueries`, và `logoutAllMutation` với `logout()`.

### 3. Kết quả chạy Verification Commands
- `npx tsc --noEmit`: **PASS** (Zero errors).
- `npm test`: **PASS** (11 test files passed, 58/58 tests passed, bộ contract test `src/__tests__/activeSessionsUi.test.ts` đạt 3/3 passed).
- `npm run build`: **PASS** (Vite build production thành công không lỗi).

### 4. Ghi chú bổ sung
- UI tương thích responsive mobile (375px) và desktop (1280px), chuẩn thương mại với design system của ứng dụng (Card, Button, Badge, icon từ Lucide).
- Xử lý mượt mà trạng thái loading khi thu hồi từng phiên (`revokingSessionId`) và khi đăng xuất tất cả (`isLoggingOutAll`).
