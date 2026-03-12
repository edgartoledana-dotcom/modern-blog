/**
 * Admin Dashboard
 * Main dashboard with overview and navigation
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Routes, Route } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Image,
  Settings,
  LogOut,
  Plus,
  TrendingUp,
  Eye,
  Mail,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { postsAPI, subscriberAPI } from '@/services/api';
import type { Post } from '@/types';
import SEO from '@/components/SEO';

// Import admin sub-pages
import Posts from './Posts';
import PostEditor from './PostEditor';
import Categories from './Categories';
import Media from './Media';
import Subscribers from './Subscribers';
import SettingsPage from './Settings';

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalSubscribers: number;
  newSubscribersThisMonth: number;
}

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalSubscribers: 0,
    newSubscribersThisMonth: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch posts
        const postsRes = await postsAPI.getPosts({ limit: 100 });
        const posts = postsRes.data.data.posts;

        // Fetch subscribers
        const subscribersRes = await subscriberAPI.getSubscriberStats();
        const subscriberStats = subscribersRes.data.data;

        // Calculate stats
        const publishedPosts = posts.filter((p: Post) => p.status === 'published').length;
        const draftPosts = posts.filter((p: Post) => p.status === 'draft').length;
        const totalViews = posts.reduce((sum: number, p: Post) => sum + (p.views || 0), 0);

        setStats({
          totalPosts: posts.length,
          publishedPosts,
          draftPosts,
          totalViews,
          totalSubscribers: subscriberStats.verified || 0,
          newSubscribersThisMonth: subscriberStats.newThisMonth || 0,
        });

        setRecentPosts(posts.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {stats.publishedPosts} published
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-orange-600">{stats.draftPosts} drafts</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Across all published articles
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Subscribers</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalSubscribers.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +{stats.newSubscribersThisMonth} this month
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Posts</h2>
          <Link
            to="/admin/posts"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentPosts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No posts yet. Create your first post!
            </div>
          ) : (
            recentPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 line-clamp-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {post.status}
                      </span>
                      <span>{new Date(post.createdAt || '').toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </span>
                    </div>
                  </div>
                </div>
                <Link to={`/admin/posts/edit/${post.id}`}>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/posts/new">
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-gray-900 hover:bg-gray-50"
          >
            <Plus className="w-6 h-6" />
            <span>New Post</span>
          </Button>
        </Link>
        <Link to="/admin/categories">
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-gray-900 hover:bg-gray-50"
          >
            <FolderOpen className="w-6 h-6" />
            <span>Categories</span>
          </Button>
        </Link>
        <Link to="/admin/media">
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-gray-900 hover:bg-gray-50"
          >
            <Image className="w-6 h-6" />
            <span>Media</span>
          </Button>
        </Link>
        <Link to="/admin/subscribers">
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-gray-900 hover:bg-gray-50"
          >
            <Users className="w-6 h-6" />
            <span>Subscribers</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: FileText, label: 'Posts', href: '/admin/posts' },
    { icon: FolderOpen, label: 'Categories', href: '/admin/categories' },
    { icon: Image, label: 'Media', href: '/admin/media' },
    { icon: Users, label: 'Subscribers', href: '/admin/subscribers' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <>
      <SEO
        title="Admin Dashboard"
        description="Manage your blog content, subscribers, and settings."
        url="/admin/dashboard"
      />

      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
              <Link to="/" className="inline-block">
                <span className="text-xl font-bold font-['Playfair_Display']">
                  Modern<span className="text-[#e1f532]">Blog</span>
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{user?.name}</p>
                  <p className="text-sm text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                aria-label="Open menu"
              >
                <LayoutDashboard className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <Link to="/" target="_blank">
                  <Button variant="outline" size="sm">
                    View Site
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-8 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/posts/new" element={<PostEditor />} />
              <Route path="/posts/edit/:id" element={<PostEditor />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/media" element={<Media />} />
              <Route path="/subscribers" element={<Subscribers />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
