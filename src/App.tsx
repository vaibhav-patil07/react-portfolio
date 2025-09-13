import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

interface MediumArticle {
  title: string;
  pubDate: string;
  link: string;
  content: string;
  description: string;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

function Home() {
  // Function to get system theme preference
  const getSystemTheme = () => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false; // Default to light if window is not available
  };

  // Initialize with proper theme immediately
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;

    const savedTheme = localStorage.getItem("darkMode");
    const systemTheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    console.log("Initial - System theme is dark:", systemTheme);
    console.log("Initial - Saved theme:", savedTheme);

    if (savedTheme !== null) {
      const userPreference = JSON.parse(savedTheme);
      console.log("Initial - Using saved preference:", userPreference);
      return userPreference;
    } else {
      console.log("Initial - Using system theme:", systemTheme);
      return systemTheme;
    }
  });

  const [articles, setArticles] = useState<MediumArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Clean HTML content to readable text
  const cleanHtmlContent = (htmlContent: string): string => {
    if (!htmlContent) return "";

    // Remove HTML tags
    let cleanText = htmlContent.replace(/<[^>]*>/g, " ");

    // Remove multiple spaces and normalize whitespace
    cleanText = cleanText.replace(/\s+/g, " ").trim();

    // Remove common unwanted patterns
    cleanText = cleanText.replace(/&nbsp;/g, " ");
    cleanText = cleanText.replace(/&amp;/g, "&");
    cleanText = cleanText.replace(/&lt;/g, "<");
    cleanText = cleanText.replace(/&gt;/g, ">");

    // Get first meaningful paragraph (skip title if it's repeated)
    const sentences = cleanText.split(". ");
    let excerpt = "";
    let wordCount = 0;

    for (const sentence of sentences) {
      if (wordCount + sentence.split(" ").length > 30) break;
      excerpt += sentence + ". ";
      wordCount += sentence.split(" ").length;
    }

    // Fallback to character limit if word-based didn't work well
    if (excerpt.length < 50) {
      excerpt = cleanText.substring(0, 150);
    }

    return excerpt.trim() + (excerpt.endsWith(".") ? "" : "...");
  };

  // Fetch Medium articles
  const fetchMediumArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@vaibhav-patil"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch articles");
      }

      const data = await response.json();

      if (data.status !== "ok") {
        throw new Error("RSS feed error");
      }

      const latestArticles = data.items.slice(0, 4).map((item: any) => ({
        title: item.title,
        pubDate: item.pubDate,
        link: item.link,
        content: item.content,
        description: cleanHtmlContent(item.content || item.description || ""),
      }));

      setArticles(latestArticles);
    } catch (err) {
      console.error("Error fetching Medium articles:", err);
      setError("Failed to load articles. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch articles on component mount
  useEffect(() => {
    fetchMediumArticles();
  }, []);

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a manual preference
      const savedTheme = localStorage.getItem("darkMode");
      if (savedTheme === null) {
        console.log("System theme changed to:", e.matches ? "dark" : "light");
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  // Apply theme to document and save preference
  useEffect(() => {
    const themeValue = darkMode ? "dark" : "light";
    console.log("Applying theme to DOM:", themeValue);
    document.documentElement.setAttribute("data-theme", themeValue);

    // Verify it was applied
    const appliedTheme = document.documentElement.getAttribute("data-theme");
    console.log("Theme applied to DOM:", appliedTheme);
  }, [darkMode]);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    // Save user preference when manually toggled
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when clicking on a link
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu on window resize (when switching to desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Carousel functionality
  useEffect(() => {
    if (articles.length === 0) return;

    let currentSlide = 0;
    const totalSlides = articles.length;

    const updateCarousel = (slideIndex: number) => {
      const track = document.getElementById("carousel-track");
      const cards = document.querySelectorAll(".article-card");
      const indicators = document.querySelectorAll(".indicator");

      if (track && cards.length && indicators.length) {
        // Calculate the percentage to move based on number of articles
        const movePercentage = slideIndex * (100 / totalSlides);
        track.style.transform = `translateX(-${movePercentage}%)`;

        // Update active states
        cards.forEach((card, index) => {
          card.classList.toggle("active", index === slideIndex);
        });

        indicators.forEach((indicator, index) => {
          indicator.classList.toggle("active", index === slideIndex);
        });
      }
    };

    const nextSlide = () => {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateCarousel(currentSlide);
    };

    const prevSlide = () => {
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      updateCarousel(currentSlide);
    };

    // Event listeners
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");
    const indicators = document.querySelectorAll(".indicator");

    if (nextBtn) nextBtn.addEventListener("click", nextSlide);
    if (prevBtn) prevBtn.addEventListener("click", prevSlide);

    indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => {
        currentSlide = index;
        updateCarousel(currentSlide);
      });
    });

    // Auto-play carousel
    const autoPlay = setInterval(nextSlide, 5000);

    // Cleanup
    return () => {
      clearInterval(autoPlay);
      if (nextBtn) nextBtn.removeEventListener("click", nextSlide);
      if (prevBtn) prevBtn.removeEventListener("click", prevSlide);
      indicators.forEach((indicator, index) => {
        indicator.removeEventListener("click", () => {
          currentSlide = index;
          updateCarousel(currentSlide);
        });
      });
    };
  }, [articles]);

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2>Vaibhav Patil</h2>
          </div>
          <button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
          <ul className={`nav-menu ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <li>
              <a href="#home" onClick={closeMobileMenu}>Home</a>
            </li>
            <li>
              <a href="#about" onClick={closeMobileMenu}>About</a>
            </li>
            <li>
              <a href="#projects" onClick={closeMobileMenu}>Projects</a>
            </li>
            <li>
              <a href="#contact" onClick={closeMobileMenu}>Contact</a>
            </li>
            <li>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="homepage-container">
        {/* Left Section with Frame */}
        <div className="left-section">
          <div className="frame">
            <img
              src="/images/vaibhav.png"
              alt="Vaibhav Patil"
              className="frame-image"
            />
            <h1 className="frame-greeting">Hello World!</h1>
            <h2>I'm Vaibhav Patil</h2>
            <h3 className="frame-role">Software Engineer I, Contentstack</h3>
            <p className="frame-description">
              I am a software engineer with a passion for coding life into
              ideas. I have a background in Full Stack Development and Machine
              Learning.
            </p>

            <div className="social-buttons">
              <a
                href="https://www.linkedin.com/in/vaibhav-patil-04756a213/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-button"
              >
                <img src="/images/linkedin.svg" alt="LinkedIn" />
              </a>
              <a
                href="https://github.com/VaibhavPatil4240"
                target="_blank"
                rel="noopener noreferrer"
                className="social-button"
              >
                <img src="/images/github.svg" alt="GitHub" />
              </a>
              <a
                href="https://vaibhav-patil.medium.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-button"
              >
                <img src="/images/medium.svg" alt="Medium" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="right-section">
          <div className="articles-carousel">
            <h2 className="carousel-title">Latest Articles</h2>
            <div className="carousel-container">
              {loading ? (
                <div className="carousel-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading articles...</p>
                </div>
              ) : error ? (
                <div className="carousel-error">
                  <p>{error}</p>
                  <button onClick={fetchMediumArticles} className="retry-btn">
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="carousel-track"
                    id="carousel-track"
                    style={
                      {
                        width: `${articles.length * 100}%`,
                        "--total-slides": articles.length,
                      } as React.CSSProperties
                    }
                  >
                    {articles.map((article, index) => (
                      <div
                        key={index}
                        className={`article-card ${
                          index === 0 ? "active" : ""
                        }`}
                      >
                        <div className="article-date">
                          {formatDate(article.pubDate)}
                        </div>
                        <h3>{article.title}</h3>
                        <p>{article.description}</p>
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="read-more"
                        >
                          Read More →
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="carousel-navigation">
                    <button className="carousel-btn prev" id="prev-btn">
                      ‹
                    </button>

                    <div className="carousel-indicators">
                      {articles.map((_, index) => (
                        <span
                          key={index}
                          className={`indicator ${index === 0 ? "active" : ""}`}
                          data-slide={index}
                        ></span>
                      ))}
                    </div>

                    <button className="carousel-btn next" id="next-btn">
                      ›
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
