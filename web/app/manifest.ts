import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fastwell',
    short_name: 'Fastwell',
    description: 'Your personalised health companion for the menopause journey.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3F0E7',
    theme_color: '#F3F0E7',
    icons: [],
  };
}
