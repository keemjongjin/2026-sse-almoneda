# 🏴‍☠️ DUTCH AUCTION (Mystery Blind Betting Game)

이 프로젝트는 **SSE(단방향 데이터 스트림)**와 **WebSocket(양방향 실시간 통신)**을 활용하여 구현된 **다크웹 컨셉의 더치 경매 심리 게임**입니다.

단순한 경매를 넘어, 시간이 지날수록 가격이 떨어지는 '더치 옥션' 방식과, 구매하기 전까지는 진짜 가치를 알 수 없는 '블라인드 배팅(하이리스크 하이리턴)' 요소를 결합해 극강의 눈치싸움을 유도합니다.
---
<table align="center">
  <tr align="center">
    <td><b>📸 이미지 1 (좌측 상단)</b></td>
    <td><b>📸 이미지 2 (우측 상단)</b></td>
  </tr>
  <tr align="center">
    <td>
      <img src="https://github.com/user-attachments/assets/e3e5f024-7c5a-4fff-97ec-726c04b79178" width="380px" alt="Image 1" />
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/a48e4a9b-6907-4517-9efc-a68011719055" width="380px" alt="Image 2" />
    </td>
  </tr>
  <tr align="center">
    <td><b>📸 이미지 3 (좌측 하단)</b></td>
    <td><b>📸 이미지 4 (우측 하단)</b></td>
  </tr>
  <tr align="center">
    <td>
      <img src="https://github.com/user-attachments/assets/0df50655-f3a3-4f92-ad4e-bf7c01e5c7a3" width="380px" alt="Image 3" />
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/b341b9bc-741e-4ff0-81ec-f9f46b379df8" width="380px" alt="Image 4" />
    </td>
  </tr>
</table>

---

## 📌 주요 특징 및 게임 규칙 (Game Rules)

### 1. 💀 미스터리 아이템과 진품 감정
- 총 10개의 다크웹 미스터리 아이템 중 하나가 무작위로 경매에 올라옵니다.
- **시작 가격(Start Price)**: `50만 P ~ 300만 P` 사이에서 완전 랜덤으로 결정됩니다.
- **진짜 가치(True Value)**: `10만 P ~ 500만 P` 사이에서 서버에 의해 비밀리에 결정됩니다.

### 2. ⏳ 더치 옥션 (Dutch Auction)
- 시작가에서 출발하여 **1초마다 실시간으로 가격이 하락**합니다. (SSE를 통해 동기화)
- 참가자 중 **가장 먼저 [BUY] 버튼을 누른 단 한 사람**이 해당 시점의 가격으로 아이템을 낙찰받습니다.

### 3. 💸 하이리스크 하이리턴 정산 시스템
- 아이템을 낙찰받는 즉시 포인트가 결제되며, 서버가 숨겨진 **진짜 가치(True Value)**를 공개합니다.
- **PROFIT (대박)**: 50만 P에 샀는데 진짜 가치가 200만 P라면? ➔ **+150만 P 순수익!**
- **LOSS (쪽박)**: 뺏길까 봐 250만 P에 샀는데 진짜 가치가 15만 P라면? ➔ **-235만 P 대참사...**

### 4. 미니멀리즘 UI
- 테두리를 최소화하고, Pitch Black 배경에 화이트/그레이 모노스페이스 폰트만을 사용하여 오싹하고 은밀한 감성을 극대화했습니다.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React, Vite, Custom CSS (Fira Code Font, ASCII Art)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose) - `User`, `Auction`, `BidLog` 스키마 설계
- **Communication**:
  - `SSE (Server-Sent Events)`: 경매 상태와 1초마다 떨어지는 째깍째깍 타이머를 클라이언트들에게 가볍게 단방향 브로드캐스트.
  - `WebSocket (Socket.io)`: 가장 빨리 [BUY] 버튼을 누른 사람을 판별하는 실시간 트랜잭션 및 유저 간 채팅 통신.

---

## 🚀 실행 방법 (Execution Guide)

이 프로젝트는 `backend`와 `frontend` 두 개의 디렉토리로 나뉘어 있습니다.
실행을 위해 **터미널을 2개** 열어주세요.

### 사전 요구사항
- Node.js 설치 완료
- **로컬 MongoDB** (포트 27017) 구동 중이어야 합니다. (`mongodb://127.0.0.1:27017/sse-almoneda-db` 연결)

### 1. 백엔드 실행 (터미널 1)
```bash
cd backend
npm install
npm run start
```
> 서버가 정상적으로 실행되면 `MongoDB 연결 성공` 및 `서버가 포트 4000에서 실행 중입니다.` 메시지가 나타납니다.

### 2. 프론트엔드 실행 (터미널 2)
```bash
cd frontend
npm install
npm run dev
```
> 콘솔에 출력된 로컬 호스트 주소(예: `http://localhost:5173`)로 브라우저를 통해 접속합니다.

---

## 🧪 테스트 방법 (멀티플레이)
1. **서로 다른 브라우저 (또는 시크릿 탭)** 창을 2~3개 엽니다.
2. 각 창에서 서로 다른 아이디로 접속합니다. (초기 포인트 100만 P 지급)
3. 15초 단위로 쉴 새 없이 돌아가는 미스터리 옥션을 구경합니다.
4. 마음에 드는 아이템이나 만만한 가격이 오면 과감하게 **[BUY]**를 눌러봅니다.
5. 대박이 터지는지 쪽박을 차는지 결과를 확인하며, 우측의 `COM_LINK (채팅)`을 통해 다른 유저들과 심리전을 벌입니다!
