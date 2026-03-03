import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import companyController from '../controllers/company.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/', companyController.createCompany);
router.get('/', companyController.getCompanies);
router.get('/:id/users', companyController.getCompanyUsers);
router.patch('/:id/users/:userId/role', companyController.updateUserRoleInCompany);
router.delete('/:id/users/:userId', companyController.removeUserFromCompany);
router.get('/:id', companyController.getCompanyById);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

export default router;
