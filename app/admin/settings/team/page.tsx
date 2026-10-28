'use client';

import { useState, useEffect } from 'react';
import { BentoCard } from '@/components/ui/BentoCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Search, UserPlus, X } from 'lucide-react';
import { useUser } from '@/libs/user-context';
import Loader from '@/components/ui/Loader';
import { apiErrorMessage } from '@/libs/api';
import { teamApi } from '@/libs/endpoints';
import { MemberStatus, type TeamMember } from '@/types/api';
import { initials, memberName } from '@/libs/format';
import toast from 'react-hot-toast';

export default function TeamManagementPage() {
  const { user, loading: userLoading } = useUser();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [creativeIdInput, setCreativeIdInput] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const fetchTeam = async () => {
    if (!user?.studioId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // The API returns members with `fullName` computed server-side now; this
      // used to read fields (`fullName`, `roleTitle`, `color`) that the
      // endpoint never sent, so every row rendered blank.
      const data = await teamApi.get();
      setTeam([...data.active, ...data.pending]);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to load team members'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) {
      fetchTeam();
    }
  }, [user, userLoading]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creativeIdInput.trim() || !user?.studioId) return;

    setIsInviting(true);
    try {
      await teamApi.invite(creativeIdInput.trim());
      toast.success('Creative invited successfully!');
      setIsInviteModalOpen(false);
      setCreativeIdInput('');
      fetchTeam();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to invite creative. Check ID.'));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    if (!user?.studioId) return;

    try {
      await teamApi.remove(userId);
      toast.success('Member removed');
      fetchTeam();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to remove member'));
    }
  };

  const filteredTeam = team.filter(m => 
    (m.fullName || '').toLowerCase().includes((search || '').toLowerCase()) || 
    (m.email || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const getInitials = (name: string) => initials(name);

  const columns: Column<TeamMember>[] = [
    { key: 'fullName', title: 'Member', render: (m) => (
      <div className="flex items-center gap-3">
         <div
           className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] overflow-hidden flex-shrink-0 ${
             m.status === MemberStatus.ACTIVE
               ? 'bg-black text-white'
               : 'bg-amber-100 text-amber-700'
           }`}
         >
           {m.avatarUrl ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={m.avatarUrl} alt={memberName(m)} className="w-full h-full object-cover" />
           ) : (
             getInitials(memberName(m))
           )}
         </div>
         <div>
           <p className="font-semibold text-gray-900 text-sm">{memberName(m)}</p>
           <p className="text-xs text-gray-500">{m.email}</p>
         </div>
      </div>
    )},
    { key: 'roleTitle', title: 'Role', render: (m) => (
      <span className="text-gray-700 text-sm">{m.roleTitle || m.role}</span>
    ) },
    { key: 'status', title: 'Status', render: (m) => {
      const isActive = m.status === MemberStatus.ACTIVE;
      return (
        <Badge
          status={isActive ? 'active' : 'pending'}
          label={isActive ? 'Active' : 'Pending Invitation'}
        />
      );
    } },
    { key: 'id', title: 'Actions', align: 'right', render: (m) => (
      <button 
        onClick={() => handleRemove(m.id)}
        className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
      >
        Remove
      </button>
    )}
  ];

  if (userLoading || loading) {
    return <div className="py-12 flex justify-center"><Loader /></div>;
  }

  return (
    <>
      <BentoCard className="p-6">
        <div className="flex items-start justify-between mb-8">
          <div className="max-w-md">
            <h2 className="text-lg font-bold text-gray-900">Team Management</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your studio team members, their roles, and access levels across the platform.</p>
          </div>
          <div className="flex gap-3">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find member..." 
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black/20 outline-none w-48" 
                />
             </div>
             <GlassButton variant="primary" icon={UserPlus} onClick={() => setIsInviteModalOpen(true)}>Invite Member</GlassButton>
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <DataTable data={filteredTeam} columns={columns} keyExtractor={(m) => m.id} />
        </div>
      </BentoCard>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <button 
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Invite Creative</h3>
            <p className="text-sm text-gray-500 mb-6">Enter the Creative ID of the user you want to invite to your studio.</p>
            
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Creative ID</label>
                <input 
                  type="text" 
                  value={creativeIdInput}
                  onChange={(e) => setCreativeIdInput(e.target.value)}
                  placeholder="e.g. TM-847521"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black/20 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <GlassButton variant="secondary" onClick={(e) => { e.preventDefault(); setIsInviteModalOpen(false); }}>Cancel</GlassButton>
                <GlassButton variant="primary" type="submit" disabled={isInviting}>
                  {isInviting ? 'Inviting...' : 'Send Invitation'}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
