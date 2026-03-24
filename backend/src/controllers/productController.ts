import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import * as productService from '../services/productService.js';

export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { products, total } = await productService.getPublicProducts(req.query as never);
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 12;
  res.json(paginatedResponse(products, total, page, limit));
});

export const searchProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = req.query.q as string;
  const products = await productService.searchProducts(q);
  res.json(successResponse(products));
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.getProductBySlug(req.params.slug);
  res.json(successResponse(product));
});

export const getLatestProducts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const products = await productService.getLatestProducts(6);
  res.json(successResponse(products));
});

export const getDiscountedProducts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const products = await productService.getDiscountedProducts(6);
  res.json(successResponse(products));
});
