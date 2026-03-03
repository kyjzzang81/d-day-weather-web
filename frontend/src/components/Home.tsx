import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { WeatherStatistics, City } from "../types/weather";
import { fetchWeatherStatistics, fetchCities } from "../utils/weatherApi";
import { getSearchHistoryList, addSearchHistory } from "../utils/storage";
import WeatherStats from "./WeatherStats";

const POPULAR_CITIES = [
  { id: "seoul", name: "서울", icon: "🇰🇷" },
  { id: "tokyo", name: "도쿄", icon: "🇯🇵" },
  { id: "bangkok", name: "방콕", icon: "🇹🇭" },
  { id: "paris", name: "파리", icon: "🇫🇷" },
  { id: "new_york", name: "뉴욕", icon: "🇺🇸" },
  { id: "london", name: "런던", icon: "🇬🇧" },
  { id: "bali", name: "발리", icon: "🇮🇩" },
  { id: "sydney", name: "시드니", icon: "🇦🇺" },
];

const Home: React.FC = () => {
  const [screen, setScreen] = useState<"home" | "detail">("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [softUI, setSoftUI] = useState(() => {
    return localStorage.getItem("theme") === "soft";
  });

  useEffect(() => {
    if (softUI) {
      document.documentElement.setAttribute("data-theme", "soft");
      localStorage.setItem("theme", "soft");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "default");
    }
  }, [softUI]);

  const [cities, setCities] = useState<City[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("seoul");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const [statistics, setStatistics] = useState<WeatherStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities().then(setCities).catch(console.error);
  }, []);

  const loadAndShowDetail = async (
    city: string,
    month: number,
    day: number,
  ) => {
    setLoading(true);
    setError(null);
    setScreen("detail");
    try {
      const data = await fetchWeatherStatistics(city, month, day);
      setStatistics(data);
      const dateStr = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      addSearchHistory(city, dateStr, data.city_korean);
    } catch (err) {
      console.error(err);
      if (city !== "seoul") {
        setSelectedCityId("seoul");
        try {
          const fallback = await fetchWeatherStatistics("seoul", month, day);
          setStatistics(fallback);
          const dateStr = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          addSearchHistory("seoul", dateStr, fallback.city_korean);
        } catch {
          setError("날씨 데이터를 불러오는데 실패했습니다.");
        }
      } else {
        setError("날씨 데이터를 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchOpen(false);
    loadAndShowDetail(selectedCityId, selectedMonth, selectedDay);
  };

  const openSearch = () => {
    setSearchInput("");
    setSearchOpen(true);
  };

  const openSearchWithCity = (cityId: string, cityName: string) => {
    setSelectedCityId(cityId);
    setSearchInput(cityName);
    setSearchOpen(true);
  };

  const selectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    const city = cities.find((c) => c.id === cityId);
    if (city) setSearchInput(city.nameKo);
  };

  const goHome = () => {
    setScreen("home");
    setStatistics(null);
  };

  const historyList = getSearchHistoryList();
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!historyOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(e.target as Node)
      ) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [historyOpen]);

  const selectHistory = (city: string, month: number, day: number) => {
    setHistoryOpen(false);
    setSelectedCityId(city);
    setSelectedMonth(month);
    setSelectedDay(day);
    loadAndShowDetail(city, month, day);
  };

  const daysInMonth = new Date(2026, selectedMonth, 0).getDate();
  const filteredCities = searchInput.trim()
    ? cities.filter(
        (c) =>
          c.nameKo.toLowerCase().includes(searchInput.toLowerCase()) ||
          c.name.toLowerCase().includes(searchInput.toLowerCase()),
      )
    : [];

  const cityKorean = statistics?.city_korean ?? "—";
  const totalYears = statistics
    ? statistics.yearlyData.filter((d) => d.hours.length > 0).length
    : 0;

  return (
    <div className="phone">
      <div className="top-bar-wrap">
        <div className="history-wrap" ref={historyRef}>
          <button
            className="history-btn"
            onClick={() => setHistoryOpen((v) => !v)}
            title="검색 기록"
          >
            📋
          </button>
          {historyOpen && (
            <div className="history-dropdown">
              <div className="history-dropdown-title">검색 기록</div>
              {historyList.length === 0 ? (
                <div className="history-empty">검색 기록이 없어요</div>
              ) : (
                <ul className="history-list">
                  {historyList.map((h, i) => {
                    const [m, d] = h.date.split("-").map(Number);
                    return (
                      <li key={`${h.city}-${h.date}-${i}`}>
                        <button
                          className="history-item"
                          onClick={() => selectHistory(h.city, m, d)}
                        >
                          <span className="history-item-city">
                            {h.cityNameKo || h.city}
                          </span>
                          <span className="history-item-date">
                            {m}월 {d}일
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
        <button
          className="theme-toggle-btn"
          onClick={() => setSoftUI((v) => !v)}
          title={softUI ? "기본 UI로 전환" : "Soft UI로 전환"}
        >
          {softUI ? "🎨" : "🫧"}
        </button>
      </div>

      {/* ═══ HOME SCREEN ═══ */}
      {screen === "home" && (
        <div className="home-screen">
          <div className="home-bg">
            <div className="home-bg-orb orb1" />
            <div className="home-bg-orb orb2" />
            <div className="home-bg-orb orb3" />
          </div>
          <div className="home-inner">
            <div className="home-logo">
              D-Day Weather
              <span style={{ fontSize: 20, fontWeight: 400, display: "block" }}>
                그날의 날씨
              </span>
            </div>

            <div className="home-hero">
              <div className="home-eyebrow">예보가 없는 날짜도</div>
              <h1 className="home-headline">
                언제 가야
                <br />
                <em>좋을까요?</em>
              </h1>
              <p className="home-sub">
                86년치 기후 데이터로 분석한
                <br />
                여행 날씨 가이드. 7일 이후의
                <br />
                날짜를 지금 미리 알아보세요.
              </p>

              <div className="home-chips">
                {POPULAR_CITIES.slice(0, 6).map((c) => (
                  <span
                    key={c.id}
                    className="chip"
                    onClick={() => openSearchWithCity(c.id, c.name)}
                  >
                    {c.icon} {c.name}
                  </span>
                ))}
              </div>

              <button className="home-cta" onClick={openSearch}>
                🔍 도시와 날짜 검색하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DETAIL SCREEN ═══ */}
      {screen === "detail" && (
        <div className="detail-screen">
          {/* 상단 네비 */}
          <div className="detail-nav">
            <button className="nav-back" onClick={goHome}>
              ←
            </button>
            <div className="nav-info" onClick={openSearch}>
              <div className="nav-city-name">
                📍 {loading ? "..." : cityKorean}
              </div>
              <div className="nav-date-str">
                {selectedMonth}월 {selectedDay}일
                {totalYears > 0 ? ` · ${totalYears}년 기후 기준` : ""}
              </div>
            </div>
            <button className="nav-share" onClick={openSearch}>
              🔍
            </button>
          </div>

          {/* 로딩 */}
          {loading && (
            <div className="loading-wrap">
              <DotLottieReact
                src="/loading.lottie"
                loop
                autoplay
                style={{ width: 120, height: 120 }}
              />
              <p
                style={{
                  marginTop: 8,
                  color: "var(--c-dim)",
                  fontWeight: 500,
                  fontSize: 14,
                }}
              >
                날씨 데이터를 불러오는 중...
              </p>
            </div>
          )}

          {/* 에러 */}
          {error && !loading && (
            <div style={{ padding: "24px 20px" }}>
              <div
                style={{
                  background: "rgba(240,96,128,0.08)",
                  border: "1px solid rgba(240,96,128,0.2)",
                  borderRadius: 16,
                  padding: "18px 20px",
                  color: "var(--c-acc4)",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            </div>
          )}

          {/* 날씨 상세 슬라이더 */}
          {!loading && !error && statistics && (
            <WeatherStats statistics={statistics} />
          )}

          {/* 푸터 */}
          {!loading && (
            <div className="footer">
              <p>
                데이터 출처:{" "}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open-Meteo
                </a>
              </p>
              {/* <p style={{ marginTop: 4 }}>
                1940-2025년 시간별 날씨 데이터 기반
              </p> */}
            </div>
          )}
        </div>
      )}

      {/* ═══ SEARCH OVERLAY (portal) ═══ */}
      {searchOpen &&
        createPortal(
          <div
            className="search-overlay open"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSearchOpen(false);
            }}
          >
            <div className="search-sheet">
              <div className="sheet-handle" />
              <div className="search-title">여행 날씨 검색</div>
              <div className="search-sub">
                도시와 날짜를 선택하면 날씨 가이드를 보여드려요
              </div>

              {/* 도시 검색 */}
              <div className="search-row">
                <input
                  className="search-input"
                  type="text"
                  placeholder="도시 이름을 입력하세요"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>

              {/* 검색 결과 */}
              {filteredCities.length > 0 && (
                <div className="city-results">
                  {filteredCities.slice(0, 8).map((city) => (
                    <button
                      key={city.id}
                      className={`city-result ${city.id === selectedCityId ? "selected" : ""}`}
                      onClick={() => selectCity(city.id)}
                    >
                      <div className="city-result-name">
                        {city.nameKo} {city.id === selectedCityId && "✦"}
                      </div>
                      <div className="city-result-sub">
                        {city.name}, {city.country}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 날짜 선택 */}
              <div className="date-row">
                <div className="date-btn">
                  <div className="date-label">Month</div>
                  <select
                    className="date-select"
                    value={selectedMonth}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setSelectedMonth(m);
                      const maxD = new Date(2026, m, 0).getDate();
                      if (selectedDay > maxD) setSelectedDay(maxD);
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}월
                      </option>
                    ))}
                  </select>
                </div>
                <div className="date-btn">
                  <div className="date-label">Day</div>
                  <select
                    className="date-select"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                  >
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}일
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 인기 도시 */}
              <div className="popular-label">인기 도시</div>
              <div className="popular-grid">
                {POPULAR_CITIES.map((c) => (
                  <div
                    key={c.id}
                    className={`pop-city ${c.id === selectedCityId ? "selected" : ""}`}
                    onClick={() => selectCity(c.id)}
                  >
                    <div className="pop-city-icon">{c.icon}</div>
                    <div className="pop-city-name">{c.name}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                className="search-go"
                style={{ marginTop: 16 }}
                onClick={handleSearch}
                disabled={!selectedCityId}
              >
                🔍 날씨 가이드 보기
              </button>
              <button
                className="search-dismiss"
                onClick={() => setSearchOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Home;
