"use client";

interface BilibiliEmbedProps {
  bvid: string;
  title: string;
  page?: number;
}

export default function BilibiliEmbed({
  bvid,
  title,
  page = 1,
}: BilibiliEmbedProps) {
  const src = `//player.bilibili.com/player.html?bvid=${bvid}&page=${page}&high_quality=1&danmaku=0&autoplay=0`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer"
        scrolling="no"
        frameBorder="0"
      />
    </div>
  );
}
