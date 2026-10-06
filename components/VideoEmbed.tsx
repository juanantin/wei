"use client";

/** Plays YouTube / Vimeo links in an iframe and anything else (mp4, webm, m3u8 in Safari) in <video>. */
export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const src = yt
    ? `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`
    : vimeo
      ? `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`
      : null;

  if (src) {
    return (
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 size-full"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }
  return <video src={url} title={title} controls autoPlay playsInline className="absolute inset-0 size-full bg-black" />;
}
