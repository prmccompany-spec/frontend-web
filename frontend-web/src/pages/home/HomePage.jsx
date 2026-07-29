import MarqueeBar from '../../components/MarqueeBar/MarqueeBar';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import GameBanner from '../../components/GameBanner/GameBanner';
import WelcomeSection from '../../components/WelcomeSection/WelcomeSection';
import DriveSection from '../../components/DriveSection/DriveSection';
import SponsorsSection from '../../components/SponsorsSection/SponsorsSection';
import TestimonialsSection from '../../components/TestimonialsSection/TestimonialsSection';
import StatsSection from '../../components/StatsSection/StatsSection';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <MarqueeBar />
      <HeroSlider />
      {/* <GameBanner /> */}
      <WelcomeSection />
      <DriveSection />
      <SponsorsSection />
      <TestimonialsSection />
      <StatsSection />
    </div>
  );
}

export default HomePage;
