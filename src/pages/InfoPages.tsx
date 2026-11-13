import { GlassButton, GlassPanel } from '../components/glass';
import { useSeoMetadata } from '../utils/seo';

export function AboutPage() {
  useSeoMetadata({
    title: 'About – ZyvoMovie',
    description: 'Learn about ZyvoMovie, part of the Zyvo Ecosystem, and its metadata attributions.',
    path: '/about',
  });

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-8">
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-6">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          About ZyvoMovie
        </h1>
        <div className="space-y-4 text-sm sm:text-base text-white/75 leading-relaxed">
          <p>
            <strong className="text-white">ZyvoMovie</strong> is the movie, TV
            series, and anime discovery and streaming companion within the{' '}
            <strong className="text-white">Zyvo Ecosystem</strong>. Designed
            with ZyvoTube&apos;s Spatial Liquid Glass design language and Zyvo Red highlights, it
            pairs fast catalog discovery with synchronized watchlists and playback checkpoints.
          </p>
          <p>
            Metadata for feature films and television series is queried server-side via The Movie
            Database (TMDB) API. Anime discovery uses a dedicated MyAnimeList/Jikan v4 adapter so
            MyAnimeList identifiers remain strictly isolated from TMDB identifiers.
          </p>
          <GlassPanel variant="subtle" padding="md" className="space-y-2 text-sm">
            <h2 className="font-display font-bold text-white">Attribution</h2>
            <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            <p>Anime metadata is provided via the Jikan REST API for MyAnimeList.</p>
          </GlassPanel>
        </div>
      </GlassPanel>
    </div>
  );
}

export function PrivacyPage() {
  useSeoMetadata({
    title: 'Privacy Policy – ZyvoMovie',
    description: 'ZyvoMovie privacy policy covering guest storage, Firebase authentication, and Firestore isolation.',
    path: '/privacy',
  });

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-8">
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-6">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Privacy Policy
        </h1>
        <div className="space-y-4 text-sm sm:text-base text-white/75 leading-relaxed">
          <p>
            ZyvoMovie respects your privacy. Guest watchlists, playback checkpoints, search
            history, and preferences are stored locally in your browser via <code>localStorage</code>{' '}
            and can be cleared anytime from Settings.
          </p>
          <p>
            When you sign in with Firebase Authentication, your profile, watchlist, watch progress,
            watch history, and preferences are stored under your private user path (
            <code>users/&#123;uid&#125;</code>) protected by strict Firestore security rules so
            only your authenticated, verified account can access your records.
          </p>
          <p>
            Third-party streaming embeds (such as VidLink) operate under their own privacy policies
            when authorized by you in the Watch Player.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}

export function TermsPage() {
  useSeoMetadata({
    title: 'Terms of Service – ZyvoMovie',
    description: 'ZyvoMovie terms of service, third-party embed authorization, and content disclaimers.',
    path: '/terms',
  });

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-8">
      <GlassPanel variant="default" padding="lg" className="rounded-3xl space-y-6">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Terms of Service
        </h1>
        <div className="space-y-4 text-sm sm:text-base text-white/75 leading-relaxed">
          <p>
            ZyvoMovie is a discovery and metadata index application. ZyvoMovie does not host,
            store, or distribute copyrighted video files on its servers.
          </p>
          <p>
            External streaming embeds are loaded only through replaceable third-party provider
            adapters after user authorization. Users are responsible for complying with applicable
            copyright laws, regional licensing, and provider terms of service.
          </p>
          <p>
            ZyvoMovie never bypasses DRM, authentication gates, or regional access controls.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}

export function NotFoundPage() {
  useSeoMetadata({
    title: 'Page Not Found – ZyvoMovie',
    description: 'The requested page could not be found on ZyvoMovie.',
    path: '/404',
  });

  return (
    <div className="max-w-xl mx-auto px-4 pt-14">
      <GlassPanel variant="elevated" padding="lg" className="rounded-3xl text-center space-y-5">
        <p className="font-mono-tabular text-5xl font-extrabold text-[#E50914]">404</p>
        <h1 className="font-display text-3xl font-extrabold text-white">Page Not Found</h1>
        <p className="text-sm text-white/70">
          The page or title route you requested does not exist on ZyvoMovie.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <GlassButton variant="primary" size="md" to="/">
            Back to Home
          </GlassButton>
          <GlassButton variant="glass" size="md" to="/search">
            Search Titles
          </GlassButton>
        </div>
      </GlassPanel>
    </div>
  );
}
