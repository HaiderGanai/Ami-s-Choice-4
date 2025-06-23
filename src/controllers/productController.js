const { Op } = require("sequelize");
const { Product, Review, User, Order } = require("../models");
const Categories = require("../models/categoriesModel");
const { sequelize } = require("../config/dbConnect");



const addProduct = async (req, res) => {
    try {
        const { name, description, image, weight, price, stockQuantity, categoryId, productDiscount } = req.body;

        if (
    name === undefined || name === '' ||
    description === undefined || description === '' ||
    weight === undefined || weight === '' ||
    price === undefined || price === '' ||
    stockQuantity === undefined || stockQuantity === '' ||
    categoryId === undefined || categoryId === ''
) {
    return res.status(400).json({
        status: 'fail',
        message: 'Please enter all required fields!'
    });
}

        const category = await Categories.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                status: 'fail',
                message: 'This category does not exist!'
            });
        }

        // 💡 Grab file path from multer
    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

        const newProduct = await Product.create({
            name,
            description,
            image: imagePath,
            weight,
            price,
            productDiscount: productDiscount || 0,
            stockQuantity,
            isInStock: stockQuantity > 0,
            categoryId
        });

        return res.status(200).json({
            status: 'success',
            data: {
                newProduct
            }
        });
    } catch (error) {
        console.log("error",error)
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong!',
            error: error.message
        });
    }
};

//Bulk addition of products
const addProducts = async (req, res) => {
    try {
        const products = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Request body must be a non-empty array of products.'
            });
        }

        // Validate and sanitize input
        for (const product of products) {
            const { name, description, weight, price, stockQuantity, categoryId } = product;

            if (
                !name?.trim() ||
                !description?.trim() ||
                isNaN(parseFloat(weight)) ||
                isNaN(parseFloat(price)) ||
                isNaN(parseInt(stockQuantity)) ||
                isNaN(parseInt(categoryId))
            ) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Each product must have all required fields: name, description, weight, price, stockQuantity, categoryId.'
                });
            }

            // Optional: check if category exists
            const category = await Categories.findByPk(categoryId);
            if (!category) {
                return res.status(404).json({
                    status: 'fail',
                    message: `Category with ID ${categoryId} does not exist.`
                });
            }
        }

        // Prepare and sanitize input (exclude discountPrice if sent)
        const sanitizedProducts = products.map(p => ({
            name: p.name,
            description: p.description,
            image: p.image,
            weight: p.weight,
            price: p.price,
            productDiscount: p.productDiscount || 0,
            stockQuantity: p.stockQuantity,
            isInStock: p.stockQuantity > 0,
            categoryId: p.categoryId
        }));

        // Insert products (hooks will compute discountPrice)
        const createdProducts = await Product.bulkCreate(sanitizedProducts);

        return res.status(201).json({
            status: 'success',
            data: { createdProducts }
        });

    } catch (error) {
        console.error("Bulk insert error:", error);
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong!',
            error: error.message
        });
    }
};





const getAllProducts = async (req, res)=> {

    try {
        const {
            id,
            name,
            description,
            weight,
            price,
            price_lte,
            price_gte,
            discountPrice,
            isInStock,
            stockQuantity,
            stockQuantity_gte,
            stockQuantity_lte,
            category, // category name
            createdAt_gte,
            createdAt_lte,
            updatedAt_gte,
            updatedAt_lte
        } = req.query;

        const whereClause = {};

        //Handling filters
        if (id) whereClause.id = id;
        if (name) whereClause.name = { [Op.like]: `%${name}%` };
        if (description) whereClause.description = { [Op.like]: `%${description}%` };
        if (weight) whereClause.weight = weight;

        if (price) whereClause.price = price;
        if (price_gte || price_lte) {
            whereClause.price = {
                ...(price_gte && { [Op.gte]: price_gte }),
                ...(price_lte && { [Op.lte]: price_lte })
            };
        }

        if (discountPrice === "null") whereClause.discountPrice = null;
        if (discountPrice === "notnull") whereClause.discountPrice = { [Op.not]: null };

        if (isInStock !== undefined) whereClause.isInStock = isInStock === "true";

        if (stockQuantity) whereClause.stockQuantity = stockQuantity;
        if (stockQuantity_gte || stockQuantity_lte) {
            whereClause.stockQuantity = {
                ...(stockQuantity_gte && { [Op.gte]: stockQuantity_gte }),
                ...(stockQuantity_lte && { [Op.lte]: stockQuantity_lte })
            };
        }

        if (createdAt_gte || createdAt_lte) {
            whereClause.createdAt = {
                ...(createdAt_gte && { [Op.gte]: new Date(createdAt_gte) }),
                ...(createdAt_lte && { [Op.lte]: new Date(createdAt_lte) })
            };
        }

        if (updatedAt_gte || updatedAt_lte) {
            whereClause.updatedAt = {
                ...(updatedAt_gte && { [Op.gte]: new Date(updatedAt_gte) }),
                ...(updatedAt_lte && { [Op.lte]: new Date(updatedAt_lte) })
            };
        }
        
        console.log("where clause::", whereClause)
        // console.log('poduct from the query::', product)

        // let products;


        // Category name => CategoryId
        if(category) {
            const foundCategory = await Categories.findOne({ where: {name: category }});
            if(!foundCategory){
                return res.status(404).json({
                    status: 'fail',
                    message: 'Category not found!'
                });
            }
            //if category found, add it into whereClause
            whereClause.categoryId = foundCategory.id;
        }
        
        const products = await Product.findAll({ where : whereClause });
        
        if(!products || products.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No products found!',
                data: []
            })
        }
        console.log(`Get Products API is hit, where clause:: ${whereClause}`)
        return res.status(200).json({
            status: 'success',
            data: {
                products
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong!'
        })
    }
};


const bestSelling = async (req, res) => {
  try {
    const bestSellingProducts = await Order.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('productQuantity')), 'totalSold']
      ],
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'discountPrice', 'image'], // Select what you need
        }
      ],
      group: ['productId', 'Product.id'],
      order: [[sequelize.fn('SUM', sequelize.col('productQuantity')), 'DESC']],
      limit: 10,
    });

    res.status(200).json({
      status: 'success',
      data: bestSellingProducts,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'fail',
      message: 'Something went wrong!',
    });
  }
};


const getSingleProduct = async (req, res) => {
    try {
        const {id} = req.params;
    const product = await Product.findByPk(id, {
        include: [
            { 
                model: Review,
                as: 'reviews',
                attributes: ['rating', 'comment', 'createdAt'],
                include: [
                    {
                        model: User,
                        attributes: ['firstName', 'lastName']
                    }
                ]
            }
        ]
    });
    if(!product) {
        return res.status(404).json({
            status: 'fail',
            message: 'Product not found!'
        })
    }
    res.status(200).json({
        status: 'success',
        data: {
            product
        }
    })
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong!'
        })
    }
};

//1.controller with file upload logic
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found!',
      });
    }

    // Prepare updated fields
    const updateData = { ...req.body };

    // If an image is uploaded, add it to updateData
    if (req.file) {
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    // Update the product
    await product.update(updateData);

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully!',
      data: {
        product,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong!',
    });
  }
};


//2. Controller without file uppload logic
// const updateProduct = async (req, res) => {
//     try {
//         const { id } = req.params;

//         //check if request body has any data
//         if(!req.body || Object.keys(req.body).length ===0) {
//             return res.status(400).json({
//                 status: 'fail',
//                 message: 'No data provided for update!'
//             });
//         };

//         //check if product exists
//         const product = await Product.findByPk(id);
//         if(!product) {
//             return res.status(404).json({
//             status: 'fail',
//             message: 'Product not found!'
//         })
//         }

//         //update the product with provided fields
//         await product.update(req.body);
//         res.status(200).json({
//             status: 'success',
//             message: 'Product Updated Successfully!',
//             data: {
//                 product
//             }
//         })
//     } catch (error) {
//         return res.status(500).json({
//             status: 'fail',
//             message: 'Something went wrong!'
//         })
//     }
// };

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if(!product) {
            return res.status(404).json({
            status: 'fail',
            message: 'Product does not exists!'
        })
        }
        await product.destroy();
        res.status(200).json({
            status: 'success',
            message: 'Product destroyed successfully!'
        })
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong!'
        })
    }
}

module.exports = { addProduct,addProducts, getAllProducts,bestSelling, getSingleProduct, updateProduct, deleteProduct };