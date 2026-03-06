import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { WeatherStatistics, City } from "../types/weather";
import {
  fetchWeatherStatistics,
  fetchDateRangeStatistics,
  fetchCities,
  fetchHomeCards,
  HomeCard,
} from "../utils/weatherApi";
import { getSearchHistoryList, addSearchHistory } from "../utils/storage";
import WeatherStats from "./WeatherStats";
import WeatherStatsRange from "./WeatherStatsRange";

const POPULAR_CITIES = [
  { id: "jeju", name: "제주", icon: "🇰🇷" },
  { id: "tokyo", name: "도쿄", icon: "🇯🇵" },
  { id: "da-nang", name: "다낭", icon: "🇻🇳" },
  { id: "bangkok", name: "방콕", icon: "🇹🇭" },
  { id: "los-angeles", name: "LA", icon: "🇺🇸" },
  { id: "paris", name: "파리", icon: "🇫🇷" },
];

type DateMode = "single" | "range";

const Home: React.FC = () => {
  const [screen, setScreen] = useState<"home" | "detail">("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  type ThemeMode = "default" | "soft" | "bold";
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "soft" || stored === "bold") return stored;
    return "default";
  });
  const cycleTheme = () => {
    setTheme((t) =>
      t === "default" ? "soft" : t === "soft" ? "bold" : "default",
    );
  };
  useEffect(() => {
    if (theme === "soft" || theme === "bold") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);


  const [cities, setCities] = useState<City[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("seoul");

  // 날짜 모드
  const [dateMode, setDateMode] = useState<DateMode>("single");

  // 단일 날짜
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // 기간 날짜
  const [rangeStartMonth, setRangeStartMonth] = useState(
    new Date().getMonth() + 1,
  );
  const [rangeStartDay, setRangeStartDay] = useState(new Date().getDate());
  const [rangeEndMonth, setRangeEndMonth] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.getMonth() + 1;
  });
  const [rangeEndDay, setRangeEndDay] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.getDate();
  });

  // 네비 표시용 날짜 문자열
  const [navDateStr, setNavDateStr] = useState("");

  const [statistics, setStatistics] = useState<WeatherStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities().then(setCities).catch(console.error);
  }, []);

  const minDelay = () => new Promise<void>((r) => setTimeout(r, 1000));

  const loadSingle = async (city: string, month: number, day: number) => {
    setLoading(true);
    setError(null);
    setScreen("detail");
    setNavDateStr(`${month}월 ${day}일`);
    try {
      const [data] = await Promise.all([
        fetchWeatherStatistics(city, month, day),
        minDelay(),
      ]);
      setStatistics(data);
      const dateStr = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      addSearchHistory(city, dateStr, data.city_korean);
    } catch (err) {
      console.error(err);
      if (city !== "seoul") {
        setSelectedCityId("seoul");
        try {
          const [fallback] = await Promise.all([
            fetchWeatherStatistics("seoul", month, day),
            minDelay(),
          ]);
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

  const loadRange = async (
    city: string,
    sm: number,
    sd: number,
    em: number,
    ed: number,
  ) => {
    setLoading(true);
    setError(null);
    setScreen("detail");
    setNavDateStr(`${sm}월 ${sd}일 ~ ${em}월 ${ed}일`);
    try {
      const [data] = await Promise.all([
        fetchDateRangeStatistics(city, sm, sd, em, ed),
        minDelay(),
      ]);
      setStatistics(data);
    } catch (err) {
      console.error(err);
      setError("날씨 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchOpen(false);
    if (dateMode === "single") {
      loadSingle(selectedCityId, selectedMonth, selectedDay);
    } else {
      loadRange(
        selectedCityId,
        rangeStartMonth,
        rangeStartDay,
        rangeEndMonth,
        rangeEndDay,
      );
    }
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

  const [homeCards, setHomeCards] = useState<HomeCard[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  useEffect(() => {
    const minDelay = new Promise<void>((r) => setTimeout(r, 1000));
    Promise.all([fetchHomeCards(), minDelay]).then(([cards]) => {
      setHomeCards(cards);
      setHomeLoading(false);
    });
  }, []);

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
    setDateMode("single");
    loadSingle(city, month, day);
  };

  const daysInMonth = (m: number) => new Date(2024, m, 0).getDate();

  // 기간 선택 시 종료일이 시작일보다 앞서지 않도록 보정
  const handleRangeStartChange = (month: number, day: number) => {
    setRangeStartMonth(month);
    setRangeStartDay(day);
    const start = new Date(2024, month - 1, day);
    const end = new Date(2024, rangeEndMonth - 1, rangeEndDay);
    if (end <= start) {
      const next = new Date(start);
      next.setDate(next.getDate() + 1);
      setRangeEndMonth(next.getMonth() + 1);
      setRangeEndDay(next.getDate());
    }
  };

  const handleRangeEndChange = (month: number, day: number) => {
    const start = new Date(2024, rangeStartMonth - 1, rangeStartDay);
    const end = new Date(2024, month - 1, day);
    if (end <= start) return;
    // 최대 14일 제한
    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (diffDays > 13) {
      const maxEnd = new Date(start);
      maxEnd.setDate(maxEnd.getDate() + 13);
      setRangeEndMonth(maxEnd.getMonth() + 1);
      setRangeEndDay(maxEnd.getDate());
    } else {
      setRangeEndMonth(month);
      setRangeEndDay(day);
    }
  };

  const rangeNights = (() => {
    const start = new Date(2024, rangeStartMonth - 1, rangeStartDay);
    const end = new Date(2024, rangeEndMonth - 1, rangeEndDay);
    return Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86400000),
    );
  })();

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
          onClick={cycleTheme}
          title={
            theme === "default"
              ? "뉴모피즘 UI로 전환"
              : theme === "soft"
                ? "볼드 UI로 전환"
                : "기본 UI로 전환"
          }
        >
          {theme === "default" ? "🫧" : theme === "soft" ? "🎨" : "✦"}
        </button>
      </div>

      {/* ═══ HOME SCREEN ═══ */}
      {screen === "home" && homeLoading && (
        <div className="loading-wrap">
          <img
            src="https://nisxyhqxihbharxnmmdw.supabase.co/storage/v1/object/public/brand/logo.png"
            alt="로딩 중"
            className="loading-logo"
          />
        </div>
      )}

      {screen === "home" && !homeLoading && (
        <div className="home-screen">
          <div className="home-inner">
            {/* ── 로고 + 태양 ── */}
            <div className="home-top-row">
              <div className="home-logo-block">
                <div className="home-logo-brand">
                  <img
                    src="https://nisxyhqxihbharxnmmdw.supabase.co/storage/v1/object/public/brand/logo.png"
                    alt="logo"
                    className="home-logo-img"
                  />
                </div>
                <div className="home-logo-sub">
                  예보로 볼 수 없는 날짜 날씨 과거 기록 보기
                </div>
              </div>
              <div className="home-sun-lottie">
                <DotLottieReact
                  src="/weather-sunny.lottie"
                  loop
                  autoplay
                  style={{ width: 300, height: 300 }}
                />
              </div>
            </div>

            <div className="home-content-wrap">
              {/* ── 헤드라인 ── */}
              <h1 className="home-headline">
                Discover the
                <br />
                Best Day to Travel
              </h1>

              {/* ── 도시 칩 + 다른 도시 찾기 ── */}
              <div className="home-chips">
                {POPULAR_CITIES.map((c) => (
                  <span
                    key={c.id}
                    className="chip"
                    onClick={() => openSearchWithCity(c.id, c.name)}
                  >
                    {c.icon} {c.name}
                  </span>
                ))}
                <button className="chip chip-find-more" onClick={openSearch}>
                  🔍 다른 도시로 찾기
                </button>
              </div>
            </div>

            {/* ── 기획 콘텐츠 캐러셀 ── */}
            {homeCards.length > 0 && (
              <div className="home-carousel-wrap">
                <div className="home-carousel-title">
                  <h2 className="home-carousel-title-text">
                    <span className="hct-uw">
                      <span className="hct-inner">🗽 그날의 날씨 PICK!</span>
                    </span>
                  </h2>
                </div>
                <div className="home-carousel">
                  {homeCards.map((card) => {
                    const handleCardClick = () => {
                      if (!card.cityId || !card.dateFrom) return;
                      if (card.cardType === "range" && card.dateTo) {
                        const [sm, sd] = card.dateFrom.split("-").map(Number);
                        const [em, ed] = card.dateTo.split("-").map(Number);
                        loadRange(card.cityId, sm, sd, em, ed);
                      } else {
                        const [m, d] = card.dateFrom.split("-").map(Number);
                        loadSingle(card.cityId, m, d);
                      }
                    };
                    return (
                      <div
                        key={card.id}
                        className="hc-card"
                        onClick={handleCardClick}
                      >
                        <div
                          className="hc-img"
                          style={
                            card.imageUrl
                              ? { backgroundImage: `url(${card.imageUrl})` }
                              : undefined
                          }
                        />
                        <div className="hc-info">
                          <div className="hc-city-row">
                            <span className="hc-city">{card.title}</span>
                            {card.nightsLabel && (
                              <span className="hc-nights">
                                {card.nightsLabel}
                              </span>
                            )}
                          </div>
                          {card.subtitle && (
                            <div className="hc-subtitle">{card.subtitle}</div>
                          )}
                          {card.dateLabel && (
                            <div className="hc-date">{card.dateLabel}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DETAIL SCREEN ═══ */}
      {screen === "detail" && (
        <div className="detail-screen">
          <div className="detail-nav">
            <button className="nav-back" onClick={goHome}>
              ←
            </button>
            <div className="nav-info" onClick={openSearch}>
              <div className="nav-city-name">
                📍 {loading ? "..." : cityKorean}
              </div>
              <div className="nav-date-str">
                {navDateStr || `${selectedMonth}월 ${selectedDay}일`}
                {totalYears > 0 ? ` · ${totalYears}년 기후 기준` : ""}
              </div>
            </div>
            <button className="nav-share" onClick={openSearch}>
              🔍
            </button>
          </div>

          {loading && (
            <div className="loading-wrap">
              <img
                src="https://nisxyhqxihbharxnmmdw.supabase.co/storage/v1/object/public/brand/logo.png"
                alt="로딩 중"
                className="loading-logo"
              />
              <p className="loading-text">날씨 데이터를 불러오는 중...</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: "24px 20px" }}>
              <div
                style={{
                  background: "rgba(240,96,128,0.08)",
                  border: "1px solid rgba(240,96,128,0.2)",
                  borderRadius: 16,
                  padding: "18px 20px",
                  color: "var(--c-negative)",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            statistics &&
            (statistics.date.includes("~") ? (
              <WeatherStatsRange statistics={statistics} />
            ) : (
              <WeatherStats statistics={statistics} />
            ))}
        </div>
      )}

      {/* ═══ SEARCH OVERLAY ═══ */}
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
              {filteredCities(cities, searchInput).length > 0 && (
                <div className="city-results">
                  {filteredCities(cities, searchInput)
                    .slice(0, 8)
                    .map((city) => (
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

              {/* 날짜 / 기간 토글 */}
              <div className="date-mode-toggle">
                <button
                  className={`dmt-btn ${dateMode === "single" ? "active" : ""}`}
                  onClick={() => setDateMode("single")}
                >
                  날짜
                </button>
                <button
                  className={`dmt-btn ${dateMode === "range" ? "active" : ""}`}
                  onClick={() => setDateMode("range")}
                >
                  기간
                </button>
              </div>

              {/* 단일 날짜 선택 */}
              {dateMode === "single" && (
                <div className="date-row">
                  <div className="date-btn">
                    <div className="date-label">Month</div>
                    <select
                      className="date-select"
                      value={selectedMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setSelectedMonth(m);
                        if (selectedDay > daysInMonth(m))
                          setSelectedDay(daysInMonth(m));
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
                      {Array.from(
                        { length: daysInMonth(selectedMonth) },
                        (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}일
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* 기간 선택 */}
              {dateMode === "range" && (
                <div className="date-range-section">
                  <div className="date-range-row">
                    {/* 시작일 */}
                    <div className="date-range-block">
                      <div className="drb-label">시작일</div>
                      <div className="drb-selects">
                        <select
                          className="date-select date-select-sm"
                          value={rangeStartMonth}
                          onChange={(e) => {
                            const m = Number(e.target.value);
                            const d = Math.min(rangeStartDay, daysInMonth(m));
                            handleRangeStartChange(m, d);
                          }}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}월
                            </option>
                          ))}
                        </select>
                        <select
                          className="date-select date-select-sm"
                          value={rangeStartDay}
                          onChange={(e) =>
                            handleRangeStartChange(
                              rangeStartMonth,
                              Number(e.target.value),
                            )
                          }
                        >
                          {Array.from(
                            { length: daysInMonth(rangeStartMonth) },
                            (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}일
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="drb-arrow">→</div>

                    {/* 종료일 */}
                    <div className="date-range-block">
                      <div className="drb-label">종료일</div>
                      <div className="drb-selects">
                        <select
                          className="date-select date-select-sm"
                          value={rangeEndMonth}
                          onChange={(e) => {
                            const m = Number(e.target.value);
                            const d = Math.min(rangeEndDay, daysInMonth(m));
                            handleRangeEndChange(m, d);
                          }}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}월
                            </option>
                          ))}
                        </select>
                        <select
                          className="date-select date-select-sm"
                          value={rangeEndDay}
                          onChange={(e) =>
                            handleRangeEndChange(
                              rangeEndMonth,
                              Number(e.target.value),
                            )
                          }
                        >
                          {Array.from(
                            { length: daysInMonth(rangeEndMonth) },
                            (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}일
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="range-nights-badge">
                    📅 {rangeNights}박 {rangeNights + 1}일 · 최대 14일
                  </div>
                </div>
              )}

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

function filteredCities(cities: City[], input: string): City[] {
  if (!input.trim()) return [];
  return cities.filter(
    (c) =>
      c.nameKo.toLowerCase().includes(input.toLowerCase()) ||
      c.name.toLowerCase().includes(input.toLowerCase()),
  );
}

export default Home;
