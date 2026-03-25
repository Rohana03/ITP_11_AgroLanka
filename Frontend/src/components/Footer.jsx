import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="agrolanka-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>AgroLanka</h3>
          <p>Empowering farmers and streamlining agricultural processes across Sri Lanka.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: info@agrolanka.lk</p>
          <p>Phone: +94 11 234 5678</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AgroLanka. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
