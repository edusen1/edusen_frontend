import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a', background: '#fff' }}>
      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e6ebf1', height: 64, display: 'flex', alignItems: 'center', padding: '0 48px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-.02em' }}>Edusen</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" style={{ height: 40, padding: '0 20px', display: 'inline-flex', alignItems: 'center', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
          <Link href="/login" style={{ height: 40, padding: '0 20px', display: 'inline-flex', alignItems: 'center', border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Commencer</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #fff 50%, #f0fdf4 100%)', padding: '100px 48px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 14px', marginBottom: 28, fontSize: 13, color: '#2563eb', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, background: '#2563eb', borderRadius: '50%', display: 'inline-block' }} />
          Système de gestion scolaire nouvelle génération
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: 24 }}>
          Gérez votre école<br />
          <span style={{ color: '#2563eb' }}>avec intelligence</span>
        </h1>
        <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Edusen centralise élèves, enseignants, notes, absences, paiements et bulletins dans une plateforme moderne et sécurisée.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{ height: 52, padding: '0 32px', display: 'inline-flex', alignItems: 'center', gap: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Accéder à la plateforme
          </Link>
          <a href="#fonctionnalites" style={{ height: 52, padding: '0 28px', display: 'inline-flex', alignItems: 'center', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Découvrir les fonctionnalités
          </a>
        </div>
      </section>

      {/* STATS TICKER */}
      <section style={{ background: '#0f172a', padding: '28px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, maxWidth: 960, margin: '0 auto' }}>
          {[
            { val: '500+', label: 'Écoles clientes' },
            { val: '120 000+', label: 'Élèves gérés' },
            { val: '8 000+', label: 'Enseignants' },
            { val: '99.9%', label: 'Disponibilité' },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '8px 0', borderRight: i < 3 ? '1px solid #1e293b' : 'none' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#60a5fa', letterSpacing: '-.02em' }}>{s.val}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>À propos</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 20, letterSpacing: '-.02em' }}>Une solution pensée pour l'Afrique</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8, marginBottom: 20 }}>
              Edusen est né du besoin de moderniser la gestion scolaire dans les établissements francophones d'Afrique. Notre plateforme multi-tenant s'adapte à chaque école tout en garantissant la sécurité des données.
            </p>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8 }}>
              De la saisie des notes à la génération des bulletins PDF, en passant par la gestion des paiements et la communication avec les parents — tout est centralisé.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { icon: '🎓', title: 'Multi-rôles', desc: 'Admin, Professeur, Élève, Parent, Caisse, Surveillant' },
              { icon: '🔒', title: 'Sécurisé', desc: 'JWT RS256, chiffrement, isolation multi-tenant' },
              { icon: '📱', title: 'Responsive', desc: 'Accessible depuis tous les appareils' },
              { icon: '☁️', title: 'Cloud', desc: 'Données hébergées et sauvegardées automatiquement' },
            ].map((c) => (
              <div key={c.title} style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '20px 18px' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalites" style={{ padding: '80px 48px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Fonctionnalités</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#0f172a', letterSpacing: '-.02em' }}>Tout ce dont votre école a besoin</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: '📋', title: 'Gestion des élèves', desc: 'Inscriptions, dossiers complets, suivi académique, parents et contacts d\'urgence.' },
              { icon: '📝', title: 'Notes & Bulletins', desc: 'Saisie des notes par trimestre, calcul automatique des moyennes, génération PDF des bulletins.' },
              { icon: '📅', title: 'Absences & Présences', desc: 'Appel numérique, suivi des absences élèves et du personnel, justificatifs.' },
              { icon: '💰', title: 'Gestion financière', desc: 'Frais de scolarité, suivi des paiements, rapports financiers, caisse en ligne.' },
              { icon: '📢', title: 'Communication', desc: 'Annonces, convocations, réclamations, notifications en temps réel aux parents.' },
              { icon: '🗓️', title: 'Emploi du temps', desc: 'Planification des cours, affectation des salles, calendrier scolaire annuel.' },
            ].map((f) => (
              <div key={f.title} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '28px 24px' }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Espaces dédiés</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#0f172a', letterSpacing: '-.02em' }}>Un portail pour chaque acteur</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { title: 'Administrateur', color: '#2563eb', bg: '#eff6ff', desc: 'Vue globale de l\'établissement. Gestion complète des élèves, personnel, classes, bulletins, paiements et paramètres.' },
              { title: 'Enseignant', color: '#059669', bg: '#f0fdf4', desc: 'Saisie des notes, feuille d\'appel numérique, cahier de textes, emploi du temps et suivi de classe.' },
              { title: 'Parent / Élève', color: '#d97706', bg: '#fffbeb', desc: 'Consultation des notes, bulletins PDF, absences, paiements et communication directe avec l\'école.' },
            ].map((r) => (
              <div key={r.title} style={{ border: '1px solid #e6ebf1', padding: '32px 28px' }}>
                <div style={{ width: 48, height: 48, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0f172a', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-.02em' }}>Prêt à transformer votre école ?</h2>
        <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 36 }}>Rejoignez les centaines d'établissements qui font confiance à Edusen.</p>
        <Link href="/login" style={{ height: 52, padding: '0 40px', display: 'inline-flex', alignItems: 'center', gap: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
          Accéder à la plateforme
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#020617', padding: '48px 48px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Edusen</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, maxWidth: 260 }}>Système de gestion scolaire pour les établissements d'Afrique francophone.</p>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>Produit</div>
              {['Fonctionnalités', 'Tarifs', 'Démo', 'API'].map((l) => (
                <div key={l} style={{ fontSize: 13, color: '#64748b', marginBottom: 10, cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>Entreprise</div>
              {['À propos', 'Blog', 'Carrières', 'Contact'].map((l) => (
                <div key={l} style={{ fontSize: 13, color: '#64748b', marginBottom: 10, cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>Contact</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>📧 contact@edusen.sn</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>📞 +221 77 000 00 00</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>📍 Dakar, Sénégal</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#475569' }}>© 2026 Edusen. Tous droits réservés.</span>
            <span style={{ fontSize: 12, color: '#475569' }}>Politique de confidentialité · CGU</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
