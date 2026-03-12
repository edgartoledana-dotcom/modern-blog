/**
 * SEO Component
 * Dynamic meta tags management for better SEO
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import type { SEOProps } from '@/types';

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  publishedAt,
  modifiedAt,
  author,
}) => {
  const siteName = 'Modern Blog';
  const defaultImage = '/og-image.jpg'; // Default OG image
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://yourblog.com';

  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image || `${siteUrl}${defaultImage}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{`${title} | ${siteName}`}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="author" content={author || siteName} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={siteName} />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />

      {/* Article specific */}
      {type === 'article' && (
        <>
          <meta property="article:section" content="Blog" />
          {keywords.map((keyword, index) => (
            <meta key={index} property="article:tag" content={keyword} />
          ))}
        </>
      )}

      {/* Structured Data / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'article' ? 'BlogPosting' : 'WebSite',
          headline: title,
          description: description,
          url: fullUrl,
          image: fullImage,
          ...(type === 'article' && {
            datePublished: publishedAt,
            dateModified: modifiedAt || publishedAt,
            author: {
              '@type': 'Person',
              name: author || siteName,
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
              logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logo.png`,
              },
            },
          }),
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
