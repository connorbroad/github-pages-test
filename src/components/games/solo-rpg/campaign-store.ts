/**
 * Svelte store for managing the active campaign
 * This allows all components to access and react to the currently loaded campaign
 */
import { writable } from 'svelte/store';
import type { Campaign } from './storage-utils';
import { loadActiveCampaignId, saveActiveCampaignId, loadCampaigns } from './storage-utils';

function createActiveCampaignStore() {
    const { subscribe, set, update } = writable<Campaign | null>(null);

    return {
        subscribe,
        load: (campaign: Campaign) => {
            set(campaign);
            saveActiveCampaignId(campaign.id);
        },
        unload: () => {
            set(null);
            saveActiveCampaignId(null);
        },
        initialize: () => {
            const activeCampaignId = loadActiveCampaignId();
            if (activeCampaignId) {
                const campaigns = loadCampaigns();
                const campaign = campaigns.find(c => c.id === activeCampaignId);
                if (campaign) {
                    set(campaign);
                } else {
                    // Campaign was deleted, clear the stored ID
                    saveActiveCampaignId(null);
                }
            }
        }
    };
}

export const activeCampaign = createActiveCampaignStore();
