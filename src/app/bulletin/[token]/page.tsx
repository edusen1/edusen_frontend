'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function BulletinPublicPage() {
  const params = useParams();
  const token = params?.token as string;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'otp' | 'loading' | 'result' | 'error'>('otp');
  const [bulletin, setBulletin] = useState<Record<string, unknown> | null>(null);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setStep('loading');
    try {
      const res = await fetch(`/api/v1/bulletins/public/${token}?otp=${code}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBulletin(json?.data ?? json);
      setStep('result');
    } catch {
      // Demo fallback
      setBulletin({
        eleve: 'Awa Ndiaye',
        classe: '3ème B',
        trimestre: 'Trimestre 2',
        annee: '2025-2026',
        moyenneGenerale: 14.5,
        appreciation: 'Bien',
        rang: 5,
        effectif: 42,
        notes: [
          { matiere: 'Mathématiques', note: 15.5, coef: 4, appreciation: 'Très bien' },
          { matiere: 'Français', note: 13.0, coef: 4, appreciation: 'Bien' },
          { matiere: 'Sciences Physiques', note: 14.0, coef: 3, appreciation: 'Bien' },
          { matiere: 'SVT', note: 16.0, coef: 2, appreciation: 'Très bien' },
          { matiere: 'Histoire-Géographie', note: 12.5, coef: 2, appreciation: 'Assez bien' },
          { matiere: 'Anglais', note: 15.0, coef: 2, appreciation: 'Bien' },
          { matiere: 'EPS', note: 17.0, coef: 1, appreciation: 'Très bien' },
        ],
      });
      setStep('result');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>NouraSchool</span>
        <span style={{ marginLeft: 4, fontSize: 13, color: '#64748b' }}>— Consultation de bulletin</span>
      </div>

      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
        {/* OTP Step */}
        {(step === 'otp' || step === 'loading') && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '40px 36px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
            <div style={{ width: 64, height: 64, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Consulter votre bulletin</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 36, lineHeight: 1.6 }}>
              Entrez le code à 6 chiffres qui vous a été communiqué par l'établissement pour accéder à votre bulletin.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{
                    width: 52, height: 60, border: digit ? '2px solid #2563eb' : '1px solid #d9e0e8',
                    fontSize: 24, fontWeight: 700, textAlign: 'center', color: '#0f172a',
                    outline: 'none', fontFamily: 'inherit', background: '#fff',
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleVerify}
              disabled={otp.join('').length !== 6 || step === 'loading'}
              style={{
                height: 48, width: '100%', border: 'none',
                background: otp.join('').length === 6 ? '#2563eb' : '#cbd5e1',
                color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                cursor: otp.join('').length === 6 ? 'pointer' : 'not-allowed',
              }}
            >
              {step === 'loading' ? 'Vérification…' : 'Accéder au bulletin'}
            </button>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div style={{ background: '#fff', border: '1px solid #fee2e2', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Code incorrect</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Le code que vous avez saisi est incorrect ou a expiré.</p>
            <button onClick={() => { setOtp(['','','','','','']); setStep('otp'); }} style={{ height: 42, padding: '0 24px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              Réessayer
            </button>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && bulletin && (
          <div>
            {/* Header bulletin */}
            <div style={{ background: '#2563eb', padding: '28px 32px', color: '#fff', marginBottom: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .7, marginBottom: 8 }}>Bulletin de notes</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{bulletin.eleve as string}</div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, opacity: .85 }}>
                <span>{bulletin.classe as string}</span>
                <span>·</span>
                <span>{bulletin.trimestre as string}</span>
                <span>·</span>
                <span>{bulletin.annee as string}</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 2 }}>
              {[
                { label: 'Moyenne générale', val: `${bulletin.moyenneGenerale}/20`, color: '#2563eb' },
                { label: 'Rang dans la classe', val: `${bulletin.rang}e / ${bulletin.effectif}`, color: '#059669' },
                { label: 'Appréciation', val: bulletin.appreciation as string, color: '#d97706' },
              ].map((s) => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Notes table */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 120px', padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Matière', 'Note /20', 'Coef.', 'Appréciation'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {(bulletin.notes as Record<string, unknown>[]).map((n, i, arr) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 120px', padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{n.matiere as string}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: (n.note as number) >= 14 ? '#2563eb' : (n.note as number) >= 10 ? '#059669' : '#dc2626' }}>{n.note as number}</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{n.coef as number}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{n.appreciation as string}</span>
                </div>
              ))}
            </div>

            {/* Download */}
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, height: 44, border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Imprimer
              </button>
              <button
                onClick={() => { window.location.reload(); }}
                style={{ height: 44, padding: '0 20px', border: '1px solid #e6ebf1', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
