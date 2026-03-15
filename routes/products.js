var express = require('express');
var router = express.Router();
let productModel = require('../schemas/products');
const { default: slugify } = require('slugify');
let { verifyToken } = require('../middleware/auth');
let { checkRole } = require('../middleware/checkRole');

// READ ALL - Lấy tất cả sản phẩm chưa bị xóa (có hỗ trợ tìm kiếm và phân trang)
// Query params: ?search=keyword&page=1&limit=10&minPrice=0&maxPrice=1000
router.get('/', async function (req, res, next) {
    try {
        let { search, page, limit, minPrice, maxPrice } = req.query;

        let filter = { isDeleted: false };

        // Tìm kiếm theo tên sản phẩm
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        // Lọc theo khoảng giá
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
        }

        // Phân trang
        let pageNum = Math.max(1, parseInt(page) || 1);
        let limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        let skip = (pageNum - 1) * limitNum;

        let total = await productModel.countDocuments(filter);
        let result = await productModel
            .find(filter)
            .populate('category')
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        res.send({
            data: result,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// READ ONE - Lấy 1 sản phẩm theo ID
router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;
        let result = await productModel
            .findOne({ isDeleted: false, _id: id })
            .populate('category');
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "ID NOT FOUND" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// CREATE - Thêm sản phẩm mới (yêu cầu đăng nhập + role admin)
router.post('/', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let newProduct = new productModel({
            title: req.body.title,
            slug: slugify(req.body.title, {
                replacement: '-',
                remove: undefined,
                lower: true,
                strict: false,
            }),
            price: req.body.price,
            description: req.body.description,
            images: req.body.images,
            category: req.body.category,
        });
        await newProduct.save();
        res.send(newProduct);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// UPDATE - Cập nhật sản phẩm theo ID (yêu cầu đăng nhập + role admin)
router.put('/:id', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let id = req.params.id;
        if (req.body.title) {
            req.body.slug = slugify(req.body.title, {
                replacement: '-',
                remove: undefined,
                lower: true,
                strict: false,
            });
        }
        let updatedItem = await productModel.findByIdAndUpdate(id, req.body, { new: true });
        res.send(updatedItem);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// DELETE - Xóa mềm sản phẩm theo ID (yêu cầu đăng nhập + role admin)
router.delete('/:id', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await productModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );
        res.send(updatedItem);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

module.exports = router;
