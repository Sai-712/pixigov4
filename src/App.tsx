import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import UploadImage from './components/UploadImage';
import UploadSelfie from './components/UploadSelfie';
import Dashboard from './components/Dashboard';
import EventDetails from './components/EventDetails';
// Removed unused import AnimatedElements
import { GoogleAuthConfig } from './config/GoogleAuthConfig';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <GoogleAuthConfig>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-champagne to-white transition-all duration-300">
          <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
          <Routes>
            <Route path="/" element={
              <main className="animate-fadeIn">
                <Hero />
                <Features />
                <Testimonials />
                <Pricing />
                <FAQ />
              </main>
            } />
            <Route path="/dashboard" element={<div className="animate-slideIn"><Dashboard /></div>} />
            <Route path="/upload" element={<div className="animate-slideIn"><UploadImage /></div>} />
            <Route path="/upload_selfie" element={<div className="animate-slideIn"><UploadSelfie /></div>} />
            <Route path="/event/:eventId" element={<div className="animate-slideIn"><EventDetails /></div>} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </GoogleAuthConfig>
  );
}

export default App;