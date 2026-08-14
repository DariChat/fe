/**
 * 목록 갱신을 잠시 멈추는 스위치.
 *
 * 튜토리얼은 실제 계정의 상태와 무관하게 항상 같은 예시 화면을 보여줘야 한다.
 * 그런데 목록 스토어는 주기적으로(useAutoRefresh) 서버에서 다시 받아오기 때문에,
 * 예시 데이터를 넣어둬도 몇 초 뒤 실제 응답으로 덮인다.
 *
 * 그래서 튜토리얼이 도는 동안에는 여기서 조회를 막아 두고, 끝나면 풀면서 한 번 다시 받는다.
 * (조회만 막는다 — 전송·수락 같은 쓰기 동작은 튜토리얼 중에 일어나지 않는다)
 */

let frozen = false;

export const freezeRemoteData = () => {
  frozen = true;
};

export const unfreezeRemoteData = () => {
  frozen = false;
};

export const isRemoteDataFrozen = () => frozen;
