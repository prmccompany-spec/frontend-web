import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import slide1 from '../../assets/slide1.jpg';
import slide2 from '../../assets/slide2.jpg';
import slide3 from '../../assets/slide3.jpg';
import './HeroSlider.css';

const slides = [
  {
    id: 1,
    title: 'Welcome to PRMC',
    subtitle: 'Preserving Tradition, Building the Future',
    image: slide1, // replace with actual image import
  },
  {
    id: 2,
    title: 'Annual Culture Programs',
    subtitle: 'Connecting Generations Through Events and Festivals',
    image: slide2,
  },
  {
    id: 3,
    title: 'Welfare Activities for People',
    subtitle: 'Building the Future for Those in Need',
    image: slide3,
  },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();
  const animatingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      setCurrent((prev) => (prev + 1) % slides.length);
      setTimeout(() => { animatingRef.current = false; }, 500);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index) => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => {
      animatingRef.current = false;
      setAnimating(false);
    }, 500);
  };

  const handlePrev = () => handleChange((current - 1 + slides.length) % slides.length);
  const handleNext = () => handleChange((current + 1) % slides.length);

  const slide = slides[current];

  return (
    <div className="hero-slider">
      {/* Background decoration */}
      <div className="hero-bg-circle" />

      <div className="hero-inner">
        {/* Left: Image */}
        <div className="hero-image-wrap">
          <button className="hero-arrow hero-arrow-left" onClick={handlePrev} aria-label="Previous">&#8249;</button>
          <div className={`hero-img-card ${animating ? 'hero-img-fade' : ''}`}>
            <img src={slide.image} alt={slide.title} className="hero-img" />
          </div>
          <button className="hero-arrow hero-arrow-right" onClick={handleNext} aria-label="Next">&#8250;</button>
        </div>

        {/* Right: Text */}
        <div className={`hero-content ${animating ? 'hero-content-fade' : ''}`}>
          <div className="hero-tag">PRMC Foundation</div>
          <h1 className="hero-title">{slide.title}</h1>
          <p className="hero-subtitle">{slide.subtitle}</p>
          <div className="hero-buttons">
            <button className="hero-btn-primary" onClick={() => navigate('/about')}>
              Know More
            </button>
            <button className="hero-btn-arrow" onClick={handleNext} aria-label="Next slide">
              &#8594;
            </button>
          </div>

          {/* Dots */}
          <div className="hero-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === current ? 'hero-dot-active' : ''}`}
                onClick={() => handleChange(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSlider;
