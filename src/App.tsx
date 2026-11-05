import { useMemo, useState } from 'react'
import {
  Activity, Archive, ArrowDownToLine, ArrowUpRight, Bell, BookOpen, Box,
  Braces, ChevronDown, ChevronRight, Clock3, Command, Database, FileCode2,
  FileImage, Files, FolderOpen,
  HardDrive, LayoutDashboard, LockKeyhole, LogOut, Menu, MoreHorizontal,
  Plus, Search, Settings2, ShieldCheck,
  UploadCloud, Users, X, Zap,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Section = 'Overview' | 'Projects' | 'Source Vault' | 'Code Snippets' | 'Asset Library' | 'Config Vault' | 'Knowledge Base' | 'Team' | 'Activity'
const navigation: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'Projects', icon: Box },
  { label: 'Source Vault', icon: FileCode2 }, { label: 'Code Snippets', icon: Braces },
  { label: 'Asset Library', icon: Files }, { label: 'Config Vault', icon: LockKeyhole },
  { label: 'Knowledge Base', icon: BookOpen }, { label: 'Team', icon: Users },
  { label: 'Activity', icon: Activity },
]
const initialProjects = [
  { name: 'Baron Launcher', description: 'A modern Minecraft Java launcher', language: 'Java · Kotlin', status: 'In progress', files: 42, color: 'red', icon: '⌘' },
  { name: 'Nispax Studio', description: 'Cross-device video editing workspace', language: 'TypeScript', status: 'Planning', files: 18, color: 'violet', icon: '◈' },
  { name: 'Baron Habits', description: 'Personal habit tracking application', language: 'React · Supabase', status: 'Active', files: 27, color: 'blue', icon: '✳' },
]
const resources = [
  { name: 'supabase-client.ts', path: 'src/lib/', type: 'TS', size: '2.4 KB', icon: FileCode2 },
  { name: 'database-schema.sql', path: 'supabase/', type: 'SQL', size: '8.1 KB', icon: Database },
  { name: 'brand-assets.zip', path: 'assets/branding/', type: 'ZIP', size: '14.8 MB', icon: Archive },
  { name: 'setup-guide.md', path: 'docs/', type: 'MD', size: '5.2 KB', icon: BookOpen },
]
const snippets = [
  { title: 'Supabase client setup', lang: 'TypeScript', code: "const supabase = createClient(url, anonKey)" },
  { title: 'React state pattern', lang: 'TSX', code: "const [items, setItems] = useState<Item[]>([])" },
  { title: 'SQL timestamp trigger', lang: 'SQL', code: "updated_at = timezone('utc', now())" },
]
function App() {
  const [section, setSection] = useState<Section>('Overview')
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projects, setProjects] = useState(initialProjects)
  const [notice, setNotice] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authBusy, setAuthBusy] = useState(false)
  const [session, setSession] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const filteredProjects = useMemo(() => projects.filter(p => (p.name + p.description + p.language).toLowerCase().includes(query.toLowerCase())), [projects, query])

  async function authenticate() {
    if (!supabase) { setNotice('Add your Supabase URL and publishable/anon key to enable authentication.'); return }
    if (!userEmail || !password) { setNotice('Enter your email and password first.'); return }
    setAuthBusy(true)
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email: userEmail, password })
      : await supabase.auth.signInWithPassword({ email: userEmail, password })
    setAuthBusy(false)
    if (result.error) setNotice(result.error.message)
    else { setSession(true); setShowAuth(false); setNotice(authMode === 'signup' ? 'Account created. Check your email if confirmation is enabled.' : 'Signed in successfully.') }
  }
  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setSession(false); setNotice('Signed out.')
  }
  function createProject() {
    if (!projectName.trim()) return
    setProjects(current => [{ name: projectName.trim(), description: 'New workspace project', language: 'Not specified', status: 'Planning', files: 0, color: 'red', icon: '✳' }, ...current])
    setProjectName(''); setShowCreate(false); setSection('Projects'); setNotice('Project added to this preview. Connect Supabase to persist it.')
  }
  const title = section === 'Overview' ? 'Your workspace, in focus.' : section
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Command size={19}/></div><div><strong>mad-compile</strong><span>DEVELOPER WORKSPACE</span></div><button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
        <div className="workspace-switch"><div className="workspace-avatar">M</div><div className="workspace-copy"><strong>My workspace</strong><span>Personal team</span></div><ChevronDown size={15}/></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{navigation.map(item => { const Icon = item.icon; return <button key={item.label} className={`nav-item ${section === item.label ? 'active' : ''}`} onClick={() => { setSection(item.label); setMobileOpen(false) }}><Icon size={17}/><span>{item.label}</span>{item.label === 'Team' && <span className="nav-count">1</span>}</button> })}</nav>
        <div className="sidebar-bottom"><div className="storage-card"><div className="storage-heading"><HardDrive size={15}/><span>Storage</span><span className="storage-value">0 / 5 GB</span></div><div className="storage-track"><i/></div><small>Connect Supabase Storage to get started.</small></div><button className="nav-item" onClick={() => setSection('Activity')}><Settings2 size={17}/><span>Settings</span></button><div className="profile-row"><div className="profile-avatar">MC</div><div className="profile-info"><strong>{session ? userEmail : 'Workspace owner'}</strong><span>{session ? 'Signed in' : 'Local preview'}</span></div><button className="icon-btn" onClick={() => session ? signOut() : setShowAuth(true)} aria-label={session ? 'Sign out' : 'Sign in'}>{session ? <LogOut size={16}/> : <ArrowUpRight size={16}/>}</button></div></div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={19}/></button><div className="breadcrumbs">Workspace <ChevronRight size={14}/> <strong>{section}</strong></div></div><div className="topbar-actions"><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search anything..."/><kbd>⌘ K</kbd></label><button className="icon-btn notification-btn" aria-label="Notifications"><Bell size={18}/><i/></button><button className="top-avatar" onClick={() => setShowAuth(true)}>MC</button></div></header>
        <div className="page-content">
          <div className="page-heading"><div><div className="eyebrow"><span className="live-dot"/>{isSupabaseConfigured ? 'SUPABASE CONFIGURED' : 'YOUR PRIVATE DEVELOPER DATABASE'}</div><h1>{title}</h1><p>{section === 'Overview' ? 'Everything you build, organized in one place.' : `Manage your ${section.toLowerCase()} in one workspace.`}</p></div><div className="heading-actions"><button className="button button-secondary" onClick={() => setNotice('Upload UI is ready for the Supabase Storage integration phase.')}><UploadCloud size={16}/> Upload</button><button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={17}/> New project</button></div></div>
          {notice && <div className="notice"><ShieldCheck size={16}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}
          {section === 'Overview' && <>
            {!isSupabaseConfigured && <div className="setup-banner"><div className="setup-icon"><Zap size={18}/></div><div><strong>Connect your database to unlock the workspace</strong><span>Add your Supabase project URL and publishable key in Vercel environment variables. Then run the SQL setup script.</span></div><button onClick={() => setSection('Activity')}>Setup guide <ArrowUpRight size={14}/></button></div>}
            <div className="stats-grid"><Stat icon={Box} label="Projects" value={String(projects.length).padStart(2,'0')} delta="Your project library" tone="red"/><Stat icon={FileCode2} label="Source files" value="00" delta="Ready to organize" tone="blue"/><Stat icon={HardDrive} label="Storage used" value="0 B" delta="Supabase Storage" tone="violet"/><Stat icon={Users} label="Team members" value="01" delta="Workspace owner" tone="green"/></div>
            <div className="content-grid"><section className="panel projects-panel"><div className="panel-heading"><div><h2>Recent projects</h2><p>Your latest workspaces</p></div><button className="text-action" onClick={() => setSection('Projects')}>View all <ArrowUpRight size={14}/></button></div><div className="project-list">{filteredProjects.map(p => <div className="project-row" key={p.name}><div className={`project-icon ${p.color}`}>{p.icon}</div><div className="project-main"><strong>{p.name}</strong><span>{p.description}</span><small>{p.language}</small></div><div className="project-meta"><span className={`status status-${p.status.toLowerCase().replace(' ','-')}`}>{p.status}</span><small>{p.files} files</small></div><button className="icon-btn row-more" aria-label={`More options for ${p.name}`} onClick={() => setNotice(`Project: ${p.name}. Project detail pages are coming in the next build phase.`)}><MoreHorizontal size={17}/></button></div>)}</div><button className="add-project" onClick={() => setShowCreate(true)}><Plus size={16}/> Create a new project</button></section>
              <section className="panel activity-panel"><div className="panel-heading"><div><h2>Workspace pulse</h2><p>A quick look at your space</p></div><span className="panel-icon"><Activity size={17}/></span></div><div className="pulse-chart"><div className="chart-grid"><i/><i/><i/><i/></div><div className="chart-bars">{[34,52,43,68,47,78,58,88,62,72,48,94,65,80,56,74,43,68,90,58,76,49,83,62].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div><div className="chart-caption"><span>Workspace activity</span><strong><span className="live-dot"/> Live after setup</strong></div><div className="activity-empty"><Clock3 size={16}/><span>Activity will appear here as your team works.</span></div></section></div>
            <div className="bottom-grid"><section className="panel"><div className="panel-heading"><div><h2>Quick access</h2><p>Jump back into your resources</p></div><button className="icon-btn" aria-label="More"><MoreHorizontal size={18}/></button></div><div className="resource-list">{resources.map(r => {const Icon=r.icon;return <button className="resource-row" key={r.name} onClick={() => setSection('Source Vault')}><div className="resource-icon"><Icon size={17}/></div><div className="resource-main"><strong>{r.name}</strong><span>{r.path}</span></div><span className="file-type">{r.type}</span><small>{r.size}</small><ArrowDownToLine size={15}/></button>})}</div></section><section className="panel snippets-panel"><div className="panel-heading"><div><h2>Saved snippets</h2><p>Your reusable building blocks</p></div><button className="text-action" onClick={() => setSection('Code Snippets')}>Browse <ArrowUpRight size={14}/></button></div>{snippets.map(s=><div className="snippet-row" key={s.title}><div className="snippet-title"><Braces size={15}/><strong>{s.title}</strong><span>{s.lang}</span></div><code>{s.code}</code></div>)}</section></div>
          </>}
          {section === 'Projects' && <section className="panel full-panel"><div className="panel-heading"><div><h2>All projects</h2><p>{projects.length} projects in this preview</p></div><button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={16}/> New project</button></div><div className="project-list">{filteredProjects.map(p=><div className="project-row" key={p.name}><div className={`project-icon ${p.color}`}>{p.icon}</div><div className="project-main"><strong>{p.name}</strong><span>{p.description}</span><small>{p.language}</small></div><div className="project-meta"><span className="status status-in-progress">{p.status}</span><small>{p.files} files</small></div><button className="icon-btn" onClick={()=>setNotice(`Details for ${p.name} will be enabled with database-backed project pages.`)}><ChevronRight size={17}/></button></div>)}</div></section>}
          {section !== 'Overview' && section !== 'Projects' && <section className="panel empty-section"><div className="empty-icon">{section === 'Team' ? <Users/> : section === 'Asset Library' ? <FileImage/> : section === 'Knowledge Base' ? <BookOpen/> : section === 'Config Vault' ? <LockKeyhole/> : section === 'Activity' ? <Activity/> : <FolderOpen/>}</div><h2>{section} is being prepared</h2><p>This workspace section is included in the build plan. Its database-backed tools will be added in the next implementation phase.</p><button className="button button-secondary" onClick={() => setSection('Overview')}>Back to overview</button></section>}
          <footer className="footer"><span>© 2026 Mad-compile</span><span><i className="footer-dot"/> {isSupabaseConfigured ? 'Database credentials detected' : 'Preview mode'} <span className="footer-sep">·</span> Built for builders</span></footer>
        </div>
      </main>
      {showCreate && <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setShowCreate(false)}}><div className="modal"><div className="modal-heading"><div><span className="eyebrow">PROJECT LIBRARY</span><h2>Create a project</h2></div><button className="icon-btn" onClick={()=>setShowCreate(false)}><X size={18}/></button></div><label className="field-label">Project name<input autoFocus value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="e.g. My next project"/></label><div className="modal-actions"><button className="button button-secondary" onClick={()=>setShowCreate(false)}>Cancel</button><button className="button button-primary" onClick={createProject} disabled={!projectName.trim()}><Plus size={16}/> Create project</button></div><small className="modal-note">Preview only: projects will be saved to Supabase when the database integration is connected.</small></div></div>}
      {showAuth && <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setShowAuth(false)}}><div className="modal"><div className="modal-heading"><div><span className="eyebrow">WORKSPACE ACCESS</span><h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2></div><button className="icon-btn" onClick={()=>setShowAuth(false)}><X size={18}/></button></div><label className="field-label">Email<input type="email" value={userEmail} onChange={e=>setUserEmail(e.target.value)} placeholder="you@example.com"/></label><label className="field-label">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label><button className="button button-primary modal-submit" disabled={authBusy} onClick={authenticate}>{authBusy ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}</button><button className="switch-auth" onClick={()=>setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Need an account? Create one' : 'Already registered? Sign in'}</button><small className="modal-note">{isSupabaseConfigured ? 'Authentication is connected to your Supabase project.' : 'Configure Supabase environment variables to enable sign-in.'}</small></div></div>}
    </div>
  )
}
function Stat({icon:Icon,label,value,delta,tone}:{icon:typeof Box;label:string;value:string;delta:string;tone:string}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><div className="stat-label">{label}</div><strong>{value}</strong><div className="stat-delta">{delta}</div></div>
}
export default App
