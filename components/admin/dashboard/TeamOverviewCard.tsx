'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BentoCard } from '@/components/ui/BentoCard';
import { ArrowRight2 } from 'iconsax-react';
import { teamApi } from '@/libs/endpoints';
import { initials, memberName } from '@/libs/format';
import { MemberRole, type Team } from '@/types/api';

/**
 * Replaces the old "Team & Departments" card, whose member avatars, counts
 * (1240 / 562 / 25) and three "departments" were all hard-coded. Departments
 * are not a concept in the data model; studio members are.
 */
const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Creative',
};

export function TeamOverviewCard() {
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    let cancelled = false;
    teamApi
      .get()
      .then((data) => {
        if (!cancelled) setTeam(data);
      })
      .catch(() => {
        /* the empty state below covers this */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = team?.active ?? [];
  const pending = team?.pending ?? [];

  return (
    <BentoCard variant="dark" className="relative p-0 overflow-hidden h-full">
      <div
        className="absolute top-1/2 left-1/2 w-[150%] aspect-square -translate-x-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
        style={{
          backgroundImage: "url('/images/file-preview-bg.jpg')",
          backgroundPosition: 'right',
        }}
      />
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      <div className="relative z-10 p-5 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">Team</p>
            <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center">
              {active.length}
            </span>
          </div>
          <Link
            href="/admin/settings/team"
            className="text-[11px] text-white/70 hover:text-white flex items-center gap-1 transition-colors"
          >
            Manage
            <ArrowRight2 color="currentColor" size={12} />
          </Link>
        </div>

        {active.length === 0 ? (
          <p className="text-xs text-white/60">
            No one here yet. Invite a creative by their TM- ID.
          </p>
        ) : (
          <>
            <div className="flex items-center -space-x-2 mb-4">
              {active.slice(0, 6).map((member) => (
                <div
                  key={member.id}
                  title={memberName(member)}
                  className="w-9 h-9 rounded-full bg-gray-800 border border-white/20 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
                >
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatarUrl} alt={memberName(member)} className="w-full h-full object-cover" />
                  ) : (
                    initials(memberName(member))
                  )}
                </div>
              ))}
              {active.length > 6 && (
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-[10px] font-bold">
                  +{active.length - 6}
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {active.slice(0, 4).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <p className="text-xs text-white/90 truncate">{memberName(member)}</p>
                  <p className="text-[10px] text-white/50 flex-shrink-0 ml-3">
                    {member.roleTitle || ROLE_LABEL[member.role]}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {pending.length > 0 && (
          <p className="text-[11px] text-amber-300/80 mt-3 pt-3 border-t border-white/10">
            {pending.length} invitation{pending.length === 1 ? '' : 's'} awaiting a reply
          </p>
        )}
      </div>
    </BentoCard>
  );
}
