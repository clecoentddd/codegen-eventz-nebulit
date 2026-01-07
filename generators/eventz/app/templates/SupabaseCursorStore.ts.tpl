/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import * as path from 'path';
import * as url from 'url';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CursorStore } from '../common/domain/CursorStore';

// Get __dirname equivalent in ES modules
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export class SupabaseCursorStore implements CursorStore {
    private supabase: SupabaseClient;

    constructor(supabaseUrl?: string, supabaseServiceRoleKey?: string) {
        // Use constructor parameters if provided, otherwise fallback to environment variables
        const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error(
                'Supabase URL and Service Role Key are required. ' +
                'Ensure you use a server-side environment variable for the service key.'
            );
        }

        // Initialize Supabase client
        this.supabase = createClient(url, key, { auth: { persistSession: false } });
    }

    async getCursor(processorName: string): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('cursors')
            .select('last_processed_id')
            .eq('processor_name', processorName)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned - cursor doesn't exist yet
                return null;
            }
            console.error('Error fetching cursor from Supabase:', error);
            throw new Error(`Supabase getCursor failed: ${error.message}`);
        }

        return data?.last_processed_id || null;
    }

    async saveCursor(processorName: string, lastProcessedId: string): Promise<void> {
        const { error } = await this.supabase
            .from('cursors')
            .upsert(
                {
                    processor_name: processorName,
                    last_processed_id: lastProcessedId,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'processor_name'
                }
            );

        if (error) {
            console.error('Error saving cursor to Supabase:', error);
            throw new Error(`Supabase saveCursor failed: ${error.message}`);
        }
    }
}
