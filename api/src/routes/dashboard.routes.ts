import { Router } from 'express';
import { authorize } from '../middlewares/authorize';
import { buscarDashBoard } from '../controllers/dashBoardController';

const router = Router();

router.get('/home/:id', authorize([]), buscarDashBoard);

export default router;