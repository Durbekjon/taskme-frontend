'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Camera, Briefcase, ArrowRight, Check, Image as ImageIcon } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { authApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { landingPathForRoles, setToken } from '@/libs/session';
import { useUser } from '@/libs/user-context';
import type { OnboardingPayload } from '@/types/api';

/** "Olim Aliyev Qodirov" -> { firstName: "Olim", lastName: "Aliyev Qodirov" } */
function splitFullName(fullName: string): { firstName?: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') || undefined };
}

type Role = 'STUDIO' | 'CREATIVE' | null;

export default function OnboardingForm() {
  const router = useRouter();

  const { user, refresh } = useUser();

  useEffect(() => {
    if (user?.roles?.includes('ADMIN') || user?.roles?.includes('CREATIVE')) {
      router.replace(landingPathForRoles(user.roles));
    }
  }, [user, router]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    whatsapp: '',
    role: null as Role,
    fullName: '',
    studioName: '',
    studioLocation: '',
    specialization: '',
    primaryGear: '',
    creativeId: '',
  });

  const [submitError, setSubmitError] = useState('');

  // Worker public IDs are "TM-######" everywhere else - this used to mint
  // "#CR-XXXXXX", which no studio could ever type into the invite box.
  const generateCreativeId = () => {
    const digits = Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({ ...prev, creativeId: `TM-${digits}` }));
  };

  const handleNext = () => setStep(s => s + 1);

  const handleRoleSelect = (role: Role) => {
    setFormData(prev => ({ ...prev, role }));
    handleNext();
  };

  const handleSubmit = async () => {
    if (!formData.role) return;
    setLoading(true);
    setSubmitError('');
    try {
      // The form collects a single "full name" but the API takes firstName and
      // lastName. Posting `formData` wholesale meant `fullName` was stripped by
      // the server and the user's name was never stored.
      const { firstName, lastName } = splitFullName(formData.fullName);
      const payload: OnboardingPayload = {
        role: formData.role,
        whatsapp: formData.whatsapp,
        firstName,
        lastName,
        ...(formData.role === 'STUDIO'
          ? {
              studioName: formData.studioName || undefined,
              studioLocation: formData.studioLocation || undefined,
            }
          : {
              specialization: formData.specialization || undefined,
              primaryGear: formData.primaryGear || undefined,
              creativeId: formData.creativeId || undefined,
            }),
      };

      const { access_token, user: onboardedUser } = await authApi.onboarding(payload);
      setToken(access_token);
      await refresh();
      router.replace(landingPathForRoles(onboardedUser.roles));
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Onboarding failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-center h-full text-text-primary">
      <AnimatePresence mode="wait">
        
        {/* Step 1: WhatsApp */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-display mb-2">Welcome to Task.me</h1>
              <p className="text-text-secondary text-body">Let&apos;s get started by connecting your WhatsApp account.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-caption uppercase tracking-wider text-text-muted">WhatsApp Number</label>
              <input
                type="text"
                placeholder="+1 234 567 8900"
                className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={formData.whatsapp}
                onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
              />
            </div>

            <GlassButton
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl hover:bg-black/80"
              onClick={handleNext}
              disabled={!formData.whatsapp}
            >
              Continue <ArrowRight size={18} />
            </GlassButton>
          </motion.div>
        )}

        {/* Step 2: Role */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-display mb-2">Choose your path</h1>
              <p className="text-text-secondary text-body">How will you be using Task.me?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleRoleSelect('STUDIO')}
                className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border border-white/40 bg-white/40 hover:bg-white/60 transition-colors shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center">
                  <Briefcase size={32} className="text-black" />
                </div>
                <div className="text-center">
                  <h3 className="text-heading">Studio / Admin</h3>
                  <p className="text-caption text-text-secondary mt-1">Manage projects & teams</p>
                </div>
              </button>

              <button 
                onClick={() => {
                  handleRoleSelect('CREATIVE');
                  generateCreativeId();
                }}
                className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border border-white/40 bg-white/40 hover:bg-white/60 transition-colors shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center">
                  <Camera size={32} className="text-black" />
                </div>
                <div className="text-center">
                  <h3 className="text-heading">Creative</h3>
                  <p className="text-caption text-text-secondary mt-1">Accept assignments</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Studio Info */}
        {step === 3 && formData.role === 'STUDIO' && (
          <motion.div 
            key="step3-studio"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-display mb-2">Studio Details</h1>
              <p className="text-text-secondary text-body">Tell us a bit about your studio.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-caption uppercase tracking-wider text-text-muted">Your Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-caption uppercase tracking-wider text-text-muted">Studio Name</label>
                <input 
                  type="text" 
                  placeholder="Acme Studios"
                  className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={formData.studioName}
                  onChange={e => setFormData(p => ({ ...p, studioName: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-caption uppercase tracking-wider text-text-muted">Location / City</label>
                <input 
                  type="text" 
                  placeholder="New York, NY"
                  className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={formData.studioLocation}
                  onChange={e => setFormData(p => ({ ...p, studioLocation: e.target.value }))}
                />
              </div>
            </div>

            {submitError && (
              <p className="text-red-500 text-sm -mb-2">{submitError}</p>
            )}
            <GlassButton 
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl hover:bg-black/80"
              onClick={handleSubmit}
              disabled={loading || !formData.fullName || !formData.studioName}
            >
              {loading ? 'Setting up...' : 'Finish Setup'} <Check size={18} />
            </GlassButton>
          </motion.div>
        )}

        {/* Step 3: Creative Info */}
        {step === 3 && formData.role === 'CREATIVE' && (
          <motion.div 
            key="step3-creative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-display mb-2">Creative Profile</h1>
              <p className="text-text-secondary text-body">Let studios know what you do best.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-caption uppercase tracking-wider text-text-muted">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Jane Smith"
                  className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-caption uppercase tracking-wider text-text-muted">Specialization</label>
                <select 
                  className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={formData.specialization}
                  onChange={e => setFormData(p => ({ ...p, specialization: e.target.value }))}
                >
                  <option value="" disabled>Select specialization</option>
                  <option value="PHOTOGRAPHER">Photographer</option>
                  <option value="VIDEOGRAPHER">Videographer</option>
                  <option value="EDITOR">Editor</option>
                  <option value="PRODUCER">Producer</option>
                  <option value="SOUND_ENGINEER">Sound Engineer</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-caption uppercase tracking-wider text-text-muted">Primary Gear / Equipment</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sony FX3, 24-70mm f/2.8"
                  className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={formData.primaryGear}
                  onChange={e => setFormData(p => ({ ...p, primaryGear: e.target.value }))}
                />
              </div>
            </div>

            <GlassButton 
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl hover:bg-black/80"
              onClick={handleNext}
              disabled={!formData.fullName || !formData.specialization}
            >
              Continue <ArrowRight size={18} />
            </GlassButton>
          </motion.div>
        )}

        {/* Step 4: Creative Finishing */}
        {step === 4 && formData.role === 'CREATIVE' && (
          <motion.div 
            key="step4-creative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-display mb-2">Final Touches</h1>
              <p className="text-text-secondary text-body">Your unique ID is generated.</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 bg-white/40 border border-white/40 rounded-[2rem] gap-4 mb-4">
              <div className="text-caption uppercase tracking-wider text-text-muted">Your Creative ID</div>
              <div className="text-4xl font-bold tracking-tight bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">
                {formData.creativeId}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-white/50 border-2 border-dashed border-black/20 flex flex-col items-center justify-center text-text-muted cursor-pointer hover:bg-white/80 transition-colors">
                <ImageIcon size={24} className="mb-1" />
                <span className="text-[10px] uppercase font-semibold tracking-wider">Upload</span>
              </div>
              <p className="text-caption text-text-muted">Profile Picture (Optional)</p>
            </div>

            {submitError && (
              <p className="text-red-500 text-sm -mb-2">{submitError}</p>
            )}
            <GlassButton 
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl hover:bg-black/80"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Finishing...' : 'Generate my ID and Finish'} <Check size={18} />
            </GlassButton>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
