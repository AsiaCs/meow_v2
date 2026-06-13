// meow-mobile.jsx — mobile app screens
(function () {
  const { useState } = React;
  const { StatusBar, TabBar, EventCard, Cover, LogoLockup, EVENTS, INTERNS, CATS } = window;
  const I = window.Icon;

  const scroll = { flex:1, overflowY:'auto', padding:'2px 16px 16px' };
  const headRow = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 18px 12px' };

  function SearchBar({ placeholder }) {
    return (
      <div className="field-light" style={{ borderRadius:15, display:'flex', alignItems:'center', gap:11,
        padding:'14px 15px', margin:'0 16px 14px' }}>
        <I name="search" size={19} stroke="#5d666f" sw={1.8} />
        <span className="ph" style={{ fontSize:15, fontWeight:500 }}>{placeholder}</span>
      </div>
    );
  }

  function IconBtn({ name }) {
    return (
      <div className="glass-2" style={{ width:42, height:42, borderRadius:13, display:'grid',
        placeItems:'center', flex:'none' }}>
        <I name={name} size={20} stroke="var(--ink)" sw={1.7} />
      </div>
    );
  }

  /* ---------------------- 1 · Discover feed ---------------------- */
  function FeedScreen() {
    const list = EVENTS.filter(e => ['e1','e3','e2','e4'].includes(e.id));
    return (
      <React.Fragment>
        <StatusBar />
        <div style={headRow}>
          <LogoLockup size={30} type={23} />
          <IconBtn name="bell" />
        </div>
        <SearchBar placeholder="Search AI events & meetups" />
        <div style={{ display:'flex', gap:9, padding:'0 16px 14px', overflowX:'auto' }} className="noscroll">
          <span className="pill pill--on"><I name="near" size={15} stroke="var(--accent-line)" sw={1.9}/>Near me</span>
          <span className="pill">This week</span>
          <span className="pill">Hackathons</span>
          <span className="pill">Free</span>
        </div>
        <div style={scroll} className="noscroll">
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
            <span className="u-serif" style={{ fontSize:21, color:'var(--ink)' }}>This week in SF</span>
            <span style={{ color:'var(--accent-line)', fontWeight:600, fontSize:14 }}>See all</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {list.map(e => <EventCard key={e.id} ev={e} showDist />)}
          </div>
        </div>
        <TabBar active="home" />
      </React.Fragment>
    );
  }

  /* ---------------------- 2 · Near me (geo) ---------------------- */
  function NearMeScreen() {
    // single-click geolocation applied: sorted by distance, NYC hidden (>50mi)
    const list = EVENTS.filter(e => e.sf).sort((a,b) => parseFloat(a.dist) - parseFloat(b.dist));
    return (
      <React.Fragment>
        <StatusBar />
        <div style={headRow}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <span className="u-serif" style={{ fontSize:25, color:'var(--ink)', whiteSpace:'nowrap' }}>Closest to me</span>
            <span style={{ color:'var(--muted)', fontSize:14, fontWeight:500, marginTop:2 }}>San Francisco, CA</span>
          </div>
          <IconBtn name="filter" />
        </div>
        {/* active geolocation banner */}
        <div className="glass" style={{ margin:'0 16px 16px', borderRadius:16, padding:'13px 15px',
          display:'flex', alignItems:'center', gap:12,
          boxShadow:'inset 0 1px 0 var(--glass-hi), 0 0 0 1px rgba(168,85,247,.25), 0 16px 40px -18px rgba(168,85,247,.5)' }}>
          <div style={{ width:38, height:38, borderRadius:11, flex:'none', display:'grid', placeItems:'center',
            background:'linear-gradient(180deg,#f6b8e6,#c98bf6)' }}>
            <I name="near" size={20} stroke="#14071f" sw={2} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14.5, color:'var(--ink)' }}>Sorted by distance</div>
            <div style={{ color:'var(--muted)', fontSize:13, fontWeight:500 }}>4 events within 50 miles · NYC hidden</div>
          </div>
          <I name="check" size={20} stroke="var(--mint)" sw={2.2} />
        </div>
        <div style={scroll} className="noscroll">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {list.map(e => <EventCard key={e.id} ev={e} showDist />)}
          </div>
        </div>
        <TabBar active="compass" />
      </React.Fragment>
    );
  }

  /* ---------------------- 3 · Event detail ----------------------- */
  function DetailScreen() {
    const ev = EVENTS[0];
    const Row = ({ icon, a, b }) => (
      <div style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 0' }}>
        <div className="glass-2" style={{ width:40, height:40, borderRadius:12, display:'grid', placeItems:'center', flex:'none' }}>
          <I name={icon} size={19} stroke="var(--accent-line)" sw={1.8} />
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:'var(--ink)' }}>{a}</div>
          <div style={{ color:'var(--muted)', fontSize:13, fontWeight:500 }}>{b}</div>
        </div>
      </div>
    );
    return (
      <React.Fragment>
        <StatusBar />
        <div style={{ flex:1, overflowY:'auto' }} className="noscroll">
          <div style={{ position:'relative', padding:'0 16px' }}>
            <Cover ev={ev} h={232} radius={22} />
            <div style={{ position:'absolute', top:14, left:30, right:30, display:'flex', justifyContent:'space-between' }}>
              <div className="glass-2" style={{ width:40, height:40, borderRadius:13, display:'grid', placeItems:'center' }}>
                <I name="chevron" size={20} stroke="#fff" sw={2} style={{ transform:'rotate(90deg)' }} />
              </div>
              <div style={{ display:'flex', gap:9 }}>
                <div className="glass-2" style={{ width:40, height:40, borderRadius:13, display:'grid', placeItems:'center' }}><I name="share" size={18} stroke="#fff" sw={1.7}/></div>
                <div className="glass-2" style={{ width:40, height:40, borderRadius:13, display:'grid', placeItems:'center' }}><I name="bookmark" size={18} stroke="#fff" sw={1.7}/></div>
              </div>
            </div>
          </div>
          <div style={{ padding:'18px 20px 0' }}>
            <span className="pill" style={{ padding:'5px 12px', fontSize:12.5 }}>{ev.tag} · Free</span>
            <h1 className="u-h1" style={{ fontSize:26, lineHeight:1.12, color:'var(--ink)', margin:'12px 0 9px' }}>{ev.title}</h1>
            <div style={{ color:'var(--muted)', fontSize:14.5, fontWeight:600 }}>Hosted by {ev.host}</div>
            <div style={{ height:1, background:'var(--glass-brd)', margin:'16px 0 4px' }} />
            <Row icon="calendar" a="Thursday, Nov 14" b="9:00 AM – 5:00 PM PST" />
            <Row icon="pin" a={ev.place} b={`${ev.dist} away · Get directions`} />
            <Row icon="users" a={`${ev.going} going`} b="Maya, Devin, Kai + 477 others" />
            <p style={{ color:'var(--muted)', fontSize:15, lineHeight:1.6, marginTop:6, textWrap:'pretty' }}>
              A full day with the people building frontier AI — talks, demos, and the best hallway track in the Valley.
            </p>
            <div style={{ height:96 }} />
          </div>
        </div>
        {/* sticky RSVP */}
        <div className="glass-2" style={{ flex:'none', margin:'0 14px 14px', borderRadius:22, padding:12,
          display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ color:'var(--faint)', fontSize:12.5, fontWeight:600 }}>Price</div>
            <div style={{ color:'var(--ink)', fontWeight:800, fontSize:19, letterSpacing:'-.02em' }}>Free</div>
          </div>
          <button className="btn btn--primary" style={{ flex:1.3, padding:'15px' }}>
            <I name="ticket" size={19} stroke="var(--accent-ink)" sw={1.9} /> Get ticket
          </button>
        </div>
      </React.Fragment>
    );
  }

  /* ---------------------- 4 · Internships ------------------------ */
  function InternScreen() {
    return (
      <React.Fragment>
        <StatusBar />
        <div style={headRow}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <span className="u-serif" style={{ fontSize:25, color:'var(--ink)' }}>Internships</span>
            <span style={{ color:'var(--muted)', fontSize:14, fontWeight:500, marginTop:2 }}>32 open roles in AI</span>
          </div>
          <IconBtn name="search" />
        </div>
        <div style={{ display:'flex', gap:9, padding:'0 16px 16px', overflowX:'auto' }} className="noscroll">
          {CATS.map((c,i) => <span key={c} className={'pill' + (i===0?' pill--on':'')}>{c}</span>)}
        </div>
        <div style={scroll} className="noscroll">
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {INTERNS.map(j => (
              <div key={j.id} className="glass" style={{ borderRadius:18, padding:16 }}>
                <div style={{ display:'flex', gap:13 }}>
                  <div style={{ width:46, height:46, borderRadius:13, flex:'none', display:'grid', placeItems:'center',
                    background:'linear-gradient(160deg,#2a1d4a,#150d28)', border:'1px solid var(--glass-brd)' }}>
                    <span style={{ fontWeight:800, fontSize:19, color:'var(--ink)' }}>{j.co[0]}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:16.5, color:'var(--ink)', letterSpacing:'-.01em' }}>{j.role}</div>
                    <div style={{ color:'var(--muted)', fontSize:13.5, fontWeight:600, marginTop:2 }}>{j.co}</div>
                  </div>
                  <span className="pill" style={{ padding:'5px 11px', fontSize:12, alignSelf:'flex-start' }}>{j.cat}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:14, margin:'13px 0 14px', color:'var(--muted)', fontSize:13.5, fontWeight:500 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><I name="pin" size={15} stroke="var(--muted)" sw={1.7}/>{j.loc}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><I name="money" size={15} stroke="var(--muted)" sw={1.7}/>{j.pay}</span>
                </div>
                {/* deep-linked apply CTA */}
                <button className="btn btn--primary" style={{ width:'100%', padding:'13px' }}>
                  Apply <I name="arrow" size={17} stroke="var(--accent-ink)" sw={1.9} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <TabBar active="briefcase" />
      </React.Fragment>
    );
  }

  /* ---------------------- 5 · Create event ----------------------- */
  function CreateScreen() {
    const Field = ({ label, icon, value, ph }) => (
      <div style={{ marginBottom:15 }}>
        <div style={{ fontWeight:600, fontSize:13.5, color:'var(--muted)', marginBottom:8, letterSpacing:'.01em' }}>{label}</div>
        <div className="glass" style={{ borderRadius:14, padding:'14px 15px', display:'flex', alignItems:'center', gap:11 }}>
          {icon && <I name={icon} size={18} stroke="var(--faint)" sw={1.7} />}
          <span style={{ color: value?'var(--ink)':'var(--faint)', fontSize:15, fontWeight: value?600:500 }}>{value || ph}</span>
        </div>
      </div>
    );
    return (
      <React.Fragment>
        <StatusBar />
        <div style={headRow}>
          <span className="u-serif" style={{ fontSize:24, color:'var(--ink)' }}>New event</span>
          <div className="glass-2" style={{ width:38, height:38, borderRadius:12, display:'grid', placeItems:'center' }}>
            <I name="x" size={18} stroke="var(--ink)" sw={1.9} />
          </div>
        </div>
        <div style={scroll} className="noscroll">
          {/* image dropzone (replaces "Image URL" text input) */}
          <div style={{ fontWeight:600, fontSize:13.5, color:'var(--muted)', marginBottom:8 }}>Event banner</div>
          <div style={{ borderRadius:18, border:'1.5px dashed rgba(168,85,247,.45)', padding:'30px 18px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:9, marginBottom:10,
            background:'radial-gradient(120% 90% at 50% 0%, rgba(168,85,247,.12), rgba(26,16,47,.5))' }}>
            <div style={{ width:52, height:52, borderRadius:15, display:'grid', placeItems:'center',
              background:'var(--glass-2)', border:'1px solid var(--glass-brd)' }}>
              <I name="upload" size={24} stroke="var(--accent-line)" sw={1.8} />
            </div>
            <div style={{ fontWeight:700, fontSize:15.5, color:'var(--ink)' }}>Drop a banner or browse</div>
            <div style={{ color:'var(--faint)', fontSize:13, fontWeight:500 }}>PNG or JPG · up to 10MB</div>
          </div>
          <div style={{ color:'var(--faint)', fontSize:12.5, fontWeight:500, marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>
            <I name="spark" size={14} stroke="var(--accent-line)" sw={1.7} />
            No image? meow generates a cover for you.
          </div>
          <Field label="Event name" value="Cerebral Valley AI Summit" />
          <Field label="Date & time" icon="calendar" value="Thu, Nov 14 · 9:00 AM" />
          <Field label="Location" icon="pin" ph="Search a venue or address" />
          <Field label="Category" icon="compass" value="Summit" />
        </div>
        <div style={{ flex:'none', padding:'0 16px 16px' }}>
          <button className="btn btn--primary" style={{ width:'100%', padding:'16px' }}>
            <I name="check" size={19} stroke="var(--accent-ink)" sw={2} /> Publish event
          </button>
        </div>
      </React.Fragment>
    );
  }

  Object.assign(window, { FeedScreen, NearMeScreen, DetailScreen, InternScreen, CreateScreen });
})();
