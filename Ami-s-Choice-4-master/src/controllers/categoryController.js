const Categories = require("../models/categoriesModel");



const createCategory = async (req, res) => {
    try {
        const { name, icon } = req.body;
        if(!name) {
            return res.status(400).json({
            status: 'fail',
            message: 'Please enter a name!'
        })
        }
        const category = await Categories.findOne({where: { name }});
        if(category) {
            return res.status(409).json({
            status: 'fail',
            message: 'This category already exists!'
        })
        }
        const newCategory = await Categories.create({
            name,
            icon,
        });
        res.status(200).json({
            status: 'success',
            data: newCategory
        })
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong while creating the category!'
        })
    }
};

const getAllCategories =async (req, res) => {
    try {
        const categories = await Categories.findAll();
    if(!categories) {
        return res.status(200).json({
            status: 'success',
            data: {
                message: 'No categories are created yet!'
            }
        })
    }
    res.status(200).json({
        status: 'success',
        data: {
            categories
        }
    })
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong while creating the category!'
        })
    }

};

const updateCategories = async (req, res) => {
    try {
        
        const id = req.params.id;
        const { name, icon } = req.body;
         // Check if body is empty
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'No data provided to update the category!'
            });
        }

        const category = await Categories.findByPk(id);
        if(!category) {
            return res.status(404).json({
                status: 'fail',
                message: 'Category not found!'
            })
        }
        // Check for name conflict if 'name' is being updated
        let existingCategory = null;
        if (name && name !== category.name) {
            existingCategory = await Categories.findOne({
                where: { name }
            });
        }
        if(existingCategory) {
            return res.status(409).json({
            status: 'fail',
            message: 'Another category with this name exists!'
        })
        }
        await category.update(req.body);
        res.status(200).json({
            status: 'success',
            data: {
                message: 'Category updated successfully!',
                category
            }
        })
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong while updating the category!'
        })
        console.log(error)
    }
};

const deleteCategories = async (req, res) => {
    try {
        const id =req.params.id;
    const category = await Categories.findByPk(id);
    if(!category) {
        return res.status(404).json({
                status: 'fail',
                message: 'Category not found!'
            })
    }
    await category.destroy();
    res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully!'
    })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong while deleting the category!'
        })
    }
}

module.exports = { createCategory, getAllCategories, updateCategories, deleteCategories };