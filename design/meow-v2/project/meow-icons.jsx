// meow-icons.jsx — custom minimal stroke icons (no Lucide / stock)
// <Icon name="search" size={20} stroke="currentColor" sw={1.7} />
(function () {
  const P = {
    search:   'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
    pin:      'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    near:     'M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z',
    calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 9.5h16M8 3v3M16 3v3',
    clock:    'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM12 8v4.2l2.8 1.8',
    bookmark: 'M7 4h10a1 1 0 0 1 1 1v15l-6-3.6L6 20V5a1 1 0 0 1 1-1Z',
    filter:   'M4 6h16M7 12h10M10 18h4',
    plus:     'M12 5v14M5 12h14',
    arrow:    'M7 17 17 7M9 7h8v8',
    chevron:  'M6 9l6 6 6-6',
    briefcase:'M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18',
    spark:    'M12 3c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5Z',
    heart:    'M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7-2.5C19 9.6 12 20 12 20Z',
    share:    'M16 6.5 9 11M9 13l7 4.5M7 12a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0ZM22 5.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0ZM22 18.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z',
    users:    'M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11ZM3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8M16 5a3 3 0 0 1 0 6M17 14.4c2.3.5 3.5 2 3.5 4.6',
    check:    'M5 12.5 10 17 19 7',
    x:        'M6 6l12 12M18 6 6 18',
    image:    'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3.5 16l4.5-4 3.5 3 3-2.5L20.5 17M9 10a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 9 10Z',
    upload:   'M12 16V5m0 0L8 9m4-4 4 4M5 19h14',
    compass:  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
    home:     'M4 11 12 4l8 7M6 9.6V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.6',
    ticket:   'M4 8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2.2a1.8 1.8 0 0 0 0 3.6V16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.2a1.8 1.8 0 0 0 0-3.6ZM14 7v10',
    user:     'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c0-3.6 3.2-5.6 7.5-5.6s7.5 2 7.5 5.6',
    globe:    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3.4 9h17.2M3.4 15h17.2M12 3c2.4 2.3 3.6 5.4 3.6 9s-1.2 6.7-3.6 9c-2.4-2.3-3.6-5.4-3.6-9S9.6 5.3 12 3Z',
    bell:     'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 19a2 2 0 0 0 4 0',
    money:    'M12 3v18M16 7.5c0-1.7-1.8-2.8-4-2.8s-4 1-4 2.6c0 4 8 2.4 8 6.4 0 1.7-1.8 2.8-4 2.8s-4-1.1-4-2.8',
    play:     'M8 5.5v13l11-6.5-11-6.5Z',
    menu:     'M4 7h16M4 12h16M4 17h16',
    star:     'M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.5l1-5.8L3.5 9.6l5.9-.8L12 3.5Z',
  };

  function Icon({ name, size = 22, stroke = 'currentColor', sw = 1.7, fill = 'none', style }) {
    const d = P[name];
    if (!d) return null;
    const solid = name === 'spark' || name === 'play';
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={solid ? stroke : fill}
        stroke={solid ? 'none' : stroke} strokeWidth={sw} strokeLinecap="round"
        strokeLinejoin="round" style={style} aria-hidden="true">
        <path d={d} />
      </svg>
    );
  }

  window.Icon = Icon;
  window.ICON_PATHS = P;
})();
