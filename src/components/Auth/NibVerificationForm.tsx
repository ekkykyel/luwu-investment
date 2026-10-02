import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react';

interface NibVerificationFormProps {
  isDarkMode?: boolean;
}

export default function NibVerificationForm({ isDarkMode = true }: NibVerificationFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [companyName, setCompanyName] = useState('');
  const [nibNumber, setNibNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{13}$/.test(nibNumber)) {
      setError(t('nibVerification.errorNibLength'));
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-xl`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
          <ShieldCheck size={24} />
        </div>
        <h3 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {t('nibVerification.title')}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600'}`}>
                {t('nibVerification.companyNameLabel')}
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={String(t('nibVerification.companyNamePlaceholder'))}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600'}`}>
                {t('nibVerification.nibLabel')}
              </label>
              <input
                type="text"
                required
                value={nibNumber}
                onChange={(e) => setNibNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={13}
                placeholder={String(t('nibVerification.nibPlaceholder'))}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                {t('nibVerification.nibHelpText')}
              </p>
              {error && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>
              )}
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600'}`}>
                {t('nibVerification.documentLabel')}
              </label>
              <div className={`relative flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl transition-colors cursor-pointer hover:border-blue-500/50 ${
                isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-slate-50'
              }`}>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-400 pointer-events-none">
                  {file ? (
                    <>
                      <FileText className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
                      <span className={`text-xs font-medium truncate max-w-[200px] ${isDarkMode ? 'text-slate-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {file.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} />
                      <span className="text-xs font-medium">{String(t('nibVerification.documentLabel'))}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !companyName || !nibNumber || !file}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white tracking-wide transition-all ${
                isSubmitting 
                  ? 'bg-blue-600/70 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'
              } flex items-center justify-center gap-2 mt-6`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t('nibVerification.loading')}</span>
                </>
              ) : (
                <span>{t('nibVerification.submitButton')}</span>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl border flex flex-col items-center text-center ${
              isDarkMode 
                ? 'bg-emerald-950/20 border-emerald-900/50' 
                : 'bg-emerald-50 border-emerald-100'
            }`}
          >
            <div className={`p-3 rounded-full mb-4 ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <CheckCircle2 size={32} className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} />
            </div>
            <h4 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {t('nibVerification.pendingTitle')}
            </h4>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-emerald-200/70' : 'text-emerald-800/70'}`}>
              {t('nibVerification.pendingDesc')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
