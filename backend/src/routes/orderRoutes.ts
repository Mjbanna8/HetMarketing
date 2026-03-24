import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authGuard } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../utils/validators.js';

const router = Router();

router.use(authGuard);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

export default router;
