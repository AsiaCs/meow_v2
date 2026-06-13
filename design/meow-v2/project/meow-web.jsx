// meow-web.jsx — desktop website (landing) + web app (dashboard)
(function () {
  const { LogoLockup, LogoMark, EventCard, EVENTS } = window;
  const I = window.Icon;

  function NavLink({ children, on }) {
    return <span style={{ fontWeight:600, fontSize:15.5, color: on?'var(--ink)':'var(--muted)',
      cursor:'pointer' }}>{children}</span>;
  }

  /* ============================ LANDING ============================ */
  function Landing() {
    return (
      <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'var(--bg)' }}>
        <div className="bg-room" />
        <window.Aurora />
        <div className="bg-grid" />

        <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
          {/* nav */}
          <div className="glass" style={{ marginTop:26, width:'min(1180px,92%)', borderRadius:22,
            padding:'13px 16px 13px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <LogoLockup size={32} type={24} />
            <div style={{ display:'flex', gap:34 }}>
              <NavLink on>Discover</NavLink><NavLink>Internships</NavLink>
              <NavLink>For hosts</NavLink><NavLink>About</NavLink>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <NavLink>Log in</NavLink>
              <button className="btn btn--primary" style={{ padding:'11px 20px' }}>Get the app</button>
            </div>
          </div>

          {/* hero */}
          <div style={{ textAlign:'center', marginTop:74, width:'min(980px,90%)' }}>
            <div className="u-eyebrow" style={{ marginBottom:20 }}>Curiosity, organized</div>
            <h1 className="u-display" style={{ fontSize:78, lineHeight:1.0, color:'var(--ink)' }}>
              Every AI event &amp; internship,<br/><span className="u-cool">in one place.</span>
            </h1>
            <p style={{ color:'var(--muted)', fontSize:20, fontWeight:500, lineHeight:1.5, margin:'30px auto 0', maxWidth:600 }}>
              Talks, hackathons, mixers and open roles from the people building the future —
              near you, updated in real time.
            </p>

            {/* perplexity-style tinted glass search */}
            <div className="glass" style={{ margin:'36px auto 0', width:'min(680px,94%)', borderRadius:24, padding:14 }}>
              <div className="field-light" style={{ borderRadius:16, padding:'17px 18px', display:'flex', alignItems:'center', gap:13 }}>
                <I name="search" size={22} stroke="#5d666f" sw={1.8} />
                <span className="ph" style={{ fontSize:17, fontWeight:500 }}>Search events near you…</span>
                <span style={{ marginLeft:'auto', width:2.5, height:22, background:'#0c1116', borderRadius:2, opacity:.7 }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 6px 4px' }}>
                {[['near','Near me'],['calendar','This week'],['briefcase','Internships'],['spark','For you']].map(([ic,lb],i)=>(
                  <span key={ic} className={'pill'+(i===0?' pill--on':'')} style={{ padding:'9px 15px', fontSize:13.5 }}>
                    <I name={ic} size={15} stroke={i===0?'var(--accent-line)':'var(--muted)'} sw={1.8} />{lb}
                  </span>
                ))}
                <button className="btn btn--primary" style={{ marginLeft:'auto', padding:'11px 22px' }}>
                  Explore <I name="arrow" size={16} stroke="var(--accent-ink)" sw={1.9} />
                </button>
              </div>
            </div>
          </div>

          {/* floating event cards peek */}
          <div style={{ position:'absolute', bottom:-40, left:'50%', transform:'translateX(-50%)',
            width:'min(1080px,94%)', display:'flex', gap:20, justifyContent:'center',
            perspective:1400, WebkitMaskImage:'linear-gradient(180deg,#000 60%,transparent)',
            maskImage:'linear-gradient(180deg,#000 60%,transparent)' }}>
            {EVENTS.slice(0,3).map((e,i)=>(
              <div key={e.id} style={{ width:320, flex:'none',
                transform:`rotateX(14deg) translateY(${i===1?-14:0}px)` }}>
                <EventCard ev={e} showDist />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ============================ DASHBOARD ============================ */
  function SideItem({ icon, label, on }) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:13, padding:'12px 14px', borderRadius:13,
        background: on?'var(--glass-2)':'transparent', border:'1px solid '+(on?'var(--glass-brd)':'transparent'),
        color: on?'var(--ink)':'var(--muted)', cursor:'pointer' }}>
        <I name={icon} size={21} stroke={on?'var(--accent-line)':'var(--muted)'} sw={on?2:1.7} />
        <span style={{ fontWeight: on?700:600, fontSize:15 }}>{label}</span>
      </div>
    );
  }

  function Dashboard() {
    const list = EVENTS.filter(e=>e.sf).sort((a,b)=>parseFloat(a.dist)-parseFloat(b.dist));
    return (
      <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'var(--bg)', display:'flex' }}>
        <div className="bg-room" />
        <window.Aurora />

        {/* sidebar */}
        <div className="glass" style={{ position:'relative', width:268, flex:'none', margin:16, borderRadius:24,
          padding:'22px 16px', display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ padding:'4px 10px 20px' }}><LogoLockup size={30} type={23} /></div>
          <SideItem icon="home" label="Discover" on />
          <SideItem icon="compass" label="Events" />
          <SideItem icon="briefcase" label="Internships" />
          <SideItem icon="bookmark" label="Saved" />
          <SideItem icon="plus" label="Host an event" />
          <div style={{ marginTop:'auto' }}>
            <div className="glass-2" style={{ borderRadius:16, padding:14, display:'flex', alignItems:'center', gap:11 }}>
              <div style={{ width:38, height:38, borderRadius:11, flex:'none',
                background:'linear-gradient(160deg,#c98bf6,#6366f1)' }} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14.5, color:'var(--ink)' }}>Maya Chen</div>
                <div style={{ color:'var(--faint)', fontSize:12.5, fontWeight:500 }}>San Francisco</div>
              </div>
            </div>
          </div>
        </div>

        {/* main */}
        <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column', minWidth:0, padding:'16px 16px 0 0' }}>
          {/* top bar */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22 }}>
            <div className="field-light" style={{ flex:1, borderRadius:15, padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <I name="search" size={20} stroke="#5d666f" sw={1.8} />
              <span className="ph" style={{ fontSize:15.5, fontWeight:500 }}>Search events, hosts, topics…</span>
            </div>
            <button className="pill pill--on" style={{ padding:'12px 18px', fontSize:14.5 }}>
              <I name="near" size={17} stroke="var(--accent-line)" sw={1.9} /> Near me
            </button>
            <div className="glass-2" style={{ width:48, height:48, borderRadius:14, display:'grid', placeItems:'center' }}>
              <I name="bell" size={21} stroke="var(--ink)" sw={1.7} />
            </div>
          </div>

          {/* heading + active geo state */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
            <div>
              <h1 className="u-h1" style={{ fontSize:34, color:'var(--ink)' }}>Closest to me</h1>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7, color:'var(--muted)', fontSize:15, fontWeight:600 }}>
                <I name="check" size={17} stroke="var(--mint)" sw={2.2} />
                Sorted by distance · 4 within 50 mi · global events hidden
              </div>
            </div>
            <div style={{ display:'flex', gap:9 }}>
              {['This week','Hackathons','Free','Workshops'].map((c,i)=>
                <span key={c} className={'pill'+(i===0?' pill--on':'')} style={{ padding:'10px 16px' }}>{c}</span>)}
            </div>
          </div>

          {/* event grid */}
          <div style={{ flex:1, overflowY:'auto', paddingBottom:18, paddingRight:4 }} className="noscroll">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
              {list.map(e => <EventCard key={e.id} ev={e} showDist />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { Landing, Dashboard });
})();
