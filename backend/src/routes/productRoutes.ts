import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { productQuerySchema, searchQuerySchema } from '../utils/validators.js';

const router = Router();

router.get('/', validate(productQuerySchema, 'query'), productController.getProducts);
router.get('/search', validate(searchQuerySchema, 'query'), productController.searchProducts);
router.get('/latest', productController.getLatestProducts);
router.get('/discounted', productController.getDiscountedProducts);
router.get('/:slug', productController.getProductBySlug);

export default router;
