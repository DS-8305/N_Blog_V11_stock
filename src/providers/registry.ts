import {loadReviewedProvider} from './reviewedFile.js';
// A licensed regional API adapter can implement StockProvider without changing collection/editor code.
// Reviewed exports are the initial real-data adapter; no portal scraper or guessed defaults.
export const loadProvider=loadReviewedProvider;
