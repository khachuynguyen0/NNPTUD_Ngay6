var express = require('express');
var router = express.Router();
let categoryModel = require('../schemas/categories');
const { default: slugify } = require('slugify');
let { verifyToken } = require('../middleware/auth');
let { checkRole } = require('../middleware/checkRole');

// READ ALL - Lấy tất cả danh mục chưa bị xóa (có hỗ trợ tìm kiếm và phân trang)
// Query params: ?search=keyword&page=1&limit=10
router.get('/', async function (req, res, next) {
    try {
        let { search, page, limit } = req.query;

        let filter = { isDeleted: false };

        // Tìm kiếm theo tên danh mục
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        // Phân trang
        let pageNum = Math.max(1, parseInt(page) || 1);
        let limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        let skip = (pageNum - 1) * limitNum;

        let total = await categoryModel.countDocuments(filter);
        let result = await categoryModel
            .find(filter)
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

// READ ONE - Lấy 1 danh mục theo ID
router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;
        let result = await categoryModel.findOne({ isDeleted: false, _id: id });
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "ID NOT FOUND" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// CREATE - Thêm danh mục mới (yêu cầu đăng nhập + role admin)
router.post('/', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let newCate = new categoryModel({
            name: req.body.name,
            slug: slugify(req.body.name, {
                replacement: '-',
                remove: undefined,
                lower: true,
                strict: false,
            })
        });
        await newCate.save();
        res.send(newCate);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// UPDATE - Cập nhật danh mục theo ID (yêu cầu đăng nhập + role admin)
router.put('/:id', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let id = req.params.id;
        if (req.body.name) {
            req.body.slug = slugify(req.body.name, {
                replacement: '-',
                remove: undefined,
                lower: true,
                strict: false,
            });
        }
        let updatedItem = await categoryModel.findByIdAndUpdate(id, req.body, { new: true });
        res.send(updatedItem);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// DELETE - Xóa mềm danh mục theo ID (yêu cầu đăng nhập + role admin)
router.delete('/:id', verifyToken, checkRole('admin'), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await categoryModel.findByIdAndUpdate(
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
