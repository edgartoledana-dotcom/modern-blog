/**
 * Navigation Component
 * Main navigation bar with responsive design
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-lg shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 transition-transform duration-300 hover:scale-105"
          >
            <span className={`text-2xl font-bold font-['Playfair_Display'] transition-colors duration-300 ${
              isScrolled ? 'text-gray-900' : 'text-gray-900'
            }`}>
              Modern<span className="text-[#e1f532]">Blog</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`relative text-sm font-medium transition-all duration-300 group ${
                  isActive(item.href)
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-[#e1f532] transition-all duration-300 ${
                    isActive(item.href)
                      ? 'w-full'
                      : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 hover:scale-110 transform"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Admin Link */}
            <Link to="/admin/login">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300"
              >
                <User className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>

            {/* Subscribe Button */}
            <Link to="/subscribe">
              <Button
                size="sm"
                className="bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 hover:shadow-lg"
              >
                Subscribe
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <button
                className="p-2 text-gray-900"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-white">
              <div className="flex flex-col space-y-6 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`text-lg font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'text-gray-900 border-l-4 border-[#e1f532] pl-3'
                        : 'text-gray-600 hover:text-gray-900 pl-4'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <hr className="border-gray-200" />
                <Link to="/admin/login">
                  <Button
                    variant="outline"
                    className="w-full border-gray-900 text-gray-900"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Admin Login
                  </Button>
                </Link>
                <Link to="/subscribe">
                  <Button className="w-full bg-gray-900 text-white">
                    Subscribe
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search Articles</h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get('query') as string;
                if (query) {
                  window.location.href = `/blog?search=${encodeURIComponent(query)}`;
                }
              }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="query"
                  placeholder="Search for articles, topics, or tags..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e1f532] focus:border-transparent text-lg"
                  autoFocus
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="submit" className="bg-gray-900 text-white">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
