import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-contact">
        <p className="footer-contact-line">44, Dharmaraja St, RJPM Avarampatti, Rajapalayam, Tamil Nadu - 626117</p>
        <p className="footer-contact-line">
          <a href="mailto:Palayapalayamrajukkalshavadi@gmail.com">Palayapalayamrajukkalshavadi@gmail.com</a>
          {' '}·{' '}
          <a href="tel:+918807541551">+91-8807541551</a>
          {' '}·{' '}
          <a href="tel:+911140661662">+91-1140661662</a>
        </p>
      </div>
      <p className="footer-bottom">© {new Date().getFullYear()} PRMCF. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
