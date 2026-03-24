import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import * as orderService from '../services/orderService.js';

export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.createOrder(req.user!.id, req.body);
  res.status(201).json(successResponse(order));
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const orders = await orderService.getUserOrders(req.user!.id);
  res.json(successResponse(orders));
});

export const getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.getOrderById(req.params.id, req.user!.id);
  res.json(successResponse(order));
});
