import { Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
  const [showExperiencePopup, setShowExperiencePopup] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

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

  // Handle smooth scroll with offset for fixed navbar
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const navbarHeight = 80; // Height of fixed navbar
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    closeMobileMenu();
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

  // Track carousel state for indicators
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

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
              <a href="#home" onClick={(e) => handleNavClick(e, 'home')}>Home</a>
            </li>
            <li>
              <a href="#about" onClick={(e) => handleNavClick(e, 'about')}>About</a>
            </li>
            <li>
              <a href="#projects" onClick={(e) => handleNavClick(e, 'projects')}>Projects</a>
            </li>
            <li>
              <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')}>Contact</a>
            </li>
            <li>
              <a 
                href="https://static.vaibhavpatil.dev/vaibhav_patil_resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="resume-button"
              >
                Resume
              </a>
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

      {/* Home Section */}
      <section id="home" className="homepage-container">
        {/* Left Section with Frame */}
        <div className="left-section">
          <div className="frame">
            <img
              src="https://static.vaibhavpatil.dev/vaibhav/vaibhav-512.png"
              srcSet="https://static.vaibhavpatil.dev/vaibhav/vaibhav-256.png 256w,
                      https://static.vaibhavpatil.dev/vaibhav/vaibhav-384.png 384w,
                      https://static.vaibhavpatil.dev/vaibhav/vaibhav-512.png 512w"
              sizes="(max-width: 480px) 150px,
                     (max-width: 768px) 180px,
                     200px"
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
                href="https://github.com/vaibhav-patil07"
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
              <div className="carousel-wrapper-custom">
                <Carousel
                  setApi={setCarouselApi}
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 5000,
                    }),
                  ]}
                  className="w-full max-w-[500px] mx-auto"
                >
                  <CarouselContent>
                    {articles.map((article, index) => (
                      <CarouselItem key={index}>
                        <div className="article-card-wrapper">
                          <div className="article-card active">
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
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                
                {/* Custom Bottom Navigation */}
                <div className="carousel-navigation-bottom">
                  <button
                    onClick={() => carouselApi?.scrollPrev()}
                    className="carousel-btn-bottom prev"
                    aria-label="Previous slide"
                  >
                    ‹
                  </button>

                  <div className="carousel-indicators">
                    {Array.from({ length: count }).map((_, index) => (
                      <button
                        key={index}
                        className={`indicator ${index === current ? "active" : ""}`}
                        onClick={() => carouselApi?.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => carouselApi?.scrollNext()}
                    className="carousel-btn-bottom next"
                    aria-label="Next slide"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-container">          
          <div className="about-content">
            <div className="about-left">
                <div className="about-card">
                  <h3 className="about-card-title">What I Bring</h3>
                  <div className="about-card-content">
                    <p className="about-card-paragraph">
                      I have completed my <strong>B.Tech from MIT Academy of Engineering, Pune</strong>, where I developed a strong foundation in software engineering principles and modern development practices.
                    </p>
                    <p className="about-card-paragraph">
                      I work on <strong>scalable web applications</strong> that can handle high traffic and complex business requirements. My focus is on building robust, maintainable, and efficient solutions that grow with business needs.
                    </p>
                    <p className="about-card-paragraph">
                      I have extensive experience in <strong>Microservices architecture</strong>, designing and implementing distributed systems that are resilient, scalable, and easy to maintain. This includes working with service-to-service communication, API gateways, and containerized deployments.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="about-right">
                <div className="experience-section">
                  <h3 className="experience-title">Professional Experience</h3>
                  
                  <div className="timeline-container">
                    <div className="timeline-track">
                  <div className="timeline-item right" data-tooltip="Full-time position at Contentstack, Mumbai. Working on scalable web applications and APIs.">
                    <div className="timeline-content">
                      <div className="timeline-marker"></div>
                      <h4 className="timeline-position">Software Engineer I</h4>
                      <h5 className="timeline-company">Contentstack</h5>
                      <div className="timeline-duration">Mar 2025 - Present</div>
                      <div className="timeline-tech">
                        <span className="tech-pill">NestJS</span>
                        <span className="tech-pill">gRPC</span>
                        <span className="tech-pill">MongoDB</span>
                      </div>
                    </div>
                  </div>

                  <div className="timeline-item left" data-tooltip="Full-time role in Bangalore. Worked with Node.js, Express.js and other modern technologies to build robust applications.">
                    <div className="timeline-content">
                      <div className="timeline-marker"></div>
                      <h4 className="timeline-position">Associate Software Engineer</h4>
                      <h5 className="timeline-company">Contentstack</h5>
                      <div className="timeline-duration">Aug 2023 - Jun 2025</div>
                      <div className="timeline-tech">
                        <span className="tech-pill">NestJS</span>
                        <span className="tech-pill">ExpressJS</span>
                        <span className="tech-pill">MongoDB</span>
                      </div>
                    </div>
                  </div>

                  <div className="timeline-item right" data-tooltip="Remote internship in Mumbai. Worked with team which designs and develops Contentstack's management API using JavaScript and Node.js.">
                    <div className="timeline-content">
                      <div className="timeline-marker"></div>
                      <h4 className="timeline-position">Associate Software Intern</h4>
                      <h5 className="timeline-company">Contentstack</h5>
                      <div className="timeline-duration">Jan 2023 - Aug 2023</div>
                      <div className="timeline-tech">
                        <span className="tech-pill">ExpressJS</span>
                        <span className="tech-pill">NodeJS</span>
                        <span className="tech-pill">MongoDB</span>
                      </div>
                    </div>
                  </div>

                  <div className="timeline-item left" data-tooltip="Remote internship in Pune. Worked on BMC Database automation to provide end to end database patches, using Python and Selenium.">
                    <div className="timeline-content">
                      <div className="timeline-marker"></div>
                      <h4 className="timeline-position">R&D Intern</h4>
                      <h5 className="timeline-company">BMC Software</h5>
                      <div className="timeline-duration">Jun 2022 - Aug 2022</div>
                      <div className="timeline-tech">
                        <span className="tech-pill">Python</span>
                        <span className="tech-pill">Selenium</span>
                      </div>
                    </div>
                  </div>

                  {/* Show More Button */}
                  <div className="timeline-item right timeline-show-more-item">
                    <div className="timeline-content show-more-content">
                      <div className="timeline-marker show-more-marker"></div>
                      <button 
                        className="show-more-btn"
                        onClick={() => setShowExperiencePopup(true)}
                      >
                        Show More Experience
                      </button>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="projects-section">
        <div className="projects-container">
          <h2 className="projects-title">Projects</h2>
          <div className="projects-grid">
            
            {/* Image Processor Project */}
            <div className="project-card">
              <div className="project-header">
                <h3 className="project-title">Image Processor</h3>
                <div className="project-links">
                  <a
                    href="https://image-processor.vaibhavpatil.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link-icon"
                    title="Live Demo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                  <a
                    href="https://github.com/vaibhav-patil07/image-processor-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link-icon"
                    title="View on GitHub"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </a>
                </div>
              </div>
              <p className="project-description">
                A powerful web-based image compression tool that allows users to upload and compress images efficiently. 
                The application reduces file sizes while maintaining image quality, making it perfect for optimizing images 
                for web usage and reducing storage requirements.
              </p>
              <div className="project-features">
                <h4 className="features-title">Key Features:</h4>
                <ul className="features-list">
                  <li>Supports PNG, JPG, JPEG image formats</li>
                  <li>Real-time preview of compressed images</li>
                  <li>Batch processing capabilities</li>
                  <li>Download compressed images instantly</li>
                </ul>
              </div>
              <div className="project-tech-stack">
                <span className="tech-badge">Image Processing</span>
                <span className="tech-badge">Web dev</span>
                <span className="tech-badge">Machine Learning</span>
                <span className="tech-badge">Python</span>
                <span className="tech-badge">Go</span>
                <span className="tech-badge">React</span>
                <span className="tech-badge">Postgres</span>
                <span className="tech-badge">Redis</span>
                <span className="tech-badge">S3</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <h2 className="contact-title">Get In Touch</h2>
          <p className="contact-description">
            Feel free to reach out to me for collaboration opportunities or just to say hello!
          </p>
          <div className="contact-buttons">
            <a
              href="mailto:vbpatil@mitaoe.ac.in"
              className="contact-button primary"
            >
              Send Email
            </a>
            <a
              href="https://www.linkedin.com/in/vaibhav-patil-04756a213/"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-button secondary"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Experience Popup */}
      {showExperiencePopup && (
        <div className="experience-popup-overlay" onClick={() => setShowExperiencePopup(false)}>
          <div className="experience-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Additional Experience</h3>
              <button 
                className="popup-close"
                onClick={() => setShowExperiencePopup(false)}
              >
                ×
              </button>
            </div>
            <div className="popup-content">
              <div className="experience-item">
                <h4 className="experience-position">Fullstack Android Developer Intern</h4>
                <h5 className="experience-company">CodeKul - Corporate Software Development Training Institute</h5>
                <div className="experience-type">Internship</div>
                <div className="experience-duration">Jun 2021 - Aug 2021 · 3 mos</div>
                <div className="experience-location">Pune, Maharashtra, India · Remote</div>
                <p className="experience-description">
                  Developed LogIn, Sign Up, and Home Page ( Android Java ). Also developed backend API's in Spring Boot
                </p>
                <div className="experience-skills">
                  <span className="skill-pill">Java</span>
                  <span className="skill-pill">Spring Boot</span>
                  <span className="skill-pill">Android Development</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
