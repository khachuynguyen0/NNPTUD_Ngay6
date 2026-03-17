let inventoryModel = require('../schemas/inventories');

// GET all inventories (join với product)
let getAll = async (req, res) => {
    try {
        let result = await inventoryModel.find().populate({
            path: 'product',
            select: 'title slug price description images'
        });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// GET inventory by ID (join với product)
let getById = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await inventoryModel.findById(id).populate({
            path: 'product',
            select: 'title slug price description images'
        });
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: 'Inventory không tìm thấy' });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// POST /add-stock - tăng stock
let addStock = async (req, res) => {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0) {
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });
        }
        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) {
            return res.status(404).send({ message: 'Không tìm thấy inventory cho product này' });
        }
        inventory.stock += quantity;
        await inventory.save();
        res.send({ message: `Đã thêm ${quantity} vào stock`, inventory });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// POST /remove-stock - giảm stock
let removeStock = async (req, res) => {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0) {
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });
        }
        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) {
            return res.status(404).send({ message: 'Không tìm thấy inventory cho product này' });
        }
        if (inventory.stock < quantity) {
            return res.status(400).send({ message: `Không đủ hàng. Stock hiện tại: ${inventory.stock}` });
        }
        inventory.stock -= quantity;
        await inventory.save();
        res.send({ message: `Đã giảm ${quantity} khỏi stock`, inventory });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// POST /reservation - giảm stock, tăng reserved
let reservation = async (req, res) => {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0) {
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });
        }
        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) {
            return res.status(404).send({ message: 'Không tìm thấy inventory cho product này' });
        }
        if (inventory.stock < quantity) {
            return res.status(400).send({ message: `Không đủ hàng để đặt. Stock hiện tại: ${inventory.stock}` });
        }
        inventory.stock -= quantity;
        inventory.reserved += quantity;
        await inventory.save();
        res.send({ message: `Đã đặt trước ${quantity} sản phẩm`, inventory });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// POST /sold - giảm reserved, tăng soldCount
let sold = async (req, res) => {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0) {
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });
        }
        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) {
            return res.status(404).send({ message: 'Không tìm thấy inventory cho product này' });
        }
        if (inventory.reserved < quantity) {
            return res.status(400).send({ message: `Không đủ reservation. Reserved hiện tại: ${inventory.reserved}` });
        }
        inventory.reserved -= quantity;
        inventory.soldCount += quantity;
        await inventory.save();
        res.send({ message: `Đã bán ${quantity} sản phẩm`, inventory });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

module.exports = { getAll, getById, addStock, removeStock, reservation, sold };
