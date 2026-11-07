import React, { useEffect, useRef } from 'react';

interface ScrollRevealSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  wipeColor?: string;
  wipeDirection?: 'up' | 'down';
  style?: React.CSSProperties;
}

export const ScrollRevealSection: React.FC<ScrollRevealSectionProps> = ({
  id,
  className = '',
  children,
  wipeColor,
  style
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wipeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // IntersectionObserver for 15% threshold scroll reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Reveal wipe overlay if present
            if (wipeRef.current) {
              wipeRef.current.classList.add('is-wiped');
            }

            // Find all reveal-item elements inside section
            const items = section.querySelectorAll('.reveal-item');
            if (items.length > 0) {
              items.forEach((item, index) => {
                setTimeout(() => {
                  item.classList.add('is-revealed');
                }, index * 120); // 120ms stagger
              });
            } else {
              // If no specific reveal-item marked, reveal section container directly
              section.classList.add('is-revealed');
            }

            // One-time trigger
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      style={style}
      className={`relative scroll-reveal-container ${className}`}
    >
      {wipeColor && (
        <div
          ref={wipeRef}
          className="section-wipe-layer"
          style={{ backgroundColor: wipeColor }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
};
