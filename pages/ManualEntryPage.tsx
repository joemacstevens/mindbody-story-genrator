import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from '../components/ui';

const BackgroundGradients: React.FC = () => (
  <>
    <div className="pointer-events-none absolute -top-48 right-[-20%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,123,216,0.15),transparent_70%)] blur-3xl animate-pulse" />
    <div className="pointer-events-none absolute -bottom-40 left-[-15%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1),transparent_70%)] blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
  </>
);

const Header: React.FC<{ initials: string }> = ({ initials }) => (
  <header className="absolute top-0 left-0 right-0 z-10 px-8 py-6">
    <div className="flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 text-xl font-semibold text-slate-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-lg">
          📅
        </div>
        Studiogram
      </Link>
      <button 
        onClick={() => window.history.back()}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all"
      >
        <span>←</span>
        <span>Back</span>
      </button>
    </div>
  </header>
);

const HeroSection: React.FC = () => (
  <div className="text-center mb-12">
    <div className="w-16 h-16 bg-purple-500/15 border-2 border-purple-500/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">
      ✏️
    </div>
    <h1 className="text-4xl font-bold mb-3 text-slate-50">
      Add Your Gym Manually
    </h1>
    <p className="text-base text-slate-400 max-w-md mx-auto leading-relaxed">
      We'll need your Mindbody schedule URL to sync your classes
    </p>
  </div>
);

const StepsIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex justify-center gap-2 mb-8">
    <div className={`h-1 w-8 rounded-full transition-all ${currentStep === 1 ? 'bg-purple-500' : 'bg-white/10'}`}></div>
    <div className={`h-1 w-8 rounded-full transition-all ${currentStep === 2 ? 'bg-purple-500' : 'bg-white/10'}`}></div>
  </div>
);

const InfoBox: React.FC = () => (
  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-7 flex gap-3">
    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-sm flex-shrink-0">
      💡
    </div>
    <div>
      <div className="text-purple-400 font-semibold text-sm mb-1">Where to find your schedule URL</div>
      <div className="text-slate-400 text-sm leading-relaxed">
        Go to your gym's website, find the "Schedule" or "Classes" page, and copy the URL from your browser.
      </div>
    </div>
  </div>
);

const ExampleCard: React.FC = () => (
  <div className="bg-white/3 border border-white/8 rounded-xl p-4 mt-3">
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Example URL:</div>
    <div className="font-mono text-sm text-purple-400 bg-purple-500/10 p-3 rounded-lg break-all">
      https://clients.mindbodyonline.com/classic/ws?studioid=123456
    </div>
  </div>
);

const SuccessMessage: React.FC<{ onContinue: () => void }> = ({ onContinue }) => (
  <div className="text-center py-10">
    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">
      ✓
    </div>
    <h2 className="text-2xl font-bold text-green-400 mb-3">Gym Added!</h2>
    <p className="text-slate-400 mb-6">We're syncing your schedule now...</p>
    <Button
      size="md"
      className="max-w-72 mx-auto"
      onClick={onContinue}
    >
      Go to Editor
      <span>→</span>
    </Button>
  </div>
);

const ManualEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [gymName, setGymName] = useState('');
  const [gymUrl, setGymUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const initials = user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';

  const isValid = gymName.trim().length > 0 && gymUrl.trim().length > 0 && gymUrl.includes('mindbody');

  const handleContinue = async () => {
    if (!isValid) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setCurrentStep(2);
      setShowSuccess(true);
      setIsLoading(false);
      
      // Navigate to editor after delay
      setTimeout(() => {
        navigate('/');
      }, 2500);
    }, 1500);
  };

  const handleBack = () => {
    navigate('/gym-finder');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50 flex items-center justify-center p-5 overflow-hidden">
      <BackgroundGradients />
      
      <Header initials={initials} />
      
      <div className="w-full max-w-lg relative z-10">
        <HeroSection />
        
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl">
          <StepsIndicator currentStep={currentStep} />
          
          {showSuccess ? (
            <SuccessMessage onContinue={() => navigate('/')} />
          ) : (
            <>
              <InfoBox />
              
              {/* Gym Name */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Gym Name
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:bg-white/8 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all"
                  placeholder="e.g., Humble Yoga"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                />
                <div className="text-slate-500 text-sm mt-2">This is just for your reference</div>
              </div>

              {/* Mindbody URL */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Mindbody Schedule URL
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="url"
                  className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:bg-white/8 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all"
                  placeholder="https://clients.mindbodyonline.com/..."
                  value={gymUrl}
                  onChange={(e) => setGymUrl(e.target.value)}
                />
                <div className="text-slate-500 text-sm mt-2">
                  Need help? <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">Watch a quick tutorial</a>
                </div>
                <ExampleCard />
              </div>

              {/* Button Group */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={handleBack}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  className="flex-1"
                  disabled={!isValid || isLoading}
                  onClick={handleContinue}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      Continue
                      <span>→</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ManualEntryPage;
