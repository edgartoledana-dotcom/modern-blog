/**
 * Blog Card Component
 * Individual blog post card with hover effects
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowUpRight } from 'lucide-react';
import type { Post } from '@/types';

interface BlogCardProps {
  post: Post;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
}

const BlogCard: React.FC<BlogCardProps> = ({
  post,
  variant = 'default',
  className = '',
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (variant === 'compact') {
    return (
      <article
        className={`group flex gap-4 ${className}`}
      >
        {/* Thumbnail */}
        <Link
          to={`/blog/${post.slug}`}
          className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg"
        >
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.categories.slice(0, 2).map((category) => (
                <Link
                  key={category.id}
                  to={`/blog?category=${category.slug}`}
                  className="text-xs font-medium px-2 py-0.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                  }}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <Link to={`/blog/${post.slug}`}>
            <h3 className="font-semibold text-gray-900 group-hover:text-[#e1f532] transition-colors duration-200 line-clamp-2 text-sm">
              {post.title}
            </h3>
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.publishedAt)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article
        className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 ${className}`}
      >
        {/* Image */}
        <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Featured Badge */}
          {post.featured && (
            <span className="absolute top-4 left-4 bg-[#e1f532] text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
              FEATURED
            </span>
          )}
        </Link>

        {/* Content */}
        <div className="p-6">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/blog?category=${category.slug}`}
                  className="text-xs font-medium px-3 py-1 rounded-full transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                  }}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <Link to={`/blog/${post.slug}`}>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#e1f532] transition-colors duration-200 mb-3 line-clamp-2">
              {post.title}
            </h2>
          </Link>

          {/* Excerpt */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {post.author && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {post.author.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt)}
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readingTime || 5} min
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Default variant
  return (
    <article
      className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${className}`}
    >
      {/* Image */}
      <Link
        to={`/blog/${post.slug}`}
        className="block relative aspect-[4/3] overflow-hidden"
      >
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        
        {/* Read More Arrow */}
        <div className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <ArrowUpRight className="w-5 h-5 text-gray-900" />
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                to={`/blog?category=${category.slug}`}
                className="text-xs font-medium px-2.5 py-0.5 rounded-full transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <Link to={`/blog/${post.slug}`}>
          <h3 className="font-bold text-gray-900 group-hover:text-[#e1f532] transition-colors duration-200 mb-2 line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/blog?tag=${tag}`}
                className="text-xs text-gray-500 hover:text-[#e1f532] transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {post.author && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {post.author.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.publishedAt)}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTime || 5} min
          </span>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
