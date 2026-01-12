import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useAuthStore from '../store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold">SM</span>
            </div>
            <span className="text-white font-semibold text-xl">Social Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white hover:text-primary-200">
              Sign In
            </Link>
            <Link href="/register" className="btn bg-white text-primary-600 hover:bg-primary-50">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Manage All Your Social Media in One Place
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Connect YouTube, Instagram, Twitter, LinkedIn, WhatsApp, Telegram, and more.
            Schedule posts, respond to messages, and grow your business.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="btn bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-3">
              Start Free Trial
            </Link>
            <Link href="#features" className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Multi-Platform</h3>
            <p className="text-primary-100">
              Connect 9+ platforms including YouTube, Instagram, Twitter, LinkedIn, WhatsApp, Telegram, and GitHub.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
            <p className="text-primary-100">
              Generate engaging content, auto-suggest hashtags, and create intelligent replies with AI assistance.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
            <p className="text-primary-100">
              Track engagement, monitor performance, and get insights across all your connected accounts.
            </p>
          </div>
        </div>

        {/* Platforms */}
        <div className="mt-20 text-center">
          <p className="text-primary-200 mb-6">Supported Platforms</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {['YouTube', 'Instagram', 'Twitter', 'LinkedIn', 'WhatsApp', 'Telegram', 'GitHub', 'Email'].map((platform) => (
              <div
                key={platform}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-white/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-200 text-sm">
            © 2024 Social Media Manager. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-primary-200 hover:text-white text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-primary-200 hover:text-white text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
