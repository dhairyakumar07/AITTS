"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Brain, ChevronRight, Instagram, Play, ShieldCheck, Sparkles, Target, Trophy, Zap } from "lucide-react";
import styles from "./home.module.css";

const books = [
  { title: "Advanced Problems in Organic Chemistry for JEE", edition: "19th Edition", author: "M.S. Chouhan", category: "JEE Advanced", image: "/books/organic-jee-19.jpg", href: "https://www.amazon.in/Advanced-Problems-Organic-Chemistry-JEE/dp/9368025169" },
  { title: "Elementary Problems in Organic Chemistry for NEET", edition: "14th Edition", author: "M.S. Chouhan", category: "NEET", image: "/books/organic-neet-14.jpg", href: "https://www.amazon.in/Elementary-Problems-Organic-Chemistry-NEET/dp/9368025959" },
  { title: "Wiley's Solomons, Fryhle & Snyder Organic Chemistry for JEE", edition: "4th Edition · 2027", author: "T. W. Graham Solomons, Craig B. Fryhle, Scott A. Snyder & M.S. Chouhan", category: "JEE Main + Advanced", image: "/books/solomons-jee-2027.jpg", href: "https://www.amazon.in/Solomons-Organic-Chemistry-Advanced-Chouhan/dp/B0H7S4LD6V" },
];

const features = [
  { icon: Brain, title: "Error Fingerprint", text: "See whether marks are being lost to concepts, calculations, question selection, time pressure or careless errors." },
  { icon: Target, title: "Concept Intelligence", text: "Map your Organic Chemistry strengths and weak prerequisites instead of staring at one overall percentage." },
  { icon: Zap, title: "Your Next Move", text: "Turn every attempt into a focused recommendation for what to revise and what to test next." },
  { icon: Trophy, title: "Decision Analytics", text: "Understand which questions deserved your time and which ones quietly cost you marks." },
  { icon: BarChart3, title: "Confidence Calibration", text: "Compare what you thought you knew with what you actually got right." },
  { icon: ShieldCheck, title: "Competition With Context", text: "Rankings matter, but AITTS also tracks improvement, accuracy and consistency." },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" className={styles.logo}><span className={styles.logoMark}>A</span><span><strong>AITTS</strong><small>Organic Chemistry</small></span></Link>
        <nav className={styles.navLinks}><a href="#intelligence">Intelligence</a><a href="#marketplace">Marketplace</a><a href="#connect">Connect</a></nav>
        <div className={styles.navActions}><Link href="/login" className={styles.loginBtn}>Login</Link><Link href="/signup" className={styles.signupBtn}>Enter AITTS <ArrowRight size={16}/></Link></div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGlowOne}/><div className={styles.heroGlowTwo}/>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}><Sparkles size={15}/> A dedicated Organic Chemistry intelligence platform</div>
          <h1>Don&apos;t just solve.<br/><span>Understand why.</span></h1>
          <p>AITTS is built exclusively around Organic Chemistry — expert tests, performance intelligence and a preparation system that learns from every attempt.</p>
          <div className={styles.heroButtons}><Link href="/signup" className={styles.primaryBtn}>Start your journey <ArrowRight size={18}/></Link><Link href="/tests" className={styles.secondaryBtn}>Explore Organic Tests <ChevronRight size={17}/></Link></div>
          <div className={styles.heroTrust}><div className={styles.avatarStack}><span>O</span><span>C</span><span>+</span></div><div><strong>One subject. Deep focus.</strong><small>Concepts · reactions · mechanisms · problem solving</small></div></div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.intelligenceCard}>
            <div className={styles.intelTop}><div><span className={styles.miniLabel}>AITTS INTELLIGENCE</span><h3>Your Organic Chemistry DNA</h3></div><div className={styles.livePill}><span/>LIVE</div></div>
            <div className={styles.dnaGrid}>
              <div><span>GOC</span><strong>92</strong><i style={{width:"92%"}}/></div>
              <div><span>Mechanisms</span><strong>76</strong><i style={{width:"76%"}}/></div>
              <div><span>Stereochemistry</span><strong>64</strong><i style={{width:"64%"}}/></div>
              <div><span>Carbonyls</span><strong>88</strong><i style={{width:"88%"}}/></div>
            </div>
            <div className={styles.aiInsight}><Brain size={18}/><div><span>DETECTED PATTERN</span><strong>Strong concepts. Slow on unfamiliar mechanisms.</strong></div></div>
            <div className={styles.nextMove}><div className={styles.testIcon}><Target size={18}/></div><div><span>NEXT MOVE</span><strong>Mechanism Recovery · 12 questions</strong></div><ArrowRight size={17}/></div>
          </div>
          <div className={`${styles.floatingCard} ${styles.rankCard}`}><Trophy size={18}/><div><strong>+18%</strong><span>Improvement</span></div></div>
          <div className={`${styles.floatingCard} ${styles.streakCard}`}><Zap size={18}/><div><strong>12 days</strong><span>Organic streak</span></div></div>
        </div>
      </section>

      <section className={styles.stats}><div><strong>100%</strong><span>Organic Chemistry</span></div><div><strong>∞</strong><span>Learning depth</span></div><div><strong>1→1</strong><span>Personal feedback</span></div><div><strong>24/7</strong><span>Access</span></div></section>

      <section id="intelligence" className={styles.section}>
        <div className={styles.sectionHeading}><div><span className={styles.sectionEyebrow}>THE DIFFERENCE</span><h2>A test gives you a score.<br/><span>AITTS gives you a diagnosis.</span></h2></div><p>Every attempt should answer a better question than “how many marks did I get?” AITTS is designed around what happened, why it happened and what to do next.</p></div>
        <div className={styles.featureGrid}>{features.map(({icon:Icon,title,text})=><article className={styles.featureCard} key={title}><div className={styles.featureIcon}><Icon size={21}/></div><h3>{title}</h3><p>{text}</p><div className={styles.cardArrow}><ArrowRight size={17}/></div></article>)}</div>
      </section>

      <section className={styles.warRoom}>
        <div className={styles.warGlow}/>
        <div className={styles.warCopy}><span className={styles.sectionEyebrow}>THE ORGANIC WAR ROOM</span><h2>Your preparation,<br/><span>decoded.</span></h2><p>Imagine opening AITTS after a test and instantly knowing the three concepts costing you the most marks, the mistake pattern behind them and the exact recovery path.</p><Link href="/dashboard" className={styles.primaryBtn}>See the command center <ArrowRight size={17}/></Link></div>
        <div className={styles.warPanel}>
          <div className={styles.panelHead}><span>PREPARATION SIGNAL</span><strong>THIS WEEK</strong></div>
          <div className={styles.signal}><div><span>Concept strength</span><strong>81%</strong></div><div className={styles.signalBar}><i style={{width:"81%"}}/></div></div>
          <div className={styles.signal}><div><span>Accuracy</span><strong>74%</strong></div><div className={styles.signalBar}><i style={{width:"74%"}}/></div></div>
          <div className={styles.signal}><div><span>Decision quality</span><strong>62%</strong></div><div className={styles.signalBar}><i style={{width:"62%"}}/></div></div>
          <div className={styles.recovery}><div className={styles.recoveryIcon}><Target size={17}/></div><div><span>RECOMMENDED NEXT</span><strong>Reaction Mechanism Recovery</strong><small>24 min · 15 questions</small></div><ArrowRight size={17}/></div>
        </div>
      </section>

      <section id="marketplace" className={`${styles.section} ${styles.marketplace}`}>
        <div className={styles.marketHeader}><div><span className={styles.sectionEyebrow}>THE LIBRARY</span><h2>The Organic Chemistry<br/><span>collection.</span></h2></div><p>Books written and curated for students who want to go deeper than a standard test series.</p></div>
        <div className={styles.bookGrid}>{books.map(book=><article className={styles.bookCard} key={book.title}><div className={styles.bookImageWrap}><img src={book.image} alt={book.title} className={styles.bookImage}/><div className={styles.bookBadge}>{book.category}</div></div><div className={styles.bookBody}><span className={styles.bookEdition}>{book.edition}</span><h3>{book.title}</h3><p>{book.author}</p><a href={book.href} target="_blank" rel="noopener noreferrer" className={styles.bookButton}>View book <ArrowRight size={17}/></a></div></article>)}</div>
      </section>

      <section id="connect" className={styles.connectSection}>
        <div className={styles.connectGlow}/><div className={styles.connectContent}><span className={styles.sectionEyebrow}>LEARN BEYOND AITTS</span><h2>Stay close to<br/><span>the source.</span></h2><p>Follow M.S. Chouhan for Organic Chemistry content, explanations, updates and new resources.</p><div className={styles.socialGrid}>
          <a href="https://www.youtube.com/@mschouhanorganic" target="_blank" rel="noopener noreferrer" className={styles.socialCard}><div className={`${styles.socialIcon} ${styles.youtube}`}><Play size={21} fill="currentColor"/></div><div><strong>YouTube</strong><span>@mschouhanorganic</span></div><ArrowRight size={19}/></a>
          <a href="https://www.instagram.com/mschouhanorganic" target="_blank" rel="noopener noreferrer" className={styles.socialCard}><div className={`${styles.socialIcon} ${styles.instagram}`}><Instagram size={21}/></div><div><strong>Instagram</strong><span>@mschouhanorganic</span></div><ArrowRight size={19}/></a>
        </div></div><div className={styles.connectVisual}><div className={styles.connectOrb}><BookOpen size={43}/></div><div className={styles.connectQuote}><span>ORGANIC CHEMISTRY</span><strong>Depth beats shortcuts.</strong></div></div>
      </section>

      <section className={styles.cta}><div><span className={styles.sectionEyebrow}>READY?</span><h2>Stop collecting scores.<br/><span>Start collecting insight.</span></h2></div><Link href="/signup" className={styles.ctaButton}>Enter AITTS <ArrowRight size={19}/></Link></section>

      <footer className={styles.footer}><div className={styles.footerBrand}><div className={styles.logo}><span className={styles.logoMark}>A</span><span><strong>AITTS</strong><small>Organic Chemistry</small></span></div><p>A focused Organic Chemistry testing and performance intelligence platform.</p></div><div className={styles.footerLinks}><div><strong>Platform</strong><Link href="/tests">Organic Tests</Link><Link href="/results">Results</Link><Link href="/dashboard">War Room</Link></div><div><strong>Account</strong><Link href="/login">Login</Link><Link href="/signup">Register</Link><Link href="/profile">Profile</Link></div><div><strong>Connect</strong><a href="https://www.youtube.com/@mschouhanorganic" target="_blank" rel="noopener noreferrer">YouTube</a><a href="https://www.instagram.com/mschouhanorganic" target="_blank" rel="noopener noreferrer">Instagram</a></div></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} AITTS. All rights reserved.</span><span>Built exclusively for Organic Chemistry.</span></div></footer>
    </main>
  );
}
