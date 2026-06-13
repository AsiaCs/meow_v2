// meow-kit.jsx — shared data + components for the meow UI
(function () {
  const { useState } = React;

  /* ----------------------------- data ----------------------------- */
  const EVENTS = [
    { id:'e1', title:'Cerebral Valley AI Summit', host:'Cerebral Valley', mo:'NOV', day:'14',
      when:'Thu · 9:00 AM', place:'Pier 27 · San Francisco', dist:'1.2 mi', going:480, tag:'Summit',
      cover:'linear-gradient(135deg,#6d28d9,#db2777 60%,#f59e0b)', sf:true },
    { id:'e2', title:'Latent Space — Paper Club', host:'Latent.Space', mo:'NOV', day:'09',
      when:'Sat · 11:00 AM', place:'Notion HQ · San Francisco', dist:'0.8 mi', going:120, tag:'Meetup',
      cover:null, sf:true },
    { id:'e3', title:'AI Tinkerers · Hack Night', host:'AI Tinkerers', mo:'NOV', day:'12',
      when:'Tue · 6:30 PM', place:'GitHub HQ · San Francisco', dist:'2.4 mi', going:90, tag:'Hack',
      cover:'linear-gradient(135deg,#0ea5e9,#6366f1 55%,#a855f7)', sf:true },
    { id:'e4', title:'Anthropic Builder Day', host:'Anthropic', mo:'NOV', day:'20',
      when:'Wed · 10:00 AM', place:'SoMa · San Francisco', dist:'1.9 mi', going:300, tag:'Workshop',
      cover:null, sf:true },
    { id:'e5', title:'AI Founders Dinner', host:'Fractal', mo:'NOV', day:'11',
      when:'Mon · 7:00 PM', place:'SoHo · New York', dist:'2,560 mi', going:60, tag:'Dinner',
      cover:'linear-gradient(135deg,#f43f5e,#a855f7)', sf:false },
    { id:'e6', title:'SF Compute · Founders Mixer', host:'SF Compute', mo:'NOV', day:'16',
      when:'Sun · 5:00 PM', place:'Dogpatch · San Francisco', dist:'3.1 mi', going:140, tag:'Mixer',
      cover:null, sf:true },
  ];

  const INTERNS = [
    { id:'i1', role:'ML Research Intern', co:'Anthropic', loc:'San Francisco · Hybrid', pay:'$9k / mo', cat:'Research' },
    { id:'i2', role:'Founding Engineer Intern', co:'Stealth · YC W25', loc:'Remote', pay:'Equity + $7k', cat:'Engineering' },
    { id:'i3', role:'Product Design Intern', co:'Perplexity', loc:'San Francisco', pay:'$8k / mo', cat:'Design' },
    { id:'i4', role:'Forward Deployed Intern', co:'Sierra', loc:'San Francisco · On-site', pay:'$8.5k / mo', cat:'Engineering' },
  ];

  const CATS = ['All Categories','Research','Engineering','Design','Product'];

  /* ----------------------------- aurora ---------------------------- */
  function Aurora() {
    return (
      <div className="aurora">
        <span className="au au1" /><span className="au au2" />
        <span className="au au3" /><span className="au au4" />
      </div>
    );
  }

  /* ----------------------------- logo ----------------------------- */
  function LogoMark({ size = 34 }) {
    return (
      <div style={{ width: size, height: size, flex: 'none',
        filter: 'drop-shadow(0 6px 14px rgba(168,85,247,.45))' }}>
        <window.GlyphIcon sw={13} />
      </div>
    );
  }
  function LogoLockup({ size = 30, type = 22 }) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <LogoMark size={size} />
        <span className="u-wm" style={{ fontSize: type }}>meow</span>
      </div>
    );
  }

  /* --------------------------- cover panel ------------------------- */
  function Cover({ ev, h = 150, radius = 18, big }) {
    if (ev.cover) {
      return (
        <div style={{ height:h, borderRadius:radius, backgroundImage:ev.cover,
          backgroundSize:'cover', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0,
            background:'radial-gradient(120% 80% at 80% -10%, rgba(255,255,255,.35), transparent 55%)' }} />
          <div style={{ position:'absolute', left:14, top:12, display:'flex', flexDirection:'column',
            alignItems:'center', lineHeight:1, color:'#fff', textShadow:'0 1px 8px rgba(0,0,0,.4)' }}>
            <span style={{ fontWeight:700, fontSize:11, letterSpacing:'.26em' }}>{ev.mo}</span>
            <span style={{ fontWeight:800, fontSize:26, letterSpacing:'-.04em', marginTop:2 }}>{ev.day}</span>
          </div>
        </div>
      );
    }
    // directive: #1A102F panel, spaced uppercase month over massive day
    return (
      <div className="cover-fallback" style={{ height:h, borderRadius:radius,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
        <span className="cf-month" style={{ fontSize: big ? 15 : 12 }}>{ev.mo}</span>
        <span className="cf-day" style={{ fontSize: big ? 92 : 60 }}>{ev.day}</span>
      </div>
    );
  }

  /* --------------------------- event card -------------------------- */
  function EventCard({ ev, showDist }) {
    return (
      <div className="glass" style={{ borderRadius:20, padding:10, display:'flex', flexDirection:'column', gap:11 }}>
        <Cover ev={ev} h={132} radius={13} />
        <div style={{ padding:'0 4px 4px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
            <span className="pill" style={{ padding:'4px 11px', fontSize:12 }}>{ev.tag}</span>
            {showDist &&
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:13,
                fontWeight:600, color:'var(--accent-line)' }}>
                <window.Icon name="pin" size={14} stroke="var(--accent-line)" sw={1.8} />{ev.dist}
              </span>}
          </div>
          <div style={{ fontWeight:700, fontSize:17, letterSpacing:'-.01em', color:'var(--ink)',
            lineHeight:1.18, textWrap:'pretty' }}>{ev.title}</div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:8, color:'var(--muted)', fontSize:13.5, fontWeight:500 }}>
            <window.Icon name="clock" size={15} stroke="var(--muted)" sw={1.7} />{ev.when}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:11 }}>
            <span style={{ color:'var(--faint)', fontSize:13, fontWeight:500 }}>{ev.host}</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'var(--muted)', fontSize:13, fontWeight:600 }}>
              <window.Icon name="users" size={15} stroke="var(--muted)" sw={1.7} />{ev.going}
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------- phone shell ------------------------ */
  function StatusBar({ dark }) {
    const c = dark ? '#f5f2fc' : '#f5f2fc';
    return (
      <div style={{ height:46, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 26px 0 30px', flex:'none' }}>
        <span style={{ fontWeight:700, fontSize:15, color:c, letterSpacing:'.01em' }}>9:41</span>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <window.Icon name="globe" size={15} stroke={c} sw={1.6} />
          <svg width="20" height="13" viewBox="0 0 20 13" fill="none">
            <rect x="1" y="2.5" width="3" height="8" rx="1" fill={c}/>
            <rect x="6" y="0.5" width="3" height="10" rx="1" fill={c}/>
            <rect x="11" y="-1" width="3" height="11.5" rx="1" fill={c} transform="translate(0 1.5)"/>
          </svg>
          <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
            <rect x="1" y="1.5" width="21" height="10" rx="3" stroke={c} strokeOpacity="0.5" strokeWidth="1"/>
            <rect x="2.6" y="3.1" width="16" height="6.8" rx="1.6" fill={c}/>
            <rect x="23.4" y="4.6" width="1.6" height="3.8" rx="0.8" fill={c} fillOpacity="0.6"/>
          </svg>
        </div>
      </div>
    );
  }

  function PhoneShell({ children, label }) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <div style={{ width:392, height:828, borderRadius:54, padding:13, flex:'none',
          background:'linear-gradient(160deg,#241a3a,#0c0818 60%)',
          boxShadow:'0 40px 90px -30px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.08)' }}>
          <div className="noscroll" style={{ position:'relative', width:'100%', height:'100%',
            borderRadius:42, overflow:'hidden', background:'var(--bg)' }}>
            <div className="bg-room" />
            <Aurora />
            <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column' }}>
              {/* notch */}
              <div style={{ position:'absolute', top:13, left:'50%', transform:'translateX(-50%)',
                width:118, height:32, borderRadius:20, background:'#050309', zIndex:9 }} />
              {children}
            </div>
          </div>
        </div>
        {label && <span style={{ fontFamily:'Urbanist', fontSize:13, fontWeight:600, color:'#8b8298',
          letterSpacing:'.02em' }}>{label}</span>}
      </div>
    );
  }

  function TabBar({ active = 'home' }) {
    const items = [['home','Discover'],['compass','Events'],['briefcase','Interns'],['user','You']];
    return (
      <div className="glass-2" style={{ flex:'none', margin:'0 14px 12px', borderRadius:26,
        padding:'11px 8px', display:'flex', justifyContent:'space-around', alignItems:'center' }}>
        {items.map(([ic,lb]) => {
          const on = ic === active;
          return (
            <div key={ic} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              color:on?'var(--ink)':'var(--faint)' }}>
              <window.Icon name={ic} size={23} stroke={on?'var(--accent-line)':'var(--faint)'} sw={on?2:1.7} />
              <span style={{ fontSize:11, fontWeight:on?700:600,
                color:on?'var(--ink)':'var(--faint)' }}>{lb}</span>
            </div>
          );
        })}
      </div>
    );
  }

  Object.assign(window, {
    EVENTS, INTERNS, CATS, Aurora,
    LogoMark, LogoLockup, Cover, EventCard, PhoneShell, StatusBar, TabBar,
  });
})();
