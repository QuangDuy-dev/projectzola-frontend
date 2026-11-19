# HANDOFF — Zalo Pro Chat cho Web App (Pha 2, làm 1 lượt)

## Goal
Backend (`D:\Projectzola\sever`) đã xong: build 0 lỗi, `dotnet test` 214/215 pass (1 lỗi có sẵn từ trước: `Register_NewUser_ReturnsCreated`, do SMTP thật nên `DevOtpHint` null — KHÔNG phải việc của bạn).
Swarm hết quota nên **toàn bộ Web App cho chat mới chưa được làm** (kể cả phần lõi Types/Services/SignalR). Dev 2 làm hết theo thứ tự milestone bên dưới.

Tính năng cần có trên Web: Group Chat kiểu Zalo Pro, Voice Message (ghi âm + sóng âm + tốc độ 1x/1.5x/2x), gửi nhiều ảnh (≤10) / 1 video (thư viện + camera trực tiếp), Reply, Reaction, Pin, @mention, Poll, Mute, Link mời, duyệt thành viên, trạng thái online bạn bè.

## Reference Files (nguồn sự thật – chỉ ĐỌC)
- Copy hợp đồng backend: `docs/refs/chat-dtos/*.cs` (mọi DTO, `IChatClient.cs` = danh sách sự kiện SignalR, `ConversationsController.cs` + `PresenceController.cs` = route/verb/body thật).
- Quy ước: JSON camelCase; mọi enum trong DTO là **string** (`"Direct"|"Group"`, `"Member"|"Admin"|"Owner"`, `"Text"|"Image"|"Video"|"Voice"|"Poll"|"System"`, `"Image"|"Video"|"Audio"`, `"Pending"|"Approved"|"Rejected"`). Response bọc `ApiResponse<T>` (`res.data.data`).
- Web hiện có cần mở rộng: `src/features/chat/ChatPage.tsx`, `src/hooks/useChat.ts`, `src/services/signalr/chatHubClient.ts`, `src/services/api/services.ts` (`chatService`), `src/types/index.ts`, `src/features/profile/ActiveSessionsPanel.tsx` (mẫu style: inline style + CSS var, `Card/Button/Badge`, `lucide-react`).
- Hành vi quan trọng của API: gửi media = `multipart` `POST /api/conversations/{id}/messages/media` (field `files` lặp, `content?`, `replyToMessageId?`, `clientMessageId?`, `mentionedUserIds?`, `mentionAll?`); voice = `POST .../messages/voice` (`audio`, `durationSeconds?`, `waveformJson?`, ...). Tạo nhóm = `POST /api/conversations/groups` (JSON), đổi ảnh nhóm = `POST /api/conversations/{id}/avatar` (multipart `file`). Trong nhóm bật `onlyAdminsCanSend` thì Member bị 403.

## Allowed Files
- `src/types/index.ts`, `src/services/api/services.ts`, `src/services/signalr/chatHubClient.ts`, `src/hooks/useChat.ts`, `src/hooks/usePresence.ts` (mới), `src/hooks/useVoiceRecorder.ts` (mới), `src/hooks/useCameraCapture.ts` (mới)
- `src/features/chat/**` (mới/sửa), `src/features/chat/components/**`
- `src/__tests__/chat*.test.ts(x)` (mới)
- `src/utils/**` (helper mới: waveform, mention, formatDuration)
- `HANDOFF.md` (Worker Report)

## Forbidden
- Không cài package npm mới (dùng `MediaRecorder`, `getUserMedia`, Web Audio API gốc của trình duyệt).
- Không sửa `D:\Projectzola\sever`, không sửa `src/stores/*`, `src/services/api/apiClient.ts` (refresh interceptor), `src/__tests__/auth*.test.ts`, `activeSessionsUi.test.ts`.
- Không chạm `main`. Không phá route/props chat hiện tại (test `chatOrdering`, `chatInputResolution` phải vẫn xanh).

## Milestones (1 commit / milestone, theo thứ tự)

### M1 — Lõi: Types + Services + SignalR (viết test trước, TDD)
- [ ] `types/index.ts`: thêm type khớp 1-1 với `docs/refs/chat-dtos` (Conversation/Member/Message mở rộng, MessageAttachment, ReactionSummary, ReplyPreview, ChatPoll*, Group*Request/Event, OnlineFriend, UserPresenceStatus…). Giữ field cũ để không vỡ code hiện tại.
- [ ] `services.ts` `chatService`: thêm toàn bộ route nhóm/media/voice/pin/reaction/poll/invite/join-request + `presenceService` (`getOnlineFriends`, `batch`). Upload dùng `FormData` (KHÔNG tự set Content-Type).
- [ ] `chatHubClient.ts`: đăng ký thêm sự kiện `GroupUpdated, GroupMemberAdded, GroupMemberRemoved, GroupDisbanded, MessageReactionUpdated, MessagePinned, MessageUnpinned, PollUpdated, JoinRequestUpdated` (tên đúng như `IChatClient.cs`), `UserPresenceChanged` đã có.
- [ ] `useChat.ts`: cập nhật cache TanStack Query bằng `setQueryData` cho từng sự kiện (reaction, pin, poll, thành viên, đổi tên/ảnh nhóm, giải tán); hiển thị tin `System`; gỡ `refetchInterval` polling khi SignalR đang `Connected` (đặt ≥ 15s dự phòng).
- [ ] Test Vitest mới (mock service/hub): reducer cache cho reaction toggle, pin/unpin, poll vote, member removed, `groupDisbanded`; chạy xanh.

### M2 — Presence (online bạn bè)
- [ ] `usePresence.ts`: `useQuery(['presence','online-friends'])` + cập nhật realtime từ `UserPresenceChanged`; helper `isOnline(userId)`.
- [ ] Component `OnlineFriendsBar` (thanh avatar ngang đầu danh sách chat, chấm xanh, tooltip "Hoạt động X phút trước" từ `lastSeenAt`), chấm online trên avatar ở danh sách hội thoại & header phòng chat. Bấm avatar → mở/tạo chat 1-1.

### M3 — Group Chat kiểu Zalo
- [ ] `CreateGroupModal` (tên, chọn thành viên từ OnlineFriends/bạn bè, ảnh nhóm tùy chọn).
- [ ] `GroupInfoPanel` (drawer): đổi tên/ảnh, danh sách thành viên + badge Trưởng/Phó nhóm + chấm online, menu theo quyền (Owner: thăng/hạ Phó nhóm, chuyển trưởng nhóm, kick, giải tán; Admin: kick Member, duyệt yêu cầu; Member: biệt danh, rời nhóm), công tắc `onlyAdminsCanSend` / `requireJoinApproval` / link mời (copy + đặt lại), tắt thông báo (Mute: 1h/8h/24h/mãi mãi), danh sách yêu cầu chờ duyệt (approve/reject).
- [ ] `JoinByInvitePage` route `/chat/invite/:code` (preview nhóm → Tham gia / Gửi yêu cầu).
- [ ] Ô nhập bị khóa khi `onlyAdminsCanSend` và bạn là Member (hiện banner "Chỉ trưởng/phó nhóm được nhắn"); nhóm `isDisbanded` → chỉ đọc.
- [ ] Render tin `System` dạng dòng giữa màn hình.

### M4 — Reply / Reaction / Pin / @mention
- [ ] Menu tin nhắn (hover/long-press): Trả lời, Thả cảm xúc (👍❤️😂😮😢😡), Ghim/Bỏ ghim (theo quyền), Sửa/Thu hồi (đã có, giữ).
- [ ] `ReplyPreviewBar` trên ô nhập + khối trích dẫn trong bubble (bấm → cuộn tới tin gốc).
- [ ] Hàng reaction dưới bubble (đếm + highlight `reactedByCurrentUser`).
- [ ] `PinnedMessagesBar` đầu phòng chat (lấy `/pinned-messages`, bấm → cuộn tới tin).
- [ ] @mention: gõ `@` hiện danh sách thành viên (chọn → chèn chip, gửi `mentionedUserIds`; "@Tất cả" → `mentionAll`, chỉ trong nhóm); highlight mention trong bubble.

### M5 — Ảnh/Video trong chat (thư viện + camera)
- [ ] `AttachmentPicker`: chọn nhiều file (`accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"`), validate client trước: ≤10 ảnh HOẶC đúng 1 video (không trộn), ảnh ≤ giới hạn backend, video ≤ 50MB; preview thumbnail + nút xoá + caption.
- [ ] `CameraCaptureModal`: `getUserMedia({video:true})`, nút chụp ảnh (canvas → Blob `image/jpeg`), nút quay video (`MediaRecorder` → `video/webm`, tối đa 60s, đếm giờ), xin quyền lỗi → thông báo tiếng Việt, luôn `track.stop()` khi đóng. Kết quả đưa vào cùng luồng preview như AttachmentPicker.
- [ ] Hiển thị bubble: lưới ảnh 1–10 (bấm mở lightbox), video có poster `thumbnailUrl` + player (dùng `SafeVideo`/`resolveMediaUrl`).
- [ ] Trạng thái đang upload (progress qua `onUploadProgress`) + lỗi gửi + thử lại.

### M6 — Voice Message
- [ ] `useVoiceRecorder.ts`: `MediaRecorder` chọn mimeType hỗ trợ (`audio/webm;codecs=opus` → `audio/mp4` cho Safari), đếm giờ, tối đa 300s, hủy/gửi, lấy mảng waveform (AnalyserNode) ≤128 giá trị 0..1 → `waveformJson`, `durationSeconds`.
- [ ] `VoiceRecorderBar` (nút mic giữ/bấm, timer, nút hủy/gửi, hiệu ứng sóng).
- [ ] `VoiceMessageBubble`: play/pause, vẽ sóng âm từ `waveformJson`, thanh tiến trình tua được, nút tốc độ 1x/1.5x/2x, thời lượng; chỉ phát một voice tại một thời điểm.

### M7 — Poll + Mute + hoàn thiện
- [ ] `CreatePollModal` (câu hỏi ≤300, 2–10 lựa chọn ≤200, nhiều lựa chọn?, ẩn danh?, hạn chót) + `PollBubble` (thanh % , bỏ phiếu/đổi phiếu realtime qua `PollUpdated`, nút đóng cho người tạo/Admin, ẩn danh thì không hiện voter).
- [ ] Icon chuông mute trên hội thoại bị tắt thông báo; không tăng badge/âm báo cho hội thoại đang mute.
- [ ] Responsive 375px & 1280px; đủ 3 trạng thái Loading/Empty/Error tiếng Việt cho mọi panel mới.

## Verification Commands
Chạy trong `D:\Projectzola\client\web app-worker` (thiếu `node_modules` thì `npm ci`):
```bash
npx tsc --noEmit
npm test
npm run build
```
Nếu có thể, chạy thật backend (`dotnet run` ở `src/MySocialApp.Api`, cần `dotnet ef database update` cho migration `AddRichChatGroupsAndPresence`) và tự thử 2 tài khoản `user1` / `shopowner1` trên 2 trình duyệt: tạo nhóm, gửi ảnh/video/voice, reaction, poll, online.

## Git Rule
Chỉ commit trên `worker/tasks` (đã đồng bộ với `main`). Lỗi `dubious ownership`: `git config --global --add safe.directory '*'`. Không đụng `main`.

## Việc còn lại KHÔNG giao Dev 2 (Dev 1 làm khi quay lại)
- Chạy `verifier` nghiệm thu độc lập backend (swarm hết quota giữa chừng; chưa có bản xác nhận cuối).
- Áp migration vào DB thật và test thủ công API trên Swagger; kiểm tra FFmpeg có trên máy để transcode voice/video.
- Cân nhắc sửa test `Register_NewUser_ReturnsCreated` (phụ thuộc SMTP thật).

## Worker Report

### 1. Danh sách commit theo từng Milestone trên nhánh `worker/tasks`
- **M1 (Commit `9d446ef`):** `feat(chat): M1 - add rich chat types, services, hub events and reducers`
  - Đầy đủ types mở rộng theo backend (`docs/refs/chat-dtos/*.cs`), API routes `chatService` + `presenceService`, 9 sự kiện SignalR mới trong `chatHubClient`, query cache reducers trong `useChat.ts` và `chatReducers.ts`, test `chatReducers.test.ts` (5/5 pass).
- **M2 (Commit `c2c72ff`):** `feat(chat): M2 - add friends presence, online status bar and indicators`
  - Hook `usePresence.ts` (presence query + realtime event `UserPresenceChanged`), thanh `OnlineFriendsBar` avatar ngang, chấm xanh online và text "Hoạt động X phút trước" trên avatar danh sách hội thoại và header chat, test `chatPresence.test.ts` (2/2 pass).
- **M3 (Commit `a3400b1`):** `feat(chat): M3 - add Zalo Pro group chat, management drawer, and invite join page`
  - Modal tạo nhóm `CreateGroupModal`, drawer quản trị nhóm `GroupInfoPanel` (đổi tên/ảnh nhóm, thăng/hạ Phó nhóm, chuyển quyền Owner, kick thành viên, giải tán nhóm, toggle chỉ trưởng/phó nhóm gửi tin, toggle duyệt thành viên, copy/reset link mời, mute thông báo, duyệt join requests), trang tham gia theo link `JoinByInvitePage` (`/chat/invite/:code`), quy tắc khóa input `canUserSendMessage`, render tin System ở giữa màn hình, test `chatGroupRules.test.ts` (4/4 pass).
- **M4 (Commit `da12e34`):** `feat(chat): M4 - add reply, reactions, message pinning, and at-mentions`
  - Menu hover tin nhắn (Thả cảm xúc, Trả lời, Ghim/Bỏ ghim, Thu hồi), hàng reactions dưới bubble (`MessageReactionsRow`), popup chọn nhanh cảm xúc (`QuickReactionPicker`), thanh ghim đầu phòng chat (`PinnedMessagesBar`) nhảy tới tin nhắn, thanh xem trước trích dẫn (`ReplyPreviewBar`) và quote block trong bubble, autocomplete `@` mention gợi ý thành viên / `@Tất cả` (`MentionSuggestionsPopup`) và highlight mention, test `chatMentions.test.ts` (3/3 pass).
- **M5 (Commit `fe09113`):** `feat(chat): M5 - add multi-image and camera video attachment upload`
  - Chọn nhiều ảnh (≤10 ảnh) hoặc 1 video (≤50MB) với validation client (`chatMediaHelper.ts`), preview đính kèm (`AttachmentPicker`) kèm thanh tiến trình upload và nút xóa/thử lại, modal camera trực tiếp (`CameraCaptureModal`) qua `getUserMedia` chụp ảnh / quay video (≤60s) đóng track sạch sẽ, hiển thị lưới ảnh 1-10 kèm `MediaLightboxModal` phóng to tải về và `SafeVideo` cho video, test `chatMedia.test.ts` (8/8 pass).
- **M6 (Commit `98aa553`):** `feat(chat): M6 - add voice recording, waveform visualization and audio player`
  - Hook ghi âm `useVoiceRecorder.ts` (Web Audio API AnalyserNode lấy waveform mảng float ≤128 điểm, timer ≤300s, MediaRecorder `audio/webm;codecs=opus` / `audio/mp4`), thanh điều khiển ghi âm `VoiceRecorderBar` (sóng âm trực tiếp, timer, nút hủy, nút gửi), phát tin nhắn thoại `VoiceMessageBubble` (play/pause, thanh sóng âm tua được, toggle tốc độ 1x/1.5x/2x, cơ chế `audioPlayerManager` đảm bảo chỉ phát 1 voice tại 1 thời điểm), test `chatVoice.test.ts` (4/4 pass).
- **M7 (Commit `a70871b`):** `feat(chat): M7 - add poll creation and voting, conversation mute, and polish`
  - Modal tạo bình chọn `CreatePollModal` (câu hỏi ≤300 ký tự, 2-10 lựa chọn, toggle nhiều lựa chọn, ẩn danh, thời hạn), bong bóng bình chọn `PollBubble` (thanh % tiến trình realtime qua SignalR `PollUpdated`, toggle bỏ phiếu/đổi phiếu, nút đóng bình chọn cho creator/admin, ẩn danh không lộ voter), icon chuông `BellOff` trên hội thoại đang mute, responsive hoàn chỉnh 375px mobile (nút quay lại, ẩn/hiện danh sách linh hoạt) & 1280px desktop, đủ trạng thái Loading/Empty/Error tiếng Việt, test `chatPoll.test.ts` (4/4 pass).

### 2. Kết quả 3 lệnh kiểm tra (Verification Commands)
1. `npx tsc --noEmit`
   - **Kết quả:** `Exit code 0` (0 errors).
2. `npm test`
   - **Kết quả:** `Exit code 0` (18/18 test files passed, 88/88 tests passed).
   - Bao gồm toàn bộ test gốc (`chatOrdering`, `chatInputResolution`, `authStore`, `activeSessionsUi`...) và 6 test suite mới (`chatReducers`, `chatPresence`, `chatGroupRules`, `chatMentions`, `chatMedia`, `chatVoice`, `chatPoll`).
3. `npm run build`
   - **Kết quả:** `Exit code 0` (`tsc -b && vite build` hoàn tất xuất sắc, bundle tạo trong thư mục `dist`).

### 3. Phần việc của Dev 2
- Toàn bộ 7 Milestone (M1 → M7) đã được triển khai, kiểm thử, tích hợp và commit hoàn tất 100% trên nhánh `worker/tasks` theo đúng quy ước và không vi phạm bất kỳ file cấm nào.
