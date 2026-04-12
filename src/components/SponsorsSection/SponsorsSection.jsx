import './SponsorsSection.css';

import sponsorLogo1 from '../../assets/sponser_logo1.png';
import sponsorLogo2 from '../../assets/sponser_logo2.png';
import sponsorLogo3 from '../../assets/sponser_logo3.png';
import sponsorLogo4 from '../../assets/sponser_logo4.png';
import sponsorLogo5 from '../../assets/sponser_logo5.png';
import sponsorLogo6 from '../../assets/sponser_logo6.png';
import sponsorLogo7 from '../../assets/sponser_logo7.png';
import sponsorLogo8 from '../../assets/sponser_logo8.png';
import sponsorLogo9 from '../../assets/sponser_logo9.png';
import sponsorLogo10 from '../../assets/sponser_logo10.png';
import sponsorLogo11 from '../../assets/sponser_logo11.png';
import sponsorLogo12 from '../../assets/sponser_logo12.png';
import sponsorLogo13 from '../../assets/sponser_logo13.png';
import sponsorLogo14 from '../../assets/sponser_logo14.png';
import sponsorLogo15 from '../../assets/sponser_logo15.png';

const sponsorsRow1 = [
  { id: 1,  name: 'Sponsor 1',  image: sponsorLogo1 },
  { id: 2,  name: 'Sponsor 2',  image: sponsorLogo2 },
  { id: 3,  name: 'Sponsor 3',  image: sponsorLogo3 },
  { id: 4,  name: 'Sponsor 4',  image: sponsorLogo4 },
  { id: 5,  name: 'Sponsor 5',  image: sponsorLogo5 },
  { id: 6,  name: 'Sponsor 6',  image: sponsorLogo6 },
  { id: 7,  name: 'Sponsor 7',  image: sponsorLogo7 },
  { id: 8,  name: 'Sponsor 8',  image: sponsorLogo8 },
  { id: 9,  name: 'Sponsor 9',  image: sponsorLogo9 },
  { id: 10, name: 'Sponsor 10', image: sponsorLogo10 },
  { id: 11, name: 'Sponsor 11', image: sponsorLogo11 },
  { id: 12, name: 'Sponsor 12', image: sponsorLogo12 },
  { id: 13, name: 'Sponsor 13', image: sponsorLogo13 },
  { id: 14, name: 'Sponsor 14', image: sponsorLogo14 },
  { id: 15, name: 'Sponsor 15', image: sponsorLogo15 },
];



function SponsorCard({ sponsor }) {
  return (
    <div className="sponsor-card">
      {sponsor.image ? (
        <img src={sponsor.image} alt={sponsor.name} className="sponsor-logo" />
      ) : (
        <div className="sponsor-placeholder" />
      )}
    </div>
  );
}

function ScrollingRow({ sponsors, reverse }) {
  // Duplicate items so the scroll loops seamlessly
  const doubled = [...sponsors, ...sponsors];
  return (
    <div className="sponsors-track-wrap">
      <div className={`sponsors-track ${reverse ? 'sponsors-track-reverse' : ''}`}>
        {doubled.map((s, i) => (
          <SponsorCard key={`${s.id}-${i}`} sponsor={s} />
        ))}
      </div>
    </div>
  );
}

function SponsorsSection() {
  return (
    <section className="sponsors-section">
      <div className="sponsors-inner">
        <h2 className="sponsors-heading">
          Sponsor<span className="sponsors-heading-accent">s</span>
        </h2>
      </div>

      <ScrollingRow sponsors={sponsorsRow1} reverse={false} />
    </section>
  );
}

export default SponsorsSection;
