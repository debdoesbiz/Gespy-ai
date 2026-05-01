import { useState, useEffect } from 'react';
import { Search, Download, Mail, Globe, Building2, Loader2, Sparkles, Trash2, CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findLeads, type Lead } from './lib/gemini';

export default function App() {
  const [niche, setNiche] = useState('');
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('gespy_leads');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('gespy_leads', JSON.stringify(leads));
  }, [leads]);

  const loadingMessages = [
    "Gespy is scanning the digital horizon...",
    "Connecting to global business directories...",
    "Extracting high-value contact information...",
    "Verifying public email addresses...",
    "Organizing your premium leads...",
    "Finalizing the search results...",
  ];

  const [isBatchLoading, setIsBatchLoading] = useState(false);

  const handleSearch = async () => {
    if (!niche.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
      messageIndex++;
    }, 3000);
    setLoadingMessage(loadingMessages[0]);

    try {
      // Batch 1: First 10 leads
      setLoadingMessage("Fetching first batch of leads...");
      const batch1 = await findLeads(niche, 10);
      
      if (batch1 && batch1.length > 0) {
        setLeads(prev => [...batch1, ...prev]);
        
        // After first batch, we can show results but keep a "secondary" loading state
        setIsLoading(false); 
        setIsBatchLoading(true);
        
        // Batch 2: Next 10 leads
        try {
          setLoadingMessage("Fetching second batch of leads...");
          const batch2 = await findLeads(niche, 10);
          if (batch2 && batch2.length > 0) {
            setLeads(prev => [...batch2, ...prev]);
          }
        } catch (batchErr) {
          console.warn("Second batch failed:", batchErr);
          // We don't show an error to the user if the first batch succeeded
        }
      } else {
        setError("No leads found for this niche. Try a different search term.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch leads. Please check your API key and try again.");
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
      setIsBatchLoading(false);
    }
  };

  const downloadCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Business Name', 'Website', 'Email', 'Niche'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.website.replace(/"/g, '""')}"`,
        `"${lead.email.replace(/"/g, '""')}"`,
        `"${lead.niche.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gespy_leads_${niche.replace(/\s+/g, '_') || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearLeads = () => {
    if (window.confirm("Are you sure you want to clear all leads?")) {
      setLeads([]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#99ff00] selection:text-black">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#99ff00]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-[#99ff00] rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black p-2 rounded-lg border border-white/10">
                <Sparkles className="w-6 h-6 text-[#99ff00]" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tighter text-[#99ff00] italic uppercase">Gespy</span>
          </div>
          <div className="flex items-center gap-4">
            {leads.length > 0 && (
              <button
                onClick={downloadCSV}
                className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full hover:bg-[#99ff00] transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(153,255,0,0.3)]"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#99ff00] text-xs font-bold tracking-widest uppercase mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#99ff00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#99ff00]"></span>
            </span>
            Next-Gen Lead Intelligence
          </motion.div>
          <h2 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tighter">
            Scrape <span className="text-[#99ff00]">20+ Leads</span> <br />In One Click.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
            Gespy uses advanced AI to crawl the web, find business emails, and build your pipeline in seconds.
          </p>
        </section>

        {/* Search Input */}
        <section className="max-w-3xl mx-auto mb-20">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#99ff00] to-indigo-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#99ff00]/50 transition-all">
              <div className="pl-6">
                <Search className="h-6 w-6 text-slate-500 group-focus-within:text-[#99ff00] transition-colors" />
              </div>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter niche (e.g., AI Startups in San Francisco)"
                className="block w-full px-4 py-6 bg-transparent text-xl font-medium focus:outline-none placeholder:text-slate-600"
              />
              {niche && (
                <button 
                  onClick={() => setNiche('')}
                  className="p-2 text-slate-500 hover:text-white transition-colors mr-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <div className="pr-3">
                <button
                  onClick={handleSearch}
                  disabled={isLoading || isBatchLoading || !niche.trim()}
                  className="px-8 py-3 bg-[#99ff00] text-black rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500 disabled:scale-100 transition-all font-black uppercase tracking-tight flex items-center gap-2"
                >
                  {isLoading || isBatchLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Finding...</span>
                    </>
                  ) : (
                    "Find"
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Status / Loading */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-[#99ff00] rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-4 bg-[#99ff00]/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#99ff00] animate-pulse" />
                </div>
              </div>
              <p className="text-xl font-bold text-white tracking-tight animate-pulse uppercase italic">{loadingMessage}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto mb-12 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 backdrop-blur-xl"
            >
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">System Alert</h3>
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Table */}
        {!isLoading && leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-3xl pointer-events-none"></div>
            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#99ff00]/10 rounded-xl flex items-center justify-center border border-[#99ff00]/20">
                    <CheckCircle2 className="w-6 h-6 text-[#99ff00]" />
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase tracking-tight text-lg">Verified Leads</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{leads.length} Contacts Discovered</p>
                      {isBatchLoading && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#99ff00]/10 rounded-full border border-[#99ff00]/20">
                          <Loader2 className="w-3 h-3 text-[#99ff00] animate-spin" />
                          <span className="text-[9px] font-black text-[#99ff00] uppercase tracking-tighter">Fetching More...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearLeads}
                  className="group flex items-center gap-2 text-slate-500 hover:text-red-500 transition-all px-4 py-2 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Clear All</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
                      <th className="px-8 py-5">Business</th>
                      <th className="px-8 py-5">Email Address</th>
                      <th className="px-8 py-5">Digital Presence</th>
                      <th className="px-8 py-5 text-right">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map((lead, index) => (
                      <motion.tr
                        key={`${lead.email}-${index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-white/[0.03] transition-all group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#99ff00] group-hover:bg-[#99ff00]/10 border border-white/5 group-hover:border-[#99ff00]/20 transition-all">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-white group-hover:text-[#99ff00] transition-colors">{lead.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 group-hover:border-white/10 transition-all">
                              <Mail className="w-4 h-4 text-slate-500" />
                              <a href={`mailto:${lead.email}`} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{lead.email}</a>
                            </div>
                            <button
                              onClick={() => copyToClipboard(lead.email)}
                              className="p-2 hover:bg-[#99ff00] hover:text-black rounded-lg transition-all text-slate-500"
                              title="Copy Email"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <a 
                            href={lead.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-[#99ff00] transition-colors group/link"
                          >
                            <Globe className="w-4 h-4" />
                            <span className="truncate max-w-[180px]">{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-400 border border-white/5 group-hover:border-[#99ff00]/20 group-hover:text-[#99ff00] transition-all">
                            {lead.niche}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && leads.length === 0 && !error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-white/[0.01] rounded-[40px] border border-dashed border-white/10"
          >
            <div className="bg-white/5 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10">
              <Search className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Ready to Scale?</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">
              Enter a niche above and let Gespy find your next 20 high-quality business leads.
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-slate-600 text-xs font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#99ff00] rounded-full animate-pulse"></div>
            <span>Gespy AI Agent Engine v2.0</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Gespy Intelligence. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
