import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-contact">
        <p className="footer-contact-line">No. 1, Nallaiya Raja Street, Palayapalayam, Rajapalayam - 626117, Virudhunagar District, Tamil Nadu</p>
        <p className="footer-contact-line">
          <a href="mailto:Palayapalayamrajukkalshavadi@gmail.com">Palayapalayamrajukkalshavadi@gmail.com</a>
          {' '}·{' '}
          <a href="tel:+918807541551">+91-8807541551</a>
          {' '}·{' '}
          <a href="tel:+919385563356">+91-9385563356</a>
        </p>
      </div>
      <p className="footer-bottom">© {new Date().getFullYear()} PRMCF. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
