import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import * as settingsService from '../services/settingsService.js';

export const getPublicSettings = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const allSettings = await settingsService.getAllSettings();

  // Spread all about_* keys so the public About Us page can read admin-managed content
  const aboutEntries = Object.fromEntries(
    Object.entries(allSettings).filter(([k]) => k.startsWith('about_'))
  );

  const publicSettings = {
    store_name: allSettings.store_name ?? 'HetMarketing',
    store_logo_url: allSettings.store_logo_url ?? '',
    whatsapp_number: allSettings.whatsapp_number ?? '',
    contact_email: allSettings.contact_email ?? '',
    wp_message_template: allSettings.wp_message_template ?? '',
    ...aboutEntries,
  };
  res.json(successResponse(publicSettings));
});
