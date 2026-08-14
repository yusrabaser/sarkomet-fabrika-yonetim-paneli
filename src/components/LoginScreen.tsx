import React, { useState } from 'react';
import { AuthUser, TaseronPersonel } from '../types';
import { INITIAL_CALISANLAR, INITIAL_DEPARTMANLAR, INITIAL_TASERONLAR } from '../data/mockData';
import { Factory, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, KeyRound, Sparkles, Info, HardHat, Building2, ChevronRight } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  taseronlar?: TaseronPersonel[];
}

const normalizeSlug = (str: string) =>
  str
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, taseronlar = INITIAL_TASERONLAR }) => {
  const [loginRole, setLoginRole] = useState<'SARKOMET' | 'CONTRACTOR'>('SARKOMET');
  const [username, setUsername] = useState('');
  const [contractorCode, setContractorCode] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (loginRole === 'SARKOMET') {
        const cleanInput = normalizeSlug(username.trim());

        // Admin check
        if (cleanInput === 'admin' && password === '1234') {
          const adminUser: AuthUser = {
            id: 100,
            username: 'admin',
            fullName: 'Sistem Yöneticisi (Admin)',
            role: 'ADMIN',
            title: 'İnsan Kaynakları & Eğitim Müdürü',
            departmentName: 'Yönetim / Bilgi İşlem',
          };
          onLoginSuccess(adminUser);
          return;
        }

        if (password === '1234') {
          // Search employee
          const matchedEmp = INITIAL_CALISANLAR.find((emp) => {
            const firstSlug = normalizeSlug(emp.AD);
            const fullSlug = normalizeSlug(emp.AD + emp.SOYAD);
            const lastSlug = normalizeSlug(emp.SOYAD);
            return (
              cleanInput === firstSlug ||
              cleanInput === fullSlug ||
              cleanInput === lastSlug ||
              cleanInput === 'calisan'
            );
          });

          if (matchedEmp) {
            const dept = INITIAL_DEPARTMANLAR.find((d) => d.ID === matchedEmp.DEPARTMAN_ID);
            const staffUser: AuthUser = {
              id: matchedEmp.ID,
              username: normalizeSlug(matchedEmp.AD),
              fullName: `${matchedEmp.AD} ${matchedEmp.SOYAD}`,
              role: 'EMPLOYEE',
              employeeId: matchedEmp.ID,
              departmentId: matchedEmp.DEPARTMAN_ID,
              departmentName: dept ? dept.AD : 'Üretim',
              title: 'Sarkomet Fabrika Personeli',
            };
            onLoginSuccess(staffUser);
            return;
          }
        }

        setErrorMessage('Kullanıcı adı veya şifre hatalı!');
      } else {
        // CONTRACTOR PORTAL LOGIN
        const rawCode = contractorCode.trim();
        const cleanCode = normalizeSlug(rawCode);

        if (!cleanCode) {
          setErrorMessage('Lütfen Taşeron ID (Örn: TSR-101) veya Firma Adı giriniz!');
          return;
        }

        // Search in active taseronlar dataset
        const matchedTaseron = taseronlar.find((t) => {
          const tCode = t.TASERON_CODE ? normalizeSlug(t.TASERON_CODE) : `tsr${t.ID}`;
          const companySlug = normalizeSlug(t.FIRMA_ADI);
          const idStr = t.ID.toString();
          return (
            tCode === cleanCode ||
            cleanCode.includes(tCode) ||
            tCode.includes(cleanCode) ||
            companySlug.includes(cleanCode) ||
            cleanCode.includes(companySlug) ||
            idStr === cleanCode
          );
        });

        if (matchedTaseron) {
          const validPass = matchedTaseron.PASSWORD || '1234';
          if (password !== validPass && password !== '1234' && password !== 'admin') {
            setErrorMessage(`Şifre hatalı! (${matchedTaseron.TASERON_CODE || 'Taşeron'} için varsayılan şifre: 1234)`);
            return;
          }

          const chosenCode = matchedTaseron.TASERON_CODE || `TSR-${matchedTaseron.ID}`;
          const contractorUser: AuthUser = {
            id: matchedTaseron.ID,
            username: `taseron_${normalizeSlug(matchedTaseron.FIRMA_ADI)}`,
            fullName: `${matchedTaseron.FIRMA_ADI} Yetkilisi`,
            role: 'CONTRACTOR',
            title: 'Taşeron Firma Yetkilisi & İSG Sorumlusu',
            departmentName: 'Dış Taşeron Firma',
            contractorCompany: matchedTaseron.FIRMA_ADI,
            contractorCompanyCode: chosenCode,
          };

          onLoginSuccess(contractorUser);
          return;
        }

        // Fallback for general login if not found by exact code but password is 1234
        if (password === '1234' || password === 'admin') {
          const firstTaseron = taseronlar[0];
          const chosenCompany = firstTaseron ? firstTaseron.FIRMA_ADI : 'Körfez Lojistik Ltd.';
          const chosenCode = firstTaseron ? (firstTaseron.TASERON_CODE || `TSR-${firstTaseron.ID}`) : 'TSR-101';

          const contractorUser: AuthUser = {
            id: firstTaseron ? firstTaseron.ID : 301,
            username: `taseron_${normalizeSlug(chosenCompany)}`,
            fullName: `${chosenCompany} Yetkilisi`,
            role: 'CONTRACTOR',
            title: 'Taşeron Firma Yetkilisi & İSG Sorumlusu',
            departmentName: 'Dış Taşeron Firma',
            contractorCompany: chosenCompany,
            contractorCompanyCode: chosenCode,
          };

          onLoginSuccess(contractorUser);
          return;
        }

        setErrorMessage('Taşeron ID veya şifre bulunamadı! Lütfen geçerli bir Taşeron ID (Örn: TSR-101) giriniz.');
      }
    }, 350);
  };

  const handleQuickLogin = (uname: string) => {
    setLoginRole('SARKOMET');
    setUsername(uname);
    setPassword('1234');
    setErrorMessage(null);
  };

  const handleQuickContractorLogin = (companyName: string, companyCode: string) => {
    setLoginRole('CONTRACTOR');
    setContractorCode(companyCode);
    setPassword('1234');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 z-10 relative">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 rounded-b-full shadow-lg shadow-amber-500/20" />

        {/* Logo & Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 shadow-xl shadow-orange-950/50 border border-amber-400/40 mb-3 group">
            <Factory className="w-8 h-8 text-amber-100 group-hover:scale-105 transition-transform" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-sans">
            SARKOMET <span className="text-amber-400 font-black">A.Ş.</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
            Personel & Eğitim Yönetim Portalı
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Bakır Fabrikası Kurumsal Erişim Sistemi
          </p>
        </div>

        {/* Multi-Role Login Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setLoginRole('SARKOMET');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginRole === 'SARKOMET'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-950/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>🏢 Sarkomet İK / Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginRole('CONTRACTOR');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginRole === 'CONTRACTOR'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-950/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>🚜 Taşeron Girişi</span>
          </button>
        </div>

        {/* Role Banner Badge */}
        {loginRole === 'CONTRACTOR' && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
            <HardHat className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Taşeron Bireysel Evrak Portalı</strong>
              Firma Kodu / ID ile giriş yaparak çalışanlarınızın 4 zorunlu evrağını yükleyebilir ve saha giriş onay durumunu takip edebilirsiniz.
            </div>
          </div>
        )}

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2.5 shadow-lg shadow-red-950/20">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {loginRole === 'SARKOMET' ? (
            /* Username Input for Sarkomet */
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                KULLANICI ADI VEYA E-POSTA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="admin@sarkomet.com.tr"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 focus:border-amber-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                />
              </div>
            </div>
          ) : (
            /* Contractor Code / Company ID Input */
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                TAŞERON FIRMA KODU / ID VEYA FIRMA ADI
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <HardHat className="w-4 h-4 text-amber-400" />
                </div>
                <input
                  type="text"
                  required
                  value={contractorCode}
                  onChange={(e) => {
                    setContractorCode(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Örn: TSR-101 veya Körfez Lojistik"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 focus:border-amber-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              ŞİFRE
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={loginRole === 'SARKOMET' ? '••••••••' : '••••'}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/80 focus:border-amber-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/40 w-4 h-4"
              />
              <span>Beni Hatırla</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer hover:underline"
            >
              Şifremi Unuttum?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-950/50 border border-amber-400/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Giriş Yapılıyor...</span>
              </div>
            ) : (
              <span>
                {loginRole === 'SARKOMET'
                  ? '🔑 Sarkomet İK / Admin Girişi Yap'
                  : '🚜 Taşeron Portalı Girişi'}
              </span>
            )}
          </button>
        </form>

        {/* Quick Test Accounts Section */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              {loginRole === 'SARKOMET' ? 'Örnek İK / Admin Hesapları' : 'Örnek Taşeron Firma Hesapları'}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Şifre: 1234</span>
          </p>

          {loginRole === 'SARKOMET' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 text-left transition-all hover:bg-slate-800/80 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                    Yönetici (Admin)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    Tam Yetki
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">admin</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('gulsah')}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 text-left transition-all hover:bg-slate-800/80 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                    Gülşah Yılmaz
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                    İK
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">gulsah</p>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {taseronlar.slice(0, 4).map((t) => {
                const code = t.TASERON_CODE || `TSR-${t.ID}`;
                return (
                  <button
                    key={t.ID}
                    type="button"
                    onClick={() => handleQuickContractorLogin(t.FIRMA_ADI, code)}
                    className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 text-left transition-all hover:bg-slate-800/80 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate">
                        {t.FIRMA_ADI.split(' ')[0]} {t.FIRMA_ADI.split(' ')[1] || ''}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono shrink-0">
                        {code}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {t.PERSONEL_ADI_SOYADI}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-[10px] text-slate-400 mt-2.5 text-center italic">
            {loginRole === 'SARKOMET'
              ? '* Veritabanındaki tüm fabrika personeli 1234 şifresiyle giriş yapabilir.'
              : '* Tüm taşeron firmalar Firma Kodu (TSR-101 vb.) ve 1234 şifresiyle giriş yapabilir.'}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Sarkomet A.Ş. Bilgi Güvenliği Standartlarına Uygundur
        </p>
        <p>© 2026 Sarkomet Elektrolitik Bakır Sanayi ve Ticaret A.Ş. - Tüm Hakları Saklıdır.</p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center space-x-2 text-amber-400 font-bold mb-3">
              <Info className="w-5 h-5" />
              <h3>Şifre Sıfırlama Bilgilendirmesi</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Sarkomet A.Ş. kurumsal güvenlik politikaları gereğince şifre sıfırlama veya firma kodu tanımlama işlemleri İnsan Kaynakları veya Bilgi İşlem departmanı tarafından yapılmaktadır.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg text-[11px] text-slate-400 space-y-1 font-mono mb-4 border border-slate-800">
              <p>📍 İnsan Kaynakları Dış Hat: 0262 677 10 00</p>
              <p>✉️ E-posta: ik@sarkomet.com</p>
            </div>
            <button
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
