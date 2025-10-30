import React, { useEffect, useState } from "react";
import "./App.css";

const API_KEY = "cb3cb783fba46849c969356d206a40c3";
const BASE_URL = "https://api.themoviedb.org/3";

function App() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMovies();
  }, [page, sortBy, query]); //fetch movies when page, sortBy, and query change

  const fetchMovies = async () => {
    let url = "";
    if (query) {
      url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${query}&page=${page}`;
    } else {
      url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    let results = data.results || [];

    if (sortBy === "date_desc") {
      results.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    } else if (sortBy === "date_asc") {
      results.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    } else if (sortBy === "rating_desc") {
      results.sort((a, b) => b.vote_average - a.vote_average);
    } else if (sortBy === "rating_asc") {
      results.sort((a, b) => a.vote_average - b.vote_average);
    }

    setMovies(results);
    setTotalPages(data.total_pages);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Movie Explorer</h1>
      </header>
      <div className="options">
        <input
          type="text"
          placeholder="Search for a movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Sort By</option>
          <option value="date_asc">Release Date (Asc)</option>
          <option value="date_desc">Release Date (Desc)</option>
          <option value="rating_asc">Rating (Asc)</option>
          <option value="rating_desc">Rating (Desc)</option>
        </select>
      </div>

      <div className="movie-grid">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <img
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : "https://via.placeholder.com/300x450?text=No+Image"
              }
              alt={movie.title}
            />
            <h3>{movie.title}</h3>
            <p>Release Date: {movie.release_date || "N/A"}</p>
            <p>Rating: {movie.vote_average?.toFixed(1) || "N/A"}</p>
          </div>
        ))}
      </div>

      <div className="pages">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;