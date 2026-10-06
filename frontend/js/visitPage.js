/**
 * visit.html (오시는 길 페이지) 전용 스크립트
 *
 * 이 페이지는 메인 SPA(index.html)와 별개로 동작하는 독립 페이지라서
 * main.js 파이프라인을 타지 않고, 필요한 것(날씨 조회)만 바로 처리합니다.
 *
 * 주소: 상명대학교 천안캠퍼스 (충청남도 천안시 동남구 상명대길 31)
 * 좌표는 OpenStreetMap(Nominatim) 지오코딩 결과로 확인한 값입니다.
 */

const VISIT_LOCATION = {
  latitude: 36.8330,
  longitude: 127.1790
};

const WEATHER_API_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${VISIT_LOCATION.latitude}&longitude=${VISIT_LOCATION.longitude}` +
  '&current=temperature_2m,relative_humidity_2m&timezone=Asia%2FSeoul';

document.addEventListener('DOMContentLoaded', () => {
  loadWeather();
});

async function loadWeather() {
  const statusEl = document.getElementById('visit-weather-status');
  if (!statusEl) return;

  try {
    const res = await fetch(WEATHER_API_URL);
    if (!res.ok) throw new Error(`날씨 서버 응답 오류 (${res.status})`);

    const data = await res.json();
    const temp = data?.current?.temperature_2m;
    const humidity = data?.current?.relative_humidity_2m;

    if (temp === undefined || humidity === undefined) {
      throw new Error('날씨 데이터 형식이 올바르지 않습니다.');
    }

    statusEl.textContent = `${temp}°C · 습도 ${humidity}%`;
    statusEl.classList.remove('is-error');
  } catch (err) {
    console.error('[오시는 길] 날씨 정보를 불러오지 못했습니다.', err);
    statusEl.textContent = '날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    statusEl.classList.add('is-error');
  }
}
