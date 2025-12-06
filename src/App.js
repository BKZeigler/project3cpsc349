import { useState } from "react";
import "./App.css";

export default function App() {
  const [city, setCity] = useState("");
  const [options, setOptions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [unitIsF, setUnitIsF] = useState(false);

  // Safe getter
  const safe = (arr, index) =>
    Array.isArray(arr) && arr[index] !== undefined ? arr[index] : "N/A";

  //Temperature gradient
  function getBackground(tempC) {
    if (typeof tempC !== "number") return "white";
    if (tempC <= 10) return "linear-gradient(to bottom, #003366, #005599)";
    if (tempC >= 40) return "linear-gradient(to bottom, #990000, #CC3300)";
    const dist = Math.abs(tempC - 25);
    const intensity = Math.max(0, Math.min(1, dist / 15));
    const blue = `rgba(0, 102, 204, ${intensity})`;
    const red = `rgba(255, 80, 0, ${intensity})`;
    return tempC < 25
      ? `linear-gradient(to bottom, ${blue}, white)`
      : `linear-gradient(to bottom, ${red}, white)`;
  }

  const displayTemp = (c) =>
    typeof c === "number"
      ? (unitIsF ? ((c * 9) / 5 + 32).toFixed(1) : c.toFixed(1))
      : "N/A";

  const displayWind = (kph) =>
    typeof kph === "number"
      ? (unitIsF ? (kph * 0.621371).toFixed(1) : kph.toFixed(1))
      : "N/A";

  // Search city
  async function searchCity() {
    if (!city.trim()) return;
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=8&language=en&format=json`
      );
      const data = await res.json();
      setOptions(data.results || []);
    } catch (err) {
      alert("Error fetching city data.");
      console.error(err);
    }
  }

  // Load weather (hourly)
  async function loadWeather(option) {
    setOptions([]);
    setCity(option.name);
    setWeather(null);
    setDayIndex(0);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${option.latitude}` +
      `&longitude=${option.longitude}` +
      `&hourly=temperature_2m,windspeed_10m,cloudcover,precipitation,uv_index` +
      `&forecast_days=7&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.hourly || !data.hourly.time) {
        alert("Weather data not available for this location.");
        return;
      }

      // Compute daily summaries
      const daily = {};
      const hourly = data.hourly;
      hourly.time.forEach((t, idx) => {
        const date = t.split("T")[0]; // YYYY-MM-DD
        if (!daily[date]) {
          daily[date] = {
            temp_max: hourly.temperature_2m[idx],
            temp_min: hourly.temperature_2m[idx],
            wind_max: hourly.windspeed_10m[idx],
            cloud_max: hourly.cloudcover[idx],
            precip_max: hourly.precipitation[idx],
            uv_max: hourly.uv_index[idx],
            time: date,
          };
        } else {
          daily[date].temp_max = Math.max(daily[date].temp_max, hourly.temperature_2m[idx]);
          daily[date].temp_min = Math.min(daily[date].temp_min, hourly.temperature_2m[idx]);
          daily[date].wind_max = Math.max(daily[date].wind_max, hourly.windspeed_10m[idx]);
          daily[date].cloud_max = Math.max(daily[date].cloud_max, hourly.cloudcover[idx]);
          daily[date].precip_max = Math.max(daily[date].precip_max, hourly.precipitation[idx]);
          daily[date].uv_max = Math.max(daily[date].uv_max, hourly.uv_index[idx]);
        }
      });

      const dailyArray = Object.values(daily);

      setWeather({
        daily: dailyArray,
        city: option.name,
        state: option.admin1 || "",
      });
    } catch (err) {
      alert("Error fetching weather data.");
      console.error(err);
    }
  }

  // Convert ISO date to local weekday numeric time -> weekdays
  const dayName = (isoDate) => {
    if (!isoDate || isoDate === "N/A") return "N/A";
    const date = new Date(isoDate + "T12:00"); // avoid timezone shift
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  if (!weather || !weather.daily) {
    return (
      <div className="container">
        <h2 className="header">7-Day Weather Forecast</h2>

        <div className="search-row">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter a city..."
          />
          <button onClick={searchCity}>Search</button>
        </div>

        {options.length > 0 && (
          <div className="dropdown">
            <strong>Select a location:</strong>
            <div className="dropdown-list">
              {options.map((o) => (
                <div
                  key={o.id}
                  className="dropdown-item"
                  onClick={() => loadWeather(o)}
                >
                  {o.name}, {o.admin1 || "—"}, {o.country}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const day = safe(weather.daily, dayIndex);
  if (!day) return <div>Data not available for this day.</div>;

  const background = getBackground(day.temp_max);

  return (
    <div className="container" style={{ background }}>
      {/* Re-search for a different city */}
      <div className="search-row" style={{ marginBottom: "20px" }}>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Search a different city..."
        />
        <button onClick={searchCity}>Search</button>
      </div>

      {options.length > 0 && (
        <div className="dropdown">
          <strong>Select a location:</strong>
          <div className="dropdown-list">
            {options.map((o) => (
              <div
                key={o.id}
                className="dropdown-item"
                onClick={() => loadWeather(o)}
              >
                {o.name}, {o.admin1 || "—"}, {o.country}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2>
        {weather.city}{weather.state ? ", " + weather.state : ""}
      </h2>

      <div className="middle">
        <h3>
          {dayName(day.time)} — Day {dayIndex + 1} of {weather.daily.length}
        </h3>

        <p>
          <strong>High:</strong> {displayTemp(day.temp_max)}°{unitIsF ? "F" : "C"}
        </p>

        <p>
          <strong>Low:</strong> {displayTemp(day.temp_min)}°{unitIsF ? "F" : "C"}
        </p>

        <p>
          <strong>Precipitation:</strong> {day.precip_max} mm
        </p>

        <p>
          <strong>Wind:</strong> {displayWind(day.wind_max)} {unitIsF ? "mph" : "km/h"}
        </p>

        <p>
          <strong>Cloud Cover:</strong> {day.cloud_max}%
        </p>

        <p>
          <strong>UV Index:</strong> {day.uv_max}
        </p>

        <button
          style={{
            marginTop: "12px",
            padding: "8px 14px",
            borderRadius: "8px",
            background: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => setUnitIsF(!unitIsF)}
        >
          Switch to °{unitIsF ? "C / km/h" : "F / mph"}
        </button>
      </div>

      <div className="bottom">
        <button
          onClick={() => setDayIndex((d) => d - 1)}
          disabled={dayIndex === 0}
        >
          ◀ Previous
        </button>
        <button
          onClick={() => setDayIndex((d) => d + 1)}
          disabled={dayIndex >= weather.daily.length - 1}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}