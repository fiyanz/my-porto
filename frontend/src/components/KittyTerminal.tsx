'use client';
import { useState, useRef, useEffect } from 'react';

export default function KittyTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState<React.ReactNode[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p) setProfile(p); })
      .catch(() => {});

    fetch('/api/projects/')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setProjects(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && lines.length === 0) {
      setTimeout(() => runCmd('neofetch'), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  const openKitty = () => setIsOpen(true);
  const closeKitty = () => setIsOpen(false);
  const resetTerm = () => setLines([]);

  const appendRaw = (node: React.ReactNode) => {
    setLines((prev) => [...prev, node]);
  };

  const runCmd = (cmd: string) => {
    const c = cmd.toLowerCase().trim();
    if (c === 'neofetch') {
      appendRaw(
        <div key={Date.now()} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', margin: '8px 0' }}>
          <pre className="term-ascii">{'    /\\_/\\\n  ( o.o )\n   > ^ <'}</pre>
          <div>
            <div className="term-line"><span className="term-label">OS:       </span><span className="term-value">Hyprland / Arch Linux</span></div>
            <div className="term-line"><span className="term-label">Host:     </span><span className="term-value">{profile?.name || 'Bagus Alfiyan'}</span></div>
            <div className="term-line"><span className="term-label">Kernel:   </span><span className="term-value">ML / Backend / IoT Systems</span></div>
            <div className="term-line"><span className="term-label">Shell:    </span><span className="term-value">Kitty / Zsh + JetBrains Mono</span></div>
            <div className="term-line"><span className="term-label">Projects: </span><span className="term-value">{projects.length} Synced Repositories</span></div>
            <div className="term-line"><span className="term-label">Bio:      </span><span className="term-value">{profile?.bio || 'Building at the intersection of ML, Backend & Systems.'}</span></div>
          </div>
        </div>
      );
    } else if (c === 'projects') {
      appendRaw(
        <div key={Date.now()} style={{ margin: '8px 0' }}>
          <div className="term-line" style={{ color: '#bb9af7', fontWeight: 700 }}>── Portfolio Projects ({projects.length}) ──</div>
          {projects.length > 0 ? (
            projects.slice(0, 5).map((p: any, idx: number) => (
              <div key={idx} className="term-line">
                <span className="term-label">[{p.category || 'Code'}] </span>
                <span className="term-value">{p.slug || p.title}</span> — {(p.technologies || []).slice(0, 3).join(' · ')}
              </div>
            ))
          ) : (
            <div className="term-line" style={{ color: '#565f89' }}>No projects registered yet. Sync via Admin to display repos.</div>
          )}
          <div className="term-line" style={{ color: '#565f89', marginTop: '4px' }}>→ visit /projects for complete catalog</div>
        </div>
      );
    } else if (c === 'contact') {
      appendRaw(
        <div key={Date.now()} style={{ margin: '8px 0' }}>
          <div className="term-line" style={{ color: '#bb9af7', fontWeight: 700 }}>── Contact Info ──</div>
          <div className="term-line"><span className="term-label">GitHub:   </span><span className="term-value">{profile?.github_url || 'https://github.com/Fiyanz'}</span></div>
          <div className="term-line"><span className="term-label">LinkedIn: </span><span className="term-value">{profile?.linkedin_url || 'Not set'}</span></div>
          <div className="term-line"><span className="term-label">Email:    </span><span className="term-value">{profile?.email || 'bagusalfiyanyusuf@gmail.com'}</span></div>
        </div>
      );
    } else if (c === 'sudo hire' || c === 'hire') {
      appendRaw(
        <div key={Date.now()} style={{ margin: '8px 0' }}>
          <div className="term-line" style={{ color: '#9ece6a', fontWeight: 700 }}>[sudo] initiating contact & CV dispatch…</div>
          <div className="term-line" style={{ color: '#9ece6a' }}>✓ Profile: {profile?.name || 'Bagus Alfiyan'}</div>
          <div className="term-line" style={{ color: '#e0af68', marginTop: '6px' }}>📄 CV URL: {profile?.cv_url || '/api/files/cv'}</div>
        </div>
      );
    } else if (c === 'clear') {
      resetTerm();
    } else if (c === 'help') {
      appendRaw(
        <div key={Date.now()} style={{ margin: '8px 0' }}>
          <div className="term-line" style={{ color: '#bb9af7', fontWeight: 700 }}>── Available Commands ──</div>
          <div className="term-line"><span className="term-label">neofetch   </span>Show system info & bio</div>
          <div className="term-line"><span className="term-label">projects   </span>List registered portfolio projects</div>
          <div className="term-line"><span className="term-label">contact    </span>Show authentic contact links</div>
          <div className="term-line"><span className="term-label">hire       </span>Display CV link & details</div>
          <div className="term-line"><span className="term-label">clear      </span>Clear terminal</div>
        </div>
      );
    } else {
      appendRaw(
        <div key={Date.now()} className="term-line" style={{ color: '#f7768e' }}>
          bash: {cmd}: command not found — try &apos;help&apos;
        </div>
      );
    }
  };

  const sendCmd = () => {
    const val = inputValue.trim();
    if (!val) return;
    appendRaw(
      <div key={Date.now() + 'input'} className="term-line">
        <span className="term-prompt">bagus@hyprland-rice ~ $</span> <span className="term-cmd">{val}</span>
      </div>
    );
    setInputValue('');
    runCmd(val);
  };

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = { ox: e.clientX - position.x, oy: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    setPosition({
      x: e.clientX - dragRef.current.ox,
      y: e.clientY - dragRef.current.oy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      const move = (e: MouseEvent) => handleMouseMove(e as any);
      const up = () => handleMouseUp();
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      return () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      };
    }
  }, [isDragging]);

  return (
    <>
      <button
        id="kitty-trigger"
        onClick={openKitty}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9997,
          background: '#1a1b26', color: '#7aa2f7', border: '2px solid #3b3d57',
          padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}
      >
        <span style={{ color: '#9ece6a', fontWeight: 700 }}>$</span> kitty
        <span style={{ color: '#a9b1d6', fontSize: '10px' }}>(Wayland)</span>
      </button>

      {isOpen && (
        <>
          <div id="kitty-overlay" className="open" onClick={closeKitty}></div>
          <div
            id="kitty-window"
            className="open"
            style={{
              transform: position.x !== 0 || position.y !== 0 ? 'none' : 'translate(-50%, -50%)',
              left: position.x !== 0 ? position.x + 'px' : '50%',
              top: position.y !== 0 ? position.y + 'px' : '50%',
            }}
          >
            <div className="kitty-titlebar" onMouseDown={handleMouseDown}>
              <div className="kitty-dots">
                <div className="kitty-dot dot-red" onClick={closeKitty} title="Close"></div>
                <div className="kitty-dot dot-yellow" title="Minimize"></div>
                <div className="kitty-dot dot-green" title="Maximize"></div>
              </div>
              <span className="kitty-title">&gt;_ kitty ~ bagus@hyprland-rice (Wayland)</span>
              <button className="kitty-reset" onClick={resetTerm}>Reset</button>
            </div>

            <div className="kitty-body" ref={bodyRef}>
              <div className="kitty-tip">
                💡 Tip: Type <a onClick={() => runCmd('neofetch')}>neofetch</a>,{' '}
                <a onClick={() => runCmd('projects')}>projects</a>,{' '}
                <a onClick={() => runCmd('contact')}>contact</a>, or{' '}
                <a onClick={() => runCmd('hire')}>hire</a> below!
              </div>

              <div id="term-output">
                {lines}
              </div>
            </div>

            <div className="kitty-inputbar">
              <span>bagus@hyprland-rice ~ $</span>
              <input
                type="text"
                autoFocus
                placeholder="type 'help' or 'neofetch'..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendCmd();
                }}
                spellCheck={false}
                autoComplete="off"
              />
              <button className="kitty-send" onClick={sendCmd}>
                <i className="fa-solid fa-paper-plane" style={{ fontSize: '11px' }}></i>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
