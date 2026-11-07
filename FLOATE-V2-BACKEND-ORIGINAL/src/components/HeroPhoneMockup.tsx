import React from 'react';
import { HERO_PHONE_SCREEN_BASE64 } from '../assets/heroPhoneBase64';

export const HeroPhoneMockup: React.FC = () => {
  return (
    <div className="floate-phone-wrap select-none w-full max-w-2xl mx-auto pt-2 sm:pt-4">
      <style>{`
        .floate-phone-wrap {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          perspective: 1400px;
          transform-style: preserve-3d;
          padding: 20px;
        }

        .floate-phone {
          position: relative;
          width: 380px; /* Enhanced enlarged size */
          transform-style: preserve-3d;
          transform: rotateY(-10deg) rotateX(5deg);
          transition: transform 0.5s ease;
          will-change: transform;
        }

        .floate-phone:hover {
          transform: rotateY(-5deg) rotateX(2deg) scale(1.02);
        }

        /* Samsung frame */
        .phone-body {
          position: relative;
          background: #0d0d0f;
          border-radius: 36px;
          padding: 10px 10px 12px 10px;
          box-shadow:
            0 35px 90px rgba(0, 0, 0, 0.45),
            0 14px 35px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255,255,255,0.08);
          transform-style: preserve-3d;
        }

        /* Top bezel bar */
        .phone-top-bar {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 140px;
          height: 22px;
          background: #0d0d0f;
          border-radius: 0 0 14px 14px;
          z-index: 15;
        }

        /* Punch-hole camera */
        .phone-punch-hole {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          background: #1a1a1e;
          border-radius: 50%;
          border: 1.5px solid #2a2a30;
          z-index: 16;
        }

        /* Bottom bezel bar */
        .phone-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 16px;
          background: #0d0d0f;
          border-radius: 14px 14px 0 0;
          z-index: 15;
        }

        /* Screen */
        .phone-screen {
          position: relative;
          width: 100%;
          aspect-ratio: 9 / 19.8;
          background: #000;
          border-radius: 28px;
          overflow: hidden;
          transform: translateZ(16px);
        }

        .phone-screen img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          display: block;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }

        /* Side buttons */
        .phone-btn {
          position: absolute;
          background: #1f1f24;
          border-radius: 2px;
        }
        .phone-btn.vol {
          left: -3px;
          top: 100px;
          width: 3px;
          height: 70px;
          border-radius: 2px 0 0 2px;
        }
        .phone-btn.power {
          right: -3px;
          top: 120px;
          width: 3px;
          height: 45px;
          border-radius: 0 2px 2px 0;
        }

        /* Glass sheen */
        .phone-sheen {
          position: absolute;
          inset: 0;
          border-radius: 36px;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.04) 0%,
            transparent 40%,
            transparent 60%,
            rgba(255,255,255,0.02) 100%
          );
          pointer-events: none;
          z-index: 5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .floate-phone { width: 300px; }
        }
        @media (max-width: 480px) {
          .floate-phone { width: 260px; }
        }
      `}</style>

      <div className="floate-phone">
        <div className="phone-body">
          <div className="phone-top-bar" />
          <div className="phone-punch-hole" />
          <div className="phone-bottom-bar" />
          <div className="phone-btn vol" />
          <div className="phone-btn power" />

          <div className="phone-screen">
            <img
              src={HERO_PHONE_SCREEN_BASE64 || "https://i.postimg.cc/P5RJxw3g/Screenshot-20260901-173316-Whats-App.png"}
              alt="Floate WhatsApp Chat"
              loading="eager"
              decoding="sync"
            />
          </div>

          <div className="phone-sheen" />
        </div>
      </div>
    </div>
  );
};
