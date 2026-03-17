var express = require('express');
var router = express.Router();
let { getAll, getById, addStock, removeStock, reservation, sold } = require('../controllers/inventories');

// GET /api/v1/inventories - lấy tất cả inventory (join product)
router.get('/', getAll);

// GET /api/v1/inventories/:id - lấy inventory theo ID (join product)
router.get('/:id', getById);

// POST /api/v1/inventories/add-stock - tăng stock
router.post('/add-stock', addStock);

// POST /api/v1/inventories/remove-stock - giảm stock
router.post('/remove-stock', removeStock);

// POST /api/v1/inventories/reservation - đặt trước hàng (giảm stock, tăng reserved)
router.post('/reservation', reservation);

// POST /api/v1/inventories/sold - bán hàng (giảm reserved, tăng soldCount)
router.post('/sold', sold);

module.exports = router;
