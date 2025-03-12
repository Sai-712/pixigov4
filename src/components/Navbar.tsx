import React, { useState } from 'react';
import { Menu, X, Upload, Camera, LogIn, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import GoogleLogin from './GoogleLogin';

interface NavbarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleLoginSuccess = (credentialResponse: any) => {
    try {
      console.log('Login Success:', credentialResponse);
      setIsLoggedIn(true);
      // Store user info in localStorage
      const userInfo = {
        name: 'User',
        email: 'user@example.com',
        picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      };
      setUserProfile(userInfo);
      localStorage.setItem('userName', userInfo.name);
      localStorage.setItem('userEmail', userInfo.email);
      localStorage.setItem('userRole', 'user');
    } catch (error) {
      console.error('Error processing login:', error);
    }
  };

  const handleLoginError = () => {
    console.error('Login Failed');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    // Clear user info from localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
  };

  // Alternative login for development/testing
  const handleDevLogin = () => {
    setIsLoggedIn(true);
    const userInfo = {
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    };
    setUserProfile(userInfo);
    // Store user info in localStorage for dev testing
    localStorage.setItem('userName', userInfo.name);
    localStorage.setItem('userEmail', userInfo.email);
    localStorage.setItem('userRole', 'user');
  };

  return (
    <header className="bg-gradient-to-r from-turquoise to-aquamarine sticky top-0 z-50 shadow-lg transition-all duration-300 rounded-b-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8 relative" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center transform transition-all duration-300 hover:scale-105 hover:text-champagne">
            <span className="text-2xl font-bold text-white hover:text-champagne transition-colors duration-300">Pixigo</span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-full p-2.5 text-white hover:text-champagne transition-colors duration-300"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          <a href="#features" className="text-sm font-semibold leading-6 text-white hover:text-champagne transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10">
            Features
          </a>
          <a href="#testimonials" className="text-sm font-semibold leading-6 text-white hover:text-champagne transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10">
            Testimonials
          </a>
          <a href="#pricing" className="text-sm font-semibold leading-6 text-white hover:text-champagne transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-semibold leading-6 text-white hover:text-champagne transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10">
            FAQ
          </a>
          {isLoggedIn && (
            <>
              <Link to="/dashboard" className="text-sm font-semibold leading-6 text-white hover:text-champagne transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10 flex items-center">
                <User className="h-4 w-4 mr-1" /> Dashboard
              </Link>
              <Link to="/upload_selfie" className="text-sm font-semibold leading-6 text-white hover:text-champagne transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10 flex items-center">
                <Camera className="h-4 w-4 mr-1" /> Upload Selfie
              </Link>
            </>
          )}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {!isLoggedIn ? (
            <div className="flex items-center gap-4">
              <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
              <button
                onClick={handleDevLogin}
                className="text-sm font-semibold leading-6 text-white hover:text-champagne transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10 flex items-center"
              >
                <LogIn className="h-4 w-4 mr-1" /> Dev Login
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-sm font-semibold leading-6 text-white hover:text-champagne transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full hover:bg-white/10 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lg:hidden ${mobileMenuOpen ? 'fixed inset-0 z-50' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-turquoise">Pixigo</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                <a
                  href="#features"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#testimonials"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testimonials
                </a>
                <a
                  href="#pricing"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FAQ
                </a>
                {isLoggedIn && (
                  <>
                    <Link
                      to="/dashboard"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 flex items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 mr-2" /> Dashboard
                    </Link>
                    <Link
                      to="/upload_selfie"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 flex items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Camera className="h-5 w-5 mr-2" /> Upload Selfie
                    </Link>
                  </>
                )}
              </div>
              <div className="py-6">
                {!isLoggedIn ? (
                  <div className="space-y-4">
                    <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
                    <button
                      onClick={() => {
                        handleDevLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 w-full text-left flex items-center"
                    >
                      <LogIn className="h-5 w-5 mr-2" /> Dev Login
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 w-full text-left flex items-center"
                  >
                    <LogOut className="h-5 w-5 mr-2" /> Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;