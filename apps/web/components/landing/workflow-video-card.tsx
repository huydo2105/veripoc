"use client";

import { useCallback, useEffect, useRef } from "react";

type WorkflowVideoCardProps = {
  src?: string;
  ariaLabel?: string;
  replayLabel?: string;
};

/** Loopable workflow media card that reveals on scroll and restarts playback when entering view. */
export function WorkflowVideoCard({
  src = "/workflows/create-bounty.gif",
  ariaLabel = "DeFi team workflow: defining contract scope, pinned source revision, and testing rules",
}: WorkflowVideoCardProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inViewRef = useRef(false);
  const isGif = src.toLowerCase().endsWith(".gif");

  const restartMedia = useCallback(() => {
    if (isGif) {
      const img = imgRef.current;
      if (!img) return;
      const current = img.src;
      img.src = "";
      img.src = current;
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {});
  }, [isGif]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const section = stage.closest(".story-section") as HTMLElement | null;
    const targets = section ? [section, stage] : [stage];

    for (const el of targets) {
      el.setAttribute("data-reveal", "ready");
      el.setAttribute("data-in-view", "false");
    }

    if (typeof IntersectionObserver === "undefined") {
      for (const el of targets) el.setAttribute("data-in-view", "true");
      inViewRef.current = true;
      restartMedia();
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting === inViewRef.current) continue;
          inViewRef.current = entry.isIntersecting;
          for (const el of targets) el.setAttribute("data-in-view", entry.isIntersecting ? "true" : "false");
          if (entry.isIntersecting) {
            restartMedia();
          } else if (!isGif && videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(section ?? stage);
    return () => {
      observer.disconnect();
    };
  }, [isGif, restartMedia]);

  return (
    <div ref={stageRef} className="workflow-video-stage">
      <div className="workflow-video-card">
        {isGif ? (
          // eslint-disable-next-line @next/next/no-img-element -- Animated GIF replay manipulates the raw img src directly.
          <img ref={imgRef} className="workflow-video" src={src} alt={ariaLabel} />
        ) : (
          <video
            ref={videoRef}
            className="workflow-video"
            src={src}
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={ariaLabel}
          />
        )}
      </div>
    </div>
  );
}
