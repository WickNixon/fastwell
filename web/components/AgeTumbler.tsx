'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_AGE = 18;
const MAX_AGE = 97;
const ITEM_H = 64;
const VISIBLE = 5;
const PADDING = ITEM_H * 2;

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => i + MIN_AGE);

interface Props {
  value: number;
  onChange: (age: number) => void;
}

export default function AgeTumbler({ value, onChange }: Props) {
  const initIndex = Math.max(0, AGES.indexOf(value));
  const [selectedIndex, setSelectedIndex] = useState(initIndex >= 0 ? initIndex : AGES.indexOf(52));
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreScroll = useRef(false);

  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    if (!scrollRef.current) return;
    ignoreScroll.current = true;
    scrollRef.current.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
    setTimeout(() => { ignoreScroll.current = false; }, 400);
  }, []);

  useEffect(() => {
    scrollToIndex(selectedIndex, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChange(AGES[selectedIndex]);
  }, [selectedIndex, onChange]);

  const handleScroll = useCallback(() => {
    if (ignoreScroll.current) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const raw = scrollRef.current.scrollTop / ITEM_H;
      const idx = Math.max(0, Math.min(Math.round(raw), AGES.length - 1));
      setSelectedIndex(idx);
      scrollToIndex(idx);
    }, 80);
  }, [scrollToIndex]);

  const pick = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, AGES.length - 1));
    setSelectedIndex(clamped);
    scrollToIndex(clamped);
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      border: '1px solid #E8E4D9',
      paddingTop: 22,
      paddingBottom: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Highlight bar behind selected item */}
      <div style={{
        position: 'absolute',
        left: 20,
        right: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        height: ITEM_H,
        borderRadius: 12,
        backgroundColor: 'rgba(30,138,79,0.06)',
        border: '1px solid #D9ECE0',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Scrollable drum */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          cursor: 'ns-resize',
        }}
      >
        {/* Top spacer so first age can centre */}
        <div style={{ height: PADDING, flexShrink: 0 }} />

        {AGES.map((age, idx) => {
          const dist = Math.abs(idx - selectedIndex);
          const isSelected = dist === 0;
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.55 : dist === 2 ? 0.25 : 0;
          if (dist > 2 && opacity === 0) {
            return (
              <div
                key={age}
                onClick={() => pick(idx)}
                style={{
                  height: ITEM_H,
                  scrollSnapAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                }}
              />
            );
          }
          return (
            <div
              key={age}
              onClick={() => pick(idx)}
              style={{
                height: ITEM_H,
                scrollSnapAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity,
                transition: 'opacity 0.15s',
                cursor: isSelected ? 'default' : 'pointer',
              }}
            >
              <span style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: isSelected ? 700 : 600,
                fontSize: isSelected ? 52 : 28,
                lineHeight: 1,
                letterSpacing: isSelected ? '-1px' : '0',
                color: isSelected ? '#1E8A4F' : '#6B7066',
                transition: 'font-size 0.15s, color 0.15s',
              }}>
                {age}
              </span>
            </div>
          );
        })}

        {/* Bottom spacer */}
        <div style={{ height: PADDING, flexShrink: 0 }} />
      </div>

      {/* Hide scrollbar on WebKit */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
