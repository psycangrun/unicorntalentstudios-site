(() => {
  const showcase = document.querySelector('.showcase');
  if (!showcase) return;
  const track = showcase.querySelector('.showcase-track');
  const slides = [...showcase.querySelectorAll('.slide')];
  const dots = [...showcase.querySelectorAll('.showcase-dots button')];
  const videos = slides.map((slide) => slide.querySelector('video'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Moves on even if a clip never fires `ended` (failed load, blocked autoplay).
  const FALLBACK_MS = 20000;

  let current = 0;
  let inView = false;
  let fallback = 0;

  const play = () => {
    clearTimeout(fallback);
    if (!inView || document.hidden || reducedMotion) return;
    const video = videos[current];
    video.preload = 'auto';
    video.currentTime = 0;
    video.play().catch(() => {});
    fallback = setTimeout(() => show(current + 1), FALLBACK_MS);
  };

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(${-100 * current}%)`;
    slides.forEach((slide, i) => {
      slide.inert = i !== current;
      if (i !== current) videos[i].pause();
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', i === current ? 'true' : 'false'));
    play();
  };

  videos.forEach((video, i) => video.addEventListener('ended', () => {
    if (i === current) show(current + 1);
  }));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  showcase.querySelectorAll('.showcase-arrow').forEach((arrow) =>
    arrow.addEventListener('click', () => show(current + Number(arrow.dataset.step))));

  let touchX = null;
  track.addEventListener('pointerdown', (event) => { touchX = event.clientX; });
  track.addEventListener('pointerup', (event) => {
    if (touchX === null) return;
    const moved = event.clientX - touchX;
    touchX = null;
    if (Math.abs(moved) > 40) show(current + (moved < 0 ? 1 : -1));
  });

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) play();
    else {
      clearTimeout(fallback);
      videos[current].pause();
    }
  }, { threshold: 0.4 }).observe(showcase);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(fallback);
      videos[current].pause();
    } else play();
  });

  show(0);
})();
